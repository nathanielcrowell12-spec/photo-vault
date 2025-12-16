/**
 * Analytics Helper Functions
 *
 * Shared utilities for analytics tracking to ensure consistency
 * and avoid race conditions with first-time flag checks.
 */
import { createServiceRoleClient } from '@/lib/supabase-server'

/**
 * Check if this is the first time something happened for a user
 *
 * IMPORTANT: Call this BEFORE creating the record, not after!
 * This avoids race conditions where the count includes the record being created.
 *
 * @example
 * const isFirstGallery = await isFirstTime('photo_galleries', 'photographer_id', userId)
 * // Then create the gallery
 * // Then track the event with isFirstGallery flag
 */
export async function isFirstTime(
  table: string,
  column: string,
  value: string,
  additionalFilters?: Record<string, unknown>
): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient()

    let query = supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(column, value)

    // Add any additional filters (e.g., status = 'paid' for commissions)
    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, val]) => {
        query = query.eq(key, val)
      })
    }

    const { count } = await query

    return (count || 0) === 0
  } catch (error) {
    console.error('[Analytics Helper] isFirstTime check failed:', error)
    // Return false on error - don't break the flow, just don't mark as "first"
    return false
  }
}

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
 * Get signup date for a photographer by ID
 *
 * Uses service role client so it works in API routes
 */
export async function getPhotographerSignupDate(
  photographerId: string
): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient()

    const { data } = await supabase
      .from('photographers')
      .select('created_at')
      .eq('id', photographerId)
      .single()

    return data?.created_at || null
  } catch (error) {
    console.error('[Analytics Helper] getPhotographerSignupDate failed:', error)
    return null
  }
}

/**
 * Get signup date for a client by ID
 */
export async function getClientSignupDate(
  clientId: string
): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient()

    const { data } = await supabase
      .from('clients')
      .select('created_at')
      .eq('id', clientId)
      .single()

    return data?.created_at || null
  } catch (error) {
    console.error('[Analytics Helper] getClientSignupDate failed:', error)
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
 *
 * @example
 * if (validateRequiredProperties({ gallery_id, photographer_id }, ['gallery_id', 'photographer_id'])) {
 *   trackServerEvent(...)
 * }
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
