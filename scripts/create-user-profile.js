/**
 * Create user profile for existing auth user
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createUserProfile(userId, email, fullName) {
  console.log(`🔧 Creating user profile for: ${userId}\n`)

  // Check if already exists
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existing) {
    console.log('✅ Profile already exists!')
    return existing
  }

  // Create profile (user_profiles doesn't have email column)
  // Use RPC or direct insert - try with minimal fields first
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      full_name: fullName || '',
      user_type: 'client'
    })
    .select()
    .single()

  if (error) {
    console.log('❌ Error:', error.message)
    console.log('   Code:', error.code)
    console.log('   Details:', error.details)
    console.log('   Hint:', error.hint)
    
    // If it's a foreign key issue, the auth user might not exist
    if (error.code === '23503') {
      console.log('\n⚠️  Foreign key constraint failed - checking if auth user exists...')
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const authUser = authUsers.users.find(u => u.id === userId)
      if (!authUser) {
        console.log('❌ Auth user does not exist!')
      } else {
        console.log('✅ Auth user exists:', authUser.email)
        console.log('   This might be a permissions issue with the service role key')
      }
    }
    return null
  }

  console.log('✅ Profile created successfully!')
  console.log('   ID:', profile.id)
  console.log('   Email:', profile.email)
  console.log('   User Type:', profile.user_type)
  return profile
}

// Run
const userId = process.argv[2] || 'b49ed546-a9e0-46d0-977d-f02ffc3ec19e'
const email = process.argv[3] || 'nathaniel.crowell12+testclient@gmail.com'
const name = process.argv[4] || 'Natey McNateface'

createUserProfile(userId, email, name).catch(console.error)

