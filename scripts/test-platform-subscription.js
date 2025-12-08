/**
 * Test Script for Platform Subscription
 * Run this after implementing Story 1.3 to verify everything works
 * 
 * Usage: node scripts/test-platform-subscription.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseSchema() {
  console.log('\n📊 Testing Database Schema...')
  
  try {
    // Check if photographers table has the new columns
    const { data, error } = await supabase
      .from('photographers')
      .select('stripe_platform_subscription_id, platform_subscription_status')
      .limit(1)
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('❌ Database migration not run!')
        console.error('   Run: database/add-photographer-platform-subscription.sql in Supabase SQL Editor')
        return false
      }
      throw error
    }
    
    console.log('✅ Database schema is correct - subscription columns exist')
    return true
  } catch (error) {
    console.error('❌ Error checking database schema:', error.message)
    return false
  }
}

async function testEnvironmentVariables() {
  console.log('\n🔑 Testing Environment Variables...')
  
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PRICE_PHOTOGRAPHER_MONTHLY',
  ]
  
  const missing = requiredVars.filter(v => !process.env[v])
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:')
    missing.forEach(v => console.error(`   - ${v}`))
    return false
  }
  
  console.log('✅ All required environment variables are set')
  console.log(`   STRIPE_PRICE_PHOTOGRAPHER_MONTHLY: ${process.env.STRIPE_PRICE_PHOTOGRAPHER_MONTHLY}`)
  return true
}

async function testPhotographerExists() {
  console.log('\n👤 Testing Photographer Accounts...')
  
  try {
    const { data: photographers, error } = await supabase
      .from('photographers')
      .select('id, stripe_platform_subscription_id, platform_subscription_status')
      .limit(5)
    
    if (error) throw error
    
    if (!photographers || photographers.length === 0) {
      console.warn('⚠️  No photographers found in database')
      console.warn('   Create a photographer account to test subscription creation')
      return true // Not a failure, just no data
    }
    
    console.log(`✅ Found ${photographers.length} photographer(s)`)
    
    photographers.forEach((p, i) => {
      console.log(`   ${i + 1}. Photographer ID: ${p.id}`)
      console.log(`      Subscription ID: ${p.stripe_platform_subscription_id || 'None'}`)
      console.log(`      Status: ${p.platform_subscription_status || 'Not set'}`)
    })
    
    return true
  } catch (error) {
    console.error('❌ Error checking photographers:', error.message)
    return false
  }
}

async function main() {
  console.log('🧪 Testing Story 1.3: Platform Fee Billing Implementation\n')
  console.log('=' .repeat(60))
  
  const results = {
    schema: await testDatabaseSchema(),
    env: await testEnvironmentVariables(),
    photographers: await testPhotographerExists(),
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n📋 Test Results Summary:')
  console.log(`   Database Schema: ${results.schema ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`   Environment Variables: ${results.env ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`   Photographer Accounts: ${results.photographers ? '✅ PASS' : '❌ FAIL'}`)
  
  const allPassed = Object.values(results).every(r => r === true)
  
  if (allPassed) {
    console.log('\n✅ All tests passed! Ready for manual testing.')
    console.log('\n📝 Next Steps:')
    console.log('   1. Sign up as a new photographer')
    console.log('   2. Check that subscription is created automatically')
    console.log('   3. Visit /photographers/subscription to see real data')
    console.log('   4. Test webhook processing with Stripe CLI')
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues above.')
  }
  
  process.exit(allPassed ? 0 : 1)
}

main().catch(console.error)

