// Check if storage buckets are set up
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkBuckets() {
  try {
    console.log('🔍 Checking storage buckets...\n')
    
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    console.log(`Found ${buckets.length} storage bucket(s):\n`)
    
    const photoBucket = buckets.find(b => b.id === 'photos')
    const thumbBucket = buckets.find(b => b.id === 'thumbnails')
    
    if (photoBucket) {
      console.log('✅ "photos" bucket exists')
      console.log('   - Public:', photoBucket.public)
      console.log('   - Created:', photoBucket.created_at)
    } else {
      console.log('❌ "photos" bucket NOT found')
    }
    
    if (thumbBucket) {
      console.log('✅ "thumbnails" bucket exists')
      console.log('   - Public:', thumbBucket.public)
      console.log('   - Created:', thumbBucket.created_at)
    } else {
      console.log('❌ "thumbnails" bucket NOT found')
    }
    
    console.log('\n' + '='.repeat(50))
    
    if (photoBucket && thumbBucket) {
      console.log('🎉 Storage is ready! You can now import photos.')
    } else {
      console.log('⚠️  Some buckets are missing. Please create them.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkBuckets()

