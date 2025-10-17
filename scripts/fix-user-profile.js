// Manually create user profile for existing auth user
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixUserProfile(email, fullName, userType = 'client') {
  console.log('🔧 Fixing user profile for:', email)
  console.log('')

  // 1. Get user ID from auth
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const authUser = authUsers.users.find(u => u.email === email)

  if (!authUser) {
    console.error('❌ User not found in auth.users table')
    return
  }

  console.log('✅ Found user in auth:')
  console.log('   ID:', authUser.id)
  console.log('   Email:', authUser.email)
  console.log('')

  // 2. Check if profile exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (existingProfile) {
    console.log('✅ Profile already exists - updating...')
    
    const updateData = {
      user_type: userType,
      full_name: fullName,
      payment_status: 'admin_bypass',
      last_payment_date: new Date().toISOString(),
      subscription_start_date: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', authUser.id)

    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message)
      return
    }

    console.log('✅ Profile updated successfully!')
  } else {
    console.log('⚠️  Profile missing - creating...')
    
    const profileData = {
      id: authUser.id,
      user_type: userType,
      full_name: fullName,
      payment_status: 'admin_bypass',
      last_payment_date: new Date().toISOString(),
      subscription_start_date: new Date().toISOString()
    }

    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert(profileData)

    if (insertError) {
      console.error('❌ Error creating profile:', insertError.message)
      console.error('   Details:', insertError)
      return
    }

    console.log('✅ Profile created successfully!')
  }

  // 3. Verify
  console.log('')
  console.log('🔍 Verifying...')
  
  const { data: verifyProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (verifyProfile) {
    console.log('✅ Profile verified:')
    console.log('   User Type:', verifyProfile.user_type)
    console.log('   Full Name:', verifyProfile.full_name)
    console.log('   Payment Status:', verifyProfile.payment_status)
    console.log('')
    console.log('🎉 All set! You can now log in and access the dashboard.')
  } else {
    console.log('❌ Profile verification failed')
  }
}

// Run the fix
const email = process.argv[2] || 'nathaniel.crowell12@gmail.com'
const fullName = process.argv[3] || 'Nathaniel Crowell'
const userType = process.argv[4] || 'client'

fixUserProfile(email, fullName, userType)

