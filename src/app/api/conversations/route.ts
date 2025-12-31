import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/conversations
 * Get all conversations for the authenticated user
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

    // Get user type
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    // Get conversations where user is participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        user1_id,
        user2_id,
        last_message_at,
        last_message_preview,
        user1_archived,
        user2_archived,
        user1_unread_count,
        user2_unread_count,
        created_at
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (error) {
      logger.error('[Conversations] Error fetching conversations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get all unique user IDs from conversations
    const userIds = new Set<string>()
    conversations?.forEach(conv => {
      userIds.add(conv.user1_id)
      userIds.add(conv.user2_id)
    })
    userIds.delete(user.id) // Remove current user

    // Fetch user profiles for other participants
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, business_name, user_type')
      .in('id', Array.from(userIds))

    // Get emails from auth.users
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const emailMap = new Map()
    authUsers?.users.forEach((authUser: any) => {
      emailMap.set(authUser.id, authUser.email)
    })

    // Map profiles for quick lookup
    const profileMap = new Map()
    profiles?.forEach(profile => {
      profileMap.set(profile.id, {
        ...profile,
        email: emailMap.get(profile.id),
      })
    })

    // Format conversations for client
    const formattedConversations = conversations?.map(conv => {
      const isUser1 = conv.user1_id === user.id
      const otherUserId = isUser1 ? conv.user2_id : conv.user1_id
      const otherUser = profileMap.get(otherUserId)
      const isArchived = isUser1 ? conv.user1_archived : conv.user2_archived
      const unreadCount = isUser1 ? conv.user1_unread_count : conv.user2_unread_count

      return {
        id: conv.id,
        other_user: {
          id: otherUserId,
          name: otherUser?.full_name || otherUser?.business_name || otherUser?.email || 'Unknown User',
          user_type: otherUser?.user_type || 'unknown',
          email: otherUser?.email,
        },
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview,
        unread_count: unreadCount,
        is_archived: isArchived,
        created_at: conv.created_at,
      }
    }).filter(conv => !conv.is_archived) || [] // Hide archived by default

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error: any) {
    logger.error('[Conversations] Error in GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/conversations
 * Create or get conversation with another user
 * Body: { other_user_id: string }
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
    const { other_user_id } = body

    if (!other_user_id) {
      return NextResponse.json({ error: 'other_user_id is required' }, { status: 400 })
    }

    // Check permission
    const { data: canMessage } = await supabase.rpc('can_user_message', {
      p_sender_id: user.id,
      p_recipient_id: other_user_id,
    })

    if (!canMessage) {
      return NextResponse.json(
        { error: 'You do not have permission to message this user' },
        { status: 403 }
      )
    }

    // Get or create conversation
    const { data: conversationId, error: convError } = await supabase.rpc('get_or_create_conversation', {
      p_user1_id: user.id,
      p_user2_id: other_user_id,
    })

    if (convError) {
      logger.error('[Conversations] Error creating conversation:', convError)
      return NextResponse.json({ error: convError.message }, { status: 500 })
    }

    return NextResponse.json({ conversation_id: conversationId })
  } catch (error: any) {
    logger.error('[Conversations] Error in POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
