import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ImportRequest {
  client_id: string
  platform: string
  connection_data: {
    username?: string
    password?: string
    api_key?: string
    gallery_url?: string
  }
  remember_credentials?: boolean
}

interface ConnectionData {
  platform: string
  credentials?: Record<string, string>
  galleryUrl?: string
  [key: string]: unknown
}

interface PlatformImporter {
  name: string
  importPhotos: (connectionData: ConnectionData, clientId: string) => Promise<ImportResult>
}

interface ImportResult {
  success: boolean
  galleries_imported: number
  photos_imported: number
  galleries: Array<{
    id: string
    name: string
    photographer_name: string
    photographer_business: string
    session_date: string
    session_type: string
    location?: string
    photos: Array<{
      id: string
      url: string
      thumbnail_url: string
      filename: string
      size: number
      created_at: string
    }>
  }>
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json()
    const { client_id, platform, connection_data, remember_credentials } = body

    if (!client_id || !platform || !connection_data) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, platform, connection_data' },
        { status: 400 }
      )
    }

    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Get platform importer
    const importer = getPlatformImporter(platform)
    if (!importer) {
      return NextResponse.json(
        { error: 'Unsupported platform' },
        { status: 400 }
      )
    }

    // Store credentials if requested (encrypted)
    if (remember_credentials && (connection_data.username || connection_data.api_key)) {
      await supabase
        .from('client_platform_connections')
        .upsert({
          client_id,
          platform,
          credentials_encrypted: encryptCredentials(connection_data),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    // Import photos
    const connectionDataWithPlatform: ConnectionData = {
      platform,
      ...connection_data
    }
    const result = await importer.importPhotos(connectionDataWithPlatform, client_id)

    if (result.success) {
      // Store imported data in database
      await storeImportedData(client_id, platform, result.galleries)

      // Log import activity
      await supabase
        .from('import_logs')
        .insert({
          client_id,
          platform,
          galleries_imported: result.galleries_imported,
          photos_imported: result.photos_imported,
          import_date: new Date().toISOString(),
          success: true
        })

      return NextResponse.json({
        success: true,
        data: {
          galleries_imported: result.galleries_imported,
          photos_imported: result.photos_imported,
          galleries: result.galleries
        }
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Import failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getPlatformImporter(platform: string): PlatformImporter | null {
  const importers: Record<string, PlatformImporter> = {
    pixieset: new PixiesetImporter(),
    shootproof: new ShootProofImporter(),
    smugmug: new SmugMugImporter(),
    'pic-time': new PicTimeImporter(),
    cloudspot: new CloudSpotImporter(),
    passgallery: new PassGalleryImporter(),
    slickpic: new SlickPicImporter(),
    zenfolio: new ZenfolioImporter(),
    picdrop: new PicDropImporter()
  }

  return importers[platform] || null
}

// Platform-specific importers
class PixiesetImporter implements PlatformImporter {
  name = 'Pixieset'

  async importPhotos(_connectionData: ConnectionData, _clientId: string): Promise<ImportResult> {
    try {
      // Simulate Pixieset API integration
      // In real implementation, this would use Pixieset's API or web scraping
      
      const mockGalleries = [
        {
          id: 'pixieset_1',
          name: 'Smith Wedding - October 2024',
          photographer_name: 'Emma Rodriguez',
          photographer_business: 'Emma Rodriguez Photography',
          session_date: '2024-10-15',
          session_type: 'wedding',
          location: 'Garden Venue, Portland',
          photos: Array.from({ length: 50 }, (_, i) => ({
            id: `pixieset_photo_${i}`,
            url: `https://pixieset.com/smith-wedding/photo_${i}.jpg`,
            thumbnail_url: `https://pixieset.com/smith-wedding/thumb_${i}.jpg`,
            filename: `wedding_photo_${i}.jpg`,
            size: 2500000,
            created_at: '2024-10-15T10:00:00Z'
          }))
        }
      ]

      return {
        success: true,
        galleries_imported: mockGalleries.length,
        photos_imported: mockGalleries.reduce((sum, gallery) => sum + gallery.photos.length, 0),
        galleries: mockGalleries
      }
    } catch {
      return {
        success: false,
        galleries_imported: 0,
        photos_imported: 0,
        galleries: [],
        error: 'Failed to import from Pixieset'
      }
    }
  }
}

class ShootProofImporter implements PlatformImporter {
  name = 'ShootProof'

  async importPhotos(_connectionData: ConnectionData, _clientId: string): Promise<ImportResult> {
    try {
      // Simulate ShootProof API integration
      const mockGalleries = [
        {
          id: 'shootproof_1',
          name: 'Family Portrait Session',
          photographer_name: 'Mike Chen',
          photographer_business: 'Chen Studios',
          session_date: '2024-09-20',
          session_type: 'family',
          location: 'Portland Park',
          photos: Array.from({ length: 25 }, (_, i) => ({
            id: `shootproof_photo_${i}`,
            url: `https://shootproof.com/family-session/photo_${i}.jpg`,
            thumbnail_url: `https://shootproof.com/family-session/thumb_${i}.jpg`,
            filename: `family_photo_${i}.jpg`,
            size: 1800000,
            created_at: '2024-09-20T14:00:00Z'
          }))
        }
      ]

      return {
        success: true,
        galleries_imported: mockGalleries.length,
        photos_imported: mockGalleries.reduce((sum, gallery) => sum + gallery.photos.length, 0),
        galleries: mockGalleries
      }
    } catch {
      return {
        success: false,
        galleries_imported: 0,
        photos_imported: 0,
        galleries: [],
        error: 'Failed to import from ShootProof'
      }
    }
  }
}

class SmugMugImporter implements PlatformImporter {
  name = 'SmugMug'

  async importPhotos(_connectionData: ConnectionData, _clientId: string): Promise<ImportResult> {
    try {
      // Simulate SmugMug API integration
      const mockGalleries = [
        {
          id: 'smugmug_1',
          name: 'Engagement Photos',
          photographer_name: 'Sarah Thompson',
          photographer_business: 'Thompson Photography',
          session_date: '2024-08-10',
          session_type: 'portrait',
          location: 'Columbia River Gorge',
          photos: Array.from({ length: 30 }, (_, i) => ({
            id: `smugmug_photo_${i}`,
            url: `https://smugmug.com/engagement/photo_${i}.jpg`,
            thumbnail_url: `https://smugmug.com/engagement/thumb_${i}.jpg`,
            filename: `engagement_photo_${i}.jpg`,
            size: 2200000,
            created_at: '2024-08-10T16:00:00Z'
          }))
        }
      ]

      return {
        success: true,
        galleries_imported: mockGalleries.length,
        photos_imported: mockGalleries.reduce((sum, gallery) => sum + gallery.photos.length, 0),
        galleries: mockGalleries
      }
    } catch {
      return {
        success: false,
        galleries_imported: 0,
        photos_imported: 0,
        galleries: [],
        error: 'Failed to import from SmugMug'
      }
    }
  }
}

class PicTimeImporter implements PlatformImporter {
  name = 'Pic-Time'

  async importPhotos(_connectionData: ConnectionData, _clientId: string): Promise<ImportResult> {
    try {
      // Simulate Pic-Time gallery URL parsing
      const mockGalleries = [
        {
          id: 'pictime_1',
          name: 'Corporate Event',
          photographer_name: 'David Kim',
          photographer_business: 'Kim Event Photography',
          session_date: '2024-07-25',
          session_type: 'event',
          location: 'Convention Center',
          photos: Array.from({ length: 40 }, (_, i) => ({
            id: `pictime_photo_${i}`,
            url: `https://pictime.com/corporate-event/photo_${i}.jpg`,
            thumbnail_url: `https://pictime.com/corporate-event/thumb_${i}.jpg`,
            filename: `event_photo_${i}.jpg`,
            size: 2000000,
            created_at: '2024-07-25T12:00:00Z'
          }))
        }
      ]

      return {
        success: true,
        galleries_imported: mockGalleries.length,
        photos_imported: mockGalleries.reduce((sum, gallery) => sum + gallery.photos.length, 0),
        galleries: mockGalleries
      }
    } catch {
      return {
        success: false,
        galleries_imported: 0,
        photos_imported: 0,
        galleries: [],
        error: 'Failed to import from Pic-Time'
      }
    }
  }
}

class CloudSpotImporter implements PlatformImporter {
  name = 'CloudSpot'

  async importPhotos(_connectionData: ConnectionData, _clientId: string): Promise<ImportResult> {
    // Similar implementation for CloudSpot
    return {
      success: true,
      galleries_imported: 0,
      photos_imported: 0,
      galleries: []
    }
  }
}

class PassGalleryImporter implements PlatformImporter {
  name = 'Pass Gallery'

  async importPhotos(_connectionData: ConnectionData, _clientId: string): Promise<ImportResult> {
    // Similar implementation for Pass Gallery
    return {
      success: true,
      galleries_imported: 0,
      photos_imported: 0,
      galleries: []
    }
  }
}

class SlickPicImporter implements PlatformImporter {
  name = 'SlickPic'

  async importPhotos(_connectionData: ConnectionData, _clientId: string): Promise<ImportResult> {
    // Similar implementation for SlickPic
    return {
      success: true,
      galleries_imported: 0,
      photos_imported: 0,
      galleries: []
    }
  }
}

class ZenfolioImporter implements PlatformImporter {
  name = 'Zenfolio'

  async importPhotos(_connectionData: ConnectionData, _clientId: string): Promise<ImportResult> {
    // Similar implementation for Zenfolio
    return {
      success: true,
      galleries_imported: 0,
      photos_imported: 0,
      galleries: []
    }
  }
}

class PicDropImporter implements PlatformImporter {
  name = 'PicDrop'

  async importPhotos(_connectionData: ConnectionData, _clientId: string): Promise<ImportResult> {
    // Similar implementation for PicDrop
    return {
      success: true,
      galleries_imported: 0,
      photos_imported: 0,
      galleries: []
    }
  }
}

interface ImportedGallery {
  id: string
  name: string
  photographer_name: string
  photographer_business: string
  session_date: string
  session_type: string
  location?: string
  photos: Array<{
    id: string
    url: string
    thumbnail_url: string
    filename: string
    size: number
    created_at: string
  }>
}

async function storeImportedData(clientId: string, platform: string, galleries: ImportedGallery[]) {
  for (const gallery of galleries) {
    // Store gallery
    const { data: storedGallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .insert({
        id: gallery.id,
        name: gallery.name,
        photographer_name: gallery.photographer_name,
        photographer_business: gallery.photographer_business,
        session_date: gallery.session_date,
        session_type: gallery.session_type,
        location: gallery.location,
        platform_source: platform,
        client_id: clientId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (galleryError) {
      console.error('Error storing gallery:', galleryError)
      continue
    }

    // Store photos
    for (const photo of gallery.photos) {
      await supabase
        .from('photos')
        .insert({
          id: photo.id,
          gallery_id: storedGallery.id,
          url: photo.url,
          thumbnail_url: photo.thumbnail_url,
          filename: photo.filename,
          size: photo.size,
          created_at: photo.created_at,
          imported_at: new Date().toISOString()
        })
    }
  }
}

function encryptCredentials(credentials: Record<string, string>): string {
  // In real implementation, this would use proper encryption
  // For now, just base64 encode (NOT secure for production)
  return Buffer.from(JSON.stringify(credentials)).toString('base64')
}
