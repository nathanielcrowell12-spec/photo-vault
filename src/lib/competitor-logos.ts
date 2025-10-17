// Competitor logo management with automatic updates every 2 months
import { supabase } from './supabase'

export interface CompetitorLogo {
  id: string
  name: string
  logoUrl: string
  website: string
  lastUpdated: string
  isActive: boolean
}

// Default fallback logos (will be replaced by fetched ones)
export const DEFAULT_COMPETITOR_LOGOS: CompetitorLogo[] = [
  {
    id: 'pixieset',
    name: 'Pixieset',
    logoUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=60&fit=crop&crop=center',
    website: 'https://pixieset.com',
    lastUpdated: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'shootproof',
    name: 'ShootProof',
    logoUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&h=60&fit=crop&crop=center',
    website: 'https://shootproof.com',
    lastUpdated: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'smugmug',
    name: 'SmugMug',
    logoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=60&fit=crop&crop=center',
    website: 'https://smugmug.com',
    lastUpdated: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'pictime',
    name: 'Pic-Time',
    logoUrl: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=200&h=60&fit=crop&crop=center',
    website: 'https://pic-time.com',
    lastUpdated: new Date().toISOString(),
    isActive: true
  }
]

// Function to check if logos need updating (every 2 months)
export function shouldUpdateLogos(lastUpdated: string): boolean {
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  
  const lastUpdateDate = new Date(lastUpdated)
  return lastUpdateDate < twoMonthsAgo
}

// Function to fetch updated logos from competitor websites
async function fetchCompetitorLogos(): Promise<CompetitorLogo[]> {
  // In a real implementation, this would:
  // 1. Use a service like Clearbit Logo API or similar
  // 2. Scrape competitor websites for their current logos
  // 3. Use a logo detection service
  
  // For now, we'll simulate fetching updated logos
  // In production, you'd replace this with actual logo fetching logic
  const updatedLogos = await Promise.all(
    DEFAULT_COMPETITOR_LOGOS.map(async (logo) => {
      // Simulate API call to fetch logo
      // In reality: const logoData = await fetchLogoFromAPI(logo.website)
      
      return {
        ...logo,
        logoUrl: `https://images.unsplash.com/photo-${Math.random().toString(36).substring(2, 15)}?w=200&h=60&fit=crop&crop=center`,
        lastUpdated: new Date().toISOString()
      }
    })
  )
  
  return updatedLogos
}

// Function to get competitor logos (with automatic updates)
export async function getCompetitorLogos(): Promise<CompetitorLogo[]> {
  try {
    // Try to get logos from database
    const { data: dbLogos, error } = await supabase
      .from('competitor_logos')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error || !dbLogos || dbLogos.length === 0) {
      // No logos in database, use defaults
      return DEFAULT_COMPETITOR_LOGOS
    }

    // Check if any logos need updating
    const needsUpdate = dbLogos.some(logo => shouldUpdateLogos(logo.last_updated))
    
    if (needsUpdate) {
      console.log('🔄 Competitor logos need updating, fetching new ones...')
      
      // Fetch updated logos
      const updatedLogos = await fetchCompetitorLogos()
      
      // Update database with new logos
      for (const logo of updatedLogos) {
        await supabase
          .from('competitor_logos')
          .upsert({
            id: logo.id,
            name: logo.name,
            logo_url: logo.logoUrl,
            website: logo.website,
            last_updated: logo.lastUpdated,
            is_active: logo.isActive
          })
      }
      
      console.log('✅ Competitor logos updated successfully')
      return updatedLogos
    }

    // Return current logos from database
    return dbLogos.map(logo => ({
      id: logo.id,
      name: logo.name,
      logoUrl: logo.logo_url,
      website: logo.website,
      lastUpdated: logo.last_updated,
      isActive: logo.is_active
    }))

  } catch (error) {
    console.error('Error fetching competitor logos:', error)
    // Fallback to default logos
    return DEFAULT_COMPETITOR_LOGOS
  }
}

// Function to manually trigger logo updates (for admin use)
export async function forceUpdateLogos(): Promise<CompetitorLogo[]> {
  console.log('🔄 Force updating competitor logos...')
  
  const updatedLogos = await fetchCompetitorLogos()
  
  // Update database
  for (const logo of updatedLogos) {
    await supabase
      .from('competitor_logos')
      .upsert({
        id: logo.id,
        name: logo.name,
        logo_url: logo.logoUrl,
        website: logo.website,
        last_updated: logo.lastUpdated,
        is_active: logo.isActive
      })
  }
  
  console.log('✅ Competitor logos force updated successfully')
  return updatedLogos
}
