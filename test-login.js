// Test script to verify Supabase login
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING')
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin() {
  const email = 'nathaniel.crowell12@gmail.com'
  const password = process.argv[2] // Pass password as command line argument

  if (!password) {
    console.error('\nUsage: node test-login.js <your-password>')
    process.exit(1)
  }

  console.log('\nAttempting login for:', email)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('\n❌ Login failed!')
      console.error('Error:', error.message)
      console.error('Status:', error.status)
      console.error('Full error:', JSON.stringify(error, null, 2))
    } else {
      console.log('\n✅ Login successful!')
      console.log('User ID:', data.user.id)
      console.log('Email:', data.user.email)
      console.log('Session expires at:', new Date(data.session.expires_at * 1000))
    }
  } catch (err) {
    console.error('\n❌ Unexpected error:', err)
  }
}

testLogin()
