import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const photographerId = searchParams.get('photographer_id')
    const period = searchParams.get('period') || 'all' // 'all', 'monthly', 'yearly'

    if (!photographerId) {
      return NextResponse.json(
        { error: 'Photographer ID is required' },
        { status: 400 }
      )
    }

    // Fetch commission payments
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
      .eq('photographer_id', photographerId)
      .order('payment_date', { ascending: false })

    if (clientError) {
      console.error('Error fetching client payments:', clientError)
      return NextResponse.json(
        { error: 'Failed to fetch client payment data' },
        { status: 500 }
      )
    }

    // Calculate revenue metrics
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentYear = new Date(now.getFullYear(), 0, 1)

    let totalUpfrontCommission = 0
    let totalMonthlyCommission = 0
    let monthlyUpfrontCommission = 0
    let monthlyRecurringCommission = 0
    let yearlyUpfrontCommission = 0
    let yearlyRecurringCommission = 0

    const activeClients = new Set()
    const monthlyRecurringClients = new Set()

    // Process commission payments
    commissionPayments?.forEach(payment => {
      const paymentDate = new Date(payment.payment_period_start)
      const isCurrentMonth = paymentDate >= currentMonth
      const isCurrentYear = paymentDate >= currentYear

      totalUpfrontCommission += payment.commission_amount

      if (isCurrentMonth) {
        monthlyUpfrontCommission += payment.commission_amount
      }

      if (isCurrentYear) {
        yearlyUpfrontCommission += payment.commission_amount
      }

      if (payment.client_payments?.payment_options?.name?.includes('ongoing')) {
        totalMonthlyCommission += payment.commission_amount
        monthlyRecurringClients.add(payment.client_payments.client_id)

        if (isCurrentMonth) {
          monthlyRecurringCommission += payment.commission_amount
        }

        if (isCurrentYear) {
          yearlyRecurringCommission += payment.commission_amount
        }
      }

      activeClients.add(payment.client_payments.client_id)
    })

    // Process client payments for ongoing revenue
    clientPayments?.forEach(payment => {
      if (payment.status === 'active') {
        const paymentDate = new Date(payment.payment_date)
        const isCurrentMonth = paymentDate >= currentMonth
        const isCurrentYear = paymentDate >= currentYear

        // Calculate monthly recurring commission
        if (payment.payment_options?.photographer_commission_rate && payment.payment_options.price) {
          const monthlyCommission = (payment.payment_options.price * payment.payment_options.photographer_commission_rate) / 100
          
          if (payment.payment_options.name?.includes('ongoing') || payment.payment_options.name?.includes('monthly')) {
            totalMonthlyCommission += monthlyCommission
            monthlyRecurringClients.add(payment.client_id)

            if (isCurrentMonth) {
              monthlyRecurringCommission += monthlyCommission
            }

            if (isCurrentYear) {
              yearlyRecurringCommission += monthlyCommission
            }
          }
        }
      }
    })

    // Calculate projections
    const projectedMonthlyRecurring = monthlyRecurringCommission
    const projectedYearlyRecurring = projectedMonthlyRecurring * 12
    const projectedYearlyTotal = yearlyUpfrontCommission + projectedYearlyRecurring

    // Recent transactions
    const recentTransactions = commissionPayments?.slice(0, 10).map(payment => ({
      id: payment.id,
      clientName: payment.client_payments?.clients?.name || 'Unknown Client',
      amount: payment.commission_amount,
      type: payment.client_payments?.payment_options?.name?.includes('ongoing') ? 'recurring' : 'upfront',
      date: payment.payment_period_start,
      status: payment.status
    }))

    // Top earning clients
    const clientEarnings = new Map()
    commissionPayments?.forEach(payment => {
      const clientId = payment.client_payments?.client_id
      const clientName = payment.client_payments?.clients?.name || 'Unknown Client'
      
      if (clientId) {
        const current = clientEarnings.get(clientId) || { name: clientName, total: 0, upfront: 0, recurring: 0 }
        current.total += payment.commission_amount
        
        if (payment.client_payments?.payment_options?.name?.includes('ongoing')) {
          current.recurring += payment.commission_amount
        } else {
          current.upfront += payment.commission_amount
        }
        
        clientEarnings.set(clientId, current)
      }
    })

    const topClients = Array.from(clientEarnings.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const dashboardData = {
      summary: {
        totalUpfrontCommission,
        totalMonthlyCommission,
        monthlyUpfrontCommission,
        monthlyRecurringCommission,
        yearlyUpfrontCommission,
        yearlyRecurringCommission,
        activeClientsCount: activeClients.size,
        monthlyRecurringClientsCount: monthlyRecurringClients.size,
        projectedMonthlyRecurring,
        projectedYearlyRecurring,
        projectedYearlyTotal
      },
      recentTransactions,
      topClients,
      period
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Revenue dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
