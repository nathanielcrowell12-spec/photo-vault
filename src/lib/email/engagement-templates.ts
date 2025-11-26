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
            <div class="celebration-icon">🎉</div>
            <h1>First Gallery Uploaded!</h1>
            <p>Congratulations on this important milestone</p>
        </div>

        <div class="content">
            <h2>Amazing work, ${data.photographerName}! 🎊</h2>

            <div class="success-message">
                ✅ Your gallery has been uploaded successfully!
            </div>

            <div class="gallery-info">
                <h3>"${data.galleryName}"</h3>
                <div class="photo-count">${data.photoCount}</div>
                <p style="margin: 0; font-size: 16px; color: #6b7280;">beautiful photo${data.photoCount !== 1 ? 's' : ''} ready to share</p>
            </div>

            <p style="font-size: 18px; text-align: center;">
                You've just taken the first step toward transforming how you deliver photos to your clients. Your gallery is beautifully organized and ready to go!
            </p>

            <div class="next-step-box">
                <h3>🚀 Next Step: Invite Your Client</h3>
                <p style="font-size: 16px; margin: 15px 0;">
                    <span class="step-number">1</span>
                    <strong>Send a professional invitation email to your client</strong>
                </p>
                <p style="margin-left: 42px; color: #6b7280;">
                    They'll receive a beautiful email with instant access to their photos. No downloads, no USB drives—just pure convenience!
                </p>

                <div style="text-align: center; margin-top: 20px;">
                    <a href="${data.nextStepsLink}" class="cta-button">Invite Your Client Now →</a>
                </div>
            </div>

            <div class="tips-box">
                <h3>💡 Tips for Success</h3>
                <ul>
                    <li><strong>Add a personal message:</strong> Include a note in the invitation to make it extra special</li>
                    <li><strong>Set expectations:</strong> Let clients know they can access photos anytime, anywhere</li>
                    <li><strong>Mention the subscription:</strong> Explain the small monthly fee keeps their photos accessible forever</li>
                    <li><strong>Follow up:</strong> Check in after a few days to ensure they received the invitation</li>
                </ul>
            </div>

            <p><strong>What happens after you send the invitation?</strong></p>
            <ul style="color: #6b7280;">
                <li>✉️ Your client receives a beautiful invitation email</li>
                <li>🔐 They create a free PhotoVault account</li>
                <li>💳 They subscribe ($8/month after Year 1) to access photos</li>
                <li>💰 You earn 50% commission ($4/month) for each active subscription</li>
                <li>📊 Track everything in your dashboard</li>
            </ul>

            <div class="encouragement">
                <p>
                    "You're not just uploading photos—you're building a new revenue stream while delivering an incredible client experience. Keep it up!"
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
🎉 FIRST GALLERY UPLOADED!

Amazing work, ${data.photographerName}!

✅ YOUR GALLERY HAS BEEN UPLOADED SUCCESSFULLY!

Gallery: "${data.galleryName}"
Photos: ${data.photoCount} beautiful photo${data.photoCount !== 1 ? 's' : ''} ready to share

You've just taken the first step toward transforming how you deliver photos to your clients. Your gallery is beautifully organized and ready to go!

🚀 NEXT STEP: INVITE YOUR CLIENT

1. Send a professional invitation email to your client

They'll receive a beautiful email with instant access to their photos. No downloads, no USB drives—just pure convenience!

INVITE YOUR CLIENT:
${data.nextStepsLink}

💡 TIPS FOR SUCCESS

• Add a personal message: Include a note in the invitation to make it extra special
• Set expectations: Let clients know they can access photos anytime, anywhere
• Mention the subscription: Explain the small monthly fee keeps their photos accessible forever
• Follow up: Check in after a few days to ensure they received the invitation

WHAT HAPPENS AFTER YOU SEND THE INVITATION?

✉️ Your client receives a beautiful invitation email
🔐 They create a free PhotoVault account
💳 They subscribe ($8/month after Year 1) to access photos
💰 You earn 50% commission ($4/month) for each active subscription
📊 Track everything in your dashboard

"You're not just uploading photos—you're building a new revenue stream while delivering an incredible client experience. Keep it up!"

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
            <div class="welcome-icon">👋</div>
            <h1>Welcome Back!</h1>
            <p>Your gallery access has been restored</p>
        </div>

        <div class="content">
            <h2>Hi ${data.customerName}! 😊</h2>

            <p>Great news! Your subscription to <strong>"${data.galleryName}"</strong> has been successfully renewed.</p>

            <div class="restoration-notice">
                <div class="checkmark">✅</div>
                <h3>Access Restored</h3>
                <p>All your photos are available again</p>
            </div>

            <div class="cta-container">
                <a href="${data.accessLink}" class="cta-button">Access My Gallery →</a>
            </div>

            <div class="benefits-reminder">
                <h3>Everything You Love is Back:</h3>
                <ul>
                    <li>📱 <strong>Access Anywhere:</strong> View your photos from any device</li>
                    <li>⬇️ <strong>Unlimited Downloads:</strong> Download high-resolution images anytime</li>
                    <li>🔒 <strong>Secure Storage:</strong> Your photos are safely backed up in the cloud</li>
                    <li>👨‍👩‍👧 <strong>Easy Sharing:</strong> Share your gallery with family and friends</li>
                    <li>📸 <strong>Professional Quality:</strong> All photos maintained in original quality</li>
                </ul>
            </div>

            <p><strong>Your Photographer:</strong> ${data.photographerName}</p>
            <p style="color: #6b7280;">
                ${data.photographerName} continues to maintain your photos on PhotoVault. You can access them anytime, and they may even add more photos to your gallery in the future!
            </p>

            <div class="thank-you-box">
                <h3>Thank You for Coming Back! 🙏</h3>
                <p>
                    We're glad you decided to keep your precious memories accessible. Your photos deserve to be enjoyed, not lost on a hard drive somewhere.
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
👋 WELCOME BACK!

Hi ${data.customerName}!

Great news! Your subscription to "${data.galleryName}" has been successfully renewed.

✅ ACCESS RESTORED
All your photos are available again

ACCESS YOUR GALLERY:
${data.accessLink}

EVERYTHING YOU LOVE IS BACK:

📱 Access Anywhere: View your photos from any device
⬇️ Unlimited Downloads: Download high-resolution images anytime
🔒 Secure Storage: Your photos are safely backed up in the cloud
👨‍👩‍👧 Easy Sharing: Share your gallery with family and friends
📸 Professional Quality: All photos maintained in original quality

YOUR PHOTOGRAPHER: ${data.photographerName}

${data.photographerName} continues to maintain your photos on PhotoVault. You can access them anytime, and they may even add more photos to your gallery in the future!

🙏 THANK YOU FOR COMING BACK!

We're glad you decided to keep your precious memories accessible. Your photos deserve to be enjoyed, not lost on a hard drive somewhere.

Ready to dive back in? All your photos are waiting for you!

VIEW MY PHOTOS:
${data.accessLink}

---
This confirmation was sent to ${data.customerEmail}
Questions? Contact us at support@photovault.photo

© ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}
