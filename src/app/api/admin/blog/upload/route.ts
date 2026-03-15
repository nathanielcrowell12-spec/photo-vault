import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { parseMarkdownUpload } from '@/lib/blog'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
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

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const publishImmediately = formData.get('publish') === 'true'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.match(/\.(md|mdx)$/i)) {
      return NextResponse.json(
        { success: false, error: 'File must be a .md or .mdx file' },
        { status: 400 }
      )
    }

    if (file.size > 512_000) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 500KB)' },
        { status: 400 }
      )
    }

    const rawContent = await file.text()

    let parsed
    try {
      parsed = parseMarkdownUpload(rawContent, file.name)
    } catch (parseError) {
      const msg = parseError instanceof Error ? parseError.message : 'Failed to parse markdown file'
      return NextResponse.json({ success: false, error: msg }, { status: 400 })
    }

    // Use service role client for insert (bypasses RLS — admin already verified above)
    const adminClient = createServiceRoleClient()

    // Check for duplicate slug
    const { data: existing } = await adminClient
      .from('blog_posts')
      .select('id')
      .eq('slug', parsed.slug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { success: false, error: `A post with slug "${parsed.slug}" already exists` },
        { status: 409 }
      )
    }

    // Insert
    const { data: post, error: insertError } = await adminClient
      .from('blog_posts')
      .insert({
        slug: parsed.slug,
        title: parsed.title,
        description: parsed.description,
        content: parsed.content,
        author: parsed.author,
        tags: parsed.tags,
        og_image: parsed.ogImage || null,
        reading_time: parsed.readingTime,
        status: publishImmediately ? 'published' : 'draft',
        published_at: publishImmediately
          ? (parsed.publishedAt || new Date().toISOString())
          : null,
      })
      .select()
      .single()

    if (insertError) {
      logger.error('[BlogUpload] Insert failed:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to save blog post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: post }, { status: 201 })
  } catch (error) {
    logger.error('[BlogUpload] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
