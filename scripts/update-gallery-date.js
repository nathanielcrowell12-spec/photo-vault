// Script to update the gallery session date
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateGalleryDate() {
  try {
    console.log('📝 Updating gallery date...\n')
    
    // Find the user
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching users:', authError)
      return
    }
    
    const user = authUser.users.find(u => u.email === 'nathaniel.crowell12@gmail.com')
    
    if (!user) {
      console.error('❌ User not found')
      return
    }
    
    // Update the gallery - set session_date to null since we don't know the actual photoshoot date
    const { data, error } = await supabase
      .from('galleries')
      .update({
        session_date: null, // Clear the fake date
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('gallery_name', 'Crowell Country Living')
      .select()
    
    if (error) {
      console.error('❌ Error updating gallery:', error)
      return
    }
    
    console.log('✅ Gallery updated successfully!')
    console.log('   - Session date removed (was showing Jan 2024)')
    console.log('   - Gallery will now show connection date instead')
    console.log('\n💡 When photos are imported, we can extract the actual photo dates')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updateGalleryDate().catch(console.error)
