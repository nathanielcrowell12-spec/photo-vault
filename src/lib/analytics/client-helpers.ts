/**
 * Client-side Analytics Helper Functions
 *
 * These helpers can be used in client components.
 * For server-side helpers, see helpers.ts
 */

/**
 * Calculate seconds since user signed up
 *
 * Returns null if signup date is not available (don't track meaningless data)
 *
 * @example
 * const timeFromSignup = calculateTimeFromSignup(user.created_at)
 * if (timeFromSignup !== null) {
 *   track({ time_from_signup_seconds: timeFromSignup })
 * }
 */
export function calculateTimeFromSignup(
  signupDate: string | Date | null | undefined
): number | null {
  if (!signupDate) {
    return null
  }

  try {
    const signupTime = new Date(signupDate).getTime()
    if (isNaN(signupTime)) {
      return null
    }

    const now = Date.now()
    return Math.round((now - signupTime) / 1000)
  } catch {
    return null
  }
}

/**
 * Map payment option ID to plan type for analytics
 */
export function mapPaymentOptionToPlanType(
  paymentOptionId: string | undefined
): 'annual' | 'monthly' | '6month' | undefined {
  if (!paymentOptionId) return undefined

  switch (paymentOptionId) {
    case 'year_package':
      return 'annual'
    case 'six_month_package':
      return '6month'
    case 'monthly':
    case 'client_monthly':
      return 'monthly'
    default:
      // Log unknown types but don't break
      console.warn('[Analytics Helper] Unknown payment option:', paymentOptionId)
      return undefined
  }
}

/**
 * Validate required properties before tracking
 *
 * Returns true if all required properties are present and non-empty
 */
export function validateRequiredProperties(
  properties: Record<string, unknown>,
  required: string[]
): boolean {
  for (const key of required) {
    const value = properties[key]
    if (value === undefined || value === null || value === '') {
      console.warn(`[Analytics Helper] Missing required property: ${key}`)
      return false
    }
  }
  return true
}
