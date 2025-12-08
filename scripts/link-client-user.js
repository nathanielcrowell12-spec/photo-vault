/**
 * Link existing client to user account
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function linkClientUser(clientEmail) {
  console.log('🔗 Linking client to user account\n')
  console.log('='.repeat(60))

  // 1. Find client
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, email, name, user_id')
    .eq('email', clientEmail)
    .limit(1)

  if (clientError || !clients || clients.length === 0) {
    console.log('❌ Client not found:', clientEmail)
    return
  }

  const client = clients[0]
  console.log(`✅ Found client: ${client.name} (${client.email})`)
  console.log(`   Current user_id: ${client.user_id || 'NULL'}`)

  // 2. Find user by email
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const authUser = authUsers.users.find(u => u.email === clientEmail.toLowerCase())

  if (!authUser) {
    console.log('❌ Auth user not found for email:', clientEmail)
    return
  }

  console.log(`✅ Found auth user: ${authUser.id}`)
  console.log(`   Created: ${authUser.created_at}`)

  // 3. Link them
  if (client.user_id === authUser.id) {
    console.log('✅ Already linked!')
    return
  }

  const { error: updateError } = await supabase
    .from('clients')
    .update({ user_id: authUser.id })
    .eq('id', client.id)

  if (updateError) {
    console.log('❌ Error linking:', updateError.message)
    return
  }

  console.log('✅ Successfully linked!')
  console.log(`   Client ID: ${client.id}`)
  console.log(`   User ID: ${authUser.id}`)
}

// Run
const email = process.argv[2] || 'nathaniel.crowell12+testclient@gmail.com'
linkClientUser(email).catch(console.error)

