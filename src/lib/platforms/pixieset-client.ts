// Pixieset API Client Implementation
// Based on reverse-engineered Pixieset Gallery API
// API Base: https://galleries.pixieset.com/api/v1

import { BasePlatformClient, GalleryMetadata, PhotoMetadata, PlatformCredentials } from './base-platform'
import { logger } from '../logger'

interface PixiesetGalleryInfo {
  subdomain: string
  gallerySlug: string
}

export class PixiesetClient extends BasePlatformClient {
  private apiBase = 'https://galleries.pixieset.com/api/v1'
  private sessionCookie: string | null = null
  private galleryInfo: PixiesetGalleryInfo | null = null

  constructor(credentials: PlatformCredentials) {
    super('Pixieset', credentials)
  }

  /**
   * Parse Pixieset gallery URL to extract subdomain and gallery slug
   * Example: https://meadowlanemedia.pixieset.com/guestlogin/crowellcountryliving/
   */
  private parseGalleryUrl(url: string): PixiesetGalleryInfo {
    // Match patterns:
    // https://subdomain.pixieset.com/galleryslug
    // https://subdomain.pixieset.com/guestlogin/galleryslug
    
    const match = url.match(/https?:\/\/([^.]+)\.pixieset\.com\/(?:guestlogin\/)?([^\/\?]+)/)
    
    if (!match) {
      throw new Error('Invalid Pixieset gallery URL format')
    }

    return {
      subdomain: match[1],
      gallerySlug: match[2]
    }
  }

  /**
   * Authenticate with Pixieset using gallery password
   * Uses session-based authentication with cookies
   */
  async authenticate(): Promise<void> {
    try {
      if (!this.credentials.galleryUrl) {
        throw new Error('Gallery URL is required for Pixieset authentication')
      }

      this.galleryInfo = this.parseGalleryUrl(this.credentials.galleryUrl)

      // If no password required or already authenticated, skip
      if (!this.credentials.password) {
        logger.info('[PixiesetClient] No password provided - attempting unauthenticated access')
        this.isAuthenticated = true
        return
      }

      // Authenticate with password
      // Note: This is a simplified version - actual implementation may need to handle
      // CSRF tokens, multiple request steps, etc.
      
      const authUrl = `${this.apiBase}/galleries/${this.galleryInfo.subdomain}/${this.galleryInfo.gallerySlug}/authenticate`
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          password: this.credentials.password
        })
      })

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
      }

      // Extract session cookie from response
      const setCookie = response.headers.get('set-cookie')
      if (setCookie) {
        this.sessionCookie = setCookie.split(';')[0] // Get just the cookie value
      }

      this.isAuthenticated = true
      logger.info('[PixiesetClient] Authenticated with Pixieset')

    } catch (error) {
      logger.error('[PixiesetClient] Authentication error:', error)
      throw error
    }
  }

  /**
   * Fetch gallery metadata from Pixieset
   */
  async fetchGalleryMetadata(galleryUrl: string): Promise<GalleryMetadata> {
    if (!this.isAuthenticated) {
      await this.authenticate()
    }

    if (!this.galleryInfo) {
      this.galleryInfo = this.parseGalleryUrl(galleryUrl)
    }

    try {
      // Fetch gallery info from API
      const galleryApiUrl = `${this.apiBase}/galleries/${this.galleryInfo.subdomain}/${this.galleryInfo.gallerySlug}`
      
      const response = await fetch(galleryApiUrl, {
        headers: {
          'Accept': 'application/json',
          ...(this.sessionCookie && { 'Cookie': this.sessionCookie })
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch gallery: ${response.status}`)
      }

      const data = await response.json()

      // Map Pixieset response to our standard format
      return {
        id: data.id || this.galleryInfo.gallerySlug,
        name: data.name || data.title || this.galleryInfo.gallerySlug,
        description: data.description || '',
        publishDate: data.published_at ? new Date(data.published_at) : undefined,
        photoCount: data.photo_count || data.photos?.length || 0,
        coverPhotoUrl: data.cover_photo_url || data.cover_photo?.url,
        photographerName: data.photographer_name || this.galleryInfo.subdomain,
        isPrivate: data.password_protected || false,
        originalUrl: galleryUrl
      }

    } catch (error) {
      logger.error('[PixiesetClient] Error fetching gallery metadata:', error)
      throw error
    }
  }

  /**
   * Fetch list of all photos in the gallery
   */
  async fetchPhotoList(galleryUrl: string): Promise<PhotoMetadata[]> {
    if (!this.isAuthenticated) {
      await this.authenticate()
    }

    if (!this.galleryInfo) {
      this.galleryInfo = this.parseGalleryUrl(galleryUrl)
    }

    try {
      // Fetch photos from API
      const photosApiUrl = `${this.apiBase}/galleries/${this.galleryInfo.subdomain}/${this.galleryInfo.gallerySlug}/photos`
      
      const response = await fetch(photosApiUrl, {
        headers: {
          'Accept': 'application/json',
          ...(this.sessionCookie && { 'Cookie': this.sessionCookie })
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`)
      }

      const data = await response.json()
      const photos = data.photos || data

      // Map Pixieset photos to our standard format
      return photos.map((photo: Record<string, unknown>, index: number) => ({
        id: photo.id || `${index}`,
        filename: photo.filename || photo.name || `photo-${index}.jpg`,
        url: photo.url || photo.original_url || photo.download_url,
        thumbnailUrl: photo.thumbnail_url || photo.thumb_url,
        width: photo.width,
        height: photo.height,
        fileSize: photo.file_size || photo.size,
        dateTaken: photo.taken_at && typeof photo.taken_at === 'string' ? new Date(photo.taken_at) : undefined,
        dateUploaded: photo.uploaded_at && typeof photo.uploaded_at === 'string' ? new Date(photo.uploaded_at) : undefined,
        caption: photo.caption || photo.description,
        exifData: photo.exif || {}
      }))

    } catch (error) {
      logger.error('[PixiesetClient] Error fetching photo list:', error)
      throw error
    }
  }

  /**
   * Download a photo from Pixieset
   */
  async downloadPhoto(photoUrl: string): Promise<Blob> {
    try {
      const response = await fetch(photoUrl, {
        headers: {
          ...(this.sessionCookie && { 'Cookie': this.sessionCookie })
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to download photo: ${response.status}`)
      }

      return await response.blob()

    } catch (error) {
      logger.error('[PixiesetClient] Error downloading photo:', error)
      throw error
    }
  }

  /**
   * Test connection to Pixieset
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate()
      return this.isAuthenticated
    } catch {
      return false
    }
  }

  /**
   * Get Pixieset platform configuration
   */
  getConfig() {
    return {
      name: 'Pixieset',
      supportsPrivateGalleries: true,
      supportsVideoDownload: false,
      requiresAuthentication: true,
      maxPhotoSize: undefined // No known limit
    }
  }
}

