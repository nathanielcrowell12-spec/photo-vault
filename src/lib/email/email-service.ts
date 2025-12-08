// CRITICAL: Use dynamic import for resend to prevent build-time evaluation
// Do NOT add static import for resend module

// Helper to get resend client (uses dynamic import)
const getClient = async () => {
  const { getResendClient } = await import('./resend')
  return getResendClient()
}

// Helper to get FROM_EMAIL (uses dynamic import)
const getFromEmail = async () => {
  const { FROM_EMAIL } = await import('./resend')
  return FROM_EMAIL
}
import {
  getGalleryReadyEmailHTML,
  getGalleryReadyEmailText,
  getWelcomeEmailHTML,
  getWelcomeEmailText,
  getWelcomeEmailWithPasswordHTML,
  getWelcomeEmailWithPasswordText,
  type GalleryReadyEmailData,
  type WelcomeEmailData,
  type WelcomeEmailWithPasswordData,
} from './templates'
import {
  getClientInvitationEmailHTML,
  getClientInvitationEmailText,
  getPhotographerWelcomeEmailHTML,
  getPhotographerWelcomeEmailText,
  getPaymentSuccessfulEmailHTML,
  getPaymentSuccessfulEmailText,
  type ClientInvitationEmailData,
  type PhotographerWelcomeEmailData,
  type PaymentSuccessfulEmailData,
} from './critical-templates'
import {
  getSubscriptionExpiringEmailHTML,
  getSubscriptionExpiringEmailText,
  getPaymentFailedEmailHTML,
  getPaymentFailedEmailText,
  getPayoutNotificationEmailHTML,
  getPayoutNotificationEmailText,
  type SubscriptionExpiringEmailData,
  type PaymentFailedEmailData,
  type PayoutNotificationEmailData,
} from './revenue-templates'
import {
  getFirstGalleryUploadEmailHTML,
  getFirstGalleryUploadEmailText,
  getGalleryAccessRestoredEmailHTML,
  getGalleryAccessRestoredEmailText,
  type FirstGalleryUploadEmailData,
  type GalleryAccessRestoredEmailData,
} from './engagement-templates'
import {
  getSecondaryInvitationEmailHTML,
  getSecondaryInvitationEmailText,
  getGracePeriodAlertEmailHTML,
  getGracePeriodAlertEmailText,
  getTakeoverConfirmationEmailHTML,
  getTakeoverConfirmationEmailText,
  getPhotographerTakeoverNotificationHTML,
  getPhotographerTakeoverNotificationText,
  type SecondaryInvitationEmailData,
  type GracePeriodAlertEmailData,
  type TakeoverConfirmationEmailData,
  type PhotographerTakeoverNotificationData,
} from './family-templates'

/**
 * Unified Email Service for PhotoVault
 * Uses Resend for all transactional emails
 */

export class EmailService {
  /**
   * Send "Gallery Ready" email to client
   * Triggered when photographer uploads photos to a gallery
   */
  static async sendGalleryReadyEmail(data: GalleryReadyEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.clientEmail,
        subject: `📸 Your photos are ready from ${data.photographerName}!`,
        html: getGalleryReadyEmailHTML(data),
        text: getGalleryReadyEmailText(data),
      })

      console.log(`[Email] Gallery ready email sent to ${data.clientEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending gallery ready email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send welcome email to new customer
   * Triggered after account creation
   */
  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.customerEmail,
        subject: '🎉 Welcome to PhotoVault!',
        html: getWelcomeEmailHTML(data),
        text: getWelcomeEmailText(data),
      })

      console.log(`[Email] Welcome email sent to ${data.customerEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending welcome email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send welcome email with temporary password
   * Triggered after payment when account is auto-created
   */
  static async sendWelcomeEmailWithPassword(data: WelcomeEmailWithPasswordData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.customerEmail,
        subject: '🎉 Welcome to PhotoVault - Your Account is Ready!',
        html: getWelcomeEmailWithPasswordHTML(data),
        text: getWelcomeEmailWithPasswordText(data),
      })

      console.log(`[Email] Welcome email with password sent to ${data.customerEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending welcome email with password:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<{ success: boolean; error?: string }> {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: email,
        subject: 'Reset your PhotoVault password',
        html: `
          <h1>Reset your password</h1>
          <p>Click the link below to reset your PhotoVault password:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
        text: `
Reset your password

Click the link below to reset your PhotoVault password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.
        `,
      })

      console.log(`[Email] Password reset email sent to ${email}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending password reset email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send payment reminder email
   */
  static async sendPaymentReminderEmail(
    email: string,
    customerName: string,
    amountDue: number,
    dueDate: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: email,
        subject: 'Payment reminder - PhotoVault',
        html: `
          <h1>Payment Reminder</h1>
          <p>Hi ${customerName},</p>
          <p>This is a friendly reminder that your PhotoVault payment of $${amountDue} is due on ${dueDate}.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/billing">Update payment method</a></p>
        `,
        text: `
Payment Reminder

Hi ${customerName},

This is a friendly reminder that your PhotoVault payment of $${amountDue} is due on ${dueDate}.

Update payment method: ${process.env.NEXT_PUBLIC_APP_URL}/billing
        `,
      })

      console.log(`[Email] Payment reminder sent to ${email}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending payment reminder:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send test email (for debugging)
   */
  static async sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to,
        subject: 'PhotoVault Test Email',
        html: '<h1>Test Email</h1><p>This is a test email from PhotoVault.</p>',
        text: 'Test Email\n\nThis is a test email from PhotoVault.',
      })

      console.log(`[Email] Test email sent to ${to}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending test email:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // CRITICAL EMAILS (Priority 1)
  // ============================================================================

  /**
   * Send client invitation email
   * Triggered when photographer invites a client to view their gallery
   */
  static async sendClientInvitationEmail(data: ClientInvitationEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.clientEmail,
        subject: `📸 ${data.photographerName} invited you to view your photos!`,
        html: getClientInvitationEmailHTML(data),
        text: getClientInvitationEmailText(data),
      })

      console.log(`[Email] Client invitation sent to ${data.clientEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending client invitation:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send photographer welcome email
   * Triggered when a new photographer signs up
   */
  static async sendPhotographerWelcomeEmail(data: PhotographerWelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.photographerEmail,
        subject: '🎉 Welcome to PhotoVault - Let\'s Get Started!',
        html: getPhotographerWelcomeEmailHTML(data),
        text: getPhotographerWelcomeEmailText(data),
      })

      console.log(`[Email] Photographer welcome email sent to ${data.photographerEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending photographer welcome email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send payment successful confirmation email
   * Triggered when a client completes payment for gallery access
   */
  static async sendPaymentSuccessfulEmail(data: PaymentSuccessfulEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.customerEmail,
        subject: '✅ Payment Successful - Your Photos Are Ready!',
        html: getPaymentSuccessfulEmailHTML(data),
        text: getPaymentSuccessfulEmailText(data),
      })

      console.log(`[Email] Payment successful email sent to ${data.customerEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending payment successful email:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // REVENUE PROTECTION EMAILS (Priority 2)
  // ============================================================================

  /**
   * Send subscription expiring warning email
   * Triggered 7 days before subscription ends
   */
  static async sendSubscriptionExpiringEmail(data: SubscriptionExpiringEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.customerEmail,
        subject: `⚠️ Your ${data.galleryName} subscription expires in ${data.expiresInDays} days`,
        html: getSubscriptionExpiringEmailHTML(data),
        text: getSubscriptionExpiringEmailText(data),
      })

      console.log(`[Email] Subscription expiring email sent to ${data.customerEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending subscription expiring email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send payment failed notification email
   * Triggered when a subscription payment fails
   */
  static async sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.customerEmail,
        subject: '⚠️ Payment Failed - Update Your Payment Method',
        html: getPaymentFailedEmailHTML(data),
        text: getPaymentFailedEmailText(data),
      })

      console.log(`[Email] Payment failed email sent to ${data.customerEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending payment failed email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send payout notification email
   * Triggered when photographer receives commission payout
   */
  static async sendPayoutNotificationEmail(data: PayoutNotificationEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.photographerEmail,
        subject: `💰 Payout Processed: $${data.payoutAmount.toFixed(2)}`,
        html: getPayoutNotificationEmailHTML(data),
        text: getPayoutNotificationEmailText(data),
      })

      console.log(`[Email] Payout notification sent to ${data.photographerEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending payout notification:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // ENGAGEMENT EMAILS (Priority 3)
  // ============================================================================

  /**
   * Send first gallery upload confirmation email
   * Triggered when photographer uploads their first gallery
   */
  static async sendFirstGalleryUploadEmail(data: FirstGalleryUploadEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.photographerEmail,
        subject: '🎉 First Gallery Uploaded Successfully!',
        html: getFirstGalleryUploadEmailHTML(data),
        text: getFirstGalleryUploadEmailText(data),
      })

      console.log(`[Email] First gallery upload email sent to ${data.photographerEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending first gallery upload email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send gallery access restored email
   * Triggered when client renews after cancellation
   */
  static async sendGalleryAccessRestoredEmail(data: GalleryAccessRestoredEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.customerEmail,
        subject: '✅ Welcome Back! Your Gallery Access Has Been Restored',
        html: getGalleryAccessRestoredEmailHTML(data),
        text: getGalleryAccessRestoredEmailText(data),
      })

      console.log(`[Email] Gallery access restored email sent to ${data.customerEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending gallery access restored email:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // FAMILY ACCOUNTS EMAILS
  // ============================================================================

  /**
   * Send secondary invitation email
   * Triggered when primary designates a new secondary (family member)
   */
  static async sendSecondaryInvitationEmail(data: SecondaryInvitationEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.secondaryEmail,
        subject: `👨‍👩‍👧‍👦 ${data.primaryName} designated you as family on PhotoVault`,
        html: getSecondaryInvitationEmailHTML(data),
        text: getSecondaryInvitationEmailText(data),
      })

      console.log(`[Email] Secondary invitation email sent to ${data.secondaryEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending secondary invitation email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send grace period alert email to secondaries
   * Triggered at 3, 4, 5, and 5.5 months into grace period
   */
  static async sendGracePeriodAlertEmail(data: GracePeriodAlertEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const urgency = data.monthsRemaining <= 0.5 ? 'FINAL NOTICE' : 
                      data.monthsRemaining <= 1 ? 'URGENT' : 
                      data.monthsRemaining <= 2 ? 'Reminder' : 'Attention Needed'
      
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.secondaryEmail,
        subject: `⚠️ ${urgency}: ${data.primaryName}'s PhotoVault account needs attention`,
        html: getGracePeriodAlertEmailHTML(data),
        text: getGracePeriodAlertEmailText(data),
      })

      console.log(`[Email] Grace period alert (${data.monthsRemaining}mo remaining) sent to ${data.secondaryEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending grace period alert email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send takeover confirmation email
   * Triggered when a secondary takes over billing or becomes primary
   */
  static async sendTakeoverConfirmationEmail(data: TakeoverConfirmationEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.newPayerEmail,
        subject: '✅ Account Takeover Confirmed - PhotoVault',
        html: getTakeoverConfirmationEmailHTML(data),
        text: getTakeoverConfirmationEmailText(data),
      })

      console.log(`[Email] Takeover confirmation email sent to ${data.newPayerEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending takeover confirmation email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send photographer notification about account takeover
   * Helps photographer understand client relationship changes
   */
  static async sendPhotographerTakeoverNotificationEmail(data: PhotographerTakeoverNotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.photographerEmail,
        subject: `📋 Account Update: ${data.originalClientName}'s account`,
        html: getPhotographerTakeoverNotificationHTML(data),
        text: getPhotographerTakeoverNotificationText(data),
      })

      console.log(`[Email] Photographer takeover notification sent to ${data.photographerEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending photographer takeover notification:', error)
      return { success: false, error: error.message }
    }
  }
}
