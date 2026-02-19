import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email/email-service'
import { enrollPhotographerDrip } from '@/lib/email/drip-enrollment'

export const dynamic = 'force-dynamic'

/**
 * Send Photographer Welcome Email
 * POST /api/email/photographer-welcome
 *
 * Triggered during signup flow (fire-and-forget from AuthContext).
 * Contains the PHOTOVAULT_BETA_2026 coupon code.
 *
 * Body:
 * {
 *   photographerName?: string    // defaults to "Photographer"
 *   photographerEmail: string    // required
 *   businessName?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { photographerName, photographerEmail, businessName } = await request.json()

    if (!photographerEmail) {
      return NextResponse.json({ error: 'Missing photographerEmail' }, { status: 400 })
    }

    await EmailService.sendPhotographerWelcomeEmail({
      photographerName: photographerName || 'Photographer',
      photographerEmail,
      businessName,
    })

    // Enroll in post-signup drip sequence (non-blocking, idempotent)
    enrollPhotographerDrip(user.id, {
      photographerName: photographerName || 'Photographer',
      photographerEmail,
    }).catch((err) => {
      logger.error('[Welcome Email] Drip enrollment failed (non-blocking):', err)
    })

    logger.info('[Welcome Email] Sent to', { email: photographerEmail })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[Welcome Email] Failed to send:', error)
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}
