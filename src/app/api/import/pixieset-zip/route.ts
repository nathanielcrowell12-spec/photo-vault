import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PixiesetZipClient } from '@/lib/platforms/pixieset-zip-client'
import { ZipStreamService } from '@/lib/services/zip-stream-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      galleryUrl, 
      password, 
      username, 
      userPassword, 
      accessType,
      galleryMetadata 
    } = await request.json()

    if (!galleryUrl || !accessType) {
      return NextResponse.json({ 
        error: 'Gallery URL and access type are required' 
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

    console.log(`PixiesetZipImport: Starting import for user ${userId}`)

    // Create gallery record
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .insert({
        user_id: userId,
        gallery_name: galleryMetadata?.galleryName || 'Pixieset Gallery',
        gallery_description: 'Imported from Pixieset',
        platform: 'Pixieset',
        gallery_url: galleryUrl,
        gallery_password: password,
        photo_count: 0,
        is_imported: false,
        photographer_name: galleryMetadata?.photographerName,
        session_date: galleryMetadata?.sessionDate,
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
      console.error('PixiesetZipImport: Error creating gallery:', galleryError)
      return NextResponse.json({ 
        error: 'Failed to create gallery record' 
      }, { status: 500 })
    }

    const galleryId = gallery.id

    // Start import process in background
    processImportInBackground(
      galleryUrl,
      password,
      username,
      userPassword,
      accessType,
      userId,
      galleryId,
      galleryMetadata
    ).catch(error => {
      console.error('PixiesetZipImport: Background import error:', error)
      
      // Update gallery with error
      supabase
        .from('galleries')
        .update({
          import_started_at: null,
          metadata: { 
            error: error.message,
            access_type: accessType
          }
        })
        .eq('id', galleryId)
        .then()
    })

    return NextResponse.json({
      success: true,
      message: 'Pixieset import started',
      galleryId: galleryId
    })

  } catch (error) {
    console.error('PixiesetZipImport: Error starting import:', error)
    return NextResponse.json(
      { error: 'Failed to start import' },
      { status: 500 }
    )
  }
}

async function processImportInBackground(
  galleryUrl: string,
  password: string | undefined,
  username: string | undefined,
  userPassword: string | undefined,
  accessType: 'guest' | 'account',
  userId: string,
  galleryId: string,
  galleryMetadata: any
) {
  try {
    console.log(`PixiesetZipImport: Processing import for gallery ${galleryId}`)

    // Create Pixieset client
    const pixiesetClient = new PixiesetZipClient({
      platform: 'Pixieset',
      galleryUrl: galleryUrl,
      password: password,
      username: username,
      userPassword: userPassword,
      accessType: accessType
    })

    // Authenticate
    const isAuthenticated = await pixiesetClient.authenticate()
    if (!isAuthenticated) {
      throw new Error('Failed to authenticate with Pixieset')
    }

    // Find the "Download to Device" link
    const downloadUrl = await pixiesetClient.getDownloadToDeviceUrl()
    if (!downloadUrl) {
      throw new Error('Could not find "Download to Device" link on the gallery page. The gallery may not allow downloads.')
    }

    console.log(`PixiesetZipImport: Found download URL: ${downloadUrl}`)

    // Create ZIP stream service
    const zipStreamService = new ZipStreamService()

    // Stream and import the ZIP
    const result = await zipStreamService.streamAndImportZip(
      downloadUrl,
      userId,
      galleryId,
      {
        galleryName: galleryMetadata?.galleryName || 'Pixieset Gallery',
        photographerName: galleryMetadata?.photographerName,
        sessionDate: galleryMetadata?.sessionDate,
        location: galleryMetadata?.location,
        people: galleryMetadata?.people
      }
    )

    if (result.success) {
      console.log(`PixiesetZipImport: Successfully imported ${result.photosImported} photos`)
    } else {
      console.error(`PixiesetZipImport: Import failed: ${result.error}`)
    }

  } catch (error) {
    console.error('PixiesetZipImport: Background processing error:', error)
    
    // Update gallery with error
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    await supabase
      .from('galleries')
      .update({
        import_started_at: null,
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          access_type: accessType
        }
      })
      .eq('id', galleryId)
  }
}
