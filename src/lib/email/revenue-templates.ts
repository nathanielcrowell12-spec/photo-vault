/**
 * REVENUE PROTECTION Email Templates for PhotoVault
 * Priority 2: Subscription Management & Payout Notifications
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// 1. SUBSCRIPTION EXPIRING WARNING EMAIL - HTML
// ============================================================================

export function getSubscriptionExpiringEmailHTML(data: SubscriptionExpiringEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Subscription is Expiring Soon</title>
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
            background: linear-gradient(135deg, #f59e0b, #ef4444);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .warning-icon {
            font-size: 64px;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px 30px;
        }
        .expiry-notice {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        .expiry-notice h3 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 24px;
        }
        .days-remaining {
            font-size: 48px;
            font-weight: 700;
            color: #ef4444;
            margin: 10px 0;
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
        .info-box {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .info-box h3 {
            margin-top: 0;
            color: #1e40af;
        }
        .benefits-list {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px 25px;
            margin: 30px 0;
        }
        .benefits-list li {
            margin-bottom: 10px;
            color: #4b5563;
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
            <div class="warning-icon">⚠️</div>
            <h1>Your ${data.galleryName} Photos Need Protection</h1>
            <p>Memory Insurance expires soon</p>
        </div>

        <div class="content">
            <h2>Hi ${data.customerName},</h2>

            <p>Your photographer delivered something <strong>irreplaceable</strong>—the only high-resolution record of ${data.galleryName}.</p>

            <p>Right now, those photos are protected in your digital safety deposit box. But in <strong>${data.expiresInDays} days</strong>, that protection expires.</p>

            <div class="expiry-notice">
                <h3>Memory Insurance Expires In</h3>
                <div class="days-remaining">${data.expiresInDays}</div>
                <p style="margin: 0; font-size: 18px; color: #92400e;">day${data.expiresInDays !== 1 ? 's' : ''}</p>
            </div>

            <div class="cta-container">
                <a href="${data.renewalLink}" class="cta-button">Keep My Photos Protected →</a>
            </div>

            <div class="info-box">
                <h3>Why Memory Insurance Matters</h3>
                <p><strong>Hard drives have a 100% failure rate eventually.</strong> Professional data recovery costs $500-$5,000—and success isn't guaranteed.</p>
                <p>Without PhotoVault, these are your only options:</p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Download everything to a hard drive (that will eventually fail)</li>
                    <li>Hope the zip file you saved years ago still works</li>
                    <li>Pay your photographer again for re-delivery (if they still have the files)</li>
                </ul>
            </div>

            <h3>What $${data.monthlyPrice.toFixed(2)}/month Gets You</h3>
            <ul class="benefits-list">
                <li>🛡️ <strong>Memory Insurance:</strong> Professional-grade protection from hard drive crashes, phone losses, house fires</li>
                <li>📱 <strong>One-Tap Access:</strong> Full resolution photos delivered to your camera roll instantly</li>
                <li>👨‍👩‍👧 <strong>Family Sharing:</strong> Share with family without tech headaches or zip files</li>
                <li>♾️ <strong>Forever Protection:</strong> Your wedding photos, baby's first steps—safe for generations</li>
            </ul>

            <p style="text-align: center; font-size: 18px; margin: 30px 0;">
                <strong>For the price of one coffee a month:</strong> never worry about losing your most precious photos again
            </p>

            <div class="cta-container">
                <a href="${data.renewalLink}" class="cta-button">Protect My Photos for $${data.monthlyPrice.toFixed(2)}/mo →</a>
            </div>

            <div class="footer">
                <p>This reminder was sent to ${data.customerEmail}</p>
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
// 1. SUBSCRIPTION EXPIRING WARNING EMAIL - TEXT
// ============================================================================

export function getSubscriptionExpiringEmailText(data: SubscriptionExpiringEmailData): string {
  return `
⚠️ YOUR ${data.galleryName.toUpperCase()} PHOTOS NEED PROTECTION

Hi ${data.customerName},

Your photographer delivered something irreplaceable—the only high-resolution record of ${data.galleryName}.

Right now, those photos are protected in your digital safety deposit box. But in ${data.expiresInDays} day${data.expiresInDays !== 1 ? 's' : ''}, that protection expires.

MEMORY INSURANCE EXPIRES IN: ${data.expiresInDays} DAY${data.expiresInDays !== 1 ? 'S' : ''}

KEEP MY PHOTOS PROTECTED:
${data.renewalLink}

WHY MEMORY INSURANCE MATTERS

Hard drives have a 100% failure rate eventually. Professional data recovery costs $500-$5,000—and success isn't guaranteed.

Without PhotoVault, these are your only options:
• Download everything to a hard drive (that will eventually fail)
• Hope the zip file you saved years ago still works
• Pay your photographer again for re-delivery (if they still have the files)

WHAT $${data.monthlyPrice.toFixed(2)}/MONTH GETS YOU

🛡️ Memory Insurance: Professional-grade protection from hard drive crashes, phone losses, house fires
📱 One-Tap Access: Full resolution photos delivered to your camera roll instantly
👨‍👩‍👧 Family Sharing: Share with family without tech headaches or zip files
♾️ Forever Protection: Your wedding photos, baby's first steps—safe for generations

For the price of one coffee a month: never worry about losing your most precious photos again

PROTECT MY PHOTOS:
${data.renewalLink}

---
This reminder was sent to ${data.customerEmail}
Questions? Contact us at support@photovault.photo

© ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}

// ============================================================================
// 2. PAYMENT FAILED NOTIFICATION EMAIL - HTML
// ============================================================================

export function getPaymentFailedEmailHTML(data: PaymentFailedEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed - Action Required</title>
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
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .alert-icon {
            font-size: 64px;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px 30px;
        }
        .payment-notice {
            background: #fef2f2;
            border: 2px solid #ef4444;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        .payment-notice h3 {
            margin: 0 0 10px 0;
            color: #991b1b;
        }
        .amount-due {
            font-size: 36px;
            font-weight: 700;
            color: #ef4444;
            margin: 10px 0;
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
        .grace-period-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .grace-period-box h3 {
            margin-top: 0;
            color: #92400e;
        }
        .common-reasons {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px 25px;
            margin: 30px 0;
        }
        .common-reasons li {
            margin-bottom: 10px;
            color: #4b5563;
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
            <div class="alert-icon">❌</div>
            <h1>Your Memory Insurance Payment Failed</h1>
            <p>Action Required - Your photos need protection</p>
        </div>

        <div class="content">
            <h2>Hi ${data.customerName},</h2>

            <p>We tried to process your Memory Insurance payment${data.galleryName ? ` for "${data.galleryName}"` : ''}, but it didn't go through. <strong>Your photos are still protected</strong>—but we need to fix this soon.</p>

            <div class="payment-notice">
                <h3>Amount Due</h3>
                <div class="amount-due">$${data.amountDue.toFixed(2)}</div>
                <p style="margin: 0; color: #991b1b;">Payment could not be processed</p>
            </div>

            <div class="cta-container">
                <a href="${data.updatePaymentLink}" class="cta-button">Update Payment Method →</a>
            </div>

            <div class="grace-period-box">
                <h3>Your photos are safe for ${data.gracePeriodDays >= 30 ? Math.ceil(data.gracePeriodDays / 30) + ' more month' + (Math.ceil(data.gracePeriodDays / 30) !== 1 ? 's' : '') : data.gracePeriodDays + ' more days'}</h3>
                <p>Your Memory Insurance is still active during this grace period. Simply update your payment method, and we'll keep your digital safety deposit box protected.</p>
                <p style="margin-bottom: 0;"><strong>Don't let your protection lapse</strong>—those memories are irreplaceable.</p>
            </div>

            <h3>Common reasons for payment failures:</h3>
            <ul class="common-reasons">
                <li>💳 <strong>Expired card:</strong> Your card may have reached its expiration date</li>
                <li>🏦 <strong>Insufficient funds:</strong> Not enough balance in your account</li>
                <li>🔒 <strong>Security block:</strong> Your bank flagged the transaction for security</li>
                <li>📍 <strong>Billing address:</strong> Mismatch between billing address and card details</li>
                <li>🚫 <strong>Card limit:</strong> Transaction exceeds your card limit</li>
            </ul>

            <p><strong>What happens next?</strong></p>
            <ul style="color: #6b7280;">
                <li>Update your payment method anytime during the ${data.gracePeriodDays >= 30 ? Math.ceil(data.gracePeriodDays / 30) + '-month' : data.gracePeriodDays + '-day'} grace period</li>
                <li>We'll automatically retry the payment</li>
                <li>Your access continues without interruption</li>
                <li>If not resolved, access may be suspended after the grace period</li>
            </ul>

            <div class="cta-container">
                <a href="${data.updatePaymentLink}" class="cta-button">Fix Payment Method Now →</a>
            </div>

            <p style="text-align: center; margin: 30px 0;">
                <strong>Need help?</strong> Contact our support team at <a href="mailto:support@photovault.photo" style="color: #3b82f6;">support@photovault.photo</a><br>
                We're here Mon-Fri, 9am-6pm CST
            </p>

            <div class="footer">
                <p>This notice was sent to ${data.customerEmail}</p>
                <p>© ${new Date().getFullYear()} PhotoVault. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// ============================================================================
// 2. PAYMENT FAILED NOTIFICATION EMAIL - TEXT
// ============================================================================

export function getPaymentFailedEmailText(data: PaymentFailedEmailData): string {
  return `
❌ PAYMENT FAILED - ACTION REQUIRED

Hi ${data.customerName}!

We tried to process your subscription payment${data.galleryName ? ` for "${data.galleryName}"` : ''}, but unfortunately it failed.

AMOUNT DUE: $${data.amountDue.toFixed(2)}

UPDATE PAYMENT METHOD:
${data.updatePaymentLink}

DON'T WORRY - YOU HAVE ${data.gracePeriodDays >= 30 ? Math.ceil(data.gracePeriodDays / 30) + ' MONTHS' : data.gracePeriodDays + ' DAYS'}

Your access continues uninterrupted during this grace period. Simply update your payment method when convenient, and we'll retry the payment automatically.

No action needed right away - but the sooner you update, the better!

COMMON REASONS FOR PAYMENT FAILURES:

💳 Expired card: Your card may have reached its expiration date
🏦 Insufficient funds: Not enough balance in your account
🔒 Security block: Your bank flagged the transaction for security
📍 Billing address: Mismatch between billing address and card details
🚫 Card limit: Transaction exceeds your card limit

WHAT HAPPENS NEXT?

• Update your payment method anytime during the ${data.gracePeriodDays >= 30 ? Math.ceil(data.gracePeriodDays / 30) + '-month' : data.gracePeriodDays + '-day'} grace period
• We'll automatically retry the payment
• Your access continues without interruption
• If not resolved, access may be suspended after the grace period

FIX PAYMENT METHOD:
${data.updatePaymentLink}

NEED HELP?
Contact our support team at support@photovault.photo
We're here Mon-Fri, 9am-6pm CST

---
This notice was sent to ${data.customerEmail}

© ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}

// ============================================================================
// 3. PAYOUT NOTIFICATION EMAIL - HTML
// ============================================================================

export function getPayoutNotificationEmailHTML(data: PayoutNotificationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payout Processed Successfully!</title>
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
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .money-icon {
            font-size: 64px;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px 30px;
        }
        .payout-box {
            background: linear-gradient(135deg, #ecfdf5, #d1fae5);
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        .payout-amount {
            font-size: 48px;
            font-weight: 700;
            color: #059669;
            margin: 10px 0;
        }
        .payout-details {
            background: #f9fafb;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #6b7280;
        }
        .detail-value {
            font-weight: 600;
            color: #111827;
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
        .celebration-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .celebration-box h3 {
            margin-top: 0;
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
            <div class="money-icon">💰</div>
            <h1>Payout Processed!</h1>
            <p>Your earnings are on the way</p>
        </div>

        <div class="content">
            <h2>Great news, ${data.photographerName}! 🎉</h2>

            <p>Your PhotoVault payout has been successfully processed and is on its way to your bank account.</p>

            <div class="payout-box">
                <p style="margin: 0; font-size: 18px; color: #059669; font-weight: 600;">Payout Amount</p>
                <div class="payout-amount">$${data.payoutAmount.toFixed(2)}</div>
                <p style="margin: 0; color: #065f46;">Processing to your bank account</p>
            </div>

            <div class="payout-details">
                <h3 style="margin-top: 0; color: #111827;">Payout Details</h3>

                <div class="detail-row">
                    <span class="detail-label">Period</span>
                    <span class="detail-value">${data.period}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Payout Date</span>
                    <span class="detail-value">${data.payoutDate}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Active Clients</span>
                    <span class="detail-value">${data.clientCount} client${data.clientCount !== 1 ? 's' : ''}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Commission Rate</span>
                    <span class="detail-value">50%</span>
                </div>
            </div>

            <p><strong>When will I receive the money?</strong><br>
            Bank transfers typically take 2-5 business days to appear in your account, depending on your bank's processing time.</p>

            <div class="cta-container">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/photographer/earnings" class="cta-button">View Earnings Report →</a>
            </div>

            <div class="celebration-box">
                <h3>🎊 Keep Growing Your Business!</h3>
                <p>You're earning passive income while delivering an amazing experience to your clients. Here are some ways to grow:</p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Upload galleries for recent shoots</li>
                    <li>Invite past clients to access their old photos</li>
                    <li>Share PhotoVault with other photographers</li>
                    <li>Promote online gallery access to new clients</li>
                </ul>
            </div>

            <p style="text-align: center; font-size: 16px; color: #6b7280;">
                Thank you for being part of the PhotoVault community!<br>
                We're here to help you succeed.
            </p>

            <div class="footer">
                <p>This payout notification was sent to ${data.photographerEmail}</p>
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
// 3. PAYOUT NOTIFICATION EMAIL - TEXT
// ============================================================================

export function getPayoutNotificationEmailText(data: PayoutNotificationEmailData): string {
  return `
💰 PAYOUT PROCESSED!

Great news, ${data.photographerName}!

Your PhotoVault payout has been successfully processed and is on its way to your bank account.

PAYOUT AMOUNT: $${data.payoutAmount.toFixed(2)}

PAYOUT DETAILS
--------------
Period: ${data.period}
Payout Date: ${data.payoutDate}
Active Clients: ${data.clientCount} client${data.clientCount !== 1 ? 's' : ''}
Commission Rate: 50%

WHEN WILL I RECEIVE THE MONEY?

Bank transfers typically take 2-5 business days to appear in your account, depending on your bank's processing time.

VIEW EARNINGS REPORT:
${process.env.NEXT_PUBLIC_APP_URL}/photographer/earnings

🎊 KEEP GROWING YOUR BUSINESS!

You're earning passive income while delivering an amazing experience to your clients. Here are some ways to grow:

• Upload galleries for recent shoots
• Invite past clients to access their old photos
• Share PhotoVault with other photographers
• Promote online gallery access to new clients

Thank you for being part of the PhotoVault community!
We're here to help you succeed.

---
This payout notification was sent to ${data.photographerEmail}
Questions? Contact us at support@photovault.photo

© ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}
