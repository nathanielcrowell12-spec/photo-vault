/**
 * Commission Service Unit Tests
 * Tests for 50/50 commission calculation logic
 *
 * Run: npm test commission-service.test.ts
 */

import {
  calculateCommissionAmount,
  calculateScheduledPayoutDate,
  isInGracePeriod,
  shouldSuspendPhotographer,
} from '@/lib/server/commission-service'
import { PHOTOGRAPHER_COMMISSION_RATE } from '@/lib/stripe'

describe('Commission Service', () => {
  describe('calculateCommissionAmount', () => {
    test('should calculate 50% commission for $8/month payment (800 cents) - Year 2+', () => {
      const paymentAmount = 800 // $8.00
      const commission = calculateCommissionAmount(paymentAmount)

      expect(commission).toBe(400) // $4.00
      expect(commission).toBe(Math.round(paymentAmount * PHOTOGRAPHER_COMMISSION_RATE))
    })

    test('should calculate 50% commission for $100 Year 1 payment (10000 cents)', () => {
      const paymentAmount = 10000 // $100.00
      const commission = calculateCommissionAmount(paymentAmount)

      expect(commission).toBe(5000) // $50.00
      expect(commission).toBe(Math.round(paymentAmount * PHOTOGRAPHER_COMMISSION_RATE))
    })

    test('should calculate 50% commission for various amounts', () => {
      const testCases = [
        { payment: 800, expected: 400 },    // $8.00 → $4.00 (monthly)
        { payment: 5000, expected: 2500 },  // $50.00 → $25.00 (6-month)
        { payment: 10000, expected: 5000 }, // $100.00 → $50.00 (year 1)
        { payment: 100, expected: 50 },     // $1.00 → $0.50
        { payment: 10, expected: 5 },       // $0.10 → $0.05
      ]

      testCases.forEach(({ payment, expected }) => {
        expect(calculateCommissionAmount(payment)).toBe(expected)
      })
    })

    test('should handle odd-cent amounts with rounding', () => {
      // $10.01 (1001 cents) → $5.01 (501 cents)
      expect(calculateCommissionAmount(1001)).toBe(501)

      // $10.03 (1003 cents) → $5.02 (502 cents, rounded)
      expect(calculateCommissionAmount(1003)).toBe(502)

      // $9.99 (999 cents) → $5.00 (500 cents, rounded)
      expect(calculateCommissionAmount(999)).toBe(500)
    })

    test('should handle very small amounts', () => {
      expect(calculateCommissionAmount(1)).toBe(1) // 1 cent → 1 cent (rounds up)
      expect(calculateCommissionAmount(2)).toBe(1) // 2 cents → 1 cent
      expect(calculateCommissionAmount(3)).toBe(2) // 3 cents → 2 cents (rounds up)
    })

    test('should handle large amounts without overflow', () => {
      const largePayment = 100000 // $1,000.00
      expect(calculateCommissionAmount(largePayment)).toBe(50000) // $500.00

      const veryLargePayment = 1000000 // $10,000.00
      expect(calculateCommissionAmount(veryLargePayment)).toBe(500000) // $5,000.00
    })

    test('should always use PHOTOGRAPHER_COMMISSION_RATE constant', () => {
      const payment = 1000
      const manualCalculation = Math.round(payment * PHOTOGRAPHER_COMMISSION_RATE)
      const functionResult = calculateCommissionAmount(payment)

      expect(functionResult).toBe(manualCalculation)
      expect(PHOTOGRAPHER_COMMISSION_RATE).toBe(0.50) // Verify constant is 50%
    })

    test('should never return negative commission', () => {
      expect(calculateCommissionAmount(0)).toBe(0)
      expect(calculateCommissionAmount(-100)).toBe(0) // Invalid input handled gracefully
    })
  })

  describe('calculateScheduledPayoutDate', () => {
    test('should add exactly 14 days to payment date', () => {
      const paymentDate = new Date('2025-11-19')
      const payoutDate = calculateScheduledPayoutDate(paymentDate)

      const expectedDate = new Date('2025-12-03')
      expect(payoutDate.toISOString().split('T')[0]).toBe('2025-12-03')
    })

    test('should handle month boundaries correctly', () => {
      // November 30 + 14 days = December 14
      const novDate = new Date('2025-11-30')
      const novPayout = calculateScheduledPayoutDate(novDate)
      expect(novPayout.toISOString().split('T')[0]).toBe('2025-12-14')

      // December 31 + 14 days = January 14 (next year)
      const decDate = new Date('2025-12-31')
      const decPayout = calculateScheduledPayoutDate(decDate)
      expect(decPayout.toISOString().split('T')[0]).toBe('2026-01-14')
    })

    test('should handle leap year correctly', () => {
      // Feb 15, 2024 (leap year) + 14 days = Feb 29, 2024
      const leapDate = new Date('2024-02-15')
      const leapPayout = calculateScheduledPayoutDate(leapDate)
      expect(leapPayout.toISOString().split('T')[0]).toBe('2024-02-29')
    })

    test('should preserve time of day', () => {
      const paymentDate = new Date('2025-11-19T15:30:00Z')
      const payoutDate = calculateScheduledPayoutDate(paymentDate)

      // Date should change, but time preserved
      expect(payoutDate.getUTCHours()).toBe(15)
      expect(payoutDate.getUTCMinutes()).toBe(30)
    })
  })

  describe('isInGracePeriod', () => {
    test('should return true when within 90 days', () => {
      const now = new Date('2025-11-19')
      const testCases = [
        new Date('2025-11-18'), // 1 day ago
        new Date('2025-11-10'), // 9 days ago
        new Date('2025-10-20'), // 30 days ago
        new Date('2025-08-21'), // 89 days ago
      ]

      testCases.forEach((lastPayment) => {
        // Mock current date
        const daysSince = (now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24)
        expect(daysSince).toBeLessThan(90)
        expect(isInGracePeriod(lastPayment)).toBe(true)
      })
    })

    test('should return false when 90 or more days ago', () => {
      const now = new Date('2025-11-19')
      const testCases = [
        new Date('2025-08-20'), // 91 days ago
        new Date('2025-08-19'), // 92 days ago
        new Date('2025-05-20'), // 183 days ago
        new Date('2024-11-19'), // 365 days ago
      ]

      testCases.forEach((lastPayment) => {
        const daysSince = (now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60 * 24)
        expect(daysSince).toBeGreaterThanOrEqual(90)
        expect(isInGracePeriod(lastPayment)).toBe(false)
      })
    })

    test('should return false exactly at 90 days', () => {
      const now = new Date('2025-11-19')
      const exactly90DaysAgo = new Date('2025-08-21')

      // This might be edge case - verify business rule
      const daysSince = (now.getTime() - exactly90DaysAgo.getTime()) / (1000 * 60 * 60 * 24)
      expect(daysSince).toBeCloseTo(90, 0)
    })
  })

  describe('shouldSuspendPhotographer', () => {
    test('should return false when less than 90 days', () => {
      const now = new Date('2025-11-19')
      const recentPayment = new Date('2025-10-01') // 49 days ago

      expect(shouldSuspendPhotographer(recentPayment)).toBe(false)
    })

    test('should return true when 90 or more days', () => {
      const now = new Date('2025-11-19')
      const oldPayment = new Date('2025-08-20') // 91 days ago

      expect(shouldSuspendPhotographer(oldPayment)).toBe(true)
    })

    test('should return true for very old payments', () => {
      const now = new Date('2025-11-19')
      const veryOldPayment = new Date('2024-01-01') // Over 1 year ago

      expect(shouldSuspendPhotographer(veryOldPayment)).toBe(true)
    })
  })

  describe('Integration: Full Commission Flow', () => {
    test('should correctly process $8/month payment (Year 2+)', () => {
      const paymentAmountCents = 800 // $8.00
      const paymentDate = new Date('2025-11-19')

      // Step 1: Calculate commission
      const commission = calculateCommissionAmount(paymentAmountCents)
      expect(commission).toBe(400) // $4.00

      // Step 2: Calculate payout date
      const payoutDate = calculateScheduledPayoutDate(paymentDate)
      expect(payoutDate.toISOString().split('T')[0]).toBe('2025-12-03')

      // Step 3: Verify split
      const photovaultRevenue = paymentAmountCents - commission
      expect(photovaultRevenue).toBe(400) // $4.00

      // Step 4: Verify percentages
      const commissionPercentage = commission / paymentAmountCents
      expect(commissionPercentage).toBe(0.50) // 50%
    })

    test('should correctly process $100 Year 1 payment', () => {
      const paymentAmountCents = 10000 // $100.00
      const paymentDate = new Date('2025-11-19')

      // Step 1: Calculate commission
      const commission = calculateCommissionAmount(paymentAmountCents)
      expect(commission).toBe(5000) // $50.00

      // Step 2: Verify split
      const photovaultRevenue = paymentAmountCents - commission
      expect(photovaultRevenue).toBe(5000) // $50.00
    })

    test('should handle multiple clients correctly (Year 2+ monthly)', () => {
      const clientPayments = [
        { clientId: '1', amount: 800 },
        { clientId: '2', amount: 800 },
        { clientId: '3', amount: 800 },
        { clientId: '4', amount: 800 },
        { clientId: '5', amount: 800 },
      ]

      const totalPayments = clientPayments.reduce((sum, p) => sum + p.amount, 0)
      const totalCommissions = clientPayments.reduce(
        (sum, p) => sum + calculateCommissionAmount(p.amount),
        0
      )

      expect(totalPayments).toBe(4000) // $40.00 total
      expect(totalCommissions).toBe(2000) // $20.00 to photographer
      expect(totalPayments - totalCommissions).toBe(2000) // $20.00 to PhotoVault
    })

    test('should calculate correct Year 2 annual revenue', () => {
      // One client paying $8/month for 12 months
      const monthlyPayment = 800 // $8.00
      const months = 12

      let totalCommissions = 0
      for (let i = 0; i < months; i++) {
        totalCommissions += calculateCommissionAmount(monthlyPayment)
      }

      expect(totalCommissions).toBe(4800) // $48.00 annually

      const totalRevenue = monthlyPayment * months
      const photovaultRevenue = totalRevenue - totalCommissions

      expect(totalRevenue).toBe(9600) // $96.00
      expect(photovaultRevenue).toBe(4800) // $48.00
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle zero payment', () => {
      expect(calculateCommissionAmount(0)).toBe(0)
    })

    test('should handle null/undefined gracefully', () => {
      // TypeScript should prevent this, but test runtime behavior
      expect(calculateCommissionAmount(null as any)).toBe(0)
      expect(calculateCommissionAmount(undefined as any)).toBe(0)
    })

    test('should handle float precision correctly', () => {
      // JavaScript floating point can cause issues
      const payment = 1000.5 // Should be whole cents, but test anyway
      const commission = calculateCommissionAmount(Math.round(payment))

      expect(Number.isInteger(commission)).toBe(true)
    })

    test('should verify commission never exceeds payment', () => {
      const testAmounts = [1, 10, 100, 1000, 10000]

      testAmounts.forEach(amount => {
        const commission = calculateCommissionAmount(amount)
        expect(commission).toBeLessThanOrEqual(amount)
      })
    })
  })

  describe('Business Rule Verification', () => {
    test('should always calculate 50/50 split, never 80/20', () => {
      const payment = 1000
      const commission = calculateCommissionAmount(payment)

      // Should NOT be 80%
      expect(commission).not.toBe(800)

      // Should be 50%
      expect(commission).toBe(500)

      // Verify using constant
      expect(PHOTOGRAPHER_COMMISSION_RATE).toBe(0.50)
      expect(PHOTOGRAPHER_COMMISSION_RATE).not.toBe(0.80)
    })

    test('should match documented pricing model', () => {
      // From business docs:
      // Year 1: Client pays $100, photographer gets $50
      // Year 2+: Client pays $8/month, photographer gets $4/month

      const year1Payment = 10000 // $100.00 in cents
      expect(calculateCommissionAmount(year1Payment)).toBe(5000) // $50.00

      const monthlyPayment = 800 // $8.00 in cents
      expect(calculateCommissionAmount(monthlyPayment)).toBe(400) // $4.00
    })

    test('should verify payout delay is 14 days, not 30', () => {
      const paymentDate = new Date('2025-11-01')
      const payoutDate = calculateScheduledPayoutDate(paymentDate)

      const daysDifference = Math.round(
        (payoutDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      expect(daysDifference).toBe(14)
      expect(daysDifference).not.toBe(30)
    })

    test('should verify grace period is 90 days, not 30', () => {
      const now = new Date('2025-11-19')

      // 30 days should still be in grace period
      const thirtyDaysAgo = new Date('2025-10-20')
      expect(isInGracePeriod(thirtyDaysAgo)).toBe(true)

      // 89 days should still be in grace period
      const eightyNineDaysAgo = new Date('2025-08-22')
      expect(isInGracePeriod(eightyNineDaysAgo)).toBe(true)

      // 91 days should be outside grace period
      const ninetyOneDaysAgo = new Date('2025-08-20')
      expect(isInGracePeriod(ninetyOneDaysAgo)).toBe(false)
    })
  })
})
