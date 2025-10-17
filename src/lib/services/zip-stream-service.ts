import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface StreamProgress {
  stage: 'authenticating' | 'finding_download' | 'downloading_zip' | 'extracting' | 'uploading' | 'complete' | 'error'
  progress: number // 0-100
  message: string
  currentPhoto?: number
  totalPhotos?: number
  error?: string
}

export class ZipStreamService {
  private progressCallback?: (progress: StreamProgress) => void

  constructor(progressCallback?: (progress: StreamProgress) => void) {
    this.progressCallback = progressCallback
  }

  private updateProgress(progress: Partial<StreamProgress>) {
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

  async streamAndImportZip(
    zipUrl: string,
    userId: string,
    galleryId: string,
    galleryMetadata: {
      galleryName: string
      photographerName?: string
      sessionDate?: string
      location?: string
      people?: string[]
    }
  ): Promise<{ success: boolean; photosImported: number; error?: string }> {
    try {
      console.log(`ZipStreamService: Starting ZIP stream import from ${zipUrl}`)

      // Step 1: Download ZIP stream
      this.updateProgress({
        stage: 'downloading_zip',
        progress: 10,
        message: 'Downloading gallery ZIP file...'
      })

      const zipResponse = await this.downloadZipWithRetry(zipUrl)
      if (!zipResponse) {
        throw new Error('Failed to download ZIP file after retries')
      }

      // Step 2: Extract photos from ZIP stream
      this.updateProgress({
        stage: 'extracting',
        progress: 30,
        message: 'Extracting photos from ZIP...'
      })

      const photos = await this.extractPhotosFromStream(zipResponse, (progress) => {
        this.updateProgress({
          stage: 'extracting',
          progress: 30 + (progress * 0.2), // 30-50%
          message: `Extracting photos... ${progress}%`
        })
      })

      console.log(`ZipStreamService: Extracted ${photos.length} photos`)

      // Step 3: Upload photos to Supabase
      this.updateProgress({
        stage: 'uploading',
        progress: 50,
        message: `Uploading ${photos.length} photos to your gallery...`,
        totalPhotos: photos.length
      })

      let successCount = 0
      let failCount = 0

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        
        try {
          const uploadProgress = 50 + ((i / photos.length) * 40) // 50-90%
          
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
            console.error(`ZipStreamService: Failed to upload photo ${photo.filename}:`, uploadError)
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
              platform_photo_id: photo.platformPhotoId,
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
              exif_data: photo.exifData,
            })

          if (dbError) {
            console.error(`ZipStreamService: Failed to save photo record for ${photo.filename}:`, dbError)
            failCount++
            continue
          }

          successCount++

        } catch (error) {
          console.error(`ZipStreamService: Error processing photo ${photo.filename}:`, error)
          failCount++
        }
      }

      // Step 4: Update gallery with final status
      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: `Import complete! ${successCount} photos imported successfully.`,
        currentPhoto: successCount,
        totalPhotos: photos.length
      })

      // Update gallery record
      await supabase
        .from('galleries')
        .update({
          is_imported: true,
          import_completed_at: new Date().toISOString(),
          photo_count: successCount,
          gallery_name: galleryMetadata.galleryName,
          photographer_name: galleryMetadata.photographerName,
          session_date: galleryMetadata.sessionDate,
          metadata: {
            location: galleryMetadata.location,
            people: galleryMetadata.people,
            import_method: 'zip_stream',
            total_photos_found: photos.length,
            photos_imported: successCount,
            photos_failed: failCount
          }
        })
        .eq('id', galleryId)

      console.log(`ZipStreamService: Import completed. Success: ${successCount}, Failed: ${failCount}`)

      return {
        success: true,
        photosImported: successCount,
        error: failCount > 0 ? `${failCount} photos failed to import` : undefined
      }

    } catch (error) {
      console.error('ZipStreamService: Import failed:', error)
      
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Update gallery with error status
      await supabase
        .from('galleries')
        .update({
          import_started_at: null,
          metadata: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            import_method: 'zip_stream'
          }
        })
        .eq('id', galleryId)

      return {
        success: false,
        photosImported: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async downloadZipWithRetry(zipUrl: string, maxRetries: number = 3): Promise<Response | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`ZipStreamService: Download attempt ${attempt}/${maxRetries} for ${zipUrl}`)
        
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
          console.warn(`ZipStreamService: Download attempt ${attempt} failed with status ${response.status}`)
        }

      } catch (error) {
        console.warn(`ZipStreamService: Download attempt ${attempt} failed:`, error)
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        console.log(`ZipStreamService: Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    console.error(`ZipStreamService: All ${maxRetries} download attempts failed`)
    return null
  }

  private async extractPhotosFromStream(
    zipResponse: Response,
    progressCallback: (progress: number) => void
  ): Promise<Array<{
    filename: string
    data: ArrayBuffer
    platformPhotoId: string
    width?: number
    height?: number
    exifData?: Record<string, unknown>
  }>> {
    // For now, we'll use a simple approach
    // In a real implementation, you'd use a ZIP streaming library like yauzl or adm-zip
    
    const zipBuffer = await zipResponse.arrayBuffer()
    progressCallback(50)
    
    // TODO: Implement actual ZIP extraction
    // This is a placeholder that would need a proper ZIP library
    console.log(`ZipStreamService: ZIP buffer size: ${zipBuffer.byteLength} bytes`)
    
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
