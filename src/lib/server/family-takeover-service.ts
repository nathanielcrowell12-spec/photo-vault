import { createServiceRoleClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email/email-service'

/**
 * Helper function to complete takeover after successful payment
 * Called from webhook handler
 */
export async function completeTakeover(
  serviceSupabase: ReturnType<typeof createServiceRoleClient>,
  metadata: {
    account_id: string
    secondary_id: string
    takeover_type: 'full_primary' | 'billing_only'
    reason: string
    reason_text: string
    new_payer_user_id: string
    previous_primary_id: string
  },
  stripeSubscriptionId: string
) {
  const {
    account_id,
    secondary_id,
    takeover_type,
    reason,
    reason_text,
    new_payer_user_id,
    previous_primary_id,
  } = metadata

  try {
    // 1. Record takeover in audit log
    await serviceSupabase
      .from('account_takeovers')
      .insert({
        account_id,
        previous_primary_id,
        new_primary_id: takeover_type === 'full_primary' ? new_payer_user_id : null,
        billing_payer_id: takeover_type === 'billing_only' ? new_payer_user_id : null,
        takeover_type,
        reason: reason === 'not_specified' ? null : reason,
        reason_text: reason_text || null,
      })

    // 2. Update secondary as billing payer
    await serviceSupabase
      .from('secondaries')
      .update({
        is_billing_payer: true,
        became_billing_payer_at: new Date().toISOString(),
        has_payment_method: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', secondary_id)

    // 3. If full_primary, update ownership tracking
    if (takeover_type === 'full_primary') {
      await serviceSupabase
        .from('user_profiles')
        .update({
          original_primary_id: previous_primary_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account_id)
    }

    // 4. Restore access on any suspended subscriptions
    await serviceSupabase
      .from('subscriptions')
      .update({
        access_suspended: false,
        access_suspended_at: null,
        payment_failure_count: 0,
        last_payment_failure_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', account_id)

    // 5. Get info for notifications
    const { data: secondary } = await serviceSupabase
      .from('secondaries')
      .select('name, email, relationship')
      .eq('id', secondary_id)
      .single()

    const { data: primary } = await serviceSupabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', previous_primary_id)
      .single()

    const { count: galleryCount } = await serviceSupabase
      .from('photo_galleries')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', account_id)

    // 6. Send takeover confirmation email to new payer
    if (secondary?.email) {
      await EmailService.sendTakeoverConfirmationEmail({
        newPayerName: secondary.name,
        newPayerEmail: secondary.email,
        previousPrimaryName: primary?.full_name || 'Account Holder',
        takeoverType: takeover_type,
        galleryCount: galleryCount || 0,
      })
    }

    // 7. Notify photographer (get from galleries)
    const { data: galleries } = await serviceSupabase
      .from('photo_galleries')
      .select('photographer_id')
      .eq('client_id', account_id)
      .limit(1)

    if (galleries?.[0]?.photographer_id) {
      const { data: photographer } = await serviceSupabase
        .from('photographers')
        .select('user_id')
        .eq('id', galleries[0].photographer_id)
        .single()

      if (photographer?.user_id) {
        const { data: photographerProfile } = await serviceSupabase
          .from('user_profiles')
          .select('full_name, email')
          .eq('id', photographer.user_id)
          .single()

        if (photographerProfile?.email && secondary) {
          await EmailService.sendPhotographerTakeoverNotificationEmail({
            photographerName: photographerProfile.full_name || 'Photographer',
            photographerEmail: photographerProfile.email,
            originalClientName: primary?.full_name || 'Client',
            newContactName: secondary.name,
            newContactEmail: secondary.email,
            relationship: secondary.relationship,
            reason: reason === 'not_specified' ? 'other' : reason,
            reasonText: reason_text,
          })
        }
      }
    }

    console.log(`[Takeover] Completed takeover: ${takeover_type} for account ${account_id} by secondary ${secondary_id}`)

    return { success: true }
  } catch (error) {
    console.error('[Takeover] Error completing takeover:', error)
    throw error
  }
}
