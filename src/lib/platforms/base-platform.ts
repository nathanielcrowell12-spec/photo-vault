// Base class for all photo platform integrations
// This provides a consistent interface that all platforms (Pixieset, SmugMug, etc.) must implement

export interface PlatformCredentials {
  platform: string
  galleryUrl?: string
  username?: string
  email?: string
  password?: string
  apiKey?: string
  [key: string]: unknown // Allow platform-specific fields
}

export interface GalleryMetadata {
  id: string
  name: string
  description?: string
  publishDate?: Date
  photoCount: number
  coverPhotoUrl?: string
  photographerName?: string
  isPrivate: boolean
  originalUrl: string
}

export interface PhotoMetadata {
  id: string
  filename: string
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  fileSize?: number
  dateTaken?: Date
  dateUploaded?: Date
  caption?: string
  exifData?: Record<string, unknown>
}

export interface ImportProgress {
  stage: 'authenticating' | 'fetching_gallery' | 'fetching_photos' | 'downloading' | 'uploading' | 'complete' | 'error'
  progress: number // 0-100
  message: string
  currentPhoto?: number
  totalPhotos?: number
}

export abstract class BasePlatformClient {
  protected platform: string
  protected credentials: PlatformCredentials
  protected isAuthenticated = false

  constructor(platform: string, credentials: PlatformCredentials) {
    this.platform = platform
    this.credentials = credentials
  }

  /**
   * Authenticate with the platform
   * @returns Authentication token or session info
   */
  abstract authenticate(): Promise<void>

  /**
   * Fetch gallery metadata (dates, photo count, etc.)
   * @param galleryUrl URL of the gallery
   * @returns Gallery metadata
   */
  abstract fetchGalleryMetadata(galleryUrl: string): Promise<GalleryMetadata>

  /**
   * Fetch list of photos in the gallery
   * @param galleryUrl URL of the gallery
   * @returns Array of photo metadata
   */
  abstract fetchPhotoList(galleryUrl: string): Promise<PhotoMetadata[]>

  /**
   * Download a photo from the platform
   * @param photoUrl URL of the photo
   * @returns Photo as Blob
   */
  abstract downloadPhoto(photoUrl: string): Promise<Blob>

  /**
   * Test connection to the platform
   * @returns true if connection is valid
   */
  abstract testConnection(): Promise<boolean>

  /**
   * Get platform-specific configuration
   */
  abstract getConfig(): {
    name: string
    supportsPrivateGalleries: boolean
    supportsVideoDownload: boolean
    requiresAuthentication: boolean
    maxPhotoSize?: number
  }
}

