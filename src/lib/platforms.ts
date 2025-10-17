export interface PlatformConfig {
  name: string
  displayName: string
  logo: string
  color: string
  authUrl: string
  apiUrl: string
  description: string
  features: string[]
}

export const SUPPORTED_PLATFORMS: Record<string, PlatformConfig> = {
  pixieset: {
    name: 'pixieset',
    displayName: 'Pixieset',
    logo: '🎨',
    color: 'bg-blue-500',
    authUrl: 'https://pixieset.com/oauth/authorize',
    apiUrl: 'https://api.pixieset.com/v1',
    description: 'Professional gallery platform for photographers',
    features: ['Gallery Management', 'Client Proofing', 'Print Sales', 'Mobile App']
  },
  shootproof: {
    name: 'shootproof',
    displayName: 'ShootProof',
    logo: '📸',
    color: 'bg-green-500',
    authUrl: 'https://shootproof.com/oauth/authorize',
    apiUrl: 'https://api.shootproof.com/v2',
    description: 'Complete photography business management',
    features: ['Client Galleries', 'Contracts', 'Invoicing', 'Studio Management']
  },
  smugmug: {
    name: 'smugmug',
    displayName: 'SmugMug',
    logo: '🖼️',
    color: 'bg-purple-500',
    authUrl: 'https://secure.smugmug.com/services/oauth/1.0a/authorize',
    apiUrl: 'https://api.smugmug.com/api/v2',
    description: 'Photo sharing and selling platform',
    features: ['Unlimited Storage', 'Custom Websites', 'Print Sales', 'Mobile Apps']
  },
  pic_time: {
    name: 'pic_time',
    displayName: 'Pic-Time',
    logo: '⏰',
    color: 'bg-orange-500',
    authUrl: 'https://pic-time.com/oauth/authorize',
    apiUrl: 'https://api.pic-time.com/v1',
    description: 'Wedding and portrait photography platform',
    features: ['Wedding Galleries', 'Client Proofing', 'Print Sales', 'Mobile App']
  },
  cloudspot: {
    name: 'cloudspot',
    displayName: 'CloudSpot',
    logo: '☁️',
    color: 'bg-cyan-500',
    authUrl: 'https://cloudspot.io/oauth/authorize',
    apiUrl: 'https://api.cloudspot.io/v1',
    description: 'Professional photography delivery platform',
    features: ['Gallery Delivery', 'Client Proofing', 'Print Sales', 'Analytics']
  }
}

export async function connectPlatform(
  platformName: string, 
  accessToken: string, 
  photographerId: string
) {
  try {
    const response = await fetch(`/api/platforms/${platformName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        photographerId
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to connect ${platformName}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error connecting to ${platformName}:`, error)
    throw error
  }
}

export async function getPlatformGalleries(platformName: string, photographerId: string) {
  try {
    const response = await fetch(`/api/platforms/${platformName}/galleries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch galleries from ${platformName}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching galleries from ${platformName}:`, error)
    throw error
  }
}

export function getPlatformAuthUrl(platformName: string, redirectUri: string) {
  const platform = SUPPORTED_PLATFORMS[platformName]
  if (!platform) {
    throw new Error(`Unsupported platform: ${platformName}`)
  }

  const params = new URLSearchParams({
    client_id: process.env[`${platformName.toUpperCase()}_CLIENT_ID`] || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read_galleries read_photos'
  })

  return `${platform.authUrl}?${params.toString()}`
}
