/**
 * PhotoVault Stripe Products Setup Script
 *
 * This script creates all the necessary Stripe products and prices for PhotoVault.
 * Run with: node scripts/create-stripe-products.js
 *
 * Prerequisites:
 * - Set STRIPE_SECRET_KEY in your .env.local file
 * - npm install dotenv (if not already installed)
 */

require('dotenv').config({ path: '.env.local' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createProducts() {
  console.log('🚀 Creating PhotoVault Stripe Products...\n');

  // Check if API key is set
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('YOUR_')) {
    console.error('❌ Error: Please set your STRIPE_SECRET_KEY in .env.local');
    console.log('\nGet your key from: https://dashboard.stripe.com/test/apikeys');
    process.exit(1);
  }

  const results = {
    products: {},
    prices: {}
  };

  try {
    // ============================================
    // 1. PHOTOGRAPHER PLATFORM SUBSCRIPTION ($22/month)
    // ============================================
    console.log('📸 Creating Photographer Platform Subscription...');

    const photographerProduct = await stripe.products.create({
      name: 'PhotoVault Pro - Photographer Platform',
      description: 'Professional photo sharing platform with commission program. Unlimited client galleries, revenue tracking, analytics, and more.',
      metadata: {
        type: 'photographer_subscription',
        features: 'unlimited_galleries,commission_program,analytics,reports'
      }
    });
    results.products.photographer = photographerProduct.id;

    const photographerPrice = await stripe.prices.create({
      product: photographerProduct.id,
      unit_amount: 2200, // $22.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        type: 'photographer_monthly'
      }
    });
    results.prices.photographer_monthly = photographerPrice.id;
    console.log(`   ✅ Product: ${photographerProduct.id}`);
    console.log(`   ✅ Price: ${photographerPrice.id} ($22/month)\n`);

    // ============================================
    // 2. CLIENT YEAR 1 PACKAGE ($100 upfront + $8/month after 12 months)
    // ============================================
    console.log('📅 Creating Client Year 1 Package...');

    const year1Product = await stripe.products.create({
      name: 'PhotoVault Gallery - Year Package',
      description: 'Full year of gallery access. $100 upfront covers first 12 months, then $8/month ongoing.',
      metadata: {
        type: 'client_year_package',
        upfront_amount: '10000',
        prepaid_months: '12',
        commission_photographer: '5000' // $50 commission
      }
    });
    results.products.client_year = year1Product.id;

    // Upfront payment price ($100 one-time)
    const year1UpfrontPrice = await stripe.prices.create({
      product: year1Product.id,
      unit_amount: 10000, // $100.00 in cents
      currency: 'usd',
      metadata: {
        type: 'year_package_upfront',
        prepaid_months: '12'
      }
    });
    results.prices.year_upfront = year1UpfrontPrice.id;

    // Recurring price ($8/month - starts after 12 month trial)
    const year1RecurringPrice = await stripe.prices.create({
      product: year1Product.id,
      unit_amount: 800, // $8.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 365 // 12 months trial (starts after upfront)
      },
      metadata: {
        type: 'year_package_recurring'
      }
    });
    results.prices.year_recurring = year1RecurringPrice.id;
    console.log(`   ✅ Product: ${year1Product.id}`);
    console.log(`   ✅ Upfront Price: ${year1UpfrontPrice.id} ($100 one-time)`);
    console.log(`   ✅ Recurring Price: ${year1RecurringPrice.id} ($8/month after 12 months)\n`);

    // ============================================
    // 3. CLIENT 6-MONTH PACKAGE ($50 upfront + $8/month after 6 months)
    // ============================================
    console.log('📆 Creating Client 6-Month Package...');

    const sixMonthProduct = await stripe.products.create({
      name: 'PhotoVault Gallery - 6-Month Package',
      description: '6 months of gallery access. $50 upfront covers first 6 months, then $8/month ongoing.',
      metadata: {
        type: 'client_6month_package',
        upfront_amount: '5000',
        prepaid_months: '6',
        commission_photographer: '2500' // $25 commission
      }
    });
    results.products.client_6month = sixMonthProduct.id;

    // Upfront payment price ($50 one-time)
    const sixMonthUpfrontPrice = await stripe.prices.create({
      product: sixMonthProduct.id,
      unit_amount: 5000, // $50.00 in cents
      currency: 'usd',
      metadata: {
        type: '6month_package_upfront',
        prepaid_months: '6'
      }
    });
    results.prices.sixmonth_upfront = sixMonthUpfrontPrice.id;

    // Recurring price ($8/month - starts after 6 month trial)
    const sixMonthRecurringPrice = await stripe.prices.create({
      product: sixMonthProduct.id,
      unit_amount: 800, // $8.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 183 // ~6 months trial
      },
      metadata: {
        type: '6month_package_recurring'
      }
    });
    results.prices.sixmonth_recurring = sixMonthRecurringPrice.id;
    console.log(`   ✅ Product: ${sixMonthProduct.id}`);
    console.log(`   ✅ Upfront Price: ${sixMonthUpfrontPrice.id} ($50 one-time)`);
    console.log(`   ✅ Recurring Price: ${sixMonthRecurringPrice.id} ($8/month after 6 months)\n`);

    // ============================================
    // 4. CLIENT 6-MONTH TRIAL ($20 one-time, no recurring)
    // ============================================
    console.log('🎫 Creating Client 6-Month Trial...');

    const trialProduct = await stripe.products.create({
      name: 'PhotoVault Gallery - 6-Month Trial',
      description: 'One-time payment for 6 months of gallery access. No recurring charges - gallery becomes inactive after 6 months.',
      metadata: {
        type: 'client_trial',
        duration_months: '6',
        commission_photographer: '1000', // $10 commission
        auto_renew: 'false'
      }
    });
    results.products.client_trial = trialProduct.id;

    const trialPrice = await stripe.prices.create({
      product: trialProduct.id,
      unit_amount: 2000, // $20.00 in cents
      currency: 'usd',
      // No recurring - one-time payment
      metadata: {
        type: 'trial_onetime',
        duration_months: '6'
      }
    });
    results.prices.trial_onetime = trialPrice.id;
    console.log(`   ✅ Product: ${trialProduct.id}`);
    console.log(`   ✅ Price: ${trialPrice.id} ($20 one-time for 6 months)\n`);

    // ============================================
    // 5. REACTIVATION FEE ($20 one-time)
    // ============================================
    console.log('🔄 Creating Reactivation Fee...');

    const reactivationProduct = await stripe.products.create({
      name: 'PhotoVault Gallery - Reactivation Fee',
      description: 'One-time fee to reactivate an inactive gallery. After payment, $8/month subscription resumes.',
      metadata: {
        type: 'reactivation_fee',
        commission_photographer: '1000', // $10 commission
        triggers_subscription: 'true'
      }
    });
    results.products.reactivation = reactivationProduct.id;

    const reactivationPrice = await stripe.prices.create({
      product: reactivationProduct.id,
      unit_amount: 2000, // $20.00 in cents
      currency: 'usd',
      // No recurring - one-time payment
      metadata: {
        type: 'reactivation_onetime'
      }
    });
    results.prices.reactivation_onetime = reactivationPrice.id;
    console.log(`   ✅ Product: ${reactivationProduct.id}`);
    console.log(`   ✅ Price: ${reactivationPrice.id} ($20 one-time)\n`);

    // ============================================
    // 6. CLIENT MONTHLY (standalone $8/month for ongoing/family)
    // ============================================
    console.log('💳 Creating Client Monthly Subscription...');

    const monthlyProduct = await stripe.products.create({
      name: 'PhotoVault Gallery - Monthly',
      description: 'Ongoing monthly gallery access. $8/month. Used for Year 2+ clients and family accounts.',
      metadata: {
        type: 'client_monthly',
        commission_photographer: '400' // $4/month commission (when applicable)
      }
    });
    results.products.client_monthly = monthlyProduct.id;

    const monthlyPrice = await stripe.prices.create({
      product: monthlyProduct.id,
      unit_amount: 800, // $8.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        type: 'client_monthly_recurring'
      }
    });
    results.prices.client_monthly = monthlyPrice.id;
    console.log(`   ✅ Product: ${monthlyProduct.id}`);
    console.log(`   ✅ Price: ${monthlyPrice.id} ($8/month)\n`);

    // ============================================
    // OUTPUT SUMMARY
    // ============================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ ALL PRODUCTS CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Add these to your .env.local file:\n');
    console.log('# Stripe Product IDs');
    console.log(`STRIPE_PRODUCT_PHOTOGRAPHER=${results.products.photographer}`);
    console.log(`STRIPE_PRODUCT_CLIENT_YEAR=${results.products.client_year}`);
    console.log(`STRIPE_PRODUCT_CLIENT_6MONTH=${results.products.client_6month}`);
    console.log(`STRIPE_PRODUCT_CLIENT_TRIAL=${results.products.client_trial}`);
    console.log(`STRIPE_PRODUCT_REACTIVATION=${results.products.reactivation}`);
    console.log(`STRIPE_PRODUCT_CLIENT_MONTHLY=${results.products.client_monthly}`);
    console.log('');
    console.log('# Stripe Price IDs');
    console.log(`STRIPE_PRICE_PHOTOGRAPHER_MONTHLY=${results.prices.photographer_monthly}`);
    console.log(`STRIPE_PRICE_YEAR_UPFRONT=${results.prices.year_upfront}`);
    console.log(`STRIPE_PRICE_YEAR_RECURRING=${results.prices.year_recurring}`);
    console.log(`STRIPE_PRICE_6MONTH_UPFRONT=${results.prices.sixmonth_upfront}`);
    console.log(`STRIPE_PRICE_6MONTH_RECURRING=${results.prices.sixmonth_recurring}`);
    console.log(`STRIPE_PRICE_TRIAL_ONETIME=${results.prices.trial_onetime}`);
    console.log(`STRIPE_PRICE_REACTIVATION=${results.prices.reactivation_onetime}`);
    console.log(`STRIPE_PRICE_CLIENT_MONTHLY=${results.prices.client_monthly}`);

    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Save to a file for easy copy
    const envContent = `
# PhotoVault Stripe Configuration
# Generated on ${new Date().toISOString()}

# Stripe Product IDs
STRIPE_PRODUCT_PHOTOGRAPHER=${results.products.photographer}
STRIPE_PRODUCT_CLIENT_YEAR=${results.products.client_year}
STRIPE_PRODUCT_CLIENT_6MONTH=${results.products.client_6month}
STRIPE_PRODUCT_CLIENT_TRIAL=${results.products.client_trial}
STRIPE_PRODUCT_REACTIVATION=${results.products.reactivation}
STRIPE_PRODUCT_CLIENT_MONTHLY=${results.products.client_monthly}

# Stripe Price IDs
STRIPE_PRICE_PHOTOGRAPHER_MONTHLY=${results.prices.photographer_monthly}
STRIPE_PRICE_YEAR_UPFRONT=${results.prices.year_upfront}
STRIPE_PRICE_YEAR_RECURRING=${results.prices.year_recurring}
STRIPE_PRICE_6MONTH_UPFRONT=${results.prices.sixmonth_upfront}
STRIPE_PRICE_6MONTH_RECURRING=${results.prices.sixmonth_recurring}
STRIPE_PRICE_TRIAL_ONETIME=${results.prices.trial_onetime}
STRIPE_PRICE_REACTIVATION=${results.prices.reactivation_onetime}
STRIPE_PRICE_CLIENT_MONTHLY=${results.prices.client_monthly}
`;

    const fs = require('fs');
    fs.writeFileSync('scripts/stripe-product-ids.env', envContent.trim());
    console.log('📄 Product IDs also saved to: scripts/stripe-product-ids.env');
    console.log('   Copy these values to your .env.local file\n');

    return results;

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 Make sure your STRIPE_SECRET_KEY is correct in .env.local');
      console.log('   Get your key from: https://dashboard.stripe.com/test/apikeys');
    }
    process.exit(1);
  }
}

// Run the script
createProducts();
