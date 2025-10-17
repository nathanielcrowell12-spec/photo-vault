// Check if user exists in Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUser(email) {
  console.log('🔍 Checking for user:', email)
  console.log('')

  // Check auth.users table
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('❌ Error fetching auth users:', authError.message)
  } else {
    const authUser = authUsers.users.find(u => u.email === email)
    if (authUser) {
      console.log('✅ Found in auth.users table:')
      console.log('   ID:', authUser.id)
      console.log('   Email:', authUser.email)
      console.log('   Created:', authUser.created_at)
      console.log('   Email Confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No')
      console.log('')
    } else {
      console.log('❌ NOT found in auth.users table')
      console.log('')
    }
  }

  // Check user_profiles table
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    
  if (profileError) {
    console.error('❌ Error fetching user_profiles:', profileError.message)
  } else {
    console.log('📊 All users in user_profiles table:')
    if (profiles && profiles.length > 0) {
      profiles.forEach(profile => {
        console.log(`   - ${profile.business_name || profile.full_name || 'No name'} (${profile.user_type})`)
      })
      console.log('')
      
      // Check for specific user
      const userProfile = profiles.find(p => {
        // Since we don't have email in user_profiles, check by name
        return p.business_name?.toLowerCase().includes('nathaniel') || 
               p.full_name?.toLowerCase().includes('nathaniel')
      })
      
      if (userProfile) {
        console.log('✅ Found profile for Nathaniel:')
        console.log('   ID:', userProfile.id)
        console.log('   Name:', userProfile.business_name || userProfile.full_name)
        console.log('   Type:', userProfile.user_type)
        console.log('   Created:', userProfile.created_at)
      } else {
        console.log('❌ No profile found matching "nathaniel"')
      }
    } else {
      console.log('   (No users found in user_profiles table)')
    }
  }

  console.log('')
  console.log('💡 To check all users:')
  console.log('   Visit: https://app.supabase.com/project/gqmycgopitxpjkxzrnyv/auth/users')
}

// Check for the specific email
const email = process.argv[2] || 'nathaniel.crowell12@gmail.com'
checkUser(email)

