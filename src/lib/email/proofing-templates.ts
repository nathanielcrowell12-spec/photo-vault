/**
 * Proofing Email Templates — Story E.1
 *
 * 4 email templates for the proofing lifecycle:
 * 1. Proofing Invitation — sent to client when proofing begins
 * 2. Deadline Reminder — sent to client before proofing deadline
 * 3. Revisions Complete — sent to client when photographer finishes edits
 * 4. Proofing Auto-Closed — sent to client + photographer when deadline expires
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProofingInvitationEmailData {
  clientName: string
  clientEmail: string
  photographerName: string
  galleryName: string
  galleryUrl: string
  proofingDeadline: string
  photoCount: number
}

export interface ProofingDeadlineReminderEmailData {
  clientName: string
  clientEmail: string
  photographerName: string
  galleryName: string
  galleryUrl: string
  proofingDeadline: string
  daysRemaining: number
}

export interface RevisionsCompleteEmailData {
  clientName: string
  clientEmail: string
  photographerName: string
  galleryName: string
  galleryUrl: string
  paymentRequired: boolean
}

export interface ProofingAutoClosedEmailData {
  clientName: string
  clientEmail: string
  photographerName: string
  galleryName: string
  galleryUrl: string
}

export interface ProofingAutoClosedPhotographerEmailData {
  photographerName: string
  photographerEmail: string
  clientName: string
  galleryName: string
  galleryId: string
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ec4899, #f97316); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">PhotoVault</h1>
        </div>
        <div style="padding: 30px;">
            ${content}
        </div>
        <div style="padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                PhotoVault — Professional Photo Gallery Platform<br>
                <a href="https://photovault.photo" style="color: #ec4899;">photovault.photo</a>
            </p>
        </div>
    </div>
</body>
</html>`
}

function ctaButton(url: string, label: string): string {
  return `
<div style="text-align: center; margin: 30px 0;">
    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #f97316); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        ${label}
    </a>
</div>`
}

// ============================================================================
// 1. PROOFING INVITATION EMAIL
// ============================================================================

export function getProofingInvitationEmailHTML(data: ProofingInvitationEmailData): string {
  const deadline = formatDate(data.proofingDeadline)
  return emailWrapper(`
    <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">
        Hi ${data.clientName}!
    </h2>
    <p style="color: #4b5563; font-size: 16px; margin: 0 0 16px;">
        Great news! <strong>${data.photographerName}</strong> has uploaded ${data.photoCount} photos to your
        <strong>${data.galleryName}</strong> gallery and is ready for your feedback.
    </p>
    <div style="background: #f9fafb; border-left: 4px solid #ec4899; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="color: #374151; margin: 0 0 8px; font-weight: 600;">What to do:</p>
        <ol style="color: #4b5563; margin: 0; padding-left: 20px;">
            <li>Review each photo in your gallery</li>
            <li>Select your preferred editing style for each photo</li>
            <li>Add any notes for your photographer</li>
            <li>Submit your selections before <strong>April 15, ${new Date(data.proofingDeadline + 'T00:00:00').getFullYear()}</strong></li>
        </ol>
    </div>
    <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">
        <strong>Proofing deadline:</strong> ${deadline}
    </p>
    ${ctaButton(data.galleryUrl, 'Review Your Photos')}
    <p style="color: #9ca3af; font-size: 14px; margin: 16px 0 0;">
        Questions? Reply to this email or contact your photographer directly.
    </p>
  `)
}

export function getProofingInvitationEmailText(data: ProofingInvitationEmailData): string {
  const deadline = formatDate(data.proofingDeadline)
  return `Hi ${data.clientName},

Great news! ${data.photographerName} has uploaded ${data.photoCount} photos to your "${data.galleryName}" gallery and is ready for your feedback.

What to do:
1. Review each photo in your gallery
2. Select your preferred editing style for each photo
3. Add any notes for your photographer
4. Submit your selections before the deadline

Proofing deadline: ${deadline}

Review your photos: ${data.galleryUrl}

Questions? Reply to this email or contact your photographer directly.

— PhotoVault`
}

// ============================================================================
// 2. PROOFING DEADLINE REMINDER EMAIL
// ============================================================================

export function getProofingDeadlineReminderEmailHTML(data: ProofingDeadlineReminderEmailData): string {
  const deadline = formatDate(data.proofingDeadline)
  return emailWrapper(`
    <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">
        Proofing deadline approaching
    </h2>
    <p style="color: #4b5563; font-size: 16px; margin: 0 0 16px;">
        Hi ${data.clientName}, just a friendly reminder that you have
        <strong>${data.daysRemaining} days</strong> left to submit your proofing selections
        for <strong>${data.galleryName}</strong>.
    </p>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="color: #92400e; margin: 0; font-weight: 600;">
            Proofing deadline: ${deadline}
        </p>
        <p style="color: #92400e; margin: 8px 0 0; font-size: 14px;">
            After the deadline, your proofing window will close automatically and your photographer
            will proceed with editing based on any selections you've submitted so far.
        </p>
    </div>
    ${ctaButton(data.galleryUrl, 'Complete Your Selections')}
    <p style="color: #9ca3af; font-size: 14px; margin: 16px 0 0;">
        Questions? Contact ${data.photographerName} or reply to this email.
    </p>
  `)
}

export function getProofingDeadlineReminderEmailText(data: ProofingDeadlineReminderEmailData): string {
  const deadline = formatDate(data.proofingDeadline)
  return `Hi ${data.clientName},

Friendly reminder: you have ${data.daysRemaining} days left to submit your proofing selections for "${data.galleryName}".

Proofing deadline: ${deadline}

After the deadline, your proofing window will close automatically and your photographer will proceed with editing based on any selections you've submitted so far.

Complete your selections: ${data.galleryUrl}

Questions? Contact ${data.photographerName} or reply to this email.

— PhotoVault`
}

// ============================================================================
// 3. REVISIONS COMPLETE EMAIL
// ============================================================================

export function getRevisionsCompleteEmailHTML(data: RevisionsCompleteEmailData): string {
  const statusMessage = data.paymentRequired
    ? `<p style="color: #4b5563; font-size: 16px; margin: 0 0 16px;">
        Your photos are edited and ready! To unlock downloads, please complete your payment.
      </p>`
    : `<p style="color: #4b5563; font-size: 16px; margin: 0 0 16px;">
        Your photos are edited and ready to download! Head to your gallery to view and save your final images.
      </p>`

  const ctaLabel = data.paymentRequired ? 'View Gallery & Pay' : 'View Your Photos'

  return emailWrapper(`
    <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">
        Your edits are ready!
    </h2>
    <p style="color: #4b5563; font-size: 16px; margin: 0 0 16px;">
        Hi ${data.clientName}, <strong>${data.photographerName}</strong> has finished editing
        your photos from <strong>${data.galleryName}</strong> based on your proofing selections.
    </p>
    ${statusMessage}
    ${ctaButton(data.galleryUrl, ctaLabel)}
    <p style="color: #9ca3af; font-size: 14px; margin: 16px 0 0;">
        Questions about your edits? Reply to this email or contact your photographer directly.
    </p>
  `)
}

export function getRevisionsCompleteEmailText(data: RevisionsCompleteEmailData): string {
  const statusMessage = data.paymentRequired
    ? 'Your photos are edited and ready! To unlock downloads, please complete your payment.'
    : 'Your photos are edited and ready to download! Head to your gallery to view and save your final images.'

  return `Hi ${data.clientName},

${data.photographerName} has finished editing your photos from "${data.galleryName}" based on your proofing selections.

${statusMessage}

View your gallery: ${data.galleryUrl}

Questions about your edits? Reply to this email or contact your photographer directly.

— PhotoVault`
}

// ============================================================================
// 4. PROOFING AUTO-CLOSED EMAIL (Client)
// ============================================================================

export function getProofingAutoClosedEmailHTML(data: ProofingAutoClosedEmailData): string {
  return emailWrapper(`
    <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">
        Proofing window closed
    </h2>
    <p style="color: #4b5563; font-size: 16px; margin: 0 0 16px;">
        Hi ${data.clientName}, the proofing deadline for your <strong>${data.galleryName}</strong>
        gallery has passed.
    </p>
    <p style="color: #4b5563; font-size: 16px; margin: 0 0 16px;">
        Your photographer <strong>${data.photographerName}</strong> will now proceed with
        editing based on any selections you submitted. If you didn't submit selections,
        your photographer will use their professional judgment.
    </p>
    ${ctaButton(data.galleryUrl, 'View Your Gallery')}
    <p style="color: #9ca3af; font-size: 14px; margin: 16px 0 0;">
        Questions? Reply to this email or contact your photographer directly.
    </p>
  `)
}

export function getProofingAutoClosedEmailText(data: ProofingAutoClosedEmailData): string {
  return `Hi ${data.clientName},

The proofing deadline for your "${data.galleryName}" gallery has passed.

Your photographer ${data.photographerName} will now proceed with editing based on any selections you submitted. If you didn't submit selections, your photographer will use their professional judgment.

View your gallery: ${data.galleryUrl}

Questions? Reply to this email or contact your photographer directly.

— PhotoVault`
}

// ============================================================================
// 5. PROOFING AUTO-CLOSED EMAIL (Photographer)
// ============================================================================

export function getProofingAutoClosedPhotographerEmailHTML(data: ProofingAutoClosedPhotographerEmailData): string {
  return emailWrapper(`
    <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">
        Proofing deadline reached
    </h2>
    <p style="color: #4b5563; font-size: 16px; margin: 0 0 16px;">
        Hi ${data.photographerName}, the proofing window for <strong>${data.galleryName}</strong>
        (client: <strong>${data.clientName}</strong>) has closed automatically.
    </p>
    <p style="color: #4b5563; font-size: 16px; margin: 0 0 16px;">
        You can now review any submitted proofing selections and proceed with editing.
    </p>
    ${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL || 'https://photovault.photo'}/photographer/galleries/${data.galleryId}/proofing-review`, 'Review Proofing Selections')}
  `)
}

export function getProofingAutoClosedPhotographerEmailText(data: ProofingAutoClosedPhotographerEmailData): string {
  return `Hi ${data.photographerName},

The proofing window for "${data.galleryName}" (client: ${data.clientName}) has closed automatically.

You can now review any submitted proofing selections and proceed with editing.

Review proofing: ${process.env.NEXT_PUBLIC_APP_URL || 'https://photovault.photo'}/photographer/galleries/${data.galleryId}/proofing-review

— PhotoVault`
}
