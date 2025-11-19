import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/messages/read
 * Mark messages as read
 * Body:
 *   - other_user_id: mark all messages from this user as read
 *   OR
 *   - message_ids: array of specific message IDs to mark as read
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
    const { other_user_id, message_ids } = body

    if (other_user_id) {
      // Use database function to mark all messages from other_user as read
      const { data, error } = await supabase.rpc('mark_messages_read', {
        p_user_id: user.id,
        p_other_user_id: other_user_id,
      })

      if (error) {
        console.error('Error marking messages as read:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ count: data, success: true }, { status: 200 })
    } else if (message_ids && Array.isArray(message_ids) && message_ids.length > 0) {
      // Mark specific messages as read
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', message_ids)
        .eq('recipient_id', user.id)
        .eq('is_read', false)
        .select('id')

      if (error) {
        console.error('Error marking messages as read:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ count: data?.length || 0, success: true }, { status: 200 })
    } else {
      return NextResponse.json(
        { error: 'Either other_user_id or message_ids is required' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error in POST /api/messages/read:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
