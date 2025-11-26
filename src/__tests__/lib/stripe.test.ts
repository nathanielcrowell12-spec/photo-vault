/**
 * Stripe Configuration Unit Tests
 * Tests for commission rate constants and helper functions
 *
 * Run: npm test stripe.test.ts
 */

import {
  PHOTOGRAPHER_COMMISSION_RATE,
  PRICING,
  calculateCommission,
  formatAmount,
  dollarsToCents,
} from '@/lib/stripe'

describe('Stripe Configuration', () => {
  describe('Constants', () => {
    test('PHOTOGRAPHER_COMMISSION_RATE should be exactly 0.50 (50%)', () => {
      expect(PHOTOGRAPHER_COMMISSION_RATE).toBe(0.50)
      expect(PHOTOGRAPHER_COMMISSION_RATE).not.toBe(0.80) // Should NOT be 80%
      expect(PHOTOGRAPHER_COMMISSION_RATE).not.toBe(0.20) // Should NOT be 20%
    })

    test('PRICING.CLIENT_MONTHLY should be $8.00 (800 cents) for Year 2+', () => {
      expect(PRICING.CLIENT_MONTHLY.amount).toBe(800)
      expect(PRICING.CLIENT_MONTHLY.currency).toBe('usd')
      expect(PRICING.CLIENT_MONTHLY.interval).toBe('month')
    })

    test('PRICING.CLIENT_YEAR_1 should be $100.00 (10000 cents)', () => {
      expect(PRICING.CLIENT_YEAR_1.amount).toBe(10000)
      expect(PRICING.CLIENT_YEAR_1.currency).toBe('usd')
      expect(PRICING.CLIENT_YEAR_1.interval).toBe('year')
    })

    test('PRICING.CLIENT_6_MONTH should be $50.00 (5000 cents)', () => {
      expect(PRICING.CLIENT_6_MONTH.amount).toBe(5000)
      expect(PRICING.CLIENT_6_MONTH.currency).toBe('usd')
    })

    test('should have correct pricing tiers', () => {
      expect(PRICING).toHaveProperty('CLIENT_MONTHLY')
      expect(PRICING).toHaveProperty('CLIENT_YEAR_1')
      expect(PRICING).toHaveProperty('CLIENT_6_MONTH')
    })
  })

  describe('calculateCommission', () => {
    test('should calculate 50% commission by default', () => {
      const amount = 1000 // $10.00
      const commission = calculateCommission(amount)

      expect(commission).toBe(500) // $5.00
    })

    test('should use PHOTOGRAPHER_COMMISSION_RATE constant', () => {
      const amount = 1000
      const commission = calculateCommission(amount)
      const expected = Math.round(amount * PHOTOGRAPHER_COMMISSION_RATE)

      expect(commission).toBe(expected)
    })

    test('should handle custom commission rates', () => {
      const amount = 1000

      // Custom 60% rate
      expect(calculateCommission(amount, 0.60)).toBe(600)

      // Custom 30% rate
      expect(calculateCommission(amount, 0.30)).toBe(300)
    })

    test('should round correctly for odd amounts', () => {
      // $10.01 (1001 cents) at 50% = 500.5 → 501 (rounds up)
      expect(calculateCommission(1001)).toBe(501)

      // $10.03 (1003 cents) at 50% = 501.5 → 502 (rounds up)
      expect(calculateCommission(1003)).toBe(502)
    })

    test('should handle various payment amounts', () => {
      expect(calculateCommission(100)).toBe(50)    // $1.00 → $0.50
      expect(calculateCommission(500)).toBe(250)   // $5.00 → $2.50
      expect(calculateCommission(2000)).toBe(1000) // $20.00 → $10.00
      expect(calculateCommission(10000)).toBe(5000) // $100.00 → $50.00
    })
  })

  describe('formatAmount', () => {
    test('should format cents to dollar string', () => {
      expect(formatAmount(1000)).toBe('$10.00')
      expect(formatAmount(500)).toBe('$5.00')
      expect(formatAmount(100)).toBe('$1.00')
      expect(formatAmount(50)).toBe('$0.50')
      expect(formatAmount(1)).toBe('$0.01')
    })

    test('should handle zero', () => {
      expect(formatAmount(0)).toBe('$0.00')
    })

    test('should always show 2 decimal places', () => {
      expect(formatAmount(1000)).toMatch(/\.\d{2}$/)
      expect(formatAmount(123)).toMatch(/\.\d{2}$/)
    })

    test('should handle large amounts', () => {
      expect(formatAmount(100000)).toBe('$1000.00')
      expect(formatAmount(1000000)).toBe('$10000.00')
    })
  })

  describe('dollarsToCents', () => {
    test('should convert dollars to cents', () => {
      expect(dollarsToCents(10)).toBe(1000)
      expect(dollarsToCents(5)).toBe(500)
      expect(dollarsToCents(1)).toBe(100)
      expect(dollarsToCents(0.50)).toBe(50)
      expect(dollarsToCents(0.01)).toBe(1)
    })

    test('should handle zero', () => {
      expect(dollarsToCents(0)).toBe(0)
    })

    test('should round to nearest cent', () => {
      expect(dollarsToCents(10.005)).toBe(1001) // Rounds up
      expect(dollarsToCents(10.004)).toBe(1000) // Rounds down
    })

    test('should handle large amounts', () => {
      expect(dollarsToCents(1000)).toBe(100000)
      expect(dollarsToCents(10000)).toBe(1000000)
    })
  })

  describe('Integration: Revenue Split Calculation', () => {
    test('should calculate correct 50/50 split for $8/month payment (Year 2+)', () => {
      const paymentCents = PRICING.CLIENT_MONTHLY.amount // 800 cents
      const commission = calculateCommission(paymentCents)
      const platformRevenue = paymentCents - commission

      expect(commission).toBe(400) // $4.00
      expect(platformRevenue).toBe(400) // $4.00
      expect(formatAmount(commission)).toBe('$4.00')
      expect(formatAmount(platformRevenue)).toBe('$4.00')
    })

    test('should calculate correct 50/50 split for $100 Year 1 payment', () => {
      const paymentCents = PRICING.CLIENT_YEAR_1.amount // 10000 cents
      const commission = calculateCommission(paymentCents)
      const platformRevenue = paymentCents - commission

      expect(commission).toBe(5000) // $50.00
      expect(platformRevenue).toBe(5000) // $50.00
      expect(formatAmount(commission)).toBe('$50.00')
      expect(formatAmount(platformRevenue)).toBe('$50.00')
    })

    test('should calculate monthly revenue for multiple clients (Year 2+)', () => {
      const clientCount = 10
      const paymentPerClient = PRICING.CLIENT_MONTHLY.amount // $8

      const totalPayments = clientCount * paymentPerClient
      const totalCommissions = clientCount * calculateCommission(paymentPerClient)
      const totalPlatformRevenue = totalPayments - totalCommissions

      expect(totalPayments).toBe(8000) // $80.00
      expect(totalCommissions).toBe(4000) // $40.00
      expect(totalPlatformRevenue).toBe(4000) // $40.00
    })

    test('should calculate Year 2 annual revenue correctly', () => {
      const monthlyPayment = PRICING.CLIENT_MONTHLY.amount // $8
      const months = 12

      const annualPayments = monthlyPayment * months
      const annualCommission = months * calculateCommission(monthlyPayment)
      const annualPlatformRevenue = annualPayments - annualCommission

      expect(annualPayments).toBe(9600) // $96.00
      expect(annualCommission).toBe(4800) // $48.00
      expect(annualPlatformRevenue).toBe(4800) // $48.00
    })
  })

  describe('Business Rules Compliance', () => {
    test('should never use 80/20 split', () => {
      const payment = 1000
      const commission = calculateCommission(payment)

      // Should NOT be 80% to photographer
      expect(commission).not.toBe(800)

      // Should NOT be 20% to platform
      expect(payment - commission).not.toBe(200)

      // Should be 50/50
      expect(commission).toBe(500)
      expect(payment - commission).toBe(500)
    })

    test('should match documentation: $100 Year 1 client payment', () => {
      const clientPayment = 10000 // $100.00

      expect(calculateCommission(clientPayment)).toBe(5000) // $50.00 to photographer
      expect(clientPayment - calculateCommission(clientPayment)).toBe(5000) // $50.00 to platform
    })

    test('should match documentation: $8/month Year 2+ client payment', () => {
      const clientPayment = 800 // $8.00

      expect(calculateCommission(clientPayment)).toBe(400) // $4.00 to photographer
      expect(clientPayment - calculateCommission(clientPayment)).toBe(400) // $4.00 to platform
    })

    test('should verify pricing constants match business model', () => {
      // From business docs:
      // - Year 1: $100 upfront (or $50 for 6-month)
      // - Year 2+: $8/month
      // - Commission: 50%

      expect(PRICING.CLIENT_YEAR_1.amount).toBe(10000) // $100
      expect(PRICING.CLIENT_6_MONTH.amount).toBe(5000) // $50
      expect(PRICING.CLIENT_MONTHLY.amount).toBe(800) // $8
      expect(PHOTOGRAPHER_COMMISSION_RATE).toBe(0.50)
      expect(Object.keys(PRICING)).toHaveLength(3) // Year 1, 6-month, Monthly
    })
  })

  describe('Type Safety', () => {
    test('PRICING should be readonly', () => {
      // TypeScript should prevent this, but verify at runtime
      expect(() => {
        // @ts-expect-error - Testing readonly behavior
        PRICING.CLIENT_MONTHLY = { amount: 2000, currency: 'usd', interval: 'month' }
      }).toThrow()
    })

    test('commission rate should be a number between 0 and 1', () => {
      expect(typeof PHOTOGRAPHER_COMMISSION_RATE).toBe('number')
      expect(PHOTOGRAPHER_COMMISSION_RATE).toBeGreaterThan(0)
      expect(PHOTOGRAPHER_COMMISSION_RATE).toBeLessThanOrEqual(1)
    })

    test('pricing amount should be positive integer', () => {
      expect(Number.isInteger(PRICING.CLIENT_MONTHLY.amount)).toBe(true)
      expect(PRICING.CLIENT_MONTHLY.amount).toBeGreaterThan(0)
    })
  })

  describe('Consistency Checks', () => {
    test('should verify all commission calculations use same constant', () => {
      const amount = 1000

      // Both functions should use same constant
      const direct = calculateCommission(amount)
      const manual = Math.round(amount * PHOTOGRAPHER_COMMISSION_RATE)

      expect(direct).toBe(manual)
    })

    test('should verify dollar/cent conversions are reversible', () => {
      const dollars = 10.50
      const cents = dollarsToCents(dollars)
      const formatted = formatAmount(cents)

      expect(cents).toBe(1050)
      expect(formatted).toBe('$10.50')
    })
  })
})
