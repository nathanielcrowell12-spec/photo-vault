// Check import status
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkImportStatus() {
  try {
    console.log('🔍 Checking import status...\n')
    
    // Get gallery
    const { data: galleries, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('gallery_name', 'Crowell Country Living')
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    if (!galleries || galleries.length === 0) {
      console.log('❌ Gallery not found')
      return
    }
    
    const gallery = galleries[0]
    
    console.log('📊 Gallery Status:')
    console.log('   - Name:', gallery.gallery_name)
    console.log('   - Platform:', gallery.platform)
    console.log('   - Photo Count:', gallery.photo_count)
    console.log('   - Is Imported:', gallery.is_imported)
    console.log('   - Import Started:', gallery.import_started_at || 'Never')
    console.log('   - Import Completed:', gallery.import_completed_at || 'Not yet')
    console.log('')
    
    // Check if any photos were imported
    const { data: photos, error: photoError } = await supabase
      .from('gallery_photos')
      .select('id, original_filename, created_at')
      .eq('gallery_id', gallery.id)
    
    if (photoError) {
      console.error('❌ Error fetching photos:', photoError)
      return
    }
    
    console.log(`📸 Found ${photos?.length || 0} photos imported\n`)
    
    if (photos && photos.length > 0) {
      console.log('First 5 photos:')
      photos.slice(0, 5).forEach((photo, i) => {
        console.log(`   ${i + 1}. ${photo.original_filename} (${photo.created_at})`)
      })
    } else {
      console.log('⚠️  No photos imported yet')
      console.log('\nPossible reasons:')
      console.log('   1. Import is still in progress (check server logs)')
      console.log('   2. Pixieset API authentication failed')
      console.log('   3. API endpoint format is incorrect')
      console.log('   4. Network/CORS issues')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkImportStatus()

