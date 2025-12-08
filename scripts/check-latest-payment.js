/**
 * Check Latest Payment Results
 * Verifies the most recent public checkout payment
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkLatestPayment() {
  console.log('🔍 Checking Latest Payment Results\n')
  console.log('='.repeat(60))

  // 1. Get most recent paid gallery
  console.log('\n1️⃣ Most Recent Paid Gallery:')
  console.log('-'.repeat(60))
  
  const { data: recentGalleries, error: galleryError } = await supabase
    .from('photo_galleries')
    .select('id, gallery_name, photographer_id, client_id, payment_status, paid_at, stripe_payment_intent_id, total_amount, created_at')
    .eq('payment_status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(1)

  if (galleryError) {
    console.error('❌ Error:', galleryError.message)
    return
  }

  if (!recentGalleries || recentGalleries.length === 0) {
    console.log('❌ No paid galleries found')
    return
  }

  const gallery = recentGalleries[0]
  console.log(`✅ Gallery: ${gallery.gallery_name}`)
  console.log(`   ID: ${gallery.id}`)
  console.log(`   Paid At: ${gallery.paid_at}`)
  console.log(`   Payment Intent: ${gallery.stripe_payment_intent_id || 'None'}`)
  console.log(`   Total Amount: $${(gallery.total_amount || 0) / 100}`)

  // 2. Get client info
  if (gallery.client_id) {
    console.log('\n2️⃣ Client Information:')
    console.log('-'.repeat(60))
    
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, email, name, user_id')
      .eq('id', gallery.client_id)
      .single()

    if (clientError) {
      console.log('❌ Error fetching client:', clientError.message)
    } else if (client) {
      console.log(`✅ Client: ${client.name}`)
      console.log(`   Email: ${client.email}`)
      console.log(`   User ID: ${client.user_id || 'NOT LINKED'}`)

      // 3. Check if user account exists
      if (client.user_id) {
        console.log('\n3️⃣ User Account Status:')
        console.log('-'.repeat(60))
        
        // Check auth.users
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        const authUser = authUsers.users.find(u => u.id === client.user_id)
        
        if (authUser) {
          console.log(`✅ Auth User Found:`)
          console.log(`   ID: ${authUser.id}`)
          console.log(`   Email: ${authUser.email}`)
          console.log(`   Created: ${authUser.created_at}`)
          console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`)
        } else {
          console.log(`❌ Auth user not found for ID: ${client.user_id}`)
        }

        // Check user_profiles
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', client.user_id)
          .single()

        if (profileError) {
          console.log(`❌ Profile error: ${profileError.message}`)
        } else if (profile) {
          console.log(`✅ User Profile Found:`)
          console.log(`   User Type: ${profile.user_type}`)
          console.log(`   Full Name: ${profile.full_name || 'None'}`)
          console.log(`   Email: ${profile.email || 'None'}`)
          console.log(`   Created: ${profile.created_at}`)
        } else {
          console.log(`❌ User profile not found`)
        }
      } else {
        console.log('\n3️⃣ User Account Status:')
        console.log('-'.repeat(60))
        console.log('⚠️  Client user_id is NULL - account may not have been created')
        
        // Check if user exists by email
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        const authUser = authUsers.users.find(u => u.email === client.email)
        
        if (authUser) {
          console.log(`✅ Found auth user by email (but not linked):`)
          console.log(`   ID: ${authUser.id}`)
          console.log(`   Created: ${authUser.created_at}`)
        } else {
          console.log(`❌ No auth user found for email: ${client.email}`)
        }
      }
    }
  }

  // 4. Check commission record
  console.log('\n4️⃣ Commission Record:')
  console.log('-'.repeat(60))
  
  const { data: commissions, error: commissionError } = await supabase
    .from('commissions')
    .select('*')
    .eq('gallery_id', gallery.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (commissionError) {
    console.log('❌ Error:', commissionError.message)
  } else if (commissions && commissions.length > 0) {
    const commission = commissions[0]
    console.log(`✅ Commission Record Found:`)
    console.log(`   ID: ${commission.id}`)
    console.log(`   Status: ${commission.status}`)
    console.log(`   Paid At: ${commission.paid_at || 'Not set'}`)
    console.log(`   Transfer ID: ${commission.stripe_transfer_id || 'None'}`)
    console.log(`\n💰 Fee Breakdown:`)
    console.log(`   Total Paid: $${commission.total_paid_cents / 100}`)
    console.log(`   Shoot Fee: $${commission.shoot_fee_cents / 100}`)
    console.log(`   Storage Fee: $${commission.storage_fee_cents / 100}`)
    console.log(`   PhotoVault Commission: $${commission.photovault_commission_cents / 100}`)
    console.log(`   Photographer Gross: $${commission.amount_cents / 100}`)
  } else {
    console.log('❌ No commission record found')
  }

  // 5. Check webhook logs (if table exists)
  console.log('\n5️⃣ Webhook Processing:')
  console.log('-'.repeat(60))
  
  if (gallery.stripe_payment_intent_id) {
    const { data: webhookLogs, error: webhookError } = await supabase
      .from('webhook_logs')
      .select('*')
      .ilike('result_message', `%${gallery.id}%`)
      .order('processed_at', { ascending: false })
      .limit(3)

    if (webhookError) {
      console.log('⚠️  Webhook logs table may not exist:', webhookError.message)
    } else if (webhookLogs && webhookLogs.length > 0) {
      console.log(`✅ Found ${webhookLogs.length} webhook log(s):`)
      webhookLogs.forEach((log, i) => {
        console.log(`\n   Log ${i + 1}:`)
        console.log(`   Event Type: ${log.event_type}`)
        console.log(`   Status: ${log.status}`)
        console.log(`   Processed At: ${log.processed_at}`)
        console.log(`   Result: ${log.result_message || 'N/A'}`)
      })
    } else {
      console.log('⚠️  No webhook logs found (may be normal if table doesn\'t exist)')
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Verification Complete\n')
}

// Run the check
checkLatestPayment().catch(console.error)

