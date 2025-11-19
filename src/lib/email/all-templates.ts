/**
 * COMPLETE Email Templates for PhotoVault
 * All transactional emails needed for the platform
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface GalleryReadyEmailData {
  clientName: string
  clientEmail: string
  photographerName: string
  photographerBusinessName?: string
  galleryName: string
  galleryDescription?: string
  photoCount: number
  invitationToken: string
  galleryId: string
}

export interface WelcomeEmailData {
  customerName: string
  customerEmail: string
  accountType: 'photographer' | 'client' | 'family'
}

export interface ClientInvitationEmailData {
  clientName: string
  clientEmail: string
  photographerName: string
  photographerBusinessName?: string
  galleryName?: string
  personalMessage?: string
  invitationToken: string
  expiresInDays: number
}

export interface PhotographerWelcomeEmailData {
  photographerName: string
  photographerEmail: string
  businessName?: string
}

export interface PaymentSuccessfulEmailData {
  customerName: string
  customerEmail: string
  amountPaid: number
  planName: string
  galleryName?: string
  photographerName?: string
  receiptUrl?: string
  nextBillingDate?: string
}

export interface SubscriptionExpiringEmailData {
  customerName: string
  customerEmail: string
  galleryName: string
  expiresInDays: number
  renewalLink: string
  monthlyPrice: number
}

export interface PaymentFailedEmailData {
  customerName: string
  customerEmail: string
  amountDue: number
  galleryName?: string
  updatePaymentLink: string
  gracePeriodDays: number
}

export interface PayoutNotificationEmailData {
  photographerName: string
  photographerEmail: string
  payoutAmount: number
  payoutDate: string
  clientCount: number
  period: string
}

export interface FirstGalleryUploadEmailData {
  photographerName: string
  galleryName: string
  photoCount: number
  nextStepsLink: string
}

export interface GalleryAccessRestoredEmailData {
  customerName: string
  galleryName: string
  photographerName: string
  accessLink: string
}

// ============================================================================
// 1. CLIENT INVITATION EMAIL (CRITICAL)
// ============================================================================

export function getClientInvitationEmailHTML(data: ClientInvitationEmailData): string {
  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.invitationToken}`

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited to View Your Photos!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #10b981, #3b82f6);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .personal-message {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
            font-style: italic;
            color: #1e40af;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981, #3b82f6);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            margin: 30px 0;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .cta-container {
            text-align: center;
        }
        .footer {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📸 You're Invited!</h1>
            <p>View your professional photos on PhotoVault</p>
        </div>

        <div class="content">
            <h2>Hi ${data.clientName}! 👋</h2>

            <p>${data.photographerName} from ${data.photographerBusinessName || data.photographerName} has invited you to view ${data.galleryName ? `your "${data.galleryName}"` : 'your photos'} on PhotoVault.</p>

            ${data.personalMessage ? `
            <div class="personal-message">
                <strong>Message from ${data.photographerName}:</strong><br>
                "${data.personalMessage}"
            </div>
            ` : ''}

            <p><strong>What is PhotoVault?</strong></p>
            <p>PhotoVault is a secure platform where you can access, download, and share all your professional photos in one beautiful place. No more lost USB drives or expired download links!</p>

            <div class="cta-container">
                <a href="${invitationLink}" class="cta-button">View My Photos →</a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
                <strong>This invitation expires in ${data.expiresInDays} days.</strong><br>
                Create your free PhotoVault account to access your photos anytime, anywhere.
            </p>

            <div class="footer">
                <p>This invitation was sent by ${data.photographerBusinessName || data.photographerName}</p>
                <p>Questions? Contact us at <a href="mailto:support@photovault.photo">support@photovault.photo</a></p>
                <p>© ${new Date().getFullYear()} PhotoVault. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}

export function getClientInvitationEmailText(data: ClientInvitationEmailData): string {
  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.invitationToken}`

  return `
📸 YOU'RE INVITED!

Hi ${data.clientName}!

${data.photographerName} from ${data.photographerBusinessName || data.photographerName} has invited you to view ${data.galleryName ? `your "${data.galleryName}"` : 'your photos'} on PhotoVault.

${data.personalMessage ? `
Message from ${data.photographerName}:
"${data.personalMessage}"
` : ''}

WHAT IS PHOTOVAULT?
PhotoVault is a secure platform where you can access, download, and share all your professional photos in one beautiful place. No more lost USB drives or expired download links!

VIEW YOUR PHOTOS:
${invitationLink}

This invitation expires in ${data.expiresInDays} days.
Create your free PhotoVault account to access your photos anytime, anywhere.

---
This invitation was sent by ${data.photographerBusinessName || data.photographerName}
Questions? Contact us at support@photovault.photo

© ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}

// Continue in next message due to length...
