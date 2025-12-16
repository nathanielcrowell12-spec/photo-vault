import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the photo and verify user has access
    // Join clients table to check if the user is linked to the client record
    const { data: photo, error: photoError } = await supabase
      .from('gallery_photos')
      .select(`
        id,
        gallery_id,
        is_favorite,
        photo_galleries!inner (
          id,
          client_id,
          user_id,
          photographer_id,
          clients (
            user_id
          )
        )
      `)
      .eq('id', photoId)
      .single()

    if (photoError || !photo) {
      console.error('[Favorite API] Photo not found:', photoError)
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this photo's gallery
    // Access granted if:
    // 1. User owns the gallery directly (user_id) - for self-uploaded galleries
    // 2. User is the photographer
    // 3. User is linked to a client record that's assigned to this gallery
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const galleryData = photo.photo_galleries as any
    const gallery = {
      id: galleryData?.id as string,
      client_id: galleryData?.client_id as string | null,
      user_id: galleryData?.user_id as string | null,
      photographer_id: galleryData?.photographer_id as string | null,
      // clients comes back as array from Supabase join, take first element
      clientUserId: (galleryData?.clients?.[0]?.user_id ?? galleryData?.clients?.user_id) as string | null
    }

    const hasAccess =
      gallery.user_id === user.id ||
      gallery.photographer_id === user.id ||
      gallery.clientUserId === user.id

    if (!hasAccess) {
      console.error('[Favorite API] User does not have access to this photo:', {
        userId: user.id,
        galleryUserId: gallery.user_id,
        photographerId: gallery.photographer_id,
        clientUserId: gallery.clientUserId
      })
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Toggle the favorite status
    const newFavoriteStatus = !photo.is_favorite

    const { error: updateError } = await supabase
      .from('gallery_photos')
      .update({ is_favorite: newFavoriteStatus })
      .eq('id', photoId)

    if (updateError) {
      console.error('[Favorite API] Failed to update:', updateError)
      return NextResponse.json(
        { error: 'Failed to update favorite status' },
        { status: 500 }
      )
    }

    console.log(`[Favorite API] Photo ${photoId} is_favorite set to ${newFavoriteStatus}`)

    return NextResponse.json({
      success: true,
      is_favorite: newFavoriteStatus
    })
  } catch (error) {
    console.error('[Favorite API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
