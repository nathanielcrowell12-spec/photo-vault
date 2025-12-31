import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { createPlatformClient } from '@/lib/platforms/unified-platform'
import { UnifiedImportService } from '@/lib/services/unified-import-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      platform,
      galleryUrl, 
      password, 
      username, 
      userPassword, 
      accessType,
      galleryMetadata 
    } = await request.json()

    // Validate required fields
    if (!platform || !galleryUrl || !accessType) {
      return NextResponse.json({ 
        error: 'Platform, gallery URL, and access type are required' 
      }, { status: 400 })
    }

    if (accessType === 'guest' && !password) {
      return NextResponse.json({ 
        error: 'Password is required for guest access' 
      }, { status: 400 })
    }

    if (accessType === 'account' && (!username || !userPassword)) {
      return NextResponse.json({ 
        error: 'Username and password are required for account access' 
      }, { status: 400 })
    }

    // Get user from request (you'll need to implement proper auth)
    const userId = request.headers.get('x-user-id') || 'test-user-id'
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'User authentication required' 
      }, { status: 401 })
    }

    logger.info(`UnifiedImport: Starting import for user ${userId} from ${platform}`)

    // Create gallery record
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .insert({
        user_id: userId,
        gallery_name: galleryMetadata?.galleryName || `${platform} Gallery`,
        gallery_description: `Imported from ${platform}`,
        platform: platform,
        gallery_url: galleryUrl,
        gallery_password: password,
        photo_count: 0,
        is_imported: false,
        photographer_name: galleryMetadata?.photographerName || null,
        session_date: galleryMetadata?.sessionDate || null,
        cover_image_url: '/images/placeholder-family.svg',
        import_started_at: new Date().toISOString(),
        metadata: {
          access_type: accessType,
          username: username,
          location: galleryMetadata?.location,
          people: galleryMetadata?.people
        }
      })
      .select('id')
      .single()

    if (galleryError || !gallery) {
      logger.error('UnifiedImport: Error creating gallery:', galleryError)
      logger.error('UnifiedImport: Gallery insert details:', {
        user_id: userId,
        platform,
        galleryUrl,
        galleryMetadata
      })
      return NextResponse.json({ 
        error: 'Failed to create gallery record',
        details: galleryError?.message || 'Unknown error'
      }, { status: 500 })
    }

    const galleryId = gallery.id

    // Start import process in background
    processImportInBackground(
      platform,
      galleryUrl,
      password,
      username,
      userPassword,
      accessType,
      userId,
      galleryId,
      galleryMetadata
    ).catch(error => {
      logger.error('UnifiedImport: Background import error:', error)
      
      // Update gallery with error
      supabase
        .from('photo_galleries')
        .update({
          import_started_at: null,
          metadata: { 
            error: error.message,
            access_type: accessType,
            platform: platform
          }
        })
        .eq('id', galleryId)
        .then()
    })

    return NextResponse.json({
      success: true,
      message: `${platform} import started`,
      galleryId: galleryId
    })

  } catch (error) {
    logger.error('UnifiedImport: Error starting import:', error)
    return NextResponse.json(
      { error: 'Failed to start import' },
      { status: 500 }
    )
  }
}

async function processImportInBackground(
  platform: string,
  galleryUrl: string,
  password: string | undefined,
  username: string | undefined,
  userPassword: string | undefined,
  accessType: 'guest' | 'account',
  userId: string,
  galleryId: string,
  galleryMetadata: Record<string, unknown>
) {
  try {
    logger.info(`UnifiedImport: Processing import for gallery ${galleryId} from ${platform}`)

    // Create platform client using factory
    const platformClient = await createPlatformClient({
      platform: platform,
      galleryUrl: galleryUrl,
      password: password,
      username: username,
      userPassword: userPassword,
      accessType: accessType
    })

    // Create unified import service
    const importService = new UnifiedImportService()

    // Import the gallery
    const result = await importService.importGallery(
      platformClient,
      userId,
      galleryId,
      {
        galleryName: galleryMetadata?.galleryName as string | undefined,
        photographerName: galleryMetadata?.photographerName as string | undefined,
        sessionDate: galleryMetadata?.sessionDate as string | undefined,
        location: galleryMetadata?.location as string | undefined,
        people: galleryMetadata?.people as string[] | undefined
      }
    )

    if (result.success) {
      logger.info(`UnifiedImport: Successfully imported ${result.photosImported} photos from ${platform}`)
    } else {
      logger.error(`UnifiedImport: Import failed from ${platform}: ${result.error}`)
    }

  } catch (error) {
    logger.error(`UnifiedImport: Background processing error for ${platform}:`, error)
    
    // Update gallery with error
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    await supabase
      .from('photo_galleries')
      .update({
        import_started_at: null,
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          access_type: accessType,
          platform: platform
        }
      })
      .eq('id', galleryId)
  }
}
