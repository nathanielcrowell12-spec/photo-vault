// Fix RLS policies for user_profiles table
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for user_profiles table...')
  console.log('')

  const sqlFile = path.join(__dirname, '..', 'database', 'fix-user-profiles-rls.sql')
  const sql = fs.readFileSync(sqlFile, 'utf8')

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    console.error('❌ Error executing SQL:', error.message)
    console.log('')
    console.log('📋 Please run this SQL manually in Supabase SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/gqmycgopitxpjkxzrnyv/sql/new')
    console.log('')
    console.log(sql)
  } else {
    console.log('✅ RLS policies updated successfully!')
    console.log('')
    console.log('Try logging in again at http://localhost:3000/login')
  }
}

fixRLSPolicies()
