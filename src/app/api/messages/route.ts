import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/messages
 * Fetch messages for the authenticated user
 * Query params:
 *   - with: user ID to get conversation with specific user
 *   - limit: number of messages to return (default 50)
 *   - before: get messages before this timestamp (for pagination)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)

    // Get authenticated user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const withUserId = searchParams.get('with')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')

    let query = supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        recipient_id,
        message_text,
        gallery_id,
        session_id,
        is_read,
        read_at,
        created_at,
        sender:sender_id(id, full_name),
        recipient:recipient_id(id, full_name)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter for conversation with specific user
    if (withUserId) {
      query = query.or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${withUserId}),and(sender_id.eq.${withUserId},recipient_id.eq.${user.id})`
      )
    } else {
      // Get all messages where user is sender or recipient
      query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    }

    // Pagination: get messages before timestamp
    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages }, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/messages
 * Send a new message
 * Body:
 *   - recipient_id: user ID of recipient
 *   - message_text: message content
 *   - gallery_id: (optional) related gallery
 *   - session_id: (optional) related session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipient_id, message_text, gallery_id, session_id } = body

    // Validation
    if (!recipient_id || !message_text) {
      return NextResponse.json(
        { error: 'recipient_id and message_text are required' },
        { status: 400 }
      )
    }

    if (recipient_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      )
    }

    if (message_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    // Verify recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('id', recipient_id)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id,
        message_text: message_text.trim(),
        gallery_id: gallery_id || null,
        session_id: session_id || null,
      })
      .select(`
        id,
        sender_id,
        recipient_id,
        message_text,
        gallery_id,
        session_id,
        is_read,
        read_at,
        created_at,
        sender:sender_id(id, full_name),
        recipient:recipient_id(id, full_name)
      `)
      .single()

    if (insertError) {
      console.error('Error inserting message:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
