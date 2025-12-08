/**
 * Check Photographer Transfer Details
 * Verifies what the photographer actually received from a payment
 */

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover'
})

async function checkTransfer(transferId) {
  console.log(`\n💸 Checking Transfer: ${transferId}`)
  console.log('='.repeat(60))
  
  try {
    // Get transfer details
    const transfer = await stripe.transfers.retrieve(transferId, {
      expand: ['destination_payment', 'balance_transaction']
    })
    
    console.log('\n📊 Transfer Details:')
    console.log(`   Transfer ID: ${transfer.id}`)
    console.log(`   Amount: $${transfer.amount / 100}`)
    console.log(`   Currency: ${transfer.currency}`)
    console.log(`   Destination: ${transfer.destination}`)
    console.log(`   Status: ${transfer.reversed ? 'REVERSED' : transfer.reversed === false ? 'COMPLETED' : 'PENDING'}`)
    console.log(`   Created: ${new Date(transfer.created * 1000).toLocaleString()}`)
    
    // Get destination payment (what photographer actually received)
    if (transfer.destination_payment) {
      const destPayment = typeof transfer.destination_payment === 'string'
        ? await stripe.account.retrieveExternalAccount(transfer.destination, transfer.destination_payment)
        : transfer.destination_payment
      
      console.log(`\n💰 Destination Payment:`)
      console.log(`   Payment ID: ${destPayment.id}`)
      console.log(`   Amount: $${destPayment.amount / 100}`)
      console.log(`   Status: ${destPayment.status || 'N/A'}`)
    }
    
    // Get balance transaction to see fees
    if (transfer.balance_transaction) {
      const balanceTx = typeof transfer.balance_transaction === 'string'
        ? await stripe.balanceTransactions.retrieve(transfer.balance_transaction)
        : transfer.balance_transaction
      
      console.log(`\n💵 Balance Transaction:`)
      console.log(`   Amount: $${balanceTx.amount / 100}`)
      console.log(`   Fee: $${Math.abs(balanceTx.fee / 100)}`)
      console.log(`   Net: $${balanceTx.net / 100}`)
      console.log(`   Type: ${balanceTx.type}`)
    }
    
    // Check the charge to see application fee
    const charges = await stripe.charges.list({
      transfer: transferId,
      limit: 1
    })
    
    if (charges.data.length > 0) {
      const charge = charges.data[0]
      console.log(`\n💳 Source Charge:`)
      console.log(`   Charge ID: ${charge.id}`)
      console.log(`   Amount: $${charge.amount / 100}`)
      console.log(`   Application Fee: $${charge.application_fee_amount / 100}`)
      console.log(`   Net to Photographer: $${(charge.amount - charge.application_fee_amount) / 100}`)
      
      // Calculate what photographer actually receives after Stripe fees
      const photographerGross = charge.amount - charge.application_fee_amount
      const stripeFees = charge.balance_transaction ? 
        (await stripe.balanceTransactions.retrieve(charge.balance_transaction)).fee : 0
      
      console.log(`\n📈 Final Breakdown:`)
      console.log(`   Client Paid: $${charge.amount / 100}`)
      console.log(`   PhotoVault Fee: $${charge.application_fee_amount / 100}`)
      console.log(`   Stripe Fees: $${stripeFees / 100}`)
      console.log(`   Photographer Receives: $${(photographerGross - stripeFees) / 100}`)
    }
    
    // Check connected account balance
    try {
      const account = await stripe.accounts.retrieve(transfer.destination)
      console.log(`\n🏦 Connected Account:`)
      console.log(`   Account ID: ${account.id}`)
      console.log(`   Type: ${account.type}`)
      console.log(`   Charges Enabled: ${account.charges_enabled}`)
      console.log(`   Payouts Enabled: ${account.payouts_enabled}`)
      
      // Get account balance
      const balance = await stripe.balance.retrieve({
        stripeAccount: transfer.destination
      })
      
      console.log(`\n💰 Account Balance:`)
      balance.available.forEach(b => {
        console.log(`   ${b.currency.toUpperCase()}: $${b.amount / 100} (available)`)
      })
      balance.pending.forEach(b => {
        console.log(`   ${b.currency.toUpperCase()}: $${b.amount / 100} (pending)`)
      })
    } catch (err) {
      console.log(`\n⚠️  Could not retrieve account balance: ${err.message}`)
    }
    
    return { success: true, transfer }
  } catch (error) {
    console.error('❌ Error:', error.message)
    return { success: false, error: error.message }
  }
}

// CLI usage
if (require.main === module) {
  const transferId = process.argv[2]
  
  if (!transferId) {
    console.log('Usage: node check-photographer-transfer.js <transfer-id>')
    console.log('Example: node check-photographer-transfer.js tr_3SZpHf8jZm4oWQdn1HI3jY3e')
    process.exit(1)
  }
  
  checkTransfer(transferId).then(() => {
    console.log('\n✅ Check complete')
    process.exit(0)
  }).catch(error => {
    console.error('\n❌ Check failed:', error)
    process.exit(1)
  })
}

module.exports = { checkTransfer }

