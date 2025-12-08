/**
 * Check Photographer's Stripe Connect Account Balance
 * Shows what the photographer actually has in their account
 */

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover'
})

async function checkPhotographerBalance(accountId) {
  console.log(`\n💳 Checking Photographer Account: ${accountId}`)
  console.log('='.repeat(60))
  
  try {
    // Get account details
    const account = await stripe.accounts.retrieve(accountId)
    console.log('\n📊 Account Details:')
    console.log(`   Account ID: ${account.id}`)
    console.log(`   Type: ${account.type}`)
    console.log(`   Charges Enabled: ${account.charges_enabled}`)
    console.log(`   Payouts Enabled: ${account.payouts_enabled}`)
    console.log(`   Email: ${account.email || 'N/A'}`)
    
    // Get account balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId
    })
    
    console.log('\n💰 Account Balance:')
    if (balance.available && balance.available.length > 0) {
      balance.available.forEach(b => {
        console.log(`   ✅ Available: $${b.amount / 100} ${b.currency.toUpperCase()}`)
      })
    } else {
      console.log('   Available: $0.00')
    }
    
    if (balance.pending && balance.pending.length > 0) {
      balance.pending.forEach(b => {
        console.log(`   ⏳ Pending: $${b.amount / 100} ${b.currency.toUpperCase()}`)
      })
    }
    
    // Get recent transfers to this account
    console.log('\n📥 Recent Transfers to Account:')
    const transfers = await stripe.transfers.list({
      destination: accountId,
      limit: 5
    })
    
    if (transfers.data.length > 0) {
      transfers.data.forEach(t => {
        console.log(`\n   Transfer: ${t.id}`)
        console.log(`   Amount: $${t.amount / 100}`)
        console.log(`   Status: ${t.reversed ? 'REVERSED' : 'COMPLETED'}`)
        console.log(`   Created: ${new Date(t.created * 1000).toLocaleString()}`)
      })
    } else {
      console.log('   No transfers found')
    }
    
    // Get recent charges (payments) to this account
    console.log('\n💵 Recent Charges (Payments):')
    const charges = await stripe.charges.list({
      limit: 5
    })
    
    const accountCharges = charges.data.filter(c => 
      c.destination === accountId || 
      (c.transfer_data && c.transfer_data.destination === accountId)
    )
    
    if (accountCharges.length > 0) {
      accountCharges.forEach(c => {
        console.log(`\n   Charge: ${c.id}`)
        console.log(`   Amount: $${c.amount / 100}`)
        console.log(`   Application Fee: $${c.application_fee_amount / 100}`)
        console.log(`   Net to Photographer: $${(c.amount - c.application_fee_amount) / 100}`)
        console.log(`   Status: ${c.status}`)
        console.log(`   Created: ${new Date(c.created * 1000).toLocaleString()}`)
      })
    } else {
      console.log('   No charges found for this account')
    }
    
    // Calculate what photographer should have received
    if (accountCharges.length > 0) {
      console.log('\n📈 Summary:')
      let totalReceived = 0
      let totalFees = 0
      
      for (const charge of accountCharges) {
        const gross = charge.amount - charge.application_fee_amount
        // Get balance transaction to see Stripe fees
        if (charge.balance_transaction) {
          const bt = await stripe.balanceTransactions.retrieve(charge.balance_transaction)
          totalFees += Math.abs(bt.fee)
          totalReceived += (gross - Math.abs(bt.fee))
        } else {
          totalReceived += gross
        }
      }
      
      console.log(`   Total Gross (before Stripe fees): $${accountCharges.reduce((sum, c) => sum + (c.amount - c.application_fee_amount), 0) / 100}`)
      console.log(`   Total Stripe Fees: $${totalFees / 100}`)
      console.log(`   Net to Photographer: $${totalReceived / 100}`)
    }
    
    return { success: true, account, balance, transfers: transfers.data }
  } catch (error) {
    console.error('❌ Error:', error.message)
    return { success: false, error: error.message }
  }
}

// CLI usage
if (require.main === module) {
  const accountId = process.argv[2] || 'acct_1SYm5G9my0XhgOxd'
  
  checkPhotographerBalance(accountId).then(() => {
    console.log('\n✅ Check complete')
    process.exit(0)
  }).catch(error => {
    console.error('\n❌ Check failed:', error)
    process.exit(1)
  })
}

module.exports = { checkPhotographerBalance }

