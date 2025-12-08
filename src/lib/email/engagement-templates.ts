/**
 * ENGAGEMENT Email Templates for PhotoVault
 * Priority 3: Milestone Celebrations & Re-engagement
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FirstGalleryUploadEmailData {
  photographerName: string
  photographerEmail: string
  galleryName: string
  photoCount: number
  nextStepsLink: string
}

export interface GalleryAccessRestoredEmailData {
  customerName: string
  customerEmail: string
  galleryName: string
  photographerName: string
  accessLink: string
}

// ============================================================================
// 1. FIRST GALLERY UPLOAD CONFIRMATION EMAIL - HTML
// ============================================================================

export function getFirstGalleryUploadEmailHTML(data: FirstGalleryUploadEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>First Gallery Uploaded Successfully!</title>
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
        .celebration-icon {
            font-size: 80px;
            margin-bottom: 10px;
            animation: bounce 1s ease infinite;
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .content {
            padding: 40px 30px;
        }
        .success-message {
            font-size: 18px;
            text-align: center;
            margin: 30px 0;
            color: #059669;
            font-weight: 600;
        }
        .gallery-info {
            background: #faf5ff;
            border: 2px solid #9333ea;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        .gallery-info h3 {
            margin: 0 0 15px 0;
            color: #581c87;
            font-size: 20px;
        }
        .photo-count {
            font-size: 48px;
            font-weight: 700;
            color: #9333ea;
            margin: 10px 0;
        }
        .next-step-box {
            background: linear-gradient(135deg, #ecfdf5, #d1fae5);
            border-left: 4px solid #10b981;
            padding: 25px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .next-step-box h3 {
            margin-top: 0;
            color: #065f46;
            font-size: 22px;
        }
        .next-step-box .step-number {
            display: inline-block;
            background: #10b981;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            text-align: center;
            line-height: 32px;
            font-weight: 700;
            margin-right: 10px;
            font-size: 16px;
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
        .tips-box {
            background: #f0f9ff;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
        }
        .tips-box h3 {
            margin-top: 0;
            color: #1e40af;
        }
        .tips-box ul {
            margin: 15px 0;
            padding-left: 20px;
        }
        .tips-box li {
            margin-bottom: 10px;
            color: #4b5563;
        }
        .encouragement {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
            text-align: center;
        }
        .encouragement p {
            margin: 0;
            font-size: 18px;
            color: #92400e;
            font-style: italic;
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
            <div class="celebration-icon">🛡️</div>
            <h1>You're Now Protecting Memories</h1>
            <p>Your first gallery is secured and ready to deliver</p>
        </div>

        <div class="content">
            <h2>Well done, ${data.photographerName}!</h2>

            <div class="success-message">
                ✅ These memories are now protected in PhotoVault
            </div>

            <div class="gallery-info">
                <h3>"${data.galleryName}"</h3>
                <div class="photo-count">${data.photoCount}</div>
                <p style="margin: 0; font-size: 16px; color: #6b7280;">irreplaceable photo${data.photoCount !== 1 ? 's' : ''} now protected</p>
            </div>

            <p style="font-size: 18px; text-align: center;">
                You've just become the guardian of another family's history. These photos are now safe from hard drive failures, lost USB drives, and expired download links.
            </p>

            <div class="next-step-box">
                <h3>🛡️ Next Step: Deliver Their Memory Insurance</h3>
                <p style="font-size: 16px; margin: 15px 0;">
                    <span class="step-number">1</span>
                    <strong>Send their protected gallery invitation</strong>
                </p>
                <p style="margin-left: 42px; color: #6b7280;">
                    They'll receive instant access to their photos—one tap to download full resolution directly to their camera roll. No zip files. No hassle.
                </p>

                <div style="text-align: center; margin-top: 20px;">
                    <a href="${data.nextStepsLink}" class="cta-button">Deliver Memory Insurance →</a>
                </div>
            </div>

            <div class="tips-box">
                <h3>Guardian Tips</h3>
                <ul>
                    <li><strong>Tell the story:</strong> Remind them that hard drives fail—their photos are now protected</li>
                    <li><strong>Make it personal:</strong> Add a note about what made this session special</li>
                    <li><strong>Explain the value:</strong> For the price of one coffee a month, they never have to worry about losing these memories</li>
                    <li><strong>Follow up:</strong> Check that they've set up their Memory Insurance</li>
                </ul>
            </div>

            <p><strong>What happens when they activate their Memory Insurance?</strong></p>
            <ul style="color: #6b7280;">
                <li>🛡️ Their photos are protected in a digital safety deposit box</li>
                <li>📱 One-tap downloads to their camera roll—full resolution</li>
                <li>💰 You earn $4/month passive income for every protected family</li>
                <li>👨‍👩‍👧 They can share with family members they authorize</li>
                <li>📊 Track all your protected families in your dashboard</li>
            </ul>

            <div class="encouragement">
                <p>
                    "You're not just delivering photos—you're protecting irreplaceable memories while building recurring income. That's what being a Guardian means."
                </p>
            </div>

            <div class="cta-container">
                <a href="${data.nextStepsLink}" class="cta-button">Send Invitation →</a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/photographer/dashboard" class="cta-button">View Dashboard →</a>
            </div>

            <div class="footer">
                <p><strong>Need help?</strong> We're here for you!</p>
                <p>Contact us at <a href="mailto:support@photovault.photo">support@photovault.photo</a></p>
                <p>Mon-Fri, 9am-6pm CST</p>
                <p style="margin-top: 20px;">© ${new Date().getFullYear()} PhotoVault. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// ============================================================================
// 1. FIRST GALLERY UPLOAD CONFIRMATION EMAIL - TEXT
// ============================================================================

export function getFirstGalleryUploadEmailText(data: FirstGalleryUploadEmailData): string {
  return `
🛡️ YOU'RE NOW PROTECTING MEMORIES

Well done, ${data.photographerName}!

✅ THESE MEMORIES ARE NOW PROTECTED IN PHOTOVAULT

Gallery: "${data.galleryName}"
Photos: ${data.photoCount} irreplaceable photo${data.photoCount !== 1 ? 's' : ''} now protected

You've just become the guardian of another family's history. These photos are now safe from hard drive failures, lost USB drives, and expired download links.

🛡️ NEXT STEP: DELIVER THEIR MEMORY INSURANCE

1. Send their protected gallery invitation

They'll receive instant access to their photos—one tap to download full resolution directly to their camera roll. No zip files. No hassle.

DELIVER MEMORY INSURANCE:
${data.nextStepsLink}

GUARDIAN TIPS

• Tell the story: Remind them that hard drives fail—their photos are now protected
• Make it personal: Add a note about what made this session special
• Explain the value: For the price of one coffee a month, they never have to worry about losing these memories
• Follow up: Check that they've set up their Memory Insurance

WHAT HAPPENS WHEN THEY ACTIVATE THEIR MEMORY INSURANCE?

🛡️ Their photos are protected in a digital safety deposit box
📱 One-tap downloads to their camera roll—full resolution
💰 You earn $4/month passive income for every protected family
👨‍👩‍👧 They can share with family members they authorize
📊 Track all your protected families in your dashboard

"You're not just delivering photos—you're protecting irreplaceable memories while building recurring income. That's what being a Guardian means."

SEND INVITATION:
${data.nextStepsLink}

VIEW DASHBOARD:
${process.env.NEXT_PUBLIC_APP_URL}/photographer/dashboard

---
NEED HELP? We're here for you!
Contact us at support@photovault.photo
Mon-Fri, 9am-6pm CST

© ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}

// ============================================================================
// 2. GALLERY ACCESS RESTORED EMAIL - HTML
// ============================================================================

export function getGalleryAccessRestoredEmailHTML(data: GalleryAccessRestoredEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Back! Your Gallery Access Has Been Restored</title>
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
        .welcome-icon {
            font-size: 64px;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px 30px;
        }
        .restoration-notice {
            background: linear-gradient(135deg, #ecfdf5, #d1fae5);
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        .restoration-notice h3 {
            margin: 0 0 10px 0;
            color: #065f46;
            font-size: 24px;
        }
        .restoration-notice p {
            margin: 0;
            color: #047857;
            font-size: 16px;
        }
        .checkmark {
            font-size: 64px;
            color: #10b981;
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
        .benefits-reminder {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .benefits-reminder h3 {
            margin-top: 0;
            color: #1e40af;
        }
        .benefits-reminder ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .benefits-reminder li {
            margin-bottom: 10px;
            color: #4b5563;
        }
        .thank-you-box {
            background: #fef3c7;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        .thank-you-box h3 {
            margin-top: 0;
            color: #92400e;
        }
        .thank-you-box p {
            margin: 10px 0 0 0;
            color: #78350f;
            font-size: 16px;
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
            <div class="welcome-icon">🛡️</div>
            <h1>Your Memories Are Protected Again</h1>
            <p>Memory Insurance restored</p>
        </div>

        <div class="content">
            <h2>Hi ${data.customerName}!</h2>

            <p>Great news! Your Memory Insurance for <strong>"${data.galleryName}"</strong> is active again. Your photos are protected.</p>

            <div class="restoration-notice">
                <div class="checkmark">✅</div>
                <h3>Protection Restored</h3>
                <p>Your irreplaceable memories are safe</p>
            </div>

            <div class="cta-container">
                <a href="${data.accessLink}" class="cta-button">Access My Protected Photos →</a>
            </div>

            <div class="benefits-reminder">
                <h3>Your Memory Insurance Includes:</h3>
                <ul>
                    <li>🛡️ <strong>Digital Safety Deposit Box:</strong> Protected from hard drive failures</li>
                    <li>📱 <strong>One-Tap Downloads:</strong> Full resolution directly to your camera roll</li>
                    <li>👨‍👩‍👧 <strong>Family Sharing:</strong> Share with family members you authorize</li>
                    <li>📸 <strong>Full Resolution:</strong> Every detail preserved in original quality</li>
                    <li>♾️ <strong>Lifetime Archival:</strong> No expiring download links</li>
                </ul>
            </div>

            <p><strong>Your Photographer:</strong> ${data.photographerName}</p>
            <p style="color: #6b7280;">
                ${data.photographerName} is the guardian of your family history. They'll continue protecting your photos and may add more memories to your vault in the future.
            </p>

            <div class="thank-you-box">
                <h3>Welcome Back</h3>
                <p>
                    Smart choice. Hard drives fail. Cloud accounts get hacked. Your memories deserve real protection—a digital safety deposit box that keeps them safe for generations.
                </p>
            </div>

            <p style="text-align: center; font-size: 16px; margin: 30px 0;">
                <strong>Ready to dive back in?</strong><br>
                All your photos are waiting for you!
            </p>

            <div class="cta-container">
                <a href="${data.accessLink}" class="cta-button">View My Photos →</a>
            </div>

            <div class="footer">
                <p>This confirmation was sent to ${data.customerEmail}</p>
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
// 2. GALLERY ACCESS RESTORED EMAIL - TEXT
// ============================================================================

export function getGalleryAccessRestoredEmailText(data: GalleryAccessRestoredEmailData): string {
  return `
🛡️ YOUR MEMORIES ARE PROTECTED AGAIN

Hi ${data.customerName}!

Great news! Your Memory Insurance for "${data.galleryName}" is active again. Your photos are protected.

✅ PROTECTION RESTORED
Your irreplaceable memories are safe

ACCESS YOUR PROTECTED PHOTOS:
${data.accessLink}

YOUR MEMORY INSURANCE INCLUDES:

🛡️ Digital Safety Deposit Box: Protected from hard drive failures
📱 One-Tap Downloads: Full resolution directly to your camera roll
👨‍👩‍👧 Family Sharing: Share with family members you authorize
📸 Full Resolution: Every detail preserved in original quality
♾️ Lifetime Archival: No expiring download links

YOUR PHOTOGRAPHER: ${data.photographerName}

${data.photographerName} is the guardian of your family history. They'll continue protecting your photos and may add more memories to your vault in the future.

WELCOME BACK

Smart choice. Hard drives fail. Cloud accounts get hacked. Your memories deserve real protection—a digital safety deposit box that keeps them safe for generations.

Ready to dive back in? All your photos are waiting for you!

VIEW MY PHOTOS:
${data.accessLink}

---
This confirmation was sent to ${data.customerEmail}
Questions? Contact us at support@photovault.photo

© ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}
