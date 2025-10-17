import { UnifiedPlatformClient, PlatformCredentials, UnifiedPhoto, UnifiedGalleryMetadata, ImportProgress } from './unified-platform'

export class PixiesetClient extends UnifiedPlatformClient {
  private sessionCookie: string | null = null
  private gallerySlug: string
  private subdomain: string
  private accessType: 'guest' | 'account'

  constructor(credentials: PlatformCredentials) {
    super(credentials)
    this.accessType = credentials.accessType
    
    // Parse gallery URL to extract subdomain and slug
    const urlMatch = this.credentials.galleryUrl.match(/https:\/\/(.*?)\.pixieset\.com\/(.*?)(?:\/|$)/)
    if (!urlMatch) {
      throw new Error('Invalid Pixieset gallery URL format')
    }
    
    this.subdomain = urlMatch[1]
    this.gallerySlug = urlMatch[2].replace(/^guestlogin\//, '').replace(/\/$/, '')
  }

  async authenticate(): Promise<boolean> {
    console.log(`PixiesetZipClient: Starting authentication for ${this.subdomain}/${this.gallerySlug}`)
    
    try {
      if (this.accessType === 'guest') {
        return await this.authenticateGuest()
      } else {
        return await this.authenticateAccount()
      }
    } catch (error) {
      console.error('PixiesetZipClient: Authentication failed:', error)
      return false
    }
  }

  private async authenticateGuest(): Promise<boolean> {
    if (!this.credentials.password) {
      console.error('PixiesetZipClient: No password provided for guest access')
      return false
    }

    const guestLoginUrl = `https://${this.subdomain}.pixieset.com/guestlogin/${this.gallerySlug}/`
    
    try {
      // Step 1: Get the login page to extract CSRF token
      const loginPageResponse = await fetch(guestLoginUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      })

      if (!loginPageResponse.ok) {
        console.error(`PixiesetZipClient: Failed to load login page: ${loginPageResponse.status}`)
        return false
      }

      const loginPageHtml = await loginPageResponse.text()
      
      // Extract CSRF token from the page
      const csrfMatch = loginPageHtml.match(/name="csrfmiddlewaretoken" value="([^"]+)"/)
      const csrfToken = csrfMatch ? csrfMatch[1] : ''

      // Extract session cookie
      const setCookieHeader = loginPageResponse.headers.get('set-cookie')
      if (setCookieHeader) {
        const sessionMatch = setCookieHeader.match(/sessionid=([^;]+)/)
        if (sessionMatch) {
          this.sessionCookie = `sessionid=${sessionMatch[1]}`
        }
      }

      // Step 2: Submit login form
      const formData = new URLSearchParams()
      formData.append('password', this.credentials.password)
      if (csrfToken) {
        formData.append('csrfmiddlewaretoken', csrfToken)
      }

      const loginResponse = await fetch(guestLoginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Cookie': this.sessionCookie || '',
          'Referer': guestLoginUrl,
          'Origin': `https://${this.subdomain}.pixieset.com`,
          'X-CSRFToken': csrfToken,
        },
        body: formData,
        redirect: 'manual'
      })

      // Check if login was successful (redirect to gallery or 200 OK)
      if (loginResponse.status === 302 || loginResponse.status === 200) {
        console.log('PixiesetZipClient: Guest authentication successful')
        
        // Update session cookie if new one provided
        const newSetCookie = loginResponse.headers.get('set-cookie')
        if (newSetCookie) {
          const sessionMatch = newSetCookie.match(/sessionid=([^;]+)/)
          if (sessionMatch) {
            this.sessionCookie = `sessionid=${sessionMatch[1]}`
          }
        }
        
        return true
      } else {
        console.error(`PixiesetZipClient: Guest login failed with status: ${loginResponse.status}`)
        return false
      }

    } catch (error) {
      console.error('PixiesetZipClient: Error during guest authentication:', error)
      return false
    }
  }

  private async authenticateAccount(): Promise<boolean> {
    // Account authentication would require different approach
    // For now, return false as we'll focus on guest access first
    console.log('PixiesetZipClient: Account authentication not implemented yet')
    return false
  }

  async getGalleryMetadata(): Promise<UnifiedGalleryMetadata | null> {
    console.log(`PixiesetZipClient: Fetching metadata for ${this.subdomain}/${this.gallerySlug}`)
    
    try {
      const galleryUrl = `https://${this.subdomain}.pixieset.com/${this.gallerySlug}/`
      
      const response = await fetch(galleryUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Cookie': this.sessionCookie || '',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      })

      if (!response.ok) {
        console.error(`PixiesetZipClient: Failed to fetch gallery: ${response.status}`)
        return null
      }

      const html = await response.text()
      
      // Extract gallery information from HTML
      const galleryName = this.extractGalleryName(html)
      const photographerName = this.subdomain.replace(/([A-Z])/g, ' $1').trim()
      const photoCount = this.extractPhotoCount(html)

      return {
        id: `${this.subdomain}-${this.gallerySlug}`,
        name: galleryName || 'Pixieset Gallery',
        description: `Gallery from ${photographerName}`,
        photographerName: photographerName || 'Unknown Photographer',
        photoCount: photoCount || 0,
        coverImageUrl: undefined,
        location: undefined,
        people: undefined,
      }

    } catch (error) {
      console.error('PixiesetZipClient: Error fetching gallery metadata:', error)
      return null
    }
  }

  async getPhotos(): Promise<UnifiedPhoto[]> {
    console.log(`PixiesetZipClient: Fetching photo list for ${this.subdomain}/${this.gallerySlug}`)
    
    try {
      const galleryUrl = `https://${this.subdomain}.pixieset.com/${this.gallerySlug}/`
      
      const response = await fetch(galleryUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Cookie': this.sessionCookie || '',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      })

      if (!response.ok) {
        console.error(`PixiesetZipClient: Failed to fetch gallery for photo list: ${response.status}`)
        return []
      }

      const html = await response.text()
      
      // Extract photo URLs from the gallery page
      const photos = this.extractPhotoUrls(html)
      
      console.log(`PixiesetZipClient: Found ${photos.length} photos`)
      return photos

    } catch (error) {
      console.error('PixiesetZipClient: Error fetching photo list:', error)
      return []
    }
  }

  async downloadPhoto(photoUrl: string): Promise<ArrayBuffer> {
    console.log(`PixiesetZipClient: Downloading photo from ${photoUrl}`)
    
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
      console.error(`PixiesetZipClient: Error downloading photo:`, error)
      throw error
    }
  }

  async findZipDownloadUrl(): Promise<string | null> {
    console.log(`PixiesetZipClient: Looking for "Download to Device" link`)
    
    try {
      const galleryUrl = `https://${this.subdomain}.pixieset.com/${this.gallerySlug}/`
      
      const response = await fetch(galleryUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Cookie': this.sessionCookie || '',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      })

      if (!response.ok) {
        console.error(`PixiesetZipClient: Failed to fetch gallery for download link: ${response.status}`)
        return null
      }

      const html = await response.text()
      
      // Look for "Download to Device" link in various forms
      const downloadPatterns = [
        /href="([^"]*download[^"]*)"[^>]*>.*?download.*?to.*?device/i,
        /href="([^"]*download[^"]*)"[^>]*>.*?download.*?all/i,
        /href="([^"]*download[^"]*)"[^>]*>.*?zip/i,
        /data-download-url="([^"]+)"/i,
        /downloadUrl["\s]*:["\s]*"([^"]+)"/i,
      ]

      for (const pattern of downloadPatterns) {
        const match = html.match(pattern)
        if (match) {
          let downloadUrl = match[1]
          
          // Convert relative URL to absolute
          if (downloadUrl.startsWith('/')) {
            downloadUrl = `https://${this.subdomain}.pixieset.com${downloadUrl}`
          } else if (downloadUrl.startsWith('./')) {
            downloadUrl = `https://${this.subdomain}.pixieset.com/${this.gallerySlug}/${downloadUrl.substring(2)}`
          }
          
          console.log(`PixiesetZipClient: Found download URL: ${downloadUrl}`)
          return downloadUrl
        }
      }

      console.log('PixiesetZipClient: No download link found')
      return null

    } catch (error) {
      console.error('PixiesetZipClient: Error finding download link:', error)
      return null
    }
  }

  // Helper methods for HTML parsing
  private extractGalleryName(html: string): string | null {
    const patterns = [
      /<title>([^<]+)<\/title>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /class="gallery-title"[^>]*>([^<]+)<\//i,
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
    ]

    for (const pattern of photoPatterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1]
        if (url && !photos.some(p => p.originalUrl === url)) {
          const filename = url.split('/').pop() || `photo_${photos.length + 1}.jpg`
          photos.push({
            id: `pixieset-${photos.length + 1}`,
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
