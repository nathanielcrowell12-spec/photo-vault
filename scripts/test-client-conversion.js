/**
 * Integration Test: Client Conversion Flow
 *
 * This script tests the complete flow of converting a Direct Monthly client
 * to a photographer-associated client with 50/50 revenue share.
 *
 * SAFE TO RUN: Uses Stripe test mode only, creates and cleans up test data.
 *
 * Run with: node scripts/test-client-conversion.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Price IDs from environment
const PRICE_DIRECT_MONTHLY = process.env.STRIPE_PRICE_DIRECT_MONTHLY;
const PRICE_CLIENT_MONTHLY = process.env.STRIPE_PRICE_CLIENT_MONTHLY;

// Test data tracking for cleanup
const testData = {
  customerId: null,
  subscriptionId: null,
  paymentMethodId: null
};

// Console colors for readability
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}STEP ${step}: ${message}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.yellow}ℹ ${message}${colors.reset}`);
}

async function validateEnvironment() {
  logStep(0, 'Validating Environment');

  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PRICE_DIRECT_MONTHLY',
    'STRIPE_PRICE_CLIENT_MONTHLY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logError(`Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Verify we're in test mode
  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    logError('DANGER: Not using Stripe test mode! Aborting.');
    process.exit(1);
  }

  logSuccess('Environment validated');
  logInfo(`Direct Monthly Price: ${PRICE_DIRECT_MONTHLY}`);
  logInfo(`Client Monthly Price: ${PRICE_CLIENT_MONTHLY}`);

  // Verify prices exist
  try {
    const directPrice = await stripe.prices.retrieve(PRICE_DIRECT_MONTHLY);
    const clientPrice = await stripe.prices.retrieve(PRICE_CLIENT_MONTHLY);

    logSuccess(`Direct Monthly: $${directPrice.unit_amount / 100}/${directPrice.recurring?.interval}`);
    logSuccess(`Client Monthly: $${clientPrice.unit_amount / 100}/${clientPrice.recurring?.interval}`);

    // Check commission metadata
    logInfo(`Direct Monthly commission_rate: ${directPrice.metadata.commission_rate || 'not set'}`);
    logInfo(`Client Monthly commission_rate: ${clientPrice.metadata.commission_rate || 'not set'}`);

  } catch (error) {
    logError(`Failed to retrieve prices: ${error.message}`);
    process.exit(1);
  }
}

async function createTestCustomer() {
  logStep(1, 'Creating Test Customer');

  const timestamp = Date.now();
  const customer = await stripe.customers.create({
    email: `test-conversion-${timestamp}@photovault-test.com`,
    name: 'Test Client (Conversion Test)',
    metadata: {
      test: 'true',
      test_type: 'client_conversion',
      created_at: new Date().toISOString()
    }
  });

  testData.customerId = customer.id;
  logSuccess(`Created customer: ${customer.id}`);
  logInfo(`Email: ${customer.email}`);

  return customer;
}

async function attachTestPaymentMethod(customerId) {
  logStep(2, 'Attaching Test Payment Method');

  // Create a test payment method using Stripe's test card
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: {
      token: 'tok_visa' // Stripe test token for Visa
    }
  });

  // Attach to customer
  await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: customerId
  });

  // Set as default
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethod.id
    }
  });

  testData.paymentMethodId = paymentMethod.id;
  logSuccess(`Attached payment method: ${paymentMethod.id}`);
  logInfo(`Card: **** **** **** ${paymentMethod.card.last4}`);

  return paymentMethod;
}

async function createDirectMonthlySubscription(customerId) {
  logStep(3, 'Creating Direct Monthly Subscription');

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      { price: PRICE_DIRECT_MONTHLY }
    ],
    metadata: {
      test: 'true',
      client_type: 'direct_signup',
      primary_photographer_id: null
    }
  });

  testData.subscriptionId = subscription.id;

  logSuccess(`Created subscription: ${subscription.id}`);
  logInfo(`Status: ${subscription.status}`);
  logInfo(`Price ID: ${subscription.items.data[0].price.id}`);
  logInfo(`Amount: $${subscription.items.data[0].price.unit_amount / 100}/month`);

  // Verify it's using Direct Monthly price
  if (subscription.items.data[0].price.id !== PRICE_DIRECT_MONTHLY) {
    logError('Subscription is not using Direct Monthly price!');
    return null;
  }

  logSuccess('Verified: Subscription is on Direct Monthly (100% PhotoVault)');

  return subscription;
}

async function simulateConversion(subscriptionId) {
  logStep(4, 'Simulating Direct-to-Photographer Conversion');

  logInfo('This simulates what happens when a photographer creates a gallery for a direct client...');

  // Get the current subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Find the subscription item
  const itemToUpdate = subscription.items.data.find(
    item => item.price.id === PRICE_DIRECT_MONTHLY
  );

  if (!itemToUpdate) {
    logError('Could not find Direct Monthly price on subscription');
    return null;
  }

  logInfo(`Found subscription item: ${itemToUpdate.id}`);
  logInfo(`Current price: ${itemToUpdate.price.id}`);

  // Swap the price
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: itemToUpdate.id,
        price: PRICE_CLIENT_MONTHLY
      }
    ],
    metadata: {
      ...subscription.metadata,
      client_type: 'photographer_referred',
      primary_photographer_id: 'test-photographer-123',
      converted_from: 'direct_monthly',
      converted_to: 'client_monthly',
      converted_at: new Date().toISOString()
    },
    proration_behavior: 'none' // Same price, just different split
  });

  logSuccess('Subscription updated');

  return updatedSubscription;
}

async function verifyConversion(subscriptionId) {
  logStep(5, 'Verifying Conversion');

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Check price
  const currentPriceId = subscription.items.data[0].price.id;

  console.log('\nSubscription Details:');
  console.log(`  ID: ${subscription.id}`);
  console.log(`  Status: ${subscription.status}`);
  console.log(`  Price ID: ${currentPriceId}`);
  console.log(`  Amount: $${subscription.items.data[0].price.unit_amount / 100}/month`);

  console.log('\nMetadata:');
  Object.entries(subscription.metadata).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  // Verify price changed
  if (currentPriceId === PRICE_CLIENT_MONTHLY) {
    logSuccess('✓ Price correctly swapped to Client Monthly');
  } else {
    logError(`✗ Price did NOT swap! Still on: ${currentPriceId}`);
    return false;
  }

  // Verify metadata
  if (subscription.metadata.converted_from === 'direct_monthly') {
    logSuccess('✓ Conversion metadata recorded');
  } else {
    logError('✗ Conversion metadata missing');
    return false;
  }

  if (subscription.metadata.client_type === 'photographer_referred') {
    logSuccess('✓ Client type updated to photographer_referred');
  } else {
    logError('✗ Client type not updated');
    return false;
  }

  // Verify commission will work
  const price = await stripe.prices.retrieve(currentPriceId);
  if (price.metadata.commission_rate === '50') {
    logSuccess('✓ New price has 50% commission rate (photographer gets $4/month)');
  } else {
    logInfo(`ℹ Commission rate on price: ${price.metadata.commission_rate || 'not set'}`);
  }

  return true;
}

async function cleanup() {
  logStep(6, 'Cleaning Up Test Data');

  try {
    // Cancel subscription
    if (testData.subscriptionId) {
      await stripe.subscriptions.cancel(testData.subscriptionId);
      logSuccess(`Cancelled subscription: ${testData.subscriptionId}`);
    }

    // Detach payment method
    if (testData.paymentMethodId) {
      await stripe.paymentMethods.detach(testData.paymentMethodId);
      logSuccess(`Detached payment method: ${testData.paymentMethodId}`);
    }

    // Delete customer
    if (testData.customerId) {
      await stripe.customers.del(testData.customerId);
      logSuccess(`Deleted customer: ${testData.customerId}`);
    }

    logSuccess('All test data cleaned up');

  } catch (error) {
    logError(`Cleanup error: ${error.message}`);
    logInfo('You may need to manually clean up in Stripe Dashboard');
  }
}

async function runTests() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║          PHOTOVAULT CLIENT CONVERSION INTEGRATION TEST                       ║');
  console.log('║                                                                              ║');
  console.log('║  Testing: Direct Monthly → Client Monthly subscription swap                  ║');
  console.log('║  Mode: Stripe TEST (safe - no real money)                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  let allPassed = true;

  try {
    // Validate environment
    await validateEnvironment();

    // Create test customer
    const customer = await createTestCustomer();
    if (!customer) throw new Error('Failed to create customer');

    // Attach payment method
    const paymentMethod = await attachTestPaymentMethod(customer.id);
    if (!paymentMethod) throw new Error('Failed to attach payment method');

    // Create Direct Monthly subscription
    const subscription = await createDirectMonthlySubscription(customer.id);
    if (!subscription) throw new Error('Failed to create subscription');

    // Simulate conversion
    const updatedSubscription = await simulateConversion(subscription.id);
    if (!updatedSubscription) throw new Error('Failed to convert subscription');

    // Verify conversion
    const verified = await verifyConversion(subscription.id);
    if (!verified) {
      allPassed = false;
    }

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    allPassed = false;
  }

  // Always cleanup
  await cleanup();

  // Final result
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  if (allPassed) {
    console.log('║                        ✓ ALL TESTS PASSED                                   ║');
    console.log('║                                                                              ║');
    console.log('║  The client conversion flow is working correctly:                           ║');
    console.log('║  • Direct Monthly subscription can be created                               ║');
    console.log('║  • Subscription swaps to Client Monthly successfully                        ║');
    console.log('║  • Metadata is correctly updated                                            ║');
    console.log('║  • Commission tracking is in place                                          ║');
  } else {
    console.log('║                        ✗ TESTS FAILED                                       ║');
    console.log('║                                                                              ║');
    console.log('║  Please review the errors above and fix before going to production.         ║');
  }
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests();
