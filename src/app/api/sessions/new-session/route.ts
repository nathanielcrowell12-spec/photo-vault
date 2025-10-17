import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { clientId, photographerId, sessionDate, sessionType, galleryId } = await request.json()

    if (!clientId || !photographerId || !sessionDate) {
      return NextResponse.json(
        { error: 'Client ID, photographer ID, and session date are required' },
        { status: 400 }
      )
    }

    // Check if client has existing payments with this photographer
    const { data: existingPayments, error: fetchError } = await supabase
      .from('client_payments')
      .select('*')
      .eq('client_id', clientId)
      .eq('photographer_id', photographerId)
      .order('payment_date', { ascending: false })

    if (fetchError) {
      console.error('Error fetching existing payments:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch client payment history' },
        { status: 500 }
      )
    }

    // If client has existing payments, reset their commission cycle
    if (existingPayments && existingPayments.length > 0) {
      // Update all existing payments to mark new session
      const { error: updateError } = await supabase
        .from('client_payments')
        .update({
          new_session_with_photographer: true,
          new_session_date: sessionDate,
          commission_applies: true // Reset commission eligibility
        })
        .eq('client_id', clientId)
        .eq('photographer_id', photographerId)

      if (updateError) {
        console.error('Error updating payments for new session:', updateError)
        return NextResponse.json(
          { error: 'Failed to reset commission cycle' },
          { status: 500 }
        )
      }

      console.log(`Commission cycle reset for client ${clientId} with photographer ${photographerId} due to new session`)
    }

    // Create new session record
    const { data: sessionData, error: sessionError } = await supabase
      .from('photo_sessions')
      .insert({
        client_id: clientId,
        photographer_id: photographerId,
        session_date: sessionDate,
        session_type: sessionType || 'New Session',
        gallery_id: galleryId,
        commission_reset: true,
        created_at: new Date().toISOString()
      })
      .select()

    if (sessionError) {
      console.error('Error creating session record:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'New session recorded and commission cycle reset',
      session: sessionData[0],
      commission_reset: existingPayments && existingPayments.length > 0,
      affected_payments: existingPayments ? existingPayments.length : 0
    })

  } catch (error) {
    console.error('New session error:', error)
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

    if (!photographerId) {
      return NextResponse.json(
        { error: 'Photographer ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('photo_sessions')
      .select(`
        *,
        clients:client_id (
          id,
          email,
          name
        )
      `)
      .eq('photographer_id', photographerId)
      .order('session_date', { ascending: false })

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || []
    })

  } catch (error) {
    console.error('Fetch sessions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
