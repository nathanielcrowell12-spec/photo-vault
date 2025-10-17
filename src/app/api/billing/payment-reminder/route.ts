import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { clientId, photographerId, galleryId, paymentOptionId } = await request.json()

    if (!clientId || !photographerId || !galleryId) {
      return NextResponse.json(
        { error: 'Client ID, photographer ID, and gallery ID are required' },
        { status: 400 }
      )
    }

    // Fetch client and photographer information
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    const { data: photographerData, error: photographerError } = await supabase
      .from('photographers')
      .select('*, user_profiles(*)')
      .eq('id', photographerId)
      .single()

    const { data: galleryData, error: galleryError } = await supabase
      .from('photo_galleries')
      .select('*')
      .eq('id', galleryId)
      .single()

    if (clientError || photographerError || galleryError) {
      return NextResponse.json(
        { error: 'Failed to fetch client, photographer, or gallery data' },
        { status: 500 }
      )
    }

    // Create payment reminder record
    const { data: reminderData, error: reminderError } = await supabase
      .from('payment_reminders')
      .insert({
        client_id: clientId,
        photographer_id: photographerId,
        gallery_id: galleryId,
        payment_option_id: paymentOptionId,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .select()

    if (reminderError) {
      console.error('Error creating payment reminder:', reminderError)
      return NextResponse.json(
        { error: 'Failed to create payment reminder record' },
        { status: 500 }
      )
    }

    // In a real implementation, you would send the actual email here
    // For now, we'll simulate the email content
    const emailContent = {
      to: clientData.email,
      subject: `Your photos are ready! - ${galleryData.gallery_name}`,
      template: 'payment_reminder',
      data: {
        clientName: clientData.name,
        photographerName: photographerData.user_profiles?.business_name || photographerData.user_profiles?.name,
        galleryName: galleryData.gallery_name,
        sessionDate: galleryData.session_date,
        photoCount: galleryData.photo_count,
        paymentAmount: '$8.00',
        paymentLink: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/${clientId}/${galleryId}`,
        photographerWebsite: photographerData.user_profiles?.website_url
      }
    }

    // Simulate email sending
    console.log('Payment reminder email would be sent:', emailContent)

    return NextResponse.json({
      success: true,
      message: 'Payment reminder sent successfully',
      reminder: reminderData[0],
      emailContent: emailContent
    })

  } catch (error) {
    console.error('Payment reminder error:', error)
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
    const status = searchParams.get('status')

    let query = supabase
      .from('payment_reminders')
      .select(`
        *,
        clients:client_id (
          id,
          email,
          name
        ),
        photo_galleries:gallery_id (
          id,
          gallery_name,
          session_date
        )
      `)
      .order('sent_at', { ascending: false })

    if (photographerId) {
      query = query.eq('photographer_id', photographerId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: reminders, error } = await query

    if (error) {
      console.error('Error fetching payment reminders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment reminders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reminders: reminders || []
    })

  } catch (error) {
    console.error('Fetch payment reminders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
