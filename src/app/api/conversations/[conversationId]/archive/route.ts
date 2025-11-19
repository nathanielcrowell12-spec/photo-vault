import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/conversations/[conversationId]/archive
 * Archive or unarchive a conversation
 * Body: { archived: boolean }
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

    const body = await request.json()
    const { archived } = body

    if (typeof archived !== 'boolean') {
      return NextResponse.json({ error: 'archived must be a boolean' }, { status: 400 })
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Determine which user
    const isUser1 = conversation.user1_id === user.id
    const isUser2 = conversation.user2_id === user.id

    if (!isUser1 && !isUser2) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update archive status for this user only
    const updateData = isUser1
      ? { user1_archived: archived }
      : { user2_archived: archived }

    const { error: updateError } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)

    if (updateError) {
      console.error('Error archiving conversation:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, archived })
  } catch (error: any) {
    console.error('Error in POST /api/conversations/[conversationId]/archive:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
