import { UnifiedPlatformClient, PlatformCredentials, UnifiedPhoto, UnifiedGalleryMetadata } from './unified-platform'

export class SmugMugClient extends UnifiedPlatformClient {
  private sessionCookie: string | null = null
  private galleryKey: string
  private subdomain: string
  private accessType: 'guest' | 'account'

  constructor(credentials: PlatformCredentials) {
    super(credentials)
    this.accessType = credentials.accessType
    
    // Parse gallery URL to extract subdomain and gallery key
    // SmugMug URLs typically look like: https://photographer.smugmug.com/Gallery-Name/n-ABC123/
    const urlMatch = this.credentials.galleryUrl.match(/https:\/\/(.*?)\.smugmug\.com\/([^\/]+)\/n-([A-Za-z0-9]+)/)
    if (!urlMatch) {
      throw new Error('Invalid SmugMug gallery URL format')
    }
    
    this.subdomain = urlMatch[1]
    this.galleryKey = urlMatch[3]
  }

  async authenticate(): Promise<boolean> {
    console.log(`SmugMugClient: Starting authentication for ${this.subdomain}/${this.galleryKey}`)
    
    try {
      if (this.accessType === 'guest') {
        return await this.authenticateGuest()
      } else {
        return await this.authenticateAccount()
      }
    } catch (error) {
      console.error('SmugMugClient: Authentication failed:', error)
      return false
    }
  }

  private async authenticateGuest(): Promise<boolean> {
    if (!this.credentials.password) {
      console.error('SmugMugClient: No password provided for guest access')
      return false
    }

    try {
      // SmugMug guest authentication typically involves accessing the gallery with password
      const galleryUrl = `https://${this.subdomain}.smugmug.com/gallery/n-${this.galleryKey}/`
      
      // First, try to access the gallery page to see if it's password protected
      const response = await fetch(galleryUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      })

      if (response.ok) {
        // Gallery is accessible without password
        console.log('SmugMugClient: Gallery accessible without password')
        return true
      } else if (response.status === 401 || response.status === 403) {
        // Gallery requires password - implement password authentication
        return await this.authenticateWithPassword(galleryUrl)
      } else {
        console.error(`SmugMugClient: Unexpected response status: ${response.status}`)
        return false
      }

    } catch (error) {
      console.error('SmugMugClient: Error during guest authentication:', error)
      return false
    }
  }

  private async authenticateWithPassword(galleryUrl: string): Promise<boolean> {
    // SmugMug password authentication implementation
    // This would need to be implemented based on SmugMug's actual authentication flow
    console.log('SmugMugClient: Password authentication not fully implemented yet')
    
    // For now, return true to allow testing
    return true
  }

  private async authenticateAccount(): Promise<boolean> {
    // Account authentication would require SmugMug API credentials
    console.log('SmugMugClient: Account authentication not implemented yet')
    return false
  }

  async getGalleryMetadata(): Promise<UnifiedGalleryMetadata | null> {
    console.log(`SmugMugClient: Fetching metadata for ${this.subdomain}/${this.galleryKey}`)
    
    try {
      const galleryUrl = `https://${this.subdomain}.smugmug.com/gallery/n-${this.galleryKey}/`
      
      const response = await fetch(galleryUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Cookie': this.sessionCookie || '',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      })

      if (!response.ok) {
        console.error(`SmugMugClient: Failed to fetch gallery: ${response.status}`)
        return null
      }

      const html = await response.text()
      
      // Extract gallery information from HTML
      const galleryName = this.extractGalleryName(html)
      const photographerName = this.subdomain.replace(/([A-Z])/g, ' $1').trim()
      const photoCount = this.extractPhotoCount(html)

      return {
        id: `smugmug-${this.galleryKey}`,
        name: galleryName || 'SmugMug Gallery',
        description: `Gallery from ${photographerName}`,
        photographerName: photographerName || 'Unknown Photographer',
        photoCount: photoCount || 0,
        coverImageUrl: undefined,
        location: undefined,
        people: undefined,
      }

    } catch (error) {
      console.error('SmugMugClient: Error fetching gallery metadata:', error)
      return null
    }
  }

  async findZipDownloadUrl(): Promise<string | null> {
    console.log(`SmugMugClient: Looking for ZIP download link`)
    
    try {
      const galleryUrl = `https://${this.subdomain}.smugmug.com/gallery/n-${this.galleryKey}/`
      
      const response = await fetch(galleryUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Cookie': this.sessionCookie || '',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      })

      if (!response.ok) {
        console.error(`SmugMugClient: Failed to fetch gallery for download link: ${response.status}`)
        return null
      }

      const html = await response.text()
      
      // Look for ZIP download links in various forms
      const downloadPatterns = [
        /href="([^"]*download[^"]*\.zip[^"]*)"[^>]*>/i,
        /href="([^"]*download[^"]*)"[^>]*>.*?download.*?all/i,
        /href="([^"]*download[^"]*)"[^>]*>.*?zip/i,
        /data-download-url="([^"]+)"/i,
        /downloadUrl["\s]*:["\s]*"([^"]+)"/i,
        // SmugMug specific patterns
        /href="([^"]*\/api\/v2\/gallery\/[^"]*\/download[^"]*)"/i,
      ]

      for (const pattern of downloadPatterns) {
        const match = html.match(pattern)
        if (match) {
          let downloadUrl = match[1]
          
          // Convert relative URL to absolute
          if (downloadUrl.startsWith('/')) {
            downloadUrl = `https://${this.subdomain}.smugmug.com${downloadUrl}`
          } else if (downloadUrl.startsWith('./')) {
            downloadUrl = `https://${this.subdomain}.smugmug.com/gallery/n-${this.galleryKey}/${downloadUrl.substring(2)}`
          }
          
          console.log(`SmugMugClient: Found download URL: ${downloadUrl}`)
          return downloadUrl
        }
      }

      console.log('SmugMugClient: No download link found')
      return null

    } catch (error) {
      console.error('SmugMugClient: Error finding download link:', error)
      return null
    }
  }

  async getPhotos(): Promise<UnifiedPhoto[]> {
    console.log(`SmugMugClient: Fetching photo list for ${this.subdomain}/${this.galleryKey}`)
    
    try {
      const galleryUrl = `https://${this.subdomain}.smugmug.com/gallery/n-${this.galleryKey}/`
      
      const response = await fetch(galleryUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Cookie': this.sessionCookie || '',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      })

      if (!response.ok) {
        console.error(`SmugMugClient: Failed to fetch gallery for photo list: ${response.status}`)
        return []
      }

      const html = await response.text()
      
      // Extract photo URLs from the gallery page
      const photos = this.extractPhotoUrls(html)
      
      console.log(`SmugMugClient: Found ${photos.length} photos`)
      return photos

    } catch (error) {
      console.error('SmugMugClient: Error fetching photo list:', error)
      return []
    }
  }

  async downloadPhoto(photoUrl: string): Promise<ArrayBuffer> {
    console.log(`SmugMugClient: Downloading photo from ${photoUrl}`)
    
    try {
      const response = await fetch(photoUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Cookie': this.sessionCookie || '',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to download photo: ${response.statusText}`)
      }

      return response.arrayBuffer()
    } catch (error) {
      console.error(`SmugMugClient: Error downloading photo:`, error)
      throw error
    }
  }

  // Helper methods for HTML parsing
  private extractGalleryName(html: string): string | null {
    const patterns = [
      /<title>([^<]+)<\/title>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /class="gallery-title"[^>]*>([^<]+)<\//i,
      /"name"\s*:\s*"([^"]+)"/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    return null
  }

  private extractPhotoCount(html: string): number {
    const patterns = [
      /(\d+)\s+photos?/i,
      /photos?[^>]*>(\d+)/i,
      /"photoCount"\s*:\s*(\d+)/i,
      /"imageCount"\s*:\s*(\d+)/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        return parseInt(match[1], 10)
      }
    }
    return 0
  }

  private extractPhotoUrls(html: string): UnifiedPhoto[] {
    const photos: UnifiedPhoto[] = []
    
    // Look for various photo URL patterns in the HTML
    const photoPatterns = [
      /data-src="([^"]+\.(?:jpg|jpeg|png|gif|webp))"/gi,
      /src="([^"]+\.(?:jpg|jpeg|png|gif|webp))"/gi,
      /"url"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|gif|webp))"/gi,
      // SmugMug specific patterns
      /"LargeUrl"\s*:\s*"([^"]+)"/gi,
      /"OriginalUrl"\s*:\s*"([^"]+)"/gi,
    ]

    for (const pattern of photoPatterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1]
        if (url && !photos.some(p => p.originalUrl === url)) {
          const filename = url.split('/').pop() || `photo_${photos.length + 1}.jpg`
          photos.push({
            id: `smugmug-${photos.length + 1}`,
            filename: filename,
            originalUrl: url,
            fileSize: 0,
            width: 0,
            height: 0,
            metadata: {}
          })
        }
      }
    }

    return photos
  }
}
