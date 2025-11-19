// Photo Import Service
// Handles the complete import workflow for any platform

import { BasePlatformClient, PhotoMetadata } from '../platforms/base-platform'
import { createClient } from '@supabase/supabase-js'

export interface ImportProgress {
  stage: 'authenticating' | 'fetching_gallery' | 'fetching_photos' | 'downloading' | 'complete' | 'error'
  progress: number // 0-100
  message: string
  currentPhoto?: number
  totalPhotos?: number
}

export class PhotoImportService {
  private supabase
  private progressCallback?: (progress: ImportProgress) => void

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  /**
   * Set callback for progress updates
   */
  onProgress(callback: (progress: ImportProgress) => void) {
    this.progressCallback = callback
  }

  /**
   * Update import progress
   */
  private updateProgress(progress: Partial<ImportProgress>) {
    if (this.progressCallback) {
      this.progressCallback({
        stage: progress.stage || 'authenticating',
        progress: progress.progress || 0,
        message: progress.message || '',
        currentPhoto: progress.currentPhoto,
        totalPhotos: progress.totalPhotos
      })
    }
  }

  /**
   * Import photos from any platform
   * @param platformClient Platform-specific client (Pixieset, SmugMug, etc.)
   * @param galleryId Database ID of the gallery
   * @param userId User ID who owns the gallery
   * @param galleryUrl URL of the gallery to import from
   */
  async importGallery(
    platformClient: BasePlatformClient,
    galleryId: string,
    userId: string,
    galleryUrl: string
  ): Promise<void> {
    try {
      // Step 1: Authenticate
      this.updateProgress({
        stage: 'authenticating',
        progress: 5,
        message: 'Authenticating with platform...'
      })

      await platformClient.authenticate()

      // Step 2: Fetch gallery metadata
      this.updateProgress({
        stage: 'fetching_gallery',
        progress: 10,
        message: 'Fetching gallery information...'
      })

      const galleryMetadata = await platformClient.fetchGalleryMetadata(galleryUrl)

      // Update gallery in database with metadata
      await this.supabase
        .from('photo_galleries')
        .update({
          gallery_name: galleryMetadata.name,
          gallery_description: galleryMetadata.description,
          photographer_name: galleryMetadata.photographerName,
          photo_count: galleryMetadata.photoCount,
          session_date: galleryMetadata.publishDate?.toISOString().split('T')[0],
          cover_image_url: galleryMetadata.coverPhotoUrl || null,
          import_started_at: new Date().toISOString()
        })
        .eq('id', galleryId)

      // Step 3: Fetch photo list
      this.updateProgress({
        stage: 'fetching_photos',
        progress: 15,
        message: `Fetching list of ${galleryMetadata.photoCount} photos...`
      })

      const photos = await platformClient.fetchPhotoList(galleryUrl)

      // Step 4: Download and upload each photo
      this.updateProgress({
        stage: 'downloading',
        progress: 20,
        message: 'Starting photo download...',
        totalPhotos: photos.length
      })

      let successCount = 0
      let failCount = 0

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        
        try {
          const progress = 20 + ((i / photos.length) * 70) // 20% to 90%
          
          this.updateProgress({
            stage: 'downloading',
            progress,
            message: `Downloading photo ${i + 1} of ${photos.length}...`,
            currentPhoto: i + 1,
            totalPhotos: photos.length
          })

          // Download photo from platform
          const photoBlob = await platformClient.downloadPhoto(photo.url)

          // Generate filename
          const timestamp = Date.now()
          const extension = photo.filename.split('.').pop() || 'jpg'
          const fileName = `${timestamp}-${photo.id}.${extension}`

          // Upload original to Supabase Storage
          const originalPath = `${userId}/${galleryId}/original/${fileName}`
          const { error: uploadError } = await this.supabase.storage
            .from('photos')
            .upload(originalPath, photoBlob, {
              contentType: photoBlob.type || 'image/jpeg',
              upsert: false
            })

          if (uploadError) {
            console.error(`Failed to upload photo ${photo.filename}:`, uploadError)
            failCount++
            continue
          }

          // Get public URL
          const { data: { publicUrl } } = this.supabase.storage
            .from('photos')
            .getPublicUrl(originalPath)

          // TODO: Generate thumbnail (future enhancement)
          const thumbnailUrl = publicUrl

          // Save to database
          await this.supabase
            .from('gallery_photos')
            .insert({
              gallery_id: galleryId,
              photo_url: publicUrl,
              thumbnail_url: thumbnailUrl,
              original_filename: photo.filename,
              file_size: photo.fileSize,
              width: photo.width,
              height: photo.height,
              taken_at: photo.dateTaken?.toISOString(),
              is_favorite: false,
              is_private: false,
              metadata: {
                platform_id: photo.id,
                exif: photo.exifData,
                caption: photo.caption
              }
            })

          successCount++

        } catch (error) {
          console.error(`Error processing photo ${photo.filename}:`, error)
          failCount++
        }
      }

      // Step 5: Complete
      this.updateProgress({
        stage: 'complete',
        progress: 100,
        message: `Import complete! ${successCount} photos imported, ${failCount} failed.`
      })

      // Mark gallery as imported
      await this.supabase
        .from('photo_galleries')
        .update({
          is_imported: true,
          import_completed_at: new Date().toISOString(),
          photo_count: successCount
        })
        .eq('id', galleryId)

    } catch (error) {
      console.error('Import error:', error)
      
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })

      throw error
    }
  }

  /**
   * Generate thumbnail from photo blob
   * TODO: Implement image resizing
   */
  private async generateThumbnail(photoBlob: Blob): Promise<Blob> {
    // For now, return the original
    // In the future, implement image resizing using sharp or canvas
    return photoBlob
  }
}

