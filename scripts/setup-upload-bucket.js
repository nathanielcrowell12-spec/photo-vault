require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupBucket() {
  console.log('🔍 Checking existing buckets...')
  
  // List all buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError)
    return
  }
  
  console.log('📦 Existing buckets:')
  buckets.forEach(bucket => {
    console.log(`  - ${bucket.name} (public: ${bucket.public}, allowed MIME types: ${bucket.allowed_mime_types || 'all'})`)
  })
  
  // Check if gallery-imports bucket exists
  const galleryImportsBucket = buckets.find(b => b.name === 'gallery-imports')
  
  if (!galleryImportsBucket) {
    console.log('\n📝 Creating gallery-imports bucket...')
    const { data, error} = await supabase.storage.createBucket('gallery-imports', {
      public: false
    })
    
    if (error) {
      console.error('❌ Error creating bucket:', error)
    } else {
      console.log('✅ gallery-imports bucket created successfully!')
    }
  } else {
    console.log('\n✅ gallery-imports bucket already exists')
  }
}

setupBucket()

