/**
 * Test script to verify profile creation works after SECURITY DEFINER fix
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testProfileCreation() {
  const testEmail = 'nathaniel.crowell12+fartymcgee@gmail.com'
  const testUserId = '364d4cfb-13d5-4a57-a7db-826dd20c7ba5'
  const testName = 'Farty McGee'

  console.log('🧪 Testing profile creation with SECURITY DEFINER fix\n')
  console.log(`Email: ${testEmail}`)
  console.log(`User ID: ${testUserId}`)
  console.log(`Name: ${testName}\n`)

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', testUserId)
    .single()

  if (existingProfile) {
    console.log('✅ Profile already exists:')
    console.log(JSON.stringify(existingProfile, null, 2))
    return
  }

  console.log('📝 Attempting to create profile...\n')

  // Try to create profile
  const { data: newProfile, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: testUserId,
      full_name: testName,
      user_type: 'client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (profileError) {
    console.error('❌ Error creating profile:')
    console.error(JSON.stringify(profileError, null, 2))
    return
  }

  console.log('✅ Profile created successfully!')
  console.log(JSON.stringify(newProfile, null, 2))

  // Check if client was linked
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('email', testEmail)
    .single()

  if (client) {
    console.log('\n📋 Client record:')
    console.log(`  User ID: ${client.user_id}`)
    console.log(`  Linked: ${client.user_id === testUserId ? '✅ YES' : '❌ NO'}`)
  }
}

testProfileCreation().catch(console.error)

