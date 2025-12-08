/**
 * Fetch Unsplash images for landing page
 *
 * Run with: npx tsx scripts/fetch-landing-images.ts
 */

import 'dotenv/config'

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

if (!UNSPLASH_ACCESS_KEY) {
  console.error('Missing UNSPLASH_ACCESS_KEY in .env.local')
  process.exit(1)
}

interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  user: {
    name: string
    username: string
  }
  alt_description: string | null
}

interface ImageSlot {
  name: string
  query: string
  orientation: 'landscape' | 'portrait' | 'squarish'
  purpose: string
}

// Image slots based on UI/UX expert recommendations
const imageSlots: ImageSlot[] = [
  {
    name: 'hero_photographer',
    query: 'professional female photographer camera portrait smiling',
    orientation: 'landscape',
    purpose: 'Hero section - photographer holding camera'
  },
  {
    name: 'avatar_1',
    query: 'professional woman portrait headshot natural',
    orientation: 'squarish',
    purpose: 'Testimonial avatar 1'
  },
  {
    name: 'avatar_2',
    query: 'professional man portrait headshot natural',
    orientation: 'squarish',
    purpose: 'Testimonial avatar 2'
  },
  {
    name: 'avatar_hannah',
    query: 'woman photographer professional portrait friendly',
    orientation: 'squarish',
    purpose: 'Hannah - Wedding Photographer testimonial'
  },
  {
    name: 'avatar_sarah',
    query: 'woman portrait photographer creative professional',
    orientation: 'squarish',
    purpose: 'Sarah - Portrait Photographer testimonial'
  }
]

async function searchUnsplash(query: string, orientation: string): Promise<UnsplashPhoto | null> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=${orientation}`

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    })

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      return data.results[0]
    }

    return null
  } catch (error) {
    console.error('Error searching Unsplash:', error)
    return null
  }
}

async function main() {
  console.log('🖼️  Fetching Unsplash images for landing page...\n')

  const results: Record<string, { url: string; attribution: string }> = {}

  for (const slot of imageSlots) {
    console.log(`Searching for: ${slot.name}`)
    console.log(`  Query: "${slot.query}"`)

    const photo = await searchUnsplash(slot.query, slot.orientation)

    if (photo) {
      // Use 'regular' for hero, 'small' for avatars
      const url = slot.name.includes('avatar') ? photo.urls.small : photo.urls.regular

      results[slot.name] = {
        url,
        attribution: `Photo by ${photo.user.name} (@${photo.user.username}) on Unsplash`
      }

      console.log(`  ✅ Found: ${url.substring(0, 60)}...`)
      console.log(`  📷 ${results[slot.name].attribution}\n`)
    } else {
      console.log(`  ❌ No results found\n`)
    }

    // Rate limiting - wait 1.5 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  console.log('\n📋 RESULTS - Copy these URLs to landing-page.html:\n')
  console.log('=' .repeat(60))

  for (const [name, data] of Object.entries(results)) {
    console.log(`\n${name}:`)
    console.log(`  URL: ${data.url}`)
    console.log(`  Attribution: ${data.attribution}`)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('\n✅ Done! Remember to add Unsplash attribution to the footer.')
}

main().catch(console.error)
