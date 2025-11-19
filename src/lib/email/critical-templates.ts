/**
 * CRITICAL Email Templates for PhotoVault Launch
 * These 3 emails are REQUIRED before going live
 *
 * To implement: Copy these interfaces and functions to templates.ts
 * Then add corresponding methods to email-service.ts
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// 1. CLIENT INVITATION EMAIL - HTML
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

// ============================================================================
// 1. CLIENT INVITATION EMAIL - TEXT
// ============================================================================

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

// ============================================================================
// 2. PHOTOGRAPHER WELCOME EMAIL - HTML
// ============================================================================

export function getPhotographerWelcomeEmailHTML(data: PhotographerWelcomeEmailData): string {
  const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL}/photographer/dashboard`
  const uploadLink = `${process.env.NEXT_PUBLIC_APP_URL}/photographer/upload`
  const stripeSetupLink = `${process.env.NEXT_PUBLIC_APP_URL}/photographer/settings/payments`

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PhotoVault!</title>
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
            background: linear-gradient(135deg, #9333ea, #ec4899);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-message {
            font-size: 18px;
            margin-bottom: 30px;
        }
        .steps-container {
            background: #faf5ff;
            border-radius: 8px;
            padding: 30px;
            margin: 30px 0;
        }
        .step {
            margin-bottom: 25px;
            padding-left: 15px;
            border-left: 4px solid #9333ea;
        }
        .step:last-child {
            margin-bottom: 0;
        }
        .step-number {
            display: inline-block;
            background: #9333ea;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            text-align: center;
            line-height: 28px;
            font-weight: 700;
            margin-right: 10px;
            font-size: 14px;
        }
        .step-title {
            font-weight: 600;
            color: #581c87;
            margin-bottom: 5px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #9333ea, #ec4899);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            margin: 10px 10px 10px 0;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
        }
        .cta-container {
            text-align: center;
            margin: 30px 0;
        }
        .feature-list {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px 25px;
            margin: 30px 0;
        }
        .feature-list li {
            margin-bottom: 10px;
            color: #4b5563;
        }
        .pro-tip {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .pro-tip strong {
            color: #92400e;
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
            <h1>🎉 Welcome to PhotoVault!</h1>
            <p>Let's get your photography business set up</p>
        </div>

        <div class="content">
            <div class="welcome-message">
                <p>Hi ${data.photographerName}! 👋</p>
                <p>Welcome to PhotoVault${data.businessName ? `, representing ${data.businessName}` : ''}! We're thrilled to have you join our community of professional photographers.</p>
                <p>You're about to transform how you deliver photos to your clients. Let's get you started!</p>
            </div>

            <div class="steps-container">
                <h2 style="margin-top: 0; color: #581c87;">Getting Started in 3 Easy Steps</h2>

                <div class="step">
                    <div>
                        <span class="step-number">1</span>
                        <span class="step-title">Upload Your First Gallery</span>
                    </div>
                    <p style="margin: 10px 0 0 38px; color: #6b7280; font-size: 14px;">
                        Drag and drop your photos to create a beautiful gallery. We'll handle the rest.
                    </p>
                    <a href="${uploadLink}" class="cta-button" style="margin-left: 38px;">Upload Photos →</a>
                </div>

                <div class="step">
                    <div>
                        <span class="step-number">2</span>
                        <span class="step-title">Invite Your Client</span>
                    </div>
                    <p style="margin: 10px 0 0 38px; color: #6b7280; font-size: 14px;">
                        Send a professional invitation email. Your client gets instant access to their photos.
                    </p>
                </div>

                <div class="step">
                    <div>
                        <span class="step-number">3</span>
                        <span class="step-title">Connect Stripe for Payouts</span>
                    </div>
                    <p style="margin: 10px 0 0 38px; color: #6b7280; font-size: 14px;">
                        Set up your Stripe account to receive automatic monthly payouts from client subscriptions.
                    </p>
                    <a href="${stripeSetupLink}" class="cta-button" style="margin-left: 38px;">Connect Stripe →</a>
                </div>
            </div>

            <div class="cta-container">
                <a href="${dashboardLink}" class="cta-button">Go to My Dashboard →</a>
            </div>

            <h3>What You Can Do with PhotoVault</h3>
            <ul class="feature-list">
                <li>✅ <strong>Unlimited Photo Storage</strong> - Upload as many photos as you need</li>
                <li>✅ <strong>Automatic Client Management</strong> - Track all your clients in one place</li>
                <li>✅ <strong>Recurring Revenue</strong> - Earn 50% commission on client subscriptions</li>
                <li>✅ <strong>Beautiful Galleries</strong> - Professional presentation for your work</li>
                <li>✅ <strong>Secure Sharing</strong> - Your clients' photos are protected and private</li>
                <li>✅ <strong>Download Tracking</strong> - See when clients access their photos</li>
            </ul>

            <div class="pro-tip">
                <strong>💡 Pro Tip:</strong> Start by uploading a recent photo session for a current client. It's the fastest way to see PhotoVault in action and delight your client with instant access to their photos!
            </div>

            <div class="footer">
                <p><strong>Need help getting started?</strong></p>
                <p>Contact us anytime at <a href="mailto:support@photovault.photo">support@photovault.photo</a></p>
                <p>We're here Mon-Fri, 9am-6pm CST</p>
                <p style="margin-top: 20px;">© ${new Date().getFullYear()} PhotoVault. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// ============================================================================
// 2. PHOTOGRAPHER WELCOME EMAIL - TEXT
// ============================================================================

export function getPhotographerWelcomeEmailText(data: PhotographerWelcomeEmailData): string {
  const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL}/photographer/dashboard`
  const uploadLink = `${process.env.NEXT_PUBLIC_APP_URL}/photographer/upload`
  const stripeSetupLink = `${process.env.NEXT_PUBLIC_APP_URL}/photographer/settings/payments`

  return `
🎉 WELCOME TO PHOTOVAULT!

Hi ${data.photographerName}!

Welcome to PhotoVault${data.businessName ? `, representing ${data.businessName}` : ''}! We're thrilled to have you join our community of professional photographers.

You're about to transform how you deliver photos to your clients. Let's get you started!

GETTING STARTED IN 3 EASY STEPS:

1. UPLOAD YOUR FIRST GALLERY
   Drag and drop your photos to create a beautiful gallery. We'll handle the rest.
   → ${uploadLink}

2. INVITE YOUR CLIENT
   Send a professional invitation email. Your client gets instant access to their photos.

3. CONNECT STRIPE FOR PAYOUTS
   Set up your Stripe account to receive automatic monthly payouts from client subscriptions.
   → ${stripeSetupLink}

GO TO YOUR DASHBOARD:
${dashboardLink}

WHAT YOU CAN DO WITH PHOTOVAULT:

✅ Unlimited Photo Storage - Upload as many photos as you need
✅ Automatic Client Management - Track all your clients in one place
✅ Recurring Revenue - Earn 50% commission on client subscriptions
✅ Beautiful Galleries - Professional presentation for your work
✅ Secure Sharing - Your clients' photos are protected and private
✅ Download Tracking - See when clients access their photos

💡 PRO TIP: Start by uploading a recent photo session for a current client. It's the fastest way to see PhotoVault in action and delight your client with instant access to their photos!

---
NEED HELP GETTING STARTED?
Contact us anytime at support@photovault.photo
We're here Mon-Fri, 9am-6pm CST

© ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}

// ============================================================================
// 3. PAYMENT SUCCESSFUL EMAIL - HTML
// ============================================================================

export function getPaymentSuccessfulEmailHTML(data: PaymentSuccessfulEmailData): string {
  const accessLink = `${process.env.NEXT_PUBLIC_APP_URL}/client/dashboard`

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful - Your Photos Are Ready!</title>
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
        .success-icon {
            font-size: 64px;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px 30px;
        }
        .receipt-box {
            background: #f9fafb;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
        }
        .receipt-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .receipt-row:last-child {
            border-bottom: none;
            padding-top: 15px;
            margin-top: 10px;
            border-top: 2px solid #10b981;
            font-weight: 700;
            font-size: 18px;
        }
        .receipt-label {
            color: #6b7280;
        }
        .receipt-value {
            font-weight: 600;
            color: #111827;
        }
        .amount-paid {
            color: #10b981;
            font-size: 24px;
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
        .whats-next {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .whats-next h3 {
            margin-top: 0;
            color: #1e40af;
        }
        .whats-next ul {
            margin: 10px 0;
            padding-left: 20px;
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
            <div class="success-icon">✅</div>
            <h1>Payment Successful!</h1>
            <p>Your photos are ready to access</p>
        </div>

        <div class="content">
            <h2>Hi ${data.customerName}! 👋</h2>

            <p>Thank you for your payment! Your subscription to ${data.galleryName ? `"${data.galleryName}"` : 'your photo gallery'} is now active.</p>

            <div class="receipt-box">
                <h3 style="margin-top: 0; color: #111827;">Payment Receipt</h3>

                <div class="receipt-row">
                    <span class="receipt-label">Plan</span>
                    <span class="receipt-value">${data.planName}</span>
                </div>

                ${data.galleryName ? `
                <div class="receipt-row">
                    <span class="receipt-label">Gallery</span>
                    <span class="receipt-value">${data.galleryName}</span>
                </div>
                ` : ''}

                ${data.photographerName ? `
                <div class="receipt-row">
                    <span class="receipt-label">Photographer</span>
                    <span class="receipt-value">${data.photographerName}</span>
                </div>
                ` : ''}

                ${data.nextBillingDate ? `
                <div class="receipt-row">
                    <span class="receipt-label">Next Billing Date</span>
                    <span class="receipt-value">${data.nextBillingDate}</span>
                </div>
                ` : ''}

                <div class="receipt-row">
                    <span class="receipt-label">Amount Paid</span>
                    <span class="receipt-value amount-paid">$${data.amountPaid.toFixed(2)}</span>
                </div>
            </div>

            ${data.receiptUrl ? `
            <p style="text-align: center;">
                <a href="${data.receiptUrl}" style="color: #3b82f6; text-decoration: underline;">Download Receipt →</a>
            </p>
            ` : ''}

            <div class="cta-container">
                <a href="${accessLink}" class="cta-button">Access My Photos →</a>
            </div>

            <div class="whats-next">
                <h3>What's Next?</h3>
                <ul>
                    <li>Access your photos anytime from any device</li>
                    <li>Download high-resolution images</li>
                    <li>Share photos with family and friends</li>
                    <li>Your subscription renews automatically${data.nextBillingDate ? ` on ${data.nextBillingDate}` : ''}</li>
                </ul>
            </div>

            <p><strong>Need to manage your subscription?</strong><br>
            Visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/billing" style="color: #3b82f6;">billing dashboard</a> to update payment methods or view invoices.</p>

            <div class="footer">
                <p>This payment confirmation was sent to ${data.customerEmail}</p>
                <p>Questions? Contact us at <a href="mailto:support@photovault.photo">support@photovault.photo</a></p>
                <p>© ${new Date().getFullYear()} PhotoVault. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// ============================================================================
// 3. PAYMENT SUCCESSFUL EMAIL - TEXT
// ============================================================================

export function getPaymentSuccessfulEmailText(data: PaymentSuccessfulEmailData): string {
  const accessLink = `${process.env.NEXT_PUBLIC_APP_URL}/client/dashboard`

  return `
✅ PAYMENT SUCCESSFUL!

Hi ${data.customerName}!

Thank you for your payment! Your subscription to ${data.galleryName ? `"${data.galleryName}"` : 'your photo gallery'} is now active.

PAYMENT RECEIPT
---------------
Plan: ${data.planName}
${data.galleryName ? `Gallery: ${data.galleryName}\n` : ''}${data.photographerName ? `Photographer: ${data.photographerName}\n` : ''}${data.nextBillingDate ? `Next Billing Date: ${data.nextBillingDate}\n` : ''}
Amount Paid: $${data.amountPaid.toFixed(2)}

${data.receiptUrl ? `Download Receipt: ${data.receiptUrl}\n` : ''}
ACCESS YOUR PHOTOS:
${accessLink}

WHAT'S NEXT?

• Access your photos anytime from any device
• Download high-resolution images
• Share photos with family and friends
• Your subscription renews automatically${data.nextBillingDate ? ` on ${data.nextBillingDate}` : ''}

MANAGE YOUR SUBSCRIPTION:
Visit your billing dashboard to update payment methods or view invoices:
${process.env.NEXT_PUBLIC_APP_URL}/client/billing

---
This payment confirmation was sent to ${data.customerEmail}
Questions? Contact us at support@photovault.photo

© ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}
