import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { UnifiedPlatformClient, UnifiedPhoto, UnifiedGalleryMetadata, ImportProgress } from '../platforms/unified-platform'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class UnifiedImportService {
  private progressCallback?: (progress: ImportProgress) => void

  constructor(progressCallback?: (progress: ImportProgress) => void) {
    this.progressCallback = progressCallback
  }

  private updateProgress(progress: Partial<ImportProgress>) {
    if (this.progressCallback) {
      this.progressCallback({
        stage: progress.stage || 'authenticating',
        progress: progress.progress || 0,
        message: progress.message || '',
        currentPhoto: progress.currentPhoto,
        totalPhotos: progress.totalPhotos,
        error: progress.error
      })
    }
  }

  async importGallery(
    platformClient: UnifiedPlatformClient,
    userId: string,
    galleryId: string,
    userMetadata: {
      galleryName?: string
      photographerName?: string
      sessionDate?: string
      location?: string
      people?: string[]
    }
  ): Promise<{ success: boolean; photosImported: number; error?: string }> {
    try {
      console.log(`UnifiedImportService: Starting import for gallery ${galleryId} from ${platformClient.credentials.platform}`)

      // Step 1: Authenticate
      this.updateProgress({
        stage: 'authenticating',
        progress: 10,
        message: `Authenticating with ${platformClient.credentials.platform}...`
      })

      const isAuthenticated = await platformClient.authenticate()
      if (!isAuthenticated) {
        throw new Error(`Failed to authenticate with ${platformClient.credentials.platform}`)
      }

      // Step 2: Get gallery metadata
      this.updateProgress({
        stage: 'finding_download',
        progress: 20,
        message: 'Fetching gallery information...'
      })

      const galleryMetadata = await platformClient.getGalleryMetadata()
      if (!galleryMetadata) {
        throw new Error('Could not retrieve gallery metadata')
      }

      // Step 3: Find ZIP download URL
      this.updateProgress({
        stage: 'finding_download',
        progress: 30,
        message: 'Looking for download link...'
      })

      const zipUrl = await platformClient.findZipDownloadUrl()
      if (!zipUrl) {
        throw new Error('Could not find download link on the gallery page. The gallery may not allow downloads.')
      }

      console.log(`UnifiedImportService: Found download URL: ${zipUrl}`)

      // Step 4: Download ZIP stream
      this.updateProgress({
        stage: 'downloading_zip',
        progress: 40,
        message: 'Downloading gallery ZIP file...'
      })

      const zipResponse = await this.downloadZipWithRetry(zipUrl)
      if (!zipResponse) {
        throw new Error('Failed to download ZIP file after retries')
      }

      // Step 5: Extract photos from ZIP stream
      this.updateProgress({
        stage: 'extracting',
        progress: 50,
        message: 'Extracting photos from ZIP...'
      })

      const photos = await this.extractPhotosFromStream(zipResponse, (progress) => {
        this.updateProgress({
          stage: 'extracting',
          progress: 50 + (progress * 0.2), // 50-70%
          message: `Extracting photos... ${progress}%`
        })
      })

      console.log(`UnifiedImportService: Extracted ${photos.length} photos`)

      // Step 6: Upload photos to Supabase
      this.updateProgress({
        stage: 'uploading',
        progress: 70,
        message: `Uploading ${photos.length} photos to your gallery...`,
        totalPhotos: photos.length
      })

      let successCount = 0
      let failCount = 0

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        
        try {
          const uploadProgress = 70 + ((i / photos.length) * 25) // 70-95%
          
          this.updateProgress({
            stage: 'uploading',
            progress: uploadProgress,
            message: `Uploading photo ${i + 1} of ${photos.length}...`,
            currentPhoto: i + 1,
            totalPhotos: photos.length
          })

          // Upload photo to Supabase Storage
          const fileExtension = this.getFileExtension(photo.filename)
          const fileName = `${uuidv4()}.${fileExtension}`
          const filePath = `${userId}/${galleryId}/${fileName}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(filePath, photo.data, {
              contentType: this.getMimeType(fileExtension),
              upsert: false
            })

          if (uploadError) {
            console.error(`UnifiedImportService: Failed to upload photo ${photo.filename}:`, uploadError)
            failCount++
            continue
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(filePath)

          // Save photo record to database
          const { error: dbError } = await supabase
            .from('gallery_photos')
            .insert({
              gallery_id: galleryId,
              user_id: userId,
              platform_photo_id: photo.id,
              filename: photo.filename,
              original_url: publicUrl,
              thumbnail_url: publicUrl, // TODO: Generate thumbnail
              full_url: publicUrl,
              file_size: photo.data.byteLength,
              width: photo.width,
              height: photo.height,
              alt_text: photo.filename,
              is_favorite: false,
              download_count: 0,
              exif_data: photo.metadata,
            })

          if (dbError) {
            console.error(`UnifiedImportService: Failed to save photo record for ${photo.filename}:`, dbError)
            failCount++
            continue
          }

          successCount++

        } catch (error) {
          console.error(`UnifiedImportService: Error processing photo ${photo.filename}:`, error)
          failCount++
        }
      }

      // Step 7: Update gallery with final status
      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: `Import complete! ${successCount} photos imported successfully.`,
        currentPhoto: successCount,
        totalPhotos: photos.length
      })

      // Update gallery record with user metadata and final stats
      await supabase
        .from('galleries')
        .update({
          is_imported: true,
          import_completed_at: new Date().toISOString(),
          photo_count: successCount,
          gallery_name: userMetadata.galleryName || galleryMetadata.name,
          photographer_name: userMetadata.photographerName || galleryMetadata.photographerName,
          session_date: userMetadata.sessionDate,
          metadata: {
            location: userMetadata.location,
            people: userMetadata.people,
            import_method: 'unified_zip_stream',
            platform: platformClient.credentials.platform,
            total_photos_found: photos.length,
            photos_imported: successCount,
            photos_failed: failCount
          }
        })
        .eq('id', galleryId)

      console.log(`UnifiedImportService: Import completed. Success: ${successCount}, Failed: ${failCount}`)

      return {
        success: true,
        photosImported: successCount,
        error: failCount > 0 ? `${failCount} photos failed to import` : undefined
      }

    } catch (error) {
      console.error('UnifiedImportService: Import failed:', error)
      
      const errorMessage = platformClient.getErrorMessage(error)
      
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: `Import failed: ${errorMessage}`,
        error: errorMessage
      })

      // Update gallery with error status
      await supabase
        .from('galleries')
        .update({
          import_started_at: null,
          metadata: { 
            error: errorMessage,
            import_method: 'unified_zip_stream',
            platform: platformClient.credentials.platform
          }
        })
        .eq('id', galleryId)

      return {
        success: false,
        photosImported: 0,
        error: errorMessage
      }
    }
  }

  private async downloadZipWithRetry(zipUrl: string, maxRetries: number = 3): Promise<Response | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`UnifiedImportService: Download attempt ${attempt}/${maxRetries} for ${zipUrl}`)
        
        const response = await fetch(zipUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/zip,application/octet-stream,*/*',
            'Accept-Encoding': 'gzip, deflate, br',
          }
        })

        if (response.ok) {
          return response
        } else {
          console.warn(`UnifiedImportService: Download attempt ${attempt} failed with status ${response.status}`)
        }

      } catch (error) {
        console.warn(`UnifiedImportService: Download attempt ${attempt} failed:`, error)
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        console.log(`UnifiedImportService: Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    console.error(`UnifiedImportService: All ${maxRetries} download attempts failed`)
    return null
  }

  private async extractPhotosFromStream(
    zipResponse: Response,
    progressCallback: (progress: number) => void
  ): Promise<Array<{
    id: string
    filename: string
    data: ArrayBuffer
    width: number
    height: number
    metadata: any
  }>> {
    // For now, we'll use a simple approach
    // In a real implementation, you'd use a ZIP streaming library like yauzl or adm-zip
    
    const zipBuffer = await zipResponse.arrayBuffer()
    progressCallback(50)
    
    // TODO: Implement actual ZIP extraction
    // This is a placeholder that would need a proper ZIP library
    console.log(`UnifiedImportService: ZIP buffer size: ${zipBuffer.byteLength} bytes`)
    
    progressCallback(100)
    
    // For now, return empty array - actual ZIP extraction would go here
    return []
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg'
  }

  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
    }
    return mimeTypes[extension] || 'image/jpeg'
  }
}
