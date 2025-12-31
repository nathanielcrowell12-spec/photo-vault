import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import { EmailReportService, EmailReportData, defaultEmailConfig } from '@/lib/email-service'
import { PDFReportGenerator, ReportData } from '@/lib/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      photographer_id, 
      report_type, 
      schedule, // 'monthly', 'quarterly', 'yearly'
      email_address,
      include_pdf = true
    } = body

    if (!photographer_id || !report_type || !schedule) {
      return NextResponse.json(
        { error: 'Missing required fields: photographer_id, report_type, schedule' },
        { status: 400 }
      )
    }

    // Calculate next send date based on schedule
    const nextSendDate = calculateNextSendDate(schedule)

    // Create scheduled report record
    const { data: scheduledReport, error: createError } = await supabase
      .from('scheduled_reports')
      .insert([
        {
          photographer_id,
          report_type,
          schedule,
          email_address: email_address || null,
          include_pdf,
          next_send_date: nextSendDate,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (createError) {
      logger.error('Error creating scheduled report:', createError)
      return NextResponse.json(
        { error: 'Failed to create scheduled report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        scheduled_report_id: scheduledReport.id,
        next_send_date: nextSendDate,
        schedule,
        message: `Scheduled ${schedule} ${report_type} reports successfully`
      }
    })

  } catch (error) {
    logger.error('Schedule report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const photographerId = searchParams.get('photographer_id')

    if (!photographerId) {
      return NextResponse.json(
        { error: 'Photographer ID is required' },
        { status: 400 }
      )
    }

    // Fetch scheduled reports for photographer
    const { data: scheduledReports, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('photographer_id', photographerId)
      .eq('is_active', true)
      .order('next_send_date', { ascending: true })

    if (error) {
      logger.error('Error fetching scheduled reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: scheduledReports
    })

  } catch (error) {
    logger.error('Fetch scheduled reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduledReportId = searchParams.get('id')

    if (!scheduledReportId) {
      return NextResponse.json(
        { error: 'Scheduled report ID is required' },
        { status: 400 }
      )
    }

    // Deactivate scheduled report
    const { error } = await supabase
      .from('scheduled_reports')
      .update({ is_active: false })
      .eq('id', scheduledReportId)

    if (error) {
      logger.error('Error deactivating scheduled report:', error)
      return NextResponse.json(
        { error: 'Failed to deactivate scheduled report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Scheduled report deactivated successfully' }
    })

  } catch (error) {
    logger.error('Deactivate scheduled report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateNextSendDate(schedule: string): string {
  const now = new Date()
  
  switch (schedule) {
    case 'monthly':
      // First day of next month
      return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
    
    case 'quarterly':
      // First day of next quarter
      const nextQuarter = Math.ceil((now.getMonth() + 1) / 3) * 3
      const quarterYear = nextQuarter > 12 ? now.getFullYear() + 1 : now.getFullYear()
      const quarterMonth = nextQuarter > 12 ? nextQuarter - 12 : nextQuarter
      return new Date(quarterYear, quarterMonth - 1, 1).toISOString()
    
    case 'yearly':
      // First day of next year
      return new Date(now.getFullYear() + 1, 0, 1).toISOString()
    
    default:
      // Default to next month
      return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
  }
}

// This function would be called by a cron job or scheduled task
// Note: Removed export because it's not a valid Next.js route handler
// If you need to call this, create a separate cron endpoint
async function processScheduledReports() {
  try {
    const now = new Date()
    
    // Fetch all active scheduled reports that are due
    const { data: dueReports, error } = await supabase
      .from('scheduled_reports')
      .select(`
        *,
        photographers:photographer_id (
          *,
          users:user_id (
            name,
            email
          )
        )
      `)
      .eq('is_active', true)
      .lte('next_send_date', now.toISOString())

    if (error) {
      logger.error('Error fetching due reports:', error)
      return
    }

    const emailService = new EmailReportService(defaultEmailConfig)
    const results = []

    for (const scheduledReport of dueReports || []) {
      try {
        // Calculate report period based on schedule
        const reportPeriod = calculateReportPeriod(scheduledReport.schedule, scheduledReport.report_type)
        
        // Fetch commission data for the period
        const { data: commissionPayments } = await supabase
          .from('commission_payments')
          .select(`
            *,
            client_payments:client_payment_id (
              *,
              clients:client_id (
                name,
                email
              ),
              payment_options:payment_option_id (
                name,
                price,
                photographer_commission_rate
              )
            )
          `)
          .eq('photographer_id', scheduledReport.photographer_id)
          .gte('payment_period_start', reportPeriod.start)
          .lte('payment_period_start', reportPeriod.end)
          .order('payment_period_start', { ascending: false })

        // Calculate summary metrics
        const totalRevenue = commissionPayments?.reduce((sum, payment) => sum + payment.commission_amount, 0) || 0
        const activeClients = new Set(commissionPayments?.map(p => p.client_payments?.client_id).filter(Boolean) || [])

        // Prepare email data
        const emailData: EmailReportData = {
          to: scheduledReport.email_address || scheduledReport.photographers?.users?.email || '',
          photographerName: scheduledReport.photographers?.users?.name || scheduledReport.photographers?.users?.email || 'Photographer',
          businessName: scheduledReport.photographers?.business_name,
          reportType: scheduledReport.report_type as 'monthly' | 'quarterly' | 'yearly' | 'custom',
          period: reportPeriod,
          summary: {
            totalRevenue,
            totalClients: activeClients.size,
            monthlyRecurring: 0, // Would need more complex calculation
            growth: 0 // Would need historical comparison
          }
        }

        // Generate and send email
        let emailSent = false
        switch (scheduledReport.report_type) {
          case 'monthly':
            emailSent = await emailService.sendMonthlyReport(emailData)
            break
          case 'quarterly':
            emailSent = await emailService.sendQuarterlyReport(emailData)
            break
          case 'yearly':
            emailSent = await emailService.sendYearlyReport(emailData)
            break
        }

        if (emailSent) {
          // Update next send date
          const nextSendDate = calculateNextSendDate(scheduledReport.schedule)
          await supabase
            .from('scheduled_reports')
            .update({ 
              next_send_date: nextSendDate,
              last_sent_at: now.toISOString(),
              total_sent: (scheduledReport.total_sent || 0) + 1
            })
            .eq('id', scheduledReport.id)

          results.push({
            id: scheduledReport.id,
            status: 'sent',
            next_send_date: nextSendDate
          })
        } else {
          results.push({
            id: scheduledReport.id,
            status: 'failed',
            error: 'Email sending failed'
          })
        }

      } catch (error) {
        logger.error(`Error processing scheduled report ${scheduledReport.id}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          id: scheduledReport.id,
          status: 'failed',
          error: errorMessage
        })
      }
    }

    logger.info('Processed scheduled reports:', results)
    return results

  } catch (error) {
    logger.error('Error processing scheduled reports:', error)
  }
}

function calculateReportPeriod(schedule: string, reportType: string): { start: string, end: string } {
  const now = new Date()
  
  switch (schedule) {
    case 'monthly':
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString()
      }
    
    case 'quarterly':
      const quarterStart = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      const quarterEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        start: quarterStart.toISOString(),
        end: quarterEnd.toISOString()
      }
    
    case 'yearly':
      const yearStart = new Date(now.getFullYear() - 1, 0, 1)
      const yearEnd = new Date(now.getFullYear() - 1, 11, 31)
      return {
        start: yearStart.toISOString(),
        end: yearEnd.toISOString()
      }
    
    default:
      const defaultStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const defaultEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        start: defaultStart.toISOString(),
        end: defaultEnd.toISOString()
      }
  }
}
