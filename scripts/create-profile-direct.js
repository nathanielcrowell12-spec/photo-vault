/**
 * Create user profile using direct SQL
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createProfileDirect(userId, fullName) {
  console.log(`🔧 Creating profile directly for: ${userId}\n`)

  // Try using RPC or raw SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO user_profiles (id, full_name, user_type, created_at, updated_at)
      VALUES ('${userId}', '${fullName}', 'client', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING *;
    `
  })

  if (error) {
    // RPC might not exist, try direct insert with minimal fields
    console.log('RPC failed, trying direct insert...')
    const { data: profile, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        full_name: fullName,
        user_type: 'client'
      })
      .select()
      .single()

    if (insertError) {
      console.log('❌ Direct insert also failed:', insertError.message)
      console.log('   Code:', insertError.code)
      console.log('   Details:', insertError.details)
      
      // Check if it's a constraint issue
      if (insertError.code === '23505') {
        console.log('\n✅ Profile might already exist (unique constraint)')
        // Try to fetch it
        const { data: existing } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (existing) {
          console.log('✅ Found existing profile:')
          console.log('   User Type:', existing.user_type)
          console.log('   Full Name:', existing.full_name)
          return existing
        }
      }
      return null
    }

    console.log('✅ Profile created!')
    return profile
  }

  console.log('✅ Profile created via RPC!')
  return data
}

// Run
const userId = process.argv[2] || 'b49ed546-a9e0-46d0-977d-f02ffc3ec19e'
const name = process.argv[3] || 'Natey McNateface'

createProfileDirect(userId, name).catch(console.error)

