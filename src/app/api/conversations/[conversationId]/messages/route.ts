import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/conversations/[conversationId]/messages
 * Get all messages in a conversation
 * Query params:
 *   - limit: number of messages (default 50)
 *   - before: get messages before this timestamp (pagination)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { conversationId } = await params

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

    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')

    // Fetch messages
    let query = supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) {
      logger.error('[ConversationMessages] Error fetching messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mark messages as read
    await supabase.rpc('mark_conversation_messages_read', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
    })

    return NextResponse.json({ messages: messages?.reverse() || [] })
  } catch (error: any) {
    logger.error('[ConversationMessages] Error in GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/conversations/[conversationId]/messages
 * Send a new message
 * Body: { message_text: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { conversationId } = await params

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

    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { message_text } = body

    if (!message_text || message_text.trim().length === 0) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 })
    }

    if (message_text.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
    }

    // Determine recipient
    const recipientId = conversation.user1_id === user.id
      ? conversation.user2_id
      : conversation.user1_id

    // Check permission
    const { data: canMessage } = await supabase.rpc('can_user_message', {
      p_sender_id: user.id,
      p_recipient_id: recipientId,
    })

    if (!canMessage) {
      return NextResponse.json(
        { error: 'You do not have permission to send messages in this conversation' },
        { status: 403 }
      )
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        message_text: message_text.trim(),
      })
      .select()
      .single()

    if (insertError) {
      logger.error('[ConversationMessages] Error inserting message:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    logger.error('[ConversationMessages] Error in POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
