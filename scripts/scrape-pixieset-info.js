// Script to scrape Pixieset gallery information
const https = require('https')
const http = require('http')

async function scrapePixiesetGallery(galleryUrl, password) {
  try {
    console.log('🔍 Scraping Pixieset gallery information...\n')
    console.log('Gallery URL:', galleryUrl)
    console.log('Password:', password ? '***' : 'None')
    console.log('')

    // Parse the URL
    const url = new URL(galleryUrl)
    const hostname = url.hostname
    const path = url.pathname + (url.search || '')

    console.log('📡 Making request to:', hostname + path)
    console.log('')

    // Make HTTP request
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: hostname,
        path: path,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      }

      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }))
      })

      req.on('error', reject)
      req.end()
    })

    console.log('✅ Response received:', response.status)
    console.log('')

    // Parse the HTML to find dates
    const html = response.body

    // Look for various date patterns
    const datePatterns = [
      // ISO format: 2024-01-15
      /\d{4}-\d{2}-\d{2}/g,
      // US format: January 15, 2024
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
      // Short format: Jan 15, 2024
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/gi,
      // Timestamp format: 2024-01-15T10:00:00
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g
    ]

    console.log('🔎 Searching for dates in HTML...\n')

    const foundDates = new Set()
    datePatterns.forEach(pattern => {
      const matches = html.match(pattern)
      if (matches) {
        matches.forEach(date => foundDates.add(date))
      }
    })

    if (foundDates.size > 0) {
      console.log('📅 Found dates in the page:')
      Array.from(foundDates).forEach(date => {
        console.log('   -', date)
      })
      console.log('')
    } else {
      console.log('⚠️  No dates found in obvious places')
      console.log('')
    }

    // Look for meta tags
    console.log('🏷️  Checking meta tags...\n')
    const metaTags = html.match(/<meta[^>]+>/gi) || []
    const relevantMeta = metaTags.filter(tag => 
      tag.includes('date') || 
      tag.includes('published') || 
      tag.includes('created') ||
      tag.includes('modified')
    )

    if (relevantMeta.length > 0) {
      console.log('Found relevant meta tags:')
      relevantMeta.forEach(tag => {
        console.log('   ', tag.substring(0, 150))
      })
      console.log('')
    }

    // Look for JSON-LD structured data
    console.log('🔍 Checking for structured data...\n')
    const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
    
    if (jsonLdMatches) {
      console.log('Found structured data:')
      jsonLdMatches.forEach((match, i) => {
        try {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
          const data = JSON.parse(jsonContent)
          console.log(`\nStructured Data ${i + 1}:`)
          console.log(JSON.stringify(data, null, 2))
        } catch (e) {
          console.log(`   Error parsing structured data ${i + 1}`)
        }
      })
      console.log('')
    }

    // Look for gallery title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      console.log('📝 Page Title:', titleMatch[1])
      console.log('')
    }

    // Look for og:title or description
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
    if (ogTitleMatch) {
      console.log('🖼️  OG Title:', ogTitleMatch[1])
    }

    const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)
    if (ogDescMatch) {
      console.log('📄 OG Description:', ogDescMatch[1])
    }

    // Look for photo count
    const photoCountMatches = html.match(/(\d+)\s*(photo|image|picture)/gi)
    if (photoCountMatches) {
      console.log('\n📸 Photo references found:', photoCountMatches)
    }

    console.log('\n✅ Scraping complete!')
    console.log('\n💡 Next steps:')
    console.log('   1. If dates were found, we can use them')
    console.log('   2. If not, we\'ll need to authenticate with password')
    console.log('   3. Or extract dates from photo EXIF when importing')

  } catch (error) {
    console.error('❌ Error scraping gallery:', error.message)
  }
}

// Run the scraper
const galleryUrl = 'https://meadowlanemedia.pixieset.com/guestlogin/crowellcountryliving/?return=%2Fcrowellcountryliving%2F'
const password = 'crowell'

scrapePixiesetGallery(galleryUrl, password)

