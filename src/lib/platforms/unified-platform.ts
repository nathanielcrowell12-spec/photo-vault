// Unified Platform Interface
// This defines the standard interface that all photo platforms must implement

export interface UnifiedPhoto {
  id: string
  filename: string
  originalUrl: string
  thumbnailUrl?: string
  fileSize: number
  width: number
  height: number
  metadata: {
    exifData?: any
    takenAt?: string
    camera?: string
    location?: string
  }
}

export interface UnifiedGalleryMetadata {
  id: string
  name: string
  description?: string
  photographerName?: string
  sessionDate?: string
  photoCount: number
  coverImageUrl?: string
  location?: string
  people?: string[]
}

export interface PlatformCredentials {
  platform: string
  galleryUrl: string
  password?: string
  username?: string
  userPassword?: string
  accessType: 'guest' | 'account'
}

export interface ImportProgress {
  stage: 'authenticating' | 'finding_download' | 'downloading_zip' | 'extracting' | 'uploading' | 'complete' | 'error'
  progress: number // 0-100
  message: string
  currentPhoto?: number
  totalPhotos?: number
  error?: string
}

/**
 * Base class that all platform clients must extend
 * This ensures consistent behavior across all photo platforms
 */
export abstract class UnifiedPlatformClient {
  protected credentials: PlatformCredentials
  protected progressCallback?: (progress: ImportProgress) => void

  constructor(credentials: PlatformCredentials) {
    this.credentials = credentials
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
  protected updateProgress(progress: Partial<ImportProgress>) {
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

  /**
   * Authenticate with the platform
   * Must be implemented by each platform
   */
  abstract authenticate(): Promise<boolean>

  /**
   * Get gallery metadata (name, photographer, photo count, etc.)
   * Must be implemented by each platform
   */
  abstract getGalleryMetadata(): Promise<UnifiedGalleryMetadata | null>

  /**
   * Find the ZIP download URL on the platform
   * Must be implemented by each platform
   */
  abstract findZipDownloadUrl(): Promise<string | null>

  /**
   * Get list of photos in the gallery (for individual photo processing)
   * Optional - can be used as alternative to ZIP download
   */
  abstract getPhotos(): Promise<UnifiedPhoto[]>

  /**
   * Download a single photo from the platform
   * Used for individual photo downloads or ZIP streaming
   */
  abstract downloadPhoto(photoUrl: string): Promise<ArrayBuffer>

  /**
   * Get platform-specific error messages
   */
  getErrorMessage(error: any): string {
    const errorString = error?.message || error?.toString() || 'Unknown error'
    
    // Platform-specific error handling
    switch (this.credentials.platform.toLowerCase()) {
      case 'pixieset':
        return this.getPixiesetErrorMessage(errorString)
      case 'smugmug':
        return this.getSmugMugErrorMessage(errorString)
      default:
        return errorString
    }
  }

  private getPixiesetErrorMessage(error: string): string {
    if (error.includes('authentication') || error.includes('password')) {
      return 'Please check your gallery URL and password. If the URL is correct and the photographer confirms the gallery is active, please contact support.'
    }
    if (error.includes('download') || error.includes('zip')) {
      return 'Could not find "Download to Device" link. The gallery may not allow downloads or the photographer may have disabled this feature.'
    }
    return error
  }

  private getSmugMugErrorMessage(error: string): string {
    if (error.includes('authentication') || error.includes('login')) {
      return 'Please check your SmugMug URL and credentials. If the gallery is private, ensure you have the correct password.'
    }
    if (error.includes('download') || error.includes('zip')) {
      return 'Could not find download link. The gallery may not allow downloads or may require special permissions.'
    }
    return error
  }
}

/**
 * Factory function to create platform clients
 */
export function createPlatformClient(credentials: PlatformCredentials): UnifiedPlatformClient {
  switch (credentials.platform.toLowerCase()) {
    case 'pixieset':
      const { PixiesetClient } = require('./pixieset-zip-client')
      return new PixiesetClient(credentials)
    case 'smugmug':
      const { SmugMugClient } = require('./smugmug-client')
      return new SmugMugClient(credentials)
    default:
      throw new Error(`Unsupported platform: ${credentials.platform}`)
  }
}
