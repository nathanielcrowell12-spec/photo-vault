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
  getSecondaryWelcomeEmailHTML,
  getSecondaryWelcomeEmailText,
  type SecondaryInvitationEmailData,
  type GracePeriodAlertEmailData,
  type TakeoverConfirmationEmailData,
  type PhotographerTakeoverNotificationData,
  type SecondaryWelcomeEmailData,
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

  /**
   * Send secondary welcome email with password setup link
   * Triggered when a new secondary user account is created
   */
  static async sendSecondaryWelcomeEmail(data: SecondaryWelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: data.secondaryEmail,
        subject: `🎉 Welcome to PhotoVault - Set Your Password`,
        html: getSecondaryWelcomeEmailHTML(data),
        text: getSecondaryWelcomeEmailText(data),
      })

      console.log(`[Email] Secondary welcome email sent to ${data.secondaryEmail}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Email] Error sending secondary welcome email:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================================
  // ADMIN ALERT EMAILS (Monitoring & Error Tracking)
  // ============================================================================

  /**
   * Send alert email to admin
   * Used by monitoring scripts and webhook alerts
   */
  static async sendAlertEmail(params: {
    to: string
    subject: string
    body: string // HTML content
    alertType: 'payment_failure' | 'webhook_failure' | 'error_spike' | 'churn' | 'monitoring_failure'
    severity: 'critical' | 'high' | 'medium' | 'info'
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const severityEmoji = {
        critical: '🚨',
        high: '⚠️',
        medium: '📊',
        info: 'ℹ️',
      }[params.severity]

      const severityLabel = {
        critical: 'CRITICAL',
        high: 'HIGH',
        medium: 'MEDIUM',
        info: 'INFO',
      }[params.severity]

      const severityColor = {
        critical: '#dc2626', // red
        high: '#f59e0b', // amber
        medium: '#3b82f6', // blue
        info: '#6b7280', // gray
      }[params.severity]

      // Get remediation steps based on alert type
      const remediationSteps = this.getRemediationSteps(params.alertType)

      const result = await (await getClient()).emails.send({
        from: await getFromEmail(),
        to: params.to,
        subject: `${severityEmoji} [${severityLabel}] ${params.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .alert-box {
                background: #fffbeb;
                border: 2px solid ${severityColor};
                border-left-width: 6px;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
              }
              .severity-badge {
                display: inline-block;
                background: ${severityColor};
                color: white;
                padding: 4px 12px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 12px;
                margin-bottom: 10px;
              }
              ul { padding-left: 20px; }
              li { margin: 10px 0; }
              .remediation {
                background: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
                margin-top: 20px;
              }
              .remediation h3 { margin-top: 0; }
              .cta-button {
                display: inline-block;
                background: #2563eb;
                color: white;
                padding: 10px 20px;
                border-radius: 6px;
                text-decoration: none;
                margin-top: 15px;
              }
            </style>
          </head>
          <body>
            <div class="alert-box">
              <span class="severity-badge">${severityLabel}</span>
              ${params.body}
            </div>

            ${remediationSteps ? `
            <div class="remediation">
              <h3>Recommended Actions:</h3>
              ${remediationSteps}
            </div>
            ` : ''}

            <p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin" class="cta-button">
                Open Admin Dashboard
              </a>
            </p>

            <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              This is an automated alert from PhotoVault monitoring system.<br>
              Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST
            </p>
          </body>
          </html>
        `,
        text: `
[${severityLabel}] ${params.subject}

${params.body.replace(/<[^>]*>/g, '')}

${remediationSteps ? `Recommended Actions:\n${remediationSteps.replace(/<[^>]*>/g, '')}` : ''}

Open Admin Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/admin

---
Automated alert from PhotoVault monitoring system.
Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST
        `.trim(),
      })

      console.log(`[Email] Alert email sent: ${params.alertType} (${params.severity}) to ${params.to}`)
      return { success: true, messageId: result.id }
    } catch (error: any) {
      console.error('[Email] Error sending alert email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get remediation steps based on alert type
   */
  private static getRemediationSteps(alertType: string): string {
    const steps: Record<string, string> = {
      payment_failure: `
        <ol>
          <li>Check <a href="https://dashboard.stripe.com/test/payments">Stripe Dashboard</a> for failed payment details</li>
          <li>Review the failure_reason in the webhook_logs table</li>
          <li>If widespread issue, check Stripe status page</li>
          <li>Contact affected customers if card issues</li>
        </ol>
      `,
      webhook_failure: `
        <ol>
          <li>Check <a href="https://dashboard.stripe.com/test/webhooks">Stripe Webhook Dashboard</a> for delivery status</li>
          <li>Review webhook_logs table for specific error messages</li>
          <li>Verify STRIPE_WEBHOOK_SECRET is correct in Vercel env vars</li>
          <li>Check Vercel function logs for stack traces</li>
          <li>If issue persists 1 hour, contact Stripe support</li>
        </ol>
      `,
      error_spike: `
        <ol>
          <li>Check <a href="https://app.posthog.com">PostHog Dashboard</a> for error patterns</li>
          <li>Review error_logs table for stack traces</li>
          <li>Check recent deployments for potential causes</li>
          <li>Verify third-party services (Supabase, Stripe) are operational</li>
        </ol>
      `,
      churn: `
        <ol>
          <li>Review churn reasons in user feedback</li>
          <li>Check if related to recent changes or issues</li>
          <li>Consider reaching out to churned users for feedback</li>
        </ol>
      `,
      monitoring_failure: `
        <ol>
          <li>Check Vercel function logs for the monitoring job</li>
          <li>Verify Supabase connection is working</li>
          <li>Verify environment variables are set correctly</li>
          <li>Re-run the monitoring check manually</li>
        </ol>
      `,
    }
    return steps[alertType] || ''
  }
}
