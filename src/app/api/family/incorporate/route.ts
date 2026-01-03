import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/family/incorporate
 * List galleries available for incorporation (from accounts where user is secondary)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    // Check if user has their own account (is a primary somewhere)
    const { data: userProfile } = await serviceSupabase
      .from('user_profiles')
      .select('id, user_type')
      .eq('id', user.id)
      .single()

    const hasOwnAccount = userProfile?.user_type === 'client'

    // Get accounts where user is an accepted secondary
    const { data: secondaryRecords, error: secError } = await serviceSupabase
      .from('secondaries')
      .select('account_id, relationship')
      .eq('secondary_user_id', user.id)
      .eq('status', 'accepted')

    if (secError || !secondaryRecords || secondaryRecords.length === 0) {
      return NextResponse.json({
        galleries: [],
        has_own_account: hasOwnAccount,
        message: 'You are not a secondary on any accounts'
      })
    }

    const accountIds = secondaryRecords.map(s => s.account_id)

    // Get family-shared galleries from those accounts
    const { data: galleries, error: galleryError } = await serviceSupabase
      .from('photo_galleries')
      .select(`
        id,
        gallery_name,
        gallery_description,
        cover_image_url,
        photo_count,
        session_date,
        created_at,
        client_id,
        photographer_id,
        is_family_shared
      `)
      .in('client_id', accountIds)
      .eq('is_family_shared', true)

    if (galleryError) {
      logger.error('[Incorporate GET] Error fetching galleries:', galleryError)
      return NextResponse.json(
        { error: 'Failed to fetch galleries' },
        { status: 500 }
      )
    }

    // Get primary account holder names
    const { data: primaryProfiles } = await serviceSupabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', accountIds)

    const primaryNames = new Map(
      (primaryProfiles || []).map(p => [p.id, p.full_name || 'Account Holder'])
    )

    // Check which galleries have already been incorporated by this user
    const { data: existingIncorporations } = await serviceSupabase
      .from('gallery_incorporations')
      .select('source_gallery_id')
      .eq('destination_account_id', user.id)

    const incorporatedGalleryIds = new Set(
      (existingIncorporations || []).map(i => i.source_gallery_id)
    )

    // Enrich galleries with metadata
    const enrichedGalleries = (galleries || []).map(gallery => {
      const secondaryRecord = secondaryRecords.find(s => s.account_id === gallery.client_id)
      return {
        ...gallery,
        primary_name: primaryNames.get(gallery.client_id) || 'Account Holder',
        relationship: secondaryRecord?.relationship || 'family',
        source_account_id: gallery.client_id,
        already_incorporated: incorporatedGalleryIds.has(gallery.id)
      }
    })

    return NextResponse.json({
      galleries: enrichedGalleries,
      has_own_account: hasOwnAccount,
      account_count: accountIds.length
    })

  } catch (error) {
    logger.error('[Incorporate GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/family/incorporate
 * Copy selected galleries to user's own account
 * 
 * Body: {
 *   gallery_ids: string[]  // IDs of galleries to incorporate
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { gallery_ids } = body

    if (!gallery_ids || !Array.isArray(gallery_ids) || gallery_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid gallery_ids array' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    // Verify user has their own PhotoVault account
    const { data: userProfile } = await serviceSupabase
      .from('user_profiles')
      .select('id, user_type, full_name')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.user_type !== 'client') {
      return NextResponse.json(
        { error: 'You need your own PhotoVault account to incorporate galleries' },
        { status: 400 }
      )
    }

    // Get the client record ID from the user_id
    // FK chain: auth.users.id -> clients.user_id -> clients.id -> photo_galleries.client_id
    const { data: clientRecord } = await serviceSupabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!clientRecord) {
      return NextResponse.json(
        { error: 'Client record not found' },
        { status: 400 }
      )
    }

    const clientId = clientRecord.id

    // Get accounts where user is an accepted secondary
    const { data: secondaryRecords } = await serviceSupabase
      .from('secondaries')
      .select('account_id')
      .eq('secondary_user_id', user.id)
      .eq('status', 'accepted')

    if (!secondaryRecords || secondaryRecords.length === 0) {
      return NextResponse.json(
        { error: 'You are not a secondary on any accounts' },
        { status: 403 }
      )
    }

    const allowedAccountIds = new Set(secondaryRecords.map(s => s.account_id))

    // Fetch the galleries to incorporate
    const { data: galleries, error: galleryError } = await serviceSupabase
      .from('photo_galleries')
      .select('*')
      .in('id', gallery_ids)
      .eq('is_family_shared', true)

    if (galleryError || !galleries) {
      logger.error('[Incorporate POST] Error fetching galleries:', galleryError)
      return NextResponse.json(
        { error: 'Failed to fetch galleries' },
        { status: 500 }
      )
    }

    // Validate all galleries are from accounts where user is secondary
    for (const gallery of galleries) {
      if (!allowedAccountIds.has(gallery.client_id)) {
        return NextResponse.json(
          { error: `Gallery ${gallery.gallery_name} is not from an account you have secondary access to` },
          { status: 403 }
        )
      }
    }

    // Check for already incorporated galleries
    const { data: existingIncorporations } = await serviceSupabase
      .from('gallery_incorporations')
      .select('source_gallery_id')
      .eq('destination_account_id', user.id)
      .in('source_gallery_id', gallery_ids)

    const alreadyIncorporated = new Set(
      (existingIncorporations || []).map(i => i.source_gallery_id)
    )

    const galleriesNotAlreadyIncorporated = galleries.filter(g => !alreadyIncorporated.has(g.id))

    if (galleriesNotAlreadyIncorporated.length === 0) {
      return NextResponse.json(
        { error: 'All selected galleries have already been incorporated' },
        { status: 400 }
      )
    }

    // Get user's photographer (for commission attribution)
    // Find the most recent gallery the user owns to get their photographer
    const { data: userGalleries } = await serviceSupabase
      .from('photo_galleries')
      .select('photographer_id')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)

    const userPhotographerId = userGalleries?.[0]?.photographer_id || null

    const incorporatedGalleries: any[] = []
    const incorporationRecords: any[] = []
    const now = new Date().toISOString()

    // Process each gallery
    for (const sourceGallery of galleriesNotAlreadyIncorporated) {
      // Create new gallery record (copy)
      const newGallery = {
        gallery_name: sourceGallery.gallery_name,
        gallery_description: sourceGallery.gallery_description,
        cover_image_url: sourceGallery.cover_image_url,
        photo_count: sourceGallery.photo_count,
        session_date: sourceGallery.session_date,
        platform: sourceGallery.platform,
        photographer_name: sourceGallery.photographer_name,
        photographer_id: userPhotographerId, // Commission goes to user's photographer
        client_id: clientId, // New owner (clients.id, not auth.users.id)
        client_name: userProfile.full_name,
        is_family_shared: false, // Not shared by default in new account
        incorporated_from_gallery_id: sourceGallery.id,
        incorporated_from_account_id: sourceGallery.client_id,
        payment_status: 'paid', // Inherited galleries are considered paid
        created_at: now,
        updated_at: now,
      }

      const { data: insertedGallery, error: insertError } = await serviceSupabase
        .from('photo_galleries')
        .insert(newGallery)
        .select()
        .single()

      if (insertError) {
        logger.error('[Incorporate POST] Error inserting gallery:', insertError)
        continue
      }

      // Copy photos (reference same storage URLs - no actual file copy needed)
      const { data: sourcePhotos } = await serviceSupabase
        .from('photos')
        .select('*')
        .eq('gallery_id', sourceGallery.id)

      if (sourcePhotos && sourcePhotos.length > 0) {
        const newPhotos = sourcePhotos.map(photo => ({
          gallery_id: insertedGallery.id,
          storage_path: photo.storage_path,
          thumbnail_path: photo.thumbnail_path,
          original_filename: photo.original_filename,
          file_size: photo.file_size,
          mime_type: photo.mime_type,
          width: photo.width,
          height: photo.height,
          sort_order: photo.sort_order,
          created_at: now,
          updated_at: now,
        }))

        const { error: photosError } = await serviceSupabase
          .from('photos')
          .insert(newPhotos)

        if (photosError) {
          logger.error('[Incorporate POST] Error copying photos:', photosError)
        }
      }

      incorporatedGalleries.push({
        source_id: sourceGallery.id,
        source_name: sourceGallery.gallery_name,
        new_id: insertedGallery.id,
      })

      // Record the incorporation
      incorporationRecords.push({
        source_account_id: sourceGallery.client_id,
        destination_account_id: user.id,
        source_gallery_id: sourceGallery.id,
        destination_gallery_id: insertedGallery.id,
        incorporated_at: now,
        created_at: now,
      })
    }

    // Insert incorporation records
    if (incorporationRecords.length > 0) {
      const { error: incError } = await serviceSupabase
        .from('gallery_incorporations')
        .insert(incorporationRecords)

      if (incError) {
        logger.error('[Incorporate POST] Error recording incorporations:', incError)
      }
    }

    logger.info(`[Incorporate POST] User ${user.id} incorporated ${incorporatedGalleries.length} galleries`)

    return NextResponse.json({
      success: true,
      incorporated_count: incorporatedGalleries.length,
      galleries: incorporatedGalleries,
      message: `Successfully incorporated ${incorporatedGalleries.length} gallery(s) into your account`
    })

  } catch (error) {
    logger.error('[Incorporate POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

