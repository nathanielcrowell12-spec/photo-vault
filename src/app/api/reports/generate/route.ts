import { NextRequest, NextResponse } from 'next/server'
import { PDFReportGenerator, ReportData } from '@/lib/pdf-generator'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      photographer_id,
      report_type,
      start_date,
      end_date,
      include_analytics = true
    } = body

    if (!photographer_id || !report_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: photographer_id, report_type, start_date, end_date' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Fetch photographer data
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select('*')
      .eq('id', photographer_id)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('full_name, business_name')
      .eq('id', photographer_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get email from auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(photographer_id)
    const userEmail = authUser?.user?.email || 'No email'

    // Fetch commissions for the period from the commissions table
    const { data: commissions, error: commissionError } = await supabase
      .from('commissions')
      .select('*')
      .eq('photographer_id', photographer_id)
      .gte('created_at', start_date)
      .lte('created_at', end_date)
      .order('created_at', { ascending: false })

    if (commissionError) {
      logger.error('[ReportsGenerate] Error fetching commissions:', commissionError)
      return NextResponse.json(
        { error: 'Failed to fetch commission data' },
        { status: 500 }
      )
    }

    // Calculate summary data from real commissions
    const totalUpfrontCommission = commissions?.reduce((sum, c) => {
      return sum + (c.payment_type === 'upfront' ? c.amount_cents / 100 : 0)
    }, 0) || 0

    const totalMonthlyCommission = commissions?.reduce((sum, c) => {
      return sum + (c.payment_type === 'monthly' || c.payment_type === 'reactivation' ? c.amount_cents / 100 : 0)
    }, 0) || 0

    // Get unique clients from commissions
    const activeClients = new Set<string>()
    const monthlyRecurringClients = new Set<string>()

    commissions?.forEach(commission => {
      if (commission.client_email) {
        activeClients.add(commission.client_email)
        if (commission.payment_type === 'monthly') {
          monthlyRecurringClients.add(commission.client_email)
        }
      }
    })

    // Prepare recent transactions
    const recentTransactions = commissions?.slice(0, 20).map(commission => ({
      date: commission.created_at,
      clientName: commission.client_email || 'Unknown Client',
      amount: commission.amount_cents / 100,
      type: commission.payment_type as 'upfront' | 'recurring',
      status: commission.status
    })) || []

    // Calculate top clients by earnings
    const clientEarnings = new Map<string, { name: string; total: number; upfront: number; recurring: number }>()
    commissions?.forEach(commission => {
      const clientEmail = commission.client_email
      if (clientEmail) {
        const current = clientEarnings.get(clientEmail) || { name: clientEmail, total: 0, upfront: 0, recurring: 0 }
        const amountDollars = commission.amount_cents / 100
        current.total += amountDollars

        if (commission.payment_type === 'upfront') {
          current.upfront += amountDollars
        } else {
          current.recurring += amountDollars
        }

        clientEarnings.set(clientEmail, current)
      }
    })

    const topClients = Array.from(clientEarnings.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // Prepare report data
    const reportData: ReportData = {
      photographer: {
        name: user.full_name || user.business_name || userEmail,
        email: userEmail,
        businessName: user.business_name
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
      topClients
    }

    // Add analytics if requested
    if (include_analytics) {
      // Fetch historical data for growth calculations (previous period)
      const historicalStart = new Date(start_date)
      historicalStart.setMonth(historicalStart.getMonth() - 1)

      const { data: historicalCommissions } = await supabase
        .from('commissions')
        .select('amount_cents, payment_type')
        .eq('photographer_id', photographer_id)
        .gte('created_at', historicalStart.toISOString())
        .lt('created_at', start_date)

      const historicalUpfront = historicalCommissions?.reduce((sum, c) =>
        sum + (c.payment_type === 'upfront' ? c.amount_cents / 100 : 0), 0) || 0

      const historicalRecurring = historicalCommissions?.reduce((sum, c) =>
        sum + (c.payment_type === 'monthly' || c.payment_type === 'reactivation' ? c.amount_cents / 100 : 0), 0) || 0

      const historicalTotal = historicalUpfront + historicalRecurring
      const currentTotal = totalUpfrontCommission + totalMonthlyCommission

      reportData.analytics = {
        monthlyBreakdown: [],
        growthMetrics: {
          revenueGrowth: historicalTotal > 0 ? ((currentTotal - historicalTotal) / historicalTotal) * 100 : 0,
          clientGrowth: 0,
          recurringGrowth: historicalRecurring > 0 ? ((totalMonthlyCommission - historicalRecurring) / historicalRecurring) * 100 : 0
        }
      }
    }

    // Generate PDF
    const generator = new PDFReportGenerator()
    const pdf = generator.generateRevenueReport(reportData)
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Return PDF as base64 for download
    const pdfBase64 = pdfBuffer.toString('base64')

    return NextResponse.json({
      success: true,
      data: {
        report_id: `report_${Date.now()}`,
        pdf_base64: pdfBase64,
        filename: `photovault_${report_type}_report_${start_date}_${end_date}.pdf`,
        report_data: reportData
      }
    })

  } catch (error) {
    logger.error('[ReportsGenerate] Report generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
