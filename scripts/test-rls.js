// Test RLS policies for galleries
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Test with ANON key (what the client uses)
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Test with SERVICE key (bypasses RLS)
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testRLS() {
  try {
    console.log('🔍 Testing RLS policies...\n')
    
    const testEmail = 'nathaniel.crowell12@gmail.com'
    const testPassword = 'EAsyrider12'
    
    // Sign in with anon client
    console.log('1️⃣ Signing in with anon client...')
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (authError) {
      console.error('❌ Auth error:', authError.message)
      return
    }
    
    console.log('✅ Signed in as:', authData.user.email)
    console.log('   User ID:', authData.user.id)
    console.log('')
    
    // Try to fetch galleries with anon client (this is what the app does)
    console.log('2️⃣ Fetching galleries with ANON client (with auth)...')
    const { data: anonGalleries, error: anonError } = await supabaseAnon
      .from('galleries')
      .select('*')
      .eq('user_id', authData.user.id)
    
    if (anonError) {
      console.error('❌ Error with anon client:', anonError.message)
      console.error('   Code:', anonError.code)
      console.error('   Details:', anonError.details)
      console.error('   Hint:', anonError.hint)
    } else {
      console.log(`✅ Anon client returned ${anonGalleries?.length || 0} galleries`)
      if (anonGalleries && anonGalleries.length > 0) {
        console.log('   First gallery:', anonGalleries[0].gallery_name)
      }
    }
    console.log('')
    
    // Try to fetch galleries with service client (bypasses RLS)
    console.log('3️⃣ Fetching galleries with SERVICE client (bypasses RLS)...')
    const { data: serviceGalleries, error: serviceError } = await supabaseService
      .from('galleries')
      .select('*')
      .eq('user_id', authData.user.id)
    
    if (serviceError) {
      console.error('❌ Error with service client:', serviceError.message)
    } else {
      console.log(`✅ Service client returned ${serviceGalleries?.length || 0} galleries`)
    }
    console.log('')
    
    // Check RLS status
    console.log('4️⃣ Checking RLS policy status...')
    const { data: policies, error: policyError } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'galleries')
    
    if (policyError) {
      console.log('   Could not check policies (table may not be accessible)')
    } else if (policies) {
      console.log(`   Found ${policies.length} policies on galleries table:`)
      policies.forEach(p => {
        console.log(`   - ${p.policyname}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testRLS()



