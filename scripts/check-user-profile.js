/**
 * Check if user profile exists for auth user
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUserProfile(userId) {
  console.log(`🔍 Checking user profile for: ${userId}\n`)

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.log('❌ Error:', error.message)
    if (error.code === 'PGRST116') {
      console.log('⚠️  Profile does not exist - need to create it')
    }
    return null
  }

  if (profile) {
    console.log('✅ User profile found:')
    console.log('   ID:', profile.id)
    console.log('   Email:', profile.email)
    console.log('   User Type:', profile.user_type)
    console.log('   Full Name:', profile.full_name)
    console.log('   Created:', profile.created_at)
    return profile
  }

  return null
}

// Run
const userId = process.argv[2] || 'b49ed546-a9e0-46d0-977d-f02ffc3ec19e'
checkUserProfile(userId).catch(console.error)

