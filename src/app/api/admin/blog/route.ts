import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    // Verify admin via cookie-based client
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Use service role to see all posts (including drafts)
    const adminClient = createServiceRoleClient()

    const { data, error } = await adminClient
      .from('blog_posts')
      .select('id, slug, title, author, status, tags, reading_time, published_at, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[AdminBlog] List error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('[AdminBlog] Unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
