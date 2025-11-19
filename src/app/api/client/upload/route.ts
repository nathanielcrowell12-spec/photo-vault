import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { v4 as uuidv4 } from 'uuid'

interface UploadRequest {
  client_id: string
  photos: Array<{
    filename: string
    data: string // base64 encoded image data
    size: number
    type: string
    date_taken?: string
    location?: string
    is_favorite?: boolean
    is_private?: boolean
  }>
  session_name?: string
  auto_organize?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body: UploadRequest = await request.json()
    const { client_id, photos, session_name, auto_organize } = body

    if (!client_id || !photos || photos.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, photos' },
        { status: 400 }
      )
    }

    // Verify client exists and belongs to authenticated user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      )
    }

    // Create upload session
    const sessionId = uuidv4()
    const sessionName = session_name || `Smartphone Upload ${new Date().toLocaleDateString()}`
    
    const { error: sessionError } = await supabase
      .from('upload_sessions')
      .insert({
        id: sessionId,
        client_id,
        name: sessionName,
        upload_type: 'smartphone',
        total_photos: photos.length,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating upload session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create upload session' },
        { status: 500 }
      )
    }

    // Process and upload photos
    const uploadedPhotos = []
    const errors = []

    for (let i = 0; i < photos.length; i++) {
      try {
        const photo = photos[i]
        const photoId = uuidv4()
        
        // Decode base64 image data
        const imageData = Buffer.from(photo.data, 'base64')
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const fileExtension = photo.type.split('/')[1] || 'jpg'
        const filename = `${photoId}_${timestamp}.${fileExtension}`
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('client-photos')
          .upload(`${client_id}/${filename}`, imageData, {
            contentType: photo.type,
            upsert: false
          })

        if (uploadError) {
          console.error('Error uploading photo:', uploadError)
          errors.push({
            filename: photo.filename,
            error: 'Failed to upload to storage'
          })
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('client-photos')
          .getPublicUrl(`${client_id}/${filename}`)

        // Generate thumbnail (in real implementation, this would use image processing)
        const thumbnailFilename = `thumb_${filename}`
        const { error: thumbnailError } = await supabase.storage
          .from('client-photos')
          .upload(`${client_id}/thumbnails/${thumbnailFilename}`, imageData, {
            contentType: photo.type,
            upsert: false
          })

        let thumbnailUrl = ''
        if (!thumbnailError) {
          const { data: thumbnailUrlData } = supabase.storage
            .from('client-photos')
            .getPublicUrl(`${client_id}/thumbnails/${thumbnailFilename}`)
          thumbnailUrl = thumbnailUrlData.publicUrl
        }

        // Extract metadata from photo
        const photoMetadata = await extractPhotoMetadata(imageData)
        
        // Determine organization based on date
        let organizationDate = new Date()
        if (photo.date_taken) {
          organizationDate = new Date(photo.date_taken)
        } else if (photoMetadata.date_taken) {
          organizationDate = photoMetadata.date_taken
        }

        // Create gallery if auto-organize is enabled
        let galleryId = null
        if (auto_organize) {
          const galleryName = `Smartphone Photos - ${organizationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`
          
          // Check if gallery already exists for this month
          const { data: existingGallery } = await supabase
            .from('photo_galleries')
            .select('id')
            .eq('client_id', client_id)
            .eq('name', galleryName)
            .single()

          if (existingGallery) {
            galleryId = existingGallery.id
          } else {
            // Create new gallery
            const { data: newGallery, error: galleryError } = await supabase
              .from('photo_galleries')
              .insert({
                id: uuidv4(),
                client_id,
                name: galleryName,
                photographer_name: 'Personal Photos',
                photographer_business: 'Smartphone Upload',
                session_date: organizationDate.toISOString(),
                session_type: 'personal',
                platform_source: 'smartphone',
                created_at: new Date().toISOString()
              })
              .select()
              .single()

            if (galleryError) {
              console.error('Error creating gallery:', galleryError)
            } else {
              galleryId = newGallery.id
            }
          }
        }

        // Store photo record
        const { error: photoError } = await supabase
          .from('photos')
          .insert({
            id: photoId,
            client_id,
            gallery_id: galleryId,
            session_id: sessionId,
            filename: photo.filename,
            original_filename: photo.filename,
            url: urlData.publicUrl,
            thumbnail_url: thumbnailUrl,
            size: photo.size,
            type: photo.type,
            width: photoMetadata.width,
            height: photoMetadata.height,
            date_taken: photo.date_taken || photoMetadata.date_taken?.toISOString(),
            location: photo.location || photoMetadata.location,
            is_favorite: photo.is_favorite || false,
            is_private: photo.is_private || false,
            upload_source: 'smartphone',
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (photoError) {
          console.error('Error storing photo record:', photoError)
          errors.push({
            filename: photo.filename,
            error: 'Failed to store photo record'
          })
          continue
        }

        uploadedPhotos.push({
          id: photoId,
          filename: photo.filename,
          url: urlData.publicUrl,
          thumbnail_url: thumbnailUrl,
          size: photo.size,
          date_taken: photo.date_taken || photoMetadata.date_taken?.toISOString(),
          location: photo.location || photoMetadata.location,
          is_favorite: photo.is_favorite || false,
          is_private: photo.is_private || false
        })

      } catch (error) {
        console.error('Error processing photo:', error)
        errors.push({
          filename: photos[i].filename,
          error: 'Failed to process photo'
        })
      }
    }

    // Update session with results
    await supabase
      .from('upload_sessions')
      .update({
        photos_uploaded: uploadedPhotos.length,
        errors_count: errors.length,
        completed_at: new Date().toISOString(),
        status: errors.length === 0 ? 'completed' : 'completed_with_errors'
      })
      .eq('id', sessionId)

    // Log upload activity
    await supabase
      .from('client_activity')
      .insert({
        client_id,
        activity_type: 'smartphone_upload',
        description: `Uploaded ${uploadedPhotos.length} photos from smartphone`,
        metadata: {
          session_id: sessionId,
          total_photos: photos.length,
          successful_uploads: uploadedPhotos.length,
          errors: errors.length
        },
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      data: {
        session_id: sessionId,
        photos_uploaded: uploadedPhotos.length,
        total_photos: photos.length,
        errors: errors.length,
        photos: uploadedPhotos,
        errors_list: errors
      }
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function extractPhotoMetadata(_imageData: Buffer) {
  // In a real implementation, this would use a library like 'exif-reader' or 'piexifjs'
  // to extract EXIF data from the image
  try {
    // Simulate metadata extraction
    return {
      width: 1920,
      height: 1080,
      date_taken: new Date(),
      location: null,
      camera_make: 'Apple',
      camera_model: 'iPhone',
      iso: 100,
      aperture: 'f/1.8',
      shutter_speed: '1/60',
      focal_length: '26mm'
    }
  } catch (error) {
    console.error('Error extracting photo metadata:', error)
    return {
      width: null,
      height: null,
      date_taken: null,
      location: null,
      camera_make: null,
      camera_model: null,
      iso: null,
      aperture: null,
      shutter_speed: null,
      focal_length: null
    }
  }
}

// GET endpoint to retrieve upload sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Verify client belongs to authenticated user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch upload sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('upload_sessions')
      .select(`
        *,
        photos:photos (
          id,
          filename,
          url,
          thumbnail_url,
          size,
          date_taken,
          is_favorite,
          is_private
        )
      `)
      .eq('client_id', clientId)
      .eq('upload_type', 'smartphone')
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching upload sessions:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to fetch upload sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions || []
      }
    })

  } catch (error) {
    console.error('Upload GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
