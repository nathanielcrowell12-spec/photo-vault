const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanupOrphanedPhotos() {
  try {
    console.log('🧹 Starting cleanup of orphaned photos...')
    
    // Get all files in the photos bucket
    const { data: files, error: listError } = await supabase.storage
      .from('photos')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (listError) {
      console.error('Error listing files:', listError)
      return
    }
    
    console.log(`Found ${files.length} files in storage`)
    
    // Get all gallery IDs that exist in the database
    const { data: galleries, error: galleryError } = await supabase
      .from('galleries')
      .select('id')
    
    if (galleryError) {
      console.error('Error fetching galleries:', galleryError)
      return
    }
    
    const validGalleryIds = new Set(galleries.map(g => g.id))
    console.log(`Found ${validGalleryIds.size} valid galleries in database`)
    
    // Find orphaned files (files in storage but no corresponding gallery)
    const orphanedFiles = []
    
    for (const file of files) {
      // Skip if it's a folder
      if (file.metadata?.mimetype === 'application/octet-stream' && file.name === '') {
        continue
      }
      
      // Extract gallery ID from path (assuming format: userId/galleryId/filename)
      const pathParts = file.name.split('/')
      if (pathParts.length >= 2) {
        const galleryId = pathParts[1]
        
        // Check if this gallery ID exists in the database
        if (!validGalleryIds.has(galleryId)) {
          orphanedFiles.push(file.name)
        }
      }
    }
    
    console.log(`Found ${orphanedFiles.length} orphaned files`)
    
    if (orphanedFiles.length === 0) {
      console.log('✅ No orphaned files found. Storage is clean!')
      return
    }
    
    // Show what we're about to delete
    console.log('\n📋 Orphaned files to delete:')
    orphanedFiles.forEach(file => console.log(`  - ${file}`))
    
    // Delete orphaned files
    console.log('\n🗑️  Deleting orphaned files...')
    
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from('photos')
      .remove(orphanedFiles)
    
    if (deleteError) {
      console.error('Error deleting files:', deleteError)
      return
    }
    
    console.log(`✅ Successfully deleted ${deleteData.length} orphaned files`)
    
    // Also clean up any orphaned gallery_photos records
    console.log('\n🧹 Cleaning up orphaned gallery_photos records...')
    
    const { error: photoCleanupError } = await supabase
      .from('gallery_photos')
      .delete()
      .not('gallery_id', 'in', `(${Array.from(validGalleryIds).join(',')})`)
    
    if (photoCleanupError) {
      console.error('Error cleaning gallery_photos:', photoCleanupError)
    } else {
      console.log('✅ Cleaned up orphaned gallery_photos records')
    }
    
    console.log('\n🎉 Cleanup complete!')
    
  } catch (error) {
    console.error('Cleanup failed:', error)
  }
}

// Run the cleanup
cleanupOrphanedPhotos()
