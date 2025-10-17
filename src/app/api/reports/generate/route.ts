import { NextRequest, NextResponse } from 'next/server'
import { PDFReportGenerator, ReportData } from '@/lib/pdf-generator'
import { supabase } from '@/lib/supabase'

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

    // Fetch photographer data
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select('*')
      .eq('user_id', photographer_id)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json(
        { error: 'Photographer not found' },
        { status: 404 }
      )
    }

    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', photographer_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch commission payments for the period
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
      console.error('Error fetching commission payments:', commissionError)
      return NextResponse.json(
        { error: 'Failed to fetch commission data' },
        { status: 500 }
      )
    }

    // Fetch client payments for additional context
    const { data: clientPayments, error: clientError } = await supabase
      .from('client_payments')
      .select(`
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
      `)
      .eq('photographer_id', photographer_id)
      .gte('payment_date', start_date)
      .lte('payment_date', end_date)
      .order('payment_date', { ascending: false })

    if (clientError) {
      console.error('Error fetching client payments:', clientError)
      return NextResponse.json(
        { error: 'Failed to fetch client payment data' },
        { status: 500 }
      )
    }

    // Calculate summary data
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

    // Prepare recent transactions
    const recentTransactions = commissionPayments?.slice(0, 20).map(payment => ({
      date: payment.payment_period_start,
      clientName: payment.client_payments?.clients?.name || 'Unknown Client',
      amount: payment.commission_amount,
      type: (payment.client_payments?.payment_options?.name?.includes('upfront') || 
            payment.client_payments?.payment_options?.name?.includes('Annual') ? 'upfront' : 'recurring') as 'upfront' | 'recurring',
      status: payment.status
    })) || []

    // Calculate top clients
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
      .slice(0, 10)

    // Prepare report data
    const reportData: ReportData = {
      photographer: {
        name: user.name || user.email,
        email: user.email,
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
      topClients
    }

    // Add analytics if requested
    if (include_analytics) {
      // Fetch historical data for growth calculations
      const historicalStart = new Date(start_date)
      historicalStart.setMonth(historicalStart.getMonth() - 1)
      
      const { data: historicalPayments } = await supabase
        .from('commission_payments')
        .select('commission_amount, payment_period_start, client_payments:client_payment_id (payment_options:payment_option_id (name))')
        .eq('photographer_id', photographer_id)
        .gte('payment_period_start', historicalStart.toISOString())
        .lt('payment_period_start', start_date)

      const historicalUpfront = historicalPayments?.reduce((sum, payment) => {
        const isUpfront = payment.client_payments?.payment_options?.name?.includes('upfront') || 
                         payment.client_payments?.payment_options?.name?.includes('Annual')
        return sum + (isUpfront ? payment.commission_amount : 0)
      }, 0) || 0

      const historicalRecurring = historicalPayments?.reduce((sum, payment) => {
        const isRecurring = payment.client_payments?.payment_options?.name?.includes('ongoing') || 
                           payment.client_payments?.payment_options?.name?.includes('monthly')
        return sum + (isRecurring ? payment.commission_amount : 0)
      }, 0) || 0

      const historicalTotal = historicalUpfront + historicalRecurring
      const currentTotal = totalUpfrontCommission + totalMonthlyCommission

      reportData.analytics = {
        monthlyBreakdown: [], // Could be populated with monthly data
        growthMetrics: {
          revenueGrowth: historicalTotal > 0 ? ((currentTotal - historicalTotal) / historicalTotal) * 100 : 0,
          clientGrowth: 0, // Could be calculated with client data
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
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
