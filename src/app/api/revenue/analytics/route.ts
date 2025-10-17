import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const photographerId = searchParams.get('photographer_id')
    const period = searchParams.get('period') || '12' // months

    if (!photographerId) {
      return NextResponse.json(
        { error: 'Photographer ID is required' },
        { status: 400 }
      )
    }

    const monthsBack = parseInt(period)
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsBack)

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
      .eq('photographer_id', photographerId)
      .gte('payment_period_start', startDate.toISOString())
      .order('payment_period_start', { ascending: true })

    if (commissionError) {
      console.error('Error fetching commission payments:', commissionError)
      return NextResponse.json(
        { error: 'Failed to fetch commission data' },
        { status: 500 }
      )
    }

    // Fetch client payments for context
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
      .eq('photographer_id', photographerId)
      .gte('payment_date', startDate.toISOString())
      .order('payment_date', { ascending: true })

    if (clientError) {
      console.error('Error fetching client payments:', clientError)
      return NextResponse.json(
        { error: 'Failed to fetch client payment data' },
        { status: 500 }
      )
    }

    // Calculate monthly breakdown
    const monthlyData = new Map()
    const now = new Date()
    
    // Initialize months
    for (let i = monthsBack; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = month.toISOString().substring(0, 7) // YYYY-MM
      monthlyData.set(monthKey, {
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        upfront: 0,
        recurring: 0,
        total: 0,
        newClients: 0,
        activeClients: 0
      })
    }

    // Process commission payments
    commissionPayments?.forEach(payment => {
      const monthKey = payment.payment_period_start.substring(0, 7)
      const monthData = monthlyData.get(monthKey)
      
      if (monthData) {
        const isUpfront = payment.client_payments?.payment_options?.name?.includes('upfront') || 
                         payment.client_payments?.payment_options?.name?.includes('Annual')
        
        if (isUpfront) {
          monthData.upfront += payment.commission_amount
          monthData.newClients += 1
        } else {
          monthData.recurring += payment.commission_amount
        }
        
        monthData.total += payment.commission_amount
        monthData.activeClients = Math.max(monthData.activeClients, monthData.newClients + monthData.activeClients)
      }
    })

    // Calculate growth metrics
    const monthlyArray = Array.from(monthlyData.values())
    const currentMonth = monthlyArray[monthlyArray.length - 1]
    const previousMonth = monthlyArray[monthlyArray.length - 2]
    
    const growthMetrics = {
      revenueGrowth: previousMonth ? 
        ((currentMonth.total - previousMonth.total) / previousMonth.total * 100) : 0,
      clientGrowth: previousMonth ? 
        ((currentMonth.newClients - previousMonth.newClients) / Math.max(previousMonth.newClients, 1) * 100) : 0,
      recurringGrowth: previousMonth ? 
        ((currentMonth.recurring - previousMonth.recurring) / Math.max(previousMonth.recurring, 1) * 100) : 0
    }

    // Calculate totals
    const totals = {
      totalRevenue: monthlyArray.reduce((sum, month) => sum + month.total, 0),
      totalUpfront: monthlyArray.reduce((sum, month) => sum + month.upfront, 0),
      totalRecurring: monthlyArray.reduce((sum, month) => sum + month.recurring, 0),
      totalNewClients: monthlyArray.reduce((sum, month) => sum + month.newClients, 0),
      averageMonthlyRevenue: monthlyArray.reduce((sum, month) => sum + month.total, 0) / monthsBack
    }

    // Calculate projections
    const last3Months = monthlyArray.slice(-3)
    const avgMonthlyGrowth = last3Months.length > 1 ? 
      (last3Months[last3Months.length - 1].total - last3Months[0].total) / (last3Months.length - 1) : 0
    
    const projections = {
      nextMonth: currentMonth.total + avgMonthlyGrowth,
      next3Months: (currentMonth.total + avgMonthlyGrowth) * 3,
      nextYear: (currentMonth.total + avgMonthlyGrowth) * 12,
      recurringRunRate: monthlyArray.slice(-3).reduce((sum, month) => sum + month.recurring, 0) / 3 * 12
    }

    // Client retention analysis
    const clientActivity = new Map()
    clientPayments?.forEach(payment => {
      const clientId = payment.client_id
      const paymentDate = new Date(payment.payment_date)
      
      if (!clientActivity.has(clientId)) {
        clientActivity.set(clientId, {
          firstPayment: paymentDate,
          lastPayment: paymentDate,
          totalPayments: 0,
          totalAmount: 0
        })
      }
      
      const activity = clientActivity.get(clientId)
      activity.lastPayment = new Date(Math.max(activity.lastPayment.getTime(), paymentDate.getTime()))
      activity.totalPayments += 1
      activity.totalAmount += payment.amount || 0
    })

    const retentionMetrics = {
      totalClients: clientActivity.size,
      activeClients: Array.from(clientActivity.values()).filter(
        client => (now.getTime() - client.lastPayment.getTime()) < (30 * 24 * 60 * 60 * 1000)
      ).length,
      avgClientLifetime: Array.from(clientActivity.values()).reduce(
        (sum, client) => sum + (client.lastPayment.getTime() - client.firstPayment.getTime()), 0
      ) / clientActivity.size / (1000 * 60 * 60 * 24), // days
      avgClientValue: Array.from(clientActivity.values()).reduce(
        (sum, client) => sum + client.totalAmount, 0
      ) / clientActivity.size
    }

    const analyticsData = {
      monthlyBreakdown: monthlyArray,
      growthMetrics,
      totals,
      projections,
      retentionMetrics,
      period: monthsBack
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    console.error('Revenue analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
