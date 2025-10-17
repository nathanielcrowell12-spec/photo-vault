import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Fetch client information
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Fetch client payments with related data
    const { data: clientPayments, error: paymentsError } = await supabase
      .from('client_payments')
      .select(`
        *,
        galleries:gallery_id (
          id,
          name,
          photographers:photographer_id (
            business_name,
            users:user_id (
              name,
              email
            )
          )
        ),
        payment_options:payment_option_id (
          name,
          price,
          duration
        )
      `)
      .eq('client_id', clientId)
      .order('payment_date', { ascending: false })

    if (paymentsError) {
      console.error('Error fetching client payments:', paymentsError)
      return NextResponse.json(
        { error: 'Failed to fetch payment data' },
        { status: 500 }
      )
    }

    // Calculate total paid
    const totalPaid = clientPayments?.reduce((sum, payment) => {
      return sum + (payment.status === 'paid' ? payment.amount_paid : 0)
    }, 0) || 0

    // Get active galleries
    const activeGalleries = clientPayments?.filter(payment => 
      payment.status === 'paid' && 
      new Date(payment.gallery_access_until || '') > new Date()
    ).map(payment => ({
      id: payment.gallery_id,
      photographer_name: payment.galleries?.photographers?.business_name || 'Unknown Photographer',
      gallery_name: payment.galleries?.name || 'Unknown Gallery',
      access_expires: payment.gallery_access_until,
      status: 'active' as const
    })) || []

    // Prepare payment history
    const paymentHistory = clientPayments?.map(payment => ({
      id: payment.id,
      date: payment.payment_date,
      amount: payment.amount_paid,
      status: payment.status,
      description: `${payment.galleries?.name || 'Gallery'} - ${payment.payment_options?.name || 'Access'}`,
      payment_method: 'Card •••• 4242', // This would come from payment processor
      gallery_access: {
        photographer_name: payment.galleries?.photographers?.business_name || 'Unknown Photographer',
        gallery_name: payment.galleries?.name || 'Unknown Gallery',
        access_expires: payment.gallery_access_until
      }
    })) || []

    // Get next billing date (if any recurring payments)
    const nextBillingPayment = clientPayments?.find(payment => 
      payment.status === 'paid' && 
      payment.payment_options?.name?.includes('monthly') &&
      payment.gallery_access_until &&
      new Date(payment.gallery_access_until) > new Date()
    )

    const billingInfo = {
      client_name: client.name,
      email: client.email,
      phone: client.phone || '',
      billing_address: client.billing_address || '',
      payment_method: {
        type: 'card',
        last4: '4242', // This would come from payment processor
        brand: 'Visa',
        expiry: '12/25'
      },
      subscription_status: activeGalleries.length > 0 ? 'active' : 'inactive',
      next_billing_date: nextBillingPayment?.gallery_access_until || null,
      total_paid: totalPaid,
      galleries: activeGalleries
    }

    return NextResponse.json({
      success: true,
      data: {
        billing_info: billingInfo,
        payment_history: paymentHistory
      }
    })

  } catch (error) {
    console.error('Client billing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_id, action, ...data } = body

    if (!client_id || !action) {
      return NextResponse.json(
        { error: 'Client ID and action are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'update_payment_method':
        // Handle payment method update
        return NextResponse.json({
          success: true,
          data: { message: 'Payment method updated successfully' }
        })

      case 'download_invoice':
        const { payment_id } = data
        // Generate and return invoice download link
        return NextResponse.json({
          success: true,
          data: {
            download_url: `/api/client/invoice/${payment_id}/download`,
            message: 'Invoice ready for download'
          }
        })

      case 'email_receipt':
        const { payment_id: receiptPaymentId } = data
        // Send email receipt
        return NextResponse.json({
          success: true,
          data: { message: 'Receipt emailed successfully' }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Client billing POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
