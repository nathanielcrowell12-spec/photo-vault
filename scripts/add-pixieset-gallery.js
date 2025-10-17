// Script to add the Pixieset gallery to the database
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addPixiesetGallery() {
  try {
    console.log('🔍 Adding Pixieset gallery...\n')
    
    // Find the user
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching users:', authError)
      return
    }
    
    const user = authUser.users.find(u => u.email === 'nathaniel.crowell12@gmail.com')
    
    if (!user) {
      console.error('❌ User not found: nathaniel.crowell12@gmail.com')
      return
    }
    
    console.log('✅ User found:')
    console.log('   - ID:', user.id)
    console.log('   - Email:', user.email)
    console.log('')
    
    // Gallery data
    const galleryData = {
      user_id: user.id,
      gallery_name: 'Crowell Country Living',
      gallery_description: 'Family photos from Meadow Lane Media',
      cover_image_url: '/images/placeholder-family.svg',
      platform: 'Pixieset',
      photographer_name: 'Meadow Lane Media',
      session_date: '2024-01-15',
      photo_count: 150, // This will be updated when we actually fetch the photos
      gallery_url: 'https://meadowlanemedia.pixieset.com/guestlogin/crowellcountryliving/?return=%2Fcrowellcountryliving%2F',
      gallery_password: 'crowell', // In production, this should be encrypted
      is_imported: false
    }
    
    console.log('📝 Inserting gallery into database...\n')
    
    // Insert the gallery
    const { data: gallery, error: insertError } = await supabase
      .from('galleries')
      .insert(galleryData)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Error inserting gallery:', insertError.message)
      console.log('\n💡 Make sure to run the galleries-table.sql script first!')
      console.log('   Go to Supabase SQL Editor and paste the contents of:')
      console.log('   database/galleries-table.sql')
      return
    }
    
    console.log('✅ Gallery created successfully!')
    console.log('   - Gallery ID:', gallery.id)
    console.log('   - Name:', gallery.gallery_name)
    console.log('   - Platform:', gallery.platform)
    console.log('   - URL:', gallery.gallery_url)
    console.log('   - Photo Count:', gallery.photo_count)
    console.log('\n🎉 You should now see the gallery when you log in!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

addPixiesetGallery()

