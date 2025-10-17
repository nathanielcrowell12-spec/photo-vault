// Fetch photos from Pixieset gallery using HTML scraping
const https = require('https')
const http = require('http')

async function fetchPixiesetGallery(subdomain, gallerySlug, password) {
  console.log('🔍 Fetching Pixieset gallery...\n')
  
  // Step 1: Load the guest login page
  const guestLoginUrl = `https://${subdomain}.pixieset.com/guestlogin/${gallerySlug}/`
  console.log('📡 Step 1: Loading guest login page...')
  console.log('   URL:', guestLoginUrl)
  
  const loginPage = await makeRequest(guestLoginUrl, 'GET')
  console.log('   Status:', loginPage.status)
  
  if (loginPage.status !== 200) {
    console.log('❌ Failed to load guest login page')
    return null
  }
  
  // Step 2: Extract CSRF token and form data from the page
  console.log('\n📋 Step 2: Analyzing page structure...')
  
  const html = loginPage.body
  
  // Look for CSRF token
  const csrfMatch = html.match(/name=["\']_token["\'] value=["\']([^"\']+)["\']/) ||
                    html.match(/csrf[_-]?token["\']?\s*[:=]\s*["\']([^"\']+)["\']/)
  
  const csrfToken = csrfMatch ? csrfMatch[1] : null
  console.log('   CSRF Token:', csrfToken ? 'Found ✅' : 'Not found')
  
  // Look for form action
  const formMatch = html.match(/action=["\']([^"\']*)["\']/)
  console.log('   Form Action:', formMatch ? formMatch[1] : 'Not found')
  
  // Look for photo data in JavaScript
  console.log('\n🔎 Step 3: Looking for photo data in page...')
  
  // Pixieset often embeds data in window.__INITIAL_STATE__ or similar
  const patterns = [
    /window\.__INITIAL_STATE__\s*=\s*({[^;]+});/,
    /var\s+photos\s*=\s*(\[[^\]]+\]);/,
    /photoData\s*=\s*({[^;]+});/,
    /"photos":\s*(\[[^\]]+\])/,
    /GALLERY_DATA\s*=\s*({[^;]+});/
  ]
  
  let photoData = null
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      try {
        photoData = JSON.parse(match[1])
        console.log('   ✅ Found photo data in JavaScript!')
        console.log('   Pattern matched:', pattern.source.substring(0, 50) + '...')
        break
      } catch (e) {
        // JSON parse failed, continue
      }
    }
  }
  
  if (!photoData) {
    console.log('   ⚠️  Photo data not found in obvious JavaScript variables')
    console.log('   Trying to find individual image URLs...')
    
    // Look for image URLs in the HTML
    const imgMatches = html.match(/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/g) || []
    const photoUrls = imgMatches
      .map(img => {
        const match = img.match(/src=["\']([^"\']+)["\']/)
        return match ? match[1] : null
      })
      .filter(url => url && (url.includes('pixieset') || url.startsWith('http')))
      .filter(url => !url.includes('logo') && !url.includes('icon'))
    
    console.log(`   Found ${photoUrls.length} potential photo URLs`)
    
    if (photoUrls.length > 0) {
      console.log('\n   Sample URLs:')
      photoUrls.slice(0, 3).forEach((url, i) => {
        console.log(`   ${i + 1}. ${url.substring(0, 80)}...`)
      })
    }
  }
  
  // Step 3: Submit password form
  if (password) {
    console.log('\n🔐 Step 4: Attempting password authentication...')
    console.log('   This would require form submission and cookie handling')
    console.log('   (Skipping for now - we have the guest login page)')
  }
  
  console.log('\n✅ Analysis complete!')
  console.log('\n📝 Summary:')
  console.log('   - Guest login page: ✅ Accessible')
  console.log('   - Photo data in JS:', photoData ? '✅ Found' : '❌ Not found')
  console.log('   - Image URLs:', photoUrls && photoUrls.length > 0 ? `✅ Found ${photoUrls.length}` : '❌ Not found')
  
  return {
    html,
    photoData,
    photoUrls: photoUrls || []
  }
}

function makeRequest(url, method, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...headers
      }
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body)
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        })
      })
    })

    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

// Test with your gallery
fetchPixiesetGallery('meadowlanemedia', 'crowellcountryliving', 'crowell')

