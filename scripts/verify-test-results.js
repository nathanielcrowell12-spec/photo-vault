/**
 * Test Results Verification Script
 * 
 * This script helps verify test results by:
 * 1. Querying Supabase database for commission records, galleries, webhook logs
 * 2. Checking Stripe data (if API key available)
 * 3. Verifying expected values match actual values
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-09-30.clover' })
  : null

/**
 * Verify gallery payment status
 */
async function verifyGalleryPayment(galleryId) {
  console.log(`\n📸 Verifying Gallery Payment: ${galleryId}`)
  console.log('-'.repeat(60))
  
  const { data: gallery, error } = await supabase
    .from('photo_galleries')
    .select('id, gallery_name, photographer_id, payment_status, paid_at, stripe_payment_intent_id, total_amount, shoot_fee, storage_fee')
    .eq('id', galleryId)
    .single()
  
  if (error) {
    console.log('❌ Error:', error.message)
    return { success: false, error: error.message }
  }
  
  if (!gallery) {
    console.log('❌ Gallery not found')
    return { success: false, error: 'Gallery not found' }
  }
  
  console.log(`✅ Gallery: ${gallery.gallery_name}`)
  console.log(`   Payment Status: ${gallery.payment_status}`)
  console.log(`   Paid At: ${gallery.paid_at || 'Not paid'}`)
  console.log(`   Payment Intent: ${gallery.stripe_payment_intent_id || 'None'}`)
  console.log(`   Total Amount: $${(gallery.total_amount || 0) / 100}`)
  console.log(`   Shoot Fee: $${(gallery.shoot_fee || 0) / 100}`)
  console.log(`   Storage Fee: $${(gallery.storage_fee || 0) / 100}`)
  
  const isPaid = gallery.payment_status === 'paid' && gallery.paid_at !== null
  console.log(`\n${isPaid ? '✅' : '❌'} Payment Status: ${isPaid ? 'PAID' : 'NOT PAID'}`)
  
  return {
    success: isPaid,
    gallery,
    isPaid
  }
}

/**
 * Verify commission record
 */
async function verifyCommission(galleryId) {
  console.log(`\n💰 Verifying Commission Record: ${galleryId}`)
  console.log('-'.repeat(60))
  
  const { data: commissions, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error) {
    console.log('❌ Error:', error.message)
    return { success: false, error: error.message }
  }
  
  if (!commissions || commissions.length === 0) {
    console.log('❌ No commission record found')
    return { success: false, error: 'No commission found' }
  }
  
  const commission = commissions[0]
  
  console.log('✅ Commission Record Found:')
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
  
  // Verify expected values
  const expectedPhotovaultFee = Math.round(commission.storage_fee_cents * 0.5)
  const expectedPhotographerGross = commission.total_paid_cents - expectedPhotovaultFee
  
  const feeCorrect = commission.photovault_commission_cents === expectedPhotovaultFee
  const grossCorrect = commission.amount_cents === expectedPhotographerGross
  const statusCorrect = commission.status === 'paid'
  const hasTransferId = commission.stripe_transfer_id !== null
  
  console.log(`\n📊 Verification:`)
  console.log(`   ${statusCorrect ? '✅' : '❌'} Status is 'paid': ${commission.status}`)
  console.log(`   ${hasTransferId ? '✅' : '❌'} Transfer ID present: ${hasTransferId}`)
  console.log(`   ${feeCorrect ? '✅' : '❌'} PhotoVault fee correct: $${commission.photovault_commission_cents / 100} (expected $${expectedPhotovaultFee / 100})`)
  console.log(`   ${grossCorrect ? '✅' : '❌'} Photographer gross correct: $${commission.amount_cents / 100} (expected $${expectedPhotographerGross / 100})`)
  
  const allCorrect = statusCorrect && hasTransferId && feeCorrect && grossCorrect
  
  return {
    success: allCorrect,
    commission,
    verification: {
      statusCorrect,
      hasTransferId,
      feeCorrect,
      grossCorrect
    }
  }
}

/**
 * Verify webhook processing
 */
async function verifyWebhook(paymentIntentId) {
  console.log(`\n🔔 Verifying Webhook Processing: ${paymentIntentId}`)
  console.log('-'.repeat(60))
  
  // Check webhook logs
  const { data: webhookLogs, error: logError } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('event_type', 'checkout.session.completed')
    .order('processed_at', { ascending: false })
    .limit(5)
  
  if (logError) {
    console.log('⚠️  Error fetching webhook logs:', logError.message)
  } else {
    console.log(`✅ Found ${webhookLogs?.length || 0} recent webhook logs`)
    if (webhookLogs && webhookLogs.length > 0) {
      const latest = webhookLogs[0]
      console.log(`   Latest: ${latest.event_type} - ${latest.status}`)
      console.log(`   Processed: ${latest.processed_at}`)
      console.log(`   Message: ${latest.result_message?.substring(0, 100)}...`)
    }
  }
  
  // Check processed events (idempotency)
  const { data: processedEvents, error: eventError } = await supabase
    .from('processed_webhook_events')
    .select('stripe_event_id, event_type, processed_at')
    .eq('event_type', 'checkout.session.completed')
    .order('processed_at', { ascending: false })
    .limit(5)
  
  if (eventError) {
    console.log('⚠️  Error fetching processed events:', eventError.message)
  } else {
    console.log(`\n✅ Found ${processedEvents?.length || 0} processed events`)
    
    // Check for duplicates
    const eventIds = processedEvents?.map(e => e.stripe_event_id) || []
    const uniqueIds = new Set(eventIds)
    const hasDuplicates = eventIds.length !== uniqueIds.size
    
    if (hasDuplicates) {
      console.log('❌ Duplicate events found!')
    } else {
      console.log('✅ No duplicate events (idempotency working)')
    }
  }
  
  return {
    success: true,
    webhookLogs,
    processedEvents
  }
}

/**
 * Verify Stripe payment (if API key available)
 */
async function verifyStripePayment(paymentIntentId) {
  if (!stripe) {
    console.log('\n⚠️  Stripe API key not available - skipping Stripe verification')
    return { success: false, note: 'Stripe API key not configured' }
  }
  
  console.log(`\n💳 Verifying Stripe Payment: ${paymentIntentId}`)
  console.log('-'.repeat(60))
  
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'latest_charge.transfer']
    })
    
    console.log('✅ Payment Intent Found:')
    console.log(`   ID: ${paymentIntent.id}`)
    console.log(`   Status: ${paymentIntent.status}`)
    console.log(`   Amount: $${paymentIntent.amount / 100}`)
    console.log(`   Currency: ${paymentIntent.currency}`)
    
    if (paymentIntent.latest_charge) {
      const charge = paymentIntent.latest_charge
      console.log(`\n💸 Charge Details:`)
      console.log(`   Charge ID: ${typeof charge === 'string' ? charge : charge.id}`)
      
      if (typeof charge !== 'string' && charge.transfer) {
        const transfer = charge.transfer
        console.log(`   Transfer ID: ${typeof transfer === 'string' ? transfer : transfer.id}`)
        console.log(`   Transfer Amount: $${(typeof transfer === 'string' ? 0 : transfer.amount) / 100}`)
        console.log(`   Transfer Destination: ${typeof transfer === 'string' ? 'N/A' : transfer.destination}`)
      }
    }
    
    // Check for application fee (PhotoVault's cut)
    if (paymentIntent.application_fee_amount) {
      console.log(`\n💰 Application Fee (PhotoVault): $${paymentIntent.application_fee_amount / 100}`)
    }
    
    return {
      success: true,
      paymentIntent
    }
  } catch (error) {
    console.log('❌ Error fetching from Stripe:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Verify commission API response structure
 */
async function verifyCommissionAPI(photographerId) {
  console.log(`\n📊 Verifying Commission API Data: ${photographerId}`)
  console.log('-'.repeat(60))
  
  const { data: commissions, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('photographer_id', photographerId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.log('❌ Error:', error.message)
    return { success: false, error: error.message }
  }
  
  console.log(`✅ Found ${commissions?.length || 0} commissions`)
  
  if (commissions && commissions.length > 0) {
    const totals = {
      totalEarnings: 0,
      upfrontEarnings: 0,
      monthlyEarnings: 0,
      transactionCount: commissions.length
    }
    
    commissions.forEach(c => {
      totals.totalEarnings += c.amount_cents
      if (c.payment_type === 'upfront') {
        totals.upfrontEarnings += c.amount_cents
      } else if (c.payment_type === 'monthly') {
        totals.monthlyEarnings += c.amount_cents
      }
    })
    
    console.log(`\n💰 Totals:`)
    console.log(`   Total Earnings: $${totals.totalEarnings / 100}`)
    console.log(`   Upfront Earnings: $${totals.upfrontEarnings / 100}`)
    console.log(`   Monthly Earnings: $${totals.monthlyEarnings / 100}`)
    console.log(`   Transaction Count: ${totals.transactionCount}`)
    
    // Check all are paid
    const allPaid = commissions.every(c => c.status === 'paid')
    console.log(`\n${allPaid ? '✅' : '❌'} All commissions have status 'paid': ${allPaid}`)
    
    return {
      success: true,
      commissions,
      totals: {
        totalEarnings: totals.totalEarnings / 100,
        upfrontEarnings: totals.upfrontEarnings / 100,
        monthlyEarnings: totals.monthlyEarnings / 100,
        transactionCount: totals.transactionCount
      }
    }
  }
  
  return { success: true, commissions: [], totals: null }
}

/**
 * Main verification function
 */
async function verifyTestResults(options = {}) {
  const { galleryId, paymentIntentId, photographerId } = options
  
  console.log('🧪 Test Results Verification')
  console.log('='.repeat(60))
  
  const results = {}
  
  if (galleryId) {
    results.gallery = await verifyGalleryPayment(galleryId)
    results.commission = await verifyCommission(galleryId)
  }
  
  if (paymentIntentId) {
    results.webhook = await verifyWebhook(paymentIntentId)
    results.stripe = await verifyStripePayment(paymentIntentId)
  }
  
  if (photographerId) {
    results.api = await verifyCommissionAPI(photographerId)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Verification Summary:')
  console.log(JSON.stringify(results, null, 2))
  
  return results
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2)
  const options = {}
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--gallery=')) {
      options.galleryId = arg.split('=')[1]
    } else if (arg.startsWith('--payment-intent=')) {
      options.paymentIntentId = arg.split('=')[1]
    } else if (arg.startsWith('--photographer=')) {
      options.photographerId = arg.split('=')[1]
    }
  })
  
  verifyTestResults(options).then(() => {
    console.log('\n✅ Verification complete')
    process.exit(0)
  }).catch(error => {
    console.error('\n❌ Verification failed:', error)
    process.exit(1)
  })
}

module.exports = {
  verifyTestResults,
  verifyGalleryPayment,
  verifyCommission,
  verifyWebhook,
  verifyStripePayment,
  verifyCommissionAPI
}

