/**
 * Update Commission Record with Stripe Transfer ID
 * Fixes commission records that are missing transfer_id
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover'
})

async function updateCommissionTransferId(commissionId, paymentIntentId) {
  console.log(`\n🔧 Updating Commission: ${commissionId}`)
  console.log(`   Payment Intent: ${paymentIntentId}`)
  console.log('-'.repeat(60))
  
  try {
    // Get transfer ID from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'latest_charge.transfer']
    })
    
    let transferId = null
    
    if (paymentIntent.latest_charge) {
      const charge = paymentIntent.latest_charge
      if (typeof charge !== 'string' && charge.transfer) {
        transferId = typeof charge.transfer === 'string' ? charge.transfer : charge.transfer.id
      }
    }
    
    if (!transferId) {
      console.log('❌ Could not find transfer ID in payment intent')
      return { success: false, error: 'Transfer ID not found' }
    }
    
    console.log(`✅ Found Transfer ID: ${transferId}`)
    
    // Update commission record
    const { data, error } = await supabase
      .from('commissions')
      .update({
        stripe_transfer_id: transferId
      })
      .eq('id', commissionId)
      .select()
      .single()
    
    if (error) {
      console.log('❌ Error updating commission:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Commission updated successfully')
    console.log(`   Transfer ID: ${data.stripe_transfer_id}`)
    
    return { success: true, commission: data }
  } catch (error) {
    console.error('❌ Error:', error.message)
    return { success: false, error: error.message }
  }
}

// CLI usage
if (require.main === module) {
  const commissionId = process.argv[2]
  const paymentIntentId = process.argv[3]
  
  if (!commissionId || !paymentIntentId) {
    console.log('Usage: node update-commission-transfer-id.js <commission-id> <payment-intent-id>')
    console.log('Example: node update-commission-transfer-id.js 58931812-91ec-41e4-87a6-e617a8cc274a pi_3SZpHf8jZm4oWQdn1yBa0jlG')
    process.exit(1)
  }
  
  updateCommissionTransferId(commissionId, paymentIntentId).then(result => {
    if (result.success) {
      console.log('\n✅ Update complete')
      process.exit(0)
    } else {
      console.log('\n❌ Update failed')
      process.exit(1)
    }
  }).catch(error => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
}

module.exports = { updateCommissionTransferId }

