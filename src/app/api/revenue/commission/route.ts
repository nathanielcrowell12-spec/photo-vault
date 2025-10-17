import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      photographer_id, 
      client_payment_id, 
      commission_amount, 
      payment_period_start, 
      payment_period_end,
      status = 'pending'
    } = body

    // Validate required fields
    if (!photographer_id || !client_payment_id || !commission_amount || !payment_period_start) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create commission payment record
    const { data: commissionPayment, error } = await supabase
      .from('commission_payments')
      .insert([
        {
          photographer_id,
          client_payment_id,
          commission_amount,
          payment_period_start,
          payment_period_end: payment_period_end || payment_period_start,
          status,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating commission payment:', error)
      return NextResponse.json(
        { error: 'Failed to create commission payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: commissionPayment
    })

  } catch (error) {
    console.error('Commission creation error:', error)
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
    const clientId = searchParams.get('client_id')
    const status = searchParams.get('status')

    let query = supabase
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

    if (photographerId) {
      query = query.eq('photographer_id', photographerId)
    }

    if (clientId) {
      query = query.eq('client_payments.client_id', clientId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: commissionPayments, error } = await query
      .order('payment_period_start', { ascending: false })

    if (error) {
      console.error('Error fetching commission payments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch commission payments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: commissionPayments
    })

  } catch (error) {
    console.error('Commission fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, commission_amount, payment_period_start, payment_period_end } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Commission payment ID is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (commission_amount) updateData.commission_amount = commission_amount
    if (payment_period_start) updateData.payment_period_start = payment_period_start
    if (payment_period_end) updateData.payment_period_end = payment_period_end

    const { data: commissionPayment, error } = await supabase
      .from('commission_payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating commission payment:', error)
      return NextResponse.json(
        { error: 'Failed to update commission payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: commissionPayment
    })

  } catch (error) {
    console.error('Commission update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
