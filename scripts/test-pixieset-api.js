// Test script to probe Pixieset API endpoints
const https = require('https')

const galleryUrl = 'https://meadowlanemedia.pixieset.com/guestlogin/crowellcountryliving/?return=%2Fcrowellcountryliving%2F'
const password = 'crowell'
const subdomain = 'meadowlanemedia'
const gallerySlug = 'crowellcountryliving'

async function testPixiesetAPI() {
  console.log('🧪 Testing Pixieset API Endpoints\n')
  console.log('Gallery:', subdomain + '/' + gallerySlug)
  console.log('Password:', password)
  console.log('\n' + '='.repeat(60) + '\n')

  // Test 1: Try the galleries.pixieset.com API
  console.log('Test 1: Trying galleries.pixieset.com API...\n')
  
  const endpoints = [
    {
      name: 'Gallery Info',
      url: `https://galleries.pixieset.com/api/v1/galleries/${subdomain}/${gallerySlug}`,
      method: 'GET'
    },
    {
      name: 'Gallery Auth',
      url: `https://galleries.pixieset.com/api/v1/galleries/${subdomain}/${gallerySlug}/authenticate`,
      method: 'POST',
      body: JSON.stringify({ password: password })
    },
    {
      name: 'Photos List',
      url: `https://galleries.pixieset.com/api/v1/galleries/${subdomain}/${gallerySlug}/photos`,
      method: 'GET'
    },
    {
      name: 'Direct Gallery URL',
      url: `https://${subdomain}.pixieset.com/${gallerySlug}`,
      method: 'GET'
    },
    {
      name: 'Guest Login URL',
      url: `https://${subdomain}.pixieset.com/guestlogin/${gallerySlug}/`,
      method: 'GET'
    }
  ]

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint)
    console.log('\n' + '-'.repeat(60) + '\n')
  }

  console.log('\n✅ API testing complete!')
  console.log('\n💡 Next steps:')
  console.log('   - Check which endpoints returned 200 OK')
  console.log('   - Look for JSON responses with photo data')
  console.log('   - Update the PixiesetClient with correct endpoints')
}

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    console.log(`📡 ${endpoint.name}`)
    console.log(`   URL: ${endpoint.url}`)
    console.log(`   Method: ${endpoint.method}`)

    const url = new URL(endpoint.url)
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/html, */*',
        'Content-Type': 'application/json'
      }
    }

    if (endpoint.body) {
      options.headers['Content-Length'] = Buffer.byteLength(endpoint.body)
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`)
        console.log(`   Content-Type: ${res.headers['content-type']}`)
        
        if (res.headers['set-cookie']) {
          console.log(`   Cookies: ${res.headers['set-cookie'].join(', ')}`)
        }
        
        // Try to parse as JSON
        try {
          const json = JSON.parse(data)
          console.log('   Response (JSON):')
          console.log(JSON.stringify(json, null, 2).split('\n').slice(0, 20).join('\n'))
          if (JSON.stringify(json).length > 1000) {
            console.log('   ... (truncated)')
          }
        } catch {
          console.log(`   Response (text, first 300 chars):`)
          console.log('   ' + data.substring(0, 300).replace(/\n/g, '\n   '))
          if (data.length > 300) console.log('   ... (truncated)')
        }
        
        resolve()
      })
    })

    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`)
      resolve()
    })

    if (endpoint.body) {
      req.write(endpoint.body)
    }
    
    req.end()
  })
}

testPixiesetAPI()

