// Quick test to verify Supabase API key is valid
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase API Key...\n')
console.log('URL:', supabaseUrl)
console.log('Key (first 30 chars):', supabaseAnonKey?.substring(0, 30) + '...')
console.log('Key length:', supabaseAnonKey?.length || 0)
console.log('')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simple test - try to get auth session (should work even without being signed in)
async function testKey() {
  try {
    console.log('Testing API key by checking auth status...')
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        console.error('❌ INVALID API KEY')
        console.error('   Error:', error.message)
        console.error('\n💡 Solution:')
        console.error('   1. Go to: https://supabase.com/dashboard/project/gqmycgopitxpjkxzrnyv/settings/api')
        console.error('   2. Copy the "anon/public" key')
        console.error('   3. Update NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
      } else {
        console.error('❌ Error:', error.message)
      }
      process.exit(1)
    } else {
      console.log('✅ API Key is valid!')
      console.log('   Session status:', data.session ? 'Has session' : 'No session (expected)')
      process.exit(0)
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    process.exit(1)
  }
}

testKey()



