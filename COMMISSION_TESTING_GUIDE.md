---
PROJECT: PhotoVault
TYPE: technical
TOPIC: Commission Testing Implementation Guide
---

# Commission Testing Implementation Guide

**Date:** November 19, 2025
**Purpose:** Guide for setting up and running commission structure tests
**Status:** Tests Written, Setup Required

---

## 📋 Overview

Comprehensive automated tests have been created to verify the 50/50 commission structure is working correctly. This guide explains how to set up the testing environment and execute the tests.

---

## 📁 Test Files Created

### 1. **COMMISSION_TEST_SCENARIOS.md**
- **Location:** `./COMMISSION_TEST_SCENARIOS.md`
- **Purpose:** Comprehensive manual test scenarios
- **Contains:** 9 major scenarios with 20+ test cases
- **Use For:** Manual verification, QA testing, documentation

### 2. **commission-service.test.ts**
- **Location:** `src/__tests__/lib/server/commission-service.test.ts`
- **Purpose:** Unit tests for commission calculation logic
- **Tests:** 40+ automated tests covering:
  - Commission amount calculations (50%)
  - Payout date scheduling (payment + 14 days)
  - Grace period logic (90 days)
  - Edge cases and error handling

### 3. **stripe.test.ts**
- **Location:** `src/__tests__/lib/stripe.test.ts`
- **Purpose:** Unit tests for Stripe configuration and helpers
- **Tests:** 30+ automated tests covering:
  - Commission rate constant verification (0.50)
  - Pricing model validation ($10/month)
  - Helper function accuracy
  - Business rule compliance

---

## 🛠️ Setup Instructions

### Step 1: Install Jest Testing Framework

```bash
cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"

# Install Jest and required dependencies
npm install --save-dev jest @types/jest ts-jest @testing-library/jest-dom

# Install additional testing utilities
npm install --save-dev @testing-library/react @testing-library/react-hooks
```

### Step 2: Create Jest Configuration

Create `jest.config.js` in project root:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_*.{js,jsx,ts,tsx}',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

### Step 3: Create Jest Setup File

Create `jest.setup.js` in project root:

```javascript
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
```

### Step 4: Add Test Scripts to package.json

Add to `"scripts"` section:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:commission": "jest commission-service.test.ts stripe.test.ts"
  }
}
```

---

## 🧪 Running Tests

### Run All Tests:
```bash
npm test
```

### Run Commission Tests Only:
```bash
npm run test:commission
```

### Run Tests in Watch Mode (Auto-rerun on file changes):
```bash
npm run test:watch
```

### Run Tests with Coverage Report:
```bash
npm run test:coverage
```

### Run Specific Test File:
```bash
npm test commission-service.test.ts
npm test stripe.test.ts
```

### Run Specific Test Suite:
```bash
npm test -- --testNamePattern="calculateCommissionAmount"
npm test -- --testNamePattern="Business Rules Compliance"
```

---

## ✅ Expected Test Results

### All Tests Should Pass:

**commission-service.test.ts:**
- ✅ 40+ tests pass
- ✅ All commission calculations return 50%
- ✅ Payout dates calculated correctly (+14 days)
- ✅ Grace period logic works (90 days)
- ✅ Edge cases handled properly

**stripe.test.ts:**
- ✅ 30+ tests pass
- ✅ PHOTOGRAPHER_COMMISSION_RATE = 0.50
- ✅ PRICING.CLIENT_MONTHLY.amount = 1000 cents
- ✅ Helper functions work correctly
- ✅ Business rules verified

### Example Output:
```
PASS  src/__tests__/lib/server/commission-service.test.ts
  Commission Service
    calculateCommissionAmount
      ✓ should calculate 50% commission for $10 payment (1000 cents) (2 ms)
      ✓ should calculate 50% commission for various amounts (1 ms)
      ✓ should handle odd-cent amounts with rounding (1 ms)
      ... (40+ more tests)

PASS  src/__tests__/lib/stripe.test.ts
  Stripe Configuration
    Constants
      ✓ PHOTOGRAPHER_COMMISSION_RATE should be exactly 0.50 (50%) (1 ms)
      ✓ PRICING.CLIENT_MONTHLY should be $10.00 (1000 cents) (1 ms)
      ... (30+ more tests)

Test Suites: 2 passed, 2 total
Tests:       70+ passed, 70+ total
Snapshots:   0 total
Time:        2.5s
```

---

## 🚨 If Tests Fail

### Failure Scenarios:

**1. Commission Rate is Wrong**
```
FAIL  commission-service.test.ts
  ✗ should calculate 50% commission for $10 payment
    Expected: 500
    Received: 800
```

**Action:** Check `src/lib/stripe.ts:51` - Verify `PHOTOGRAPHER_COMMISSION_RATE = 0.50`

**2. Payout Date Calculation Wrong**
```
FAIL  commission-service.test.ts
  ✗ should add exactly 14 days to payment date
    Expected: "2025-12-03"
    Received: "2025-12-04"
```

**Action:** Check `src/lib/server/commission-service.ts:28-34` - Verify date calculation logic

**3. Grace Period Wrong**
```
FAIL  commission-service.test.ts
  ✗ should return false when 90 or more days ago
    Expected: false
    Received: true
```

**Action:** Check `src/lib/server/commission-service.ts:38-43` - Verify 90-day threshold

---

## 📊 Test Coverage Goals

### Target Coverage:
- **Commission Calculation:** 100% coverage
- **Date Functions:** 100% coverage
- **Helper Functions:** 100% coverage
- **Edge Cases:** All scenarios covered

### Check Coverage:
```bash
npm run test:coverage
```

### Coverage Report Location:
`./coverage/lcov-report/index.html`

Open in browser to see detailed line-by-line coverage.

---

## 🔍 Manual Verification Steps

Even with automated tests passing, perform these manual checks:

### 1. Code Review Checklist:
- [ ] `src/lib/stripe.ts:51` - PHOTOGRAPHER_COMMISSION_RATE = 0.50
- [ ] No hardcoded "0.80" anywhere in commission code
- [ ] No hardcoded "80%" in email templates
- [ ] All commission calculations use the constant

### 2. Database Query Verification:
```sql
-- Run after processing test payments
SELECT
  cp.commission_amount,
  ph.amount_paid_cents / 100.0 as payment_amount,
  (cp.commission_amount / (ph.amount_paid_cents / 100.0)) * 100 as commission_percent
FROM commission_payments cp
JOIN payment_history ph ON cp.client_payment_id = ph.id
ORDER BY cp.created_at DESC
LIMIT 10;

-- All commission_percent values should be 50.00
```

### 3. End-to-End Test (With Real Stripe):
1. Process $10 test payment via Stripe
2. Check webhook creates commission
3. Verify database: commission_amount = 5.00
4. Verify payout date = payment_date + 14 days
5. Check email shows correct amounts

---

## 📝 Test Maintenance

### When to Update Tests:

**1. Commission Rate Changes:**
- Update `PHOTOGRAPHER_COMMISSION_RATE` constant
- Update expected values in all tests
- Update test scenarios document

**2. Pricing Changes:**
- Update `PRICING` constants
- Update test expectations
- Verify all calculations still work

**3. Grace Period Changes:**
- Update grace period logic
- Update `isInGracePeriod()` tests
- Update test scenarios

**4. Payout Schedule Changes:**
- Update `calculateScheduledPayoutDate()` logic
- Update expected values in tests

---

## 🎯 Success Criteria

Tests are considered successful when:

1. ✅ All 70+ automated tests pass
2. ✅ Commission calculations always return 50%
3. ✅ No hardcoded commission values in code
4. ✅ Payout dates calculated correctly
5. ✅ Grace period logic works
6. ✅ Edge cases handled properly
7. ✅ Manual database queries show 50/50 split
8. ✅ End-to-end Stripe test succeeds

---

## 📚 Additional Resources

### Related Documentation:
- **COMMISSION_TEST_SCENARIOS.md** - Manual test cases
- **STRIPE_VERIFICATION_CHECKLIST.md** - Code verification checklist
- **STRIPE_INTEGRATION_COMPLETE.md** - Stripe setup guide
- **STRIPE_COMMISSION_FIX.md** - Commission rate fix history

### Key Files:
- **Commission Logic:** `src/lib/server/commission-service.ts`
- **Stripe Config:** `src/lib/stripe.ts`
- **Webhook Handler:** `src/app/api/webhooks/stripe/route.ts`

### External Resources:
- **Jest Documentation:** https://jestjs.io/docs/getting-started
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro/
- **Next.js Testing:** https://nextjs.org/docs/testing

---

## 🚀 Quick Start (TL;DR)

```bash
# Install dependencies
npm install --save-dev jest @types/jest ts-jest @testing-library/jest-dom

# Add test script to package.json
# "test": "jest"

# Run tests
npm test

# Check results
# Expected: All tests pass, commission rate verified at 50%
```

---

**Status:** Ready for Test Execution
**Next Step:** Install Jest and run automated tests
**Owner:** Development Team
**Priority:** HIGH (Launch Blocker)
