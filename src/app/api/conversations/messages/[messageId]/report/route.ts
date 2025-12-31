import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/conversations/messages/[messageId]/report
 * Report a message for review
 * Body: { reason: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { messageId } = await params

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
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    // Get message
    const { data: message, error: messageError } = await supabase
      .from('conversation_messages')
      .select('id, conversation_id, sender_id')
      .eq('id', messageId)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Verify user is part of the conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', message.conversation_id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.user1_id !== user.id && conversation.user2_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update message to mark as reported
    const { error: updateError } = await supabase
      .from('conversation_messages')
      .update({
        is_reported: true,
        reported_by: user.id,
        reported_at: new Date().toISOString(),
        report_reason: reason.trim(),
      })
      .eq('id', messageId)

    if (updateError) {
      logger.error('[MessageReport] Error reporting message:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Message reported successfully' })
  } catch (error: any) {
    logger.error('[MessageReport] Error in POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
