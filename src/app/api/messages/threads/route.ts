import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/messages/threads
 * Get all message threads (conversations) for the authenticated user
 */
export async function GET(request: NextRequest) {
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

    // Get all threads where user is participant
    const { data: threads, error } = await supabase
      .from('message_threads')
      .select(`
        id,
        user1_id,
        user2_id,
        last_message_id,
        last_message_at,
        user1_unread_count,
        user2_unread_count,
        created_at,
        user1:user1_id(id, full_name, user_type),
        user2:user2_id(id, full_name, user_type),
        last_message:last_message_id(message_text, created_at)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (error) {
      logger.error('[MessageThreads] Error fetching threads:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user emails from auth.users for all participants
    const userIds = new Set<string>()
    threads?.forEach((thread: any) => {
      userIds.add(thread.user1_id)
      userIds.add(thread.user2_id)
    })

    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const emailMap = new Map()
    authUsers?.users.forEach((authUser: any) => {
      emailMap.set(authUser.id, authUser.email)
    })

    // Format threads for easier client consumption
    const formattedThreads = threads?.map((thread: any) => {
      const isUser1 = thread.user1_id === user.id
      const otherUserProfile = isUser1 ? thread.user2 : thread.user1
      const otherUserId = isUser1 ? thread.user2_id : thread.user1_id
      const unreadCount = isUser1 ? thread.user1_unread_count : thread.user2_unread_count

      return {
        id: thread.id,
        other_user: {
          ...otherUserProfile,
          email: emailMap.get(otherUserId) || 'unknown@example.com',
        },
        last_message: thread.last_message,
        last_message_at: thread.last_message_at,
        unread_count: unreadCount,
        created_at: thread.created_at,
      }
    }) || []

    return NextResponse.json({ threads: formattedThreads }, { status: 200 })
  } catch (error: any) {
    logger.error('[MessageThreads] Error in GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
