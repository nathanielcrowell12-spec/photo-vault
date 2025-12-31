import { NextRequest, NextResponse } from 'next/server'
import { EmailReportService, EmailReportData, defaultEmailConfig } from '@/lib/email-service'
import { PDFReportGenerator, ReportData } from '@/lib/pdf-generator'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      photographer_id, 
      report_type, 
      start_date, 
      end_date,
      include_pdf = true,
      email_address 
    } = body

    if (!photographer_id || !report_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: photographer_id, report_type, start_date, end_date' },
        { status: 400 }
      )
    }

    // Fetch photographer and user data
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select(`
        *,
        users:user_id (
          name,
          email
        )
      `)
      .eq('user_id', photographer_id)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    // Use provided email or photographer's email
    const recipientEmail = email_address || photographer.users?.email
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'No email address provided' },
        { status: 400 }
      )
    }

    // Fetch commission data for the period
    const { data: commissionPayments, error: commissionError } = await supabase
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
      .eq('photographer_id', photographer_id)
      .gte('payment_period_start', start_date)
      .lte('payment_period_start', end_date)
      .order('payment_period_start', { ascending: false })

    if (commissionError) {
      logger.error('[ReportsSendEmail] Error fetching commission payments:', commissionError)
      return NextResponse.json(
        { error: 'Failed to fetch commission data' },
        { status: 500 }
      )
    }

    // Calculate summary metrics
    const totalUpfrontCommission = commissionPayments?.reduce((sum, payment) => {
      const isUpfront = payment.client_payments?.payment_options?.name?.includes('upfront') || 
                       payment.client_payments?.payment_options?.name?.includes('Annual')
      return sum + (isUpfront ? payment.commission_amount : 0)
    }, 0) || 0

    const totalMonthlyCommission = commissionPayments?.reduce((sum, payment) => {
      const isRecurring = payment.client_payments?.payment_options?.name?.includes('ongoing') || 
                         payment.client_payments?.payment_options?.name?.includes('monthly')
      return sum + (isRecurring ? payment.commission_amount : 0)
    }, 0) || 0

    const totalRevenue = totalUpfrontCommission + totalMonthlyCommission

    const activeClients = new Set()
    const monthlyRecurringClients = new Set()

    commissionPayments?.forEach(payment => {
      if (payment.client_payments?.client_id) {
        activeClients.add(payment.client_payments.client_id)
        
        if (payment.client_payments?.payment_options?.name?.includes('ongoing') || 
            payment.client_payments?.payment_options?.name?.includes('monthly')) {
          monthlyRecurringClients.add(payment.client_payments.client_id)
        }
      }
    })

    // Calculate growth metrics
    const historicalStart = new Date(start_date)
    historicalStart.setMonth(historicalStart.getMonth() - 1)
    
    const { data: historicalPayments } = await supabase
      .from('commission_payments')
      .select('commission_amount, client_payments:client_payment_id (payment_options:payment_option_id (name))')
      .eq('photographer_id', photographer_id)
      .gte('payment_period_start', historicalStart.toISOString())
      .lt('payment_period_start', start_date)

    const historicalRevenue = historicalPayments?.reduce((sum, payment) => sum + payment.commission_amount, 0) || 0
    const growth = historicalRevenue > 0 ? ((totalRevenue - historicalRevenue) / historicalRevenue) * 100 : 0

    // Prepare email data
    const emailData: EmailReportData = {
      to: recipientEmail,
      photographerName: photographer.users?.name || photographer.users?.email || 'Photographer',
      businessName: photographer.business_name,
      reportType: report_type as 'monthly' | 'quarterly' | 'yearly' | 'custom',
      period: {
        start: start_date,
        end: end_date
      },
      summary: {
        totalRevenue,
        totalClients: activeClients.size,
        monthlyRecurring: totalMonthlyCommission,
        growth
      }
    }

    // Generate PDF if requested
    if (include_pdf) {
      // Prepare report data for PDF generation
      const recentTransactions = commissionPayments?.slice(0, 10).map(payment => ({
        date: payment.payment_period_start,
        clientName: payment.client_payments?.clients?.name || 'Unknown Client',
        amount: payment.commission_amount,
        type: (payment.client_payments?.payment_options?.name?.includes('upfront') || 
               payment.client_payments?.payment_options?.name?.includes('Annual') ? 'upfront' : 'recurring') as 'upfront' | 'recurring',
        status: payment.status
      })) || []

      const clientEarnings = new Map()
      commissionPayments?.forEach(payment => {
        const clientId = payment.client_payments?.client_id
        const clientName = payment.client_payments?.clients?.name || 'Unknown Client'
        
        if (clientId) {
          const current = clientEarnings.get(clientId) || { name: clientName, total: 0, upfront: 0, recurring: 0 }
          current.total += payment.commission_amount
          
          if (payment.client_payments?.payment_options?.name?.includes('upfront') || 
              payment.client_payments?.payment_options?.name?.includes('Annual')) {
            current.upfront += payment.commission_amount
          } else {
            current.recurring += payment.commission_amount
          }
          
          clientEarnings.set(clientId, current)
        }
      })

      const topClients = Array.from(clientEarnings.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

      const reportData: ReportData = {
        photographer: {
          name: photographer.users?.name || photographer.users?.email || 'Photographer',
          email: photographer.users?.email || '',
          businessName: photographer.business_name
        },
        period: {
          start: start_date,
          end: end_date,
          type: report_type as 'monthly' | 'quarterly' | 'yearly' | 'custom'
        },
        summary: {
          totalUpfrontCommission,
          totalMonthlyCommission,
          activeClientsCount: activeClients.size,
          monthlyRecurringClientsCount: monthlyRecurringClients.size,
          projectedMonthlyRecurring: totalMonthlyCommission,
          projectedYearlyTotal: totalUpfrontCommission + (totalMonthlyCommission * 12)
        },
        transactions: recentTransactions,
        topClients,
        analytics: {
          monthlyBreakdown: [],
          growthMetrics: {
            revenueGrowth: growth,
            clientGrowth: 0,
            recurringGrowth: 0
          }
        }
      }

      // Generate PDF
      const generator = new PDFReportGenerator()
      const pdf = generator.generateRevenueReport(reportData)
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

      emailData.attachment = {
        filename: `photovault_${report_type}_report_${start_date}_${end_date}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    }

    // Send email
    const emailService = new EmailReportService(defaultEmailConfig)
    let emailSent = false

    switch (report_type) {
      case 'monthly':
        emailSent = await emailService.sendMonthlyReport(emailData)
        break
      case 'quarterly':
        emailSent = await emailService.sendQuarterlyReport(emailData)
        break
      case 'yearly':
        emailSent = await emailService.sendYearlyReport(emailData)
        break
      default:
        emailSent = await emailService.sendMonthlyReport(emailData)
    }

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email report' },
        { status: 500 }
      )
    }

    // Log the email sending activity
    await supabase
      .from('email_reports_log')
      .insert({
        photographer_id,
        report_type,
        period_start: start_date,
        period_end: end_date,
        recipient_email: recipientEmail,
        sent_at: new Date().toISOString(),
        success: true
      })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Email report sent successfully',
        recipient_email: recipientEmail,
        report_type,
        period: { start: start_date, end: end_date },
        summary: emailData.summary
      }
    })

  } catch (error) {
    logger.error('[ReportsSendEmail] Email report sending error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
