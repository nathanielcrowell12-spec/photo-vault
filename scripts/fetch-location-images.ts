/**
 * Fetch Unsplash images for directory locations
 *
 * Usage:
 * 1. Get a free Unsplash API key from https://unsplash.com/developers
 * 2. Add UNSPLASH_ACCESS_KEY to your .env.local
 * 3. Run: npx tsx scripts/fetch-location-images.ts
 */

import { createClient } from '@supabase/supabase-js'

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!UNSPLASH_ACCESS_KEY) {
  console.error('❌ Missing UNSPLASH_ACCESS_KEY in environment')
  console.log('\nTo get a free API key:')
  console.log('1. Go to https://unsplash.com/developers')
  console.log('2. Click "New Application"')
  console.log('3. Accept terms and create app')
  console.log('4. Copy your "Access Key"')
  console.log('5. Add to .env.local: UNSPLASH_ACCESS_KEY=your_key_here')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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
  links: {
    html: string
  }
}

interface UnsplashSearchResult {
  total: number
  results: UnsplashPhoto[]
}

async function searchUnsplash(query: string): Promise<UnsplashPhoto | null> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
    }
  })

  if (!response.ok) {
    console.error(`Unsplash API error: ${response.status}`)
    return null
  }

  const data: UnsplashSearchResult = await response.json()
  return data.results[0] || null
}

// Search terms optimized for each location (broader terms for better Unsplash matches)
const locationSearchTerms: Record<string, string> = {
  'wisconsin-state-capitol': 'Wisconsin State Capitol Madison',
  'uw-madison-arboretum': 'UW Madison Arboretum forest trail',
  'memorial-union-terrace': 'lakeside terrace outdoor seating sunset chairs',
  'olbrich-botanical-gardens': 'botanical garden glass dome greenhouse tropical',
  'picnic-point': 'Picnic Point Madison Wisconsin lake',
  'tenney-park': 'park stone bridge autumn lake reflection',
  'vilas-park-zoo-area': 'zoo park lake scenic nature',
  'olin-park-olin-turville': 'Madison skyline sunset',
  'bassett-washington-warehouse-district': 'Madison Wisconsin urban brick alley',
  'madison-central-library': 'modern library interior windows',
  'alliant-energy-center-grounds': 'convention center grounds',
  'james-madison-park': 'green park lakefront bench summer',
  'monona-terrace-rooftop': 'Monona Terrace Madison architecture',
  'law-park-lake-monona-shoreline': 'wooden boardwalk lake waterfront downtown',
  'garver-feed-mill': 'Garver Feed Mill Madison brick',
  'henry-vilas-beach': 'Lake Wingra Madison beach',
  'capitol-square-state-street-loop': 'downtown pedestrian shopping street boutiques',
  'warner-park': 'baseball field stadium green sports',
  'bb-clarke-beach': 'Madison beach pier willow',
  'goodman-community-center-atwood-corridor': 'Atwood Madison mural bike path',
  'yahara-place-park-riverwalk': 'river walking path willow trees scenic',
  'burrows-park-boathouse': 'stone boathouse lake Mendota',
  'alliant-energy-center-willow-island': 'Lake Monona peninsula grass',
  'hilldale-shopping-center': 'outdoor shopping center string lights',
  'hoyt-park': 'stone shelter forest woods hiking trail',
  'lakeshore-nature-preserve-frautschi-point': 'Lake Mendota woodland nature',
  'elver-park': 'grassy hill park sledding winter family',
  'monona-bay-boardwalk': 'city boardwalk sunset skyline water',
  'pope-farm-conservancy': 'Pope Farm Conservancy sunflowers Middleton',
  'pheasant-branch-conservancy': 'nature preserve prairie trail wildflowers',
}

async function main() {
  console.log('🔍 Fetching locations from database...\n')

  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, slug, cover_image_url')
    .is('cover_image_url', null)

  if (error) {
    console.error('Database error:', error)
    process.exit(1)
  }

  if (!locations || locations.length === 0) {
    console.log('✅ All locations already have images!')
    return
  }

  console.log(`Found ${locations.length} locations without images\n`)

  let updated = 0
  let failed = 0

  for (const location of locations) {
    const searchTerm = locationSearchTerms[location.slug] || `${location.name} Madison Wisconsin`

    console.log(`📷 Searching for: ${location.name}`)
    console.log(`   Query: "${searchTerm}"`)

    const photo = await searchUnsplash(searchTerm)

    if (photo) {
      // Use the regular size (1080px width) - good balance of quality/speed
      const imageUrl = photo.urls.regular

      const { error: updateError } = await supabase
        .from('locations')
        .update({ cover_image_url: imageUrl })
        .eq('id', location.id)

      if (updateError) {
        console.log(`   ❌ Failed to update database: ${updateError.message}`)
        failed++
      } else {
        console.log(`   ✅ Found: ${photo.user.name} (@${photo.user.username})`)
        console.log(`   📸 ${imageUrl.substring(0, 60)}...`)
        updated++
      }
    } else {
      console.log(`   ⚠️ No image found`)
      failed++
    }

    // Rate limit: Unsplash allows 50 requests/hour for demo apps
    await new Promise(resolve => setTimeout(resolve, 1500))
    console.log('')
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Updated: ${updated} locations`)
  console.log(`❌ Failed: ${failed} locations`)
  console.log('='.repeat(50))

  if (updated > 0) {
    console.log('\n📝 Note: Unsplash requires attribution.')
    console.log('Consider adding photo credits to your site footer or image captions.')
  }
}

main().catch(console.error)
