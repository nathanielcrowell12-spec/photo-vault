/**
 * Check if user profile already exists
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkExistingUser(email) {
  console.log(`🔍 Checking for existing user: ${email}\n`)
  console.log('='.repeat(60))

  // 1. Check auth.users
  console.log('\n1️⃣ Auth Users:')
  console.log('-'.repeat(60))
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const matchingAuthUsers = authUsers.users.filter(u => u.email === email.toLowerCase())
  
  if (matchingAuthUsers.length === 0) {
    console.log('❌ No auth users found')
  } else {
    console.log(`✅ Found ${matchingAuthUsers.length} auth user(s):`)
    for (let i = 0; i < matchingAuthUsers.length; i++) {
      const user = matchingAuthUsers[i]
      console.log(`\n   User ${i + 1}:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      
      // Check if profile exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      if (profile) {
        console.log(`   ✅ Profile exists:`)
        console.log(`      User Type: ${profile.user_type}`)
        console.log(`      Full Name: ${profile.full_name}`)
      } else {
        console.log(`   ❌ Profile does NOT exist`)
      }
    }
  }

  // 2. Check clients table
  console.log('\n2️⃣ Clients Table:')
  console.log('-'.repeat(60))
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, email, name, user_id, photographer_id, created_at')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false })

  if (clientError) {
    console.log('❌ Error:', clientError.message)
  } else if (!clients || clients.length === 0) {
    console.log('❌ No clients found')
  } else {
    console.log(`✅ Found ${clients.length} client record(s):`)
    clients.forEach((client, i) => {
      console.log(`\n   Client ${i + 1}:`)
      console.log(`   ID: ${client.id}`)
      console.log(`   Name: ${client.name}`)
      console.log(`   Email: ${client.email}`)
      console.log(`   User ID: ${client.user_id || 'NULL (not linked)'}`)
      console.log(`   Photographer ID: ${client.photographer_id}`)
      console.log(`   Created: ${client.created_at}`)
    })
  }

  // 3. Check user_profiles
  console.log('\n3️⃣ User Profiles:')
  console.log('-'.repeat(60))
  if (matchingAuthUsers.length > 0) {
    for (const authUser of matchingAuthUsers) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (profileError) {
        console.log(`❌ Error checking profile for ${authUser.id}:`, profileError.message)
      } else if (profile) {
        console.log(`✅ Profile exists for ${authUser.id}:`)
        console.log(`   User Type: ${profile.user_type}`)
        console.log(`   Full Name: ${profile.full_name}`)
        console.log(`   Created: ${profile.created_at}`)
      } else {
        console.log(`❌ No profile for ${authUser.id}`)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
}

// Run
const email = process.argv[2] || 'nathaniel.crowell12+testclient@gmail.com'
checkExistingUser(email).catch(console.error)

