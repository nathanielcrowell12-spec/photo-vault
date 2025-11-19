/**
 * Email templates for Photo Vault
 * All transactional emails sent to customers
 */

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

export interface PasswordResetEmailData {
  customerName: string
  resetToken: string
  resetLink: string
}

/**
 * Gallery Ready Email Template
 * Sent when photographer uploads photos to a client's gallery
 */
export function getGalleryReadyEmailHTML(data: GalleryReadyEmailData): string {
  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.invitationToken}`

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Photos Are Ready!</title>
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
            background: linear-gradient(135deg, #ec4899, #f97316);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.95;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #1f2937;
            margin: 0 0 20px 0;
            font-size: 22px;
        }
        .content p {
            color: #4b5563;
            margin: 0 0 16px 0;
            font-size: 16px;
        }
        .gallery-info {
            background: #f9fafb;
            border-left: 4px solid #ec4899;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .gallery-info h3 {
            margin: 0 0 12px 0;
            color: #1f2937;
            font-size: 18px;
        }
        .gallery-info p {
            margin: 0;
            color: #6b7280;
        }
        .gallery-stat {
            display: inline-block;
            background: white;
            padding: 8px 16px;
            border-radius: 20px;
            margin-top: 12px;
            font-size: 14px;
            color: #ec4899;
            font-weight: 600;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ec4899, #f97316);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            margin: 30px 0;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .cta-container {
            text-align: center;
        }
        .photographer-info {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .photographer-info p {
            margin: 0;
            color: #1e40af;
            font-size: 14px;
        }
        .photographer-info strong {
            display: block;
            font-size: 16px;
            margin-bottom: 4px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .footer p {
            margin: 8px 0;
            color: #9ca3af;
        }
        .footer a {
            color: #ec4899;
            text-decoration: none;
        }
        .steps {
            background: #f9fafb;
            padding: 24px;
            border-radius: 8px;
            margin: 24px 0;
        }
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
        }
        .step:last-child {
            margin-bottom: 0;
        }
        .step-number {
            background: #ec4899;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            flex-shrink: 0;
            margin-right: 16px;
        }
        .step-content p {
            margin: 0;
            color: #4b5563;
            font-size: 15px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📸 Your Photos Are Ready!</h1>
            <p>View and download your professional photos</p>
        </div>

        <div class="content">
            <h2>Hi ${data.clientName}! 👋</h2>

            <p>Great news! ${data.photographerName} has uploaded your photos to PhotoVault.</p>

            <div class="gallery-info">
                <h3>${data.galleryName}</h3>
                ${data.galleryDescription ? `<p>${data.galleryDescription}</p>` : ''}
                <span class="gallery-stat">📷 ${data.photoCount} photo${data.photoCount !== 1 ? 's' : ''} ready</span>
            </div>

            <p>Your photos are safely stored and ready to view, download, and share with family and friends.</p>

            <div class="steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <p><strong>Click the button below</strong> to create your free PhotoVault account</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <p><strong>Set up your account</strong> with a secure password</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <p><strong>Access your gallery</strong> and enjoy your professional photos!</p>
                    </div>
                </div>
            </div>

            <div class="cta-container">
                <a href="${invitationLink}" class="cta-button">View My Photos →</a>
            </div>

            <div class="photographer-info">
                <p><strong>From ${data.photographerBusinessName || data.photographerName}</strong></p>
                <p>Your trusted photographer</p>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
                <strong>What is PhotoVault?</strong><br>
                PhotoVault is a secure platform where you can access all your professional photos from different photographers in one beautiful place. No more lost USB drives or expired download links!
            </p>

            <div class="footer">
                <p>This gallery was shared with you by ${data.photographerName}</p>
                <p>Questions? Contact us at <a href="mailto:support@photovault.com">support@photovault.com</a></p>
                <p style="margin-top: 20px; font-size: 12px;">
                    © ${new Date().getFullYear()} PhotoVault. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}

/**
 * Gallery Ready Email - Plain Text Version
 */
export function getGalleryReadyEmailText(data: GalleryReadyEmailData): string {
  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.invitationToken}`

  return `
📸 YOUR PHOTOS ARE READY!

Hi ${data.clientName}!

Great news! ${data.photographerName} has uploaded your photos to PhotoVault.

GALLERY DETAILS:
- ${data.galleryName}
${data.galleryDescription ? `- ${data.galleryDescription}` : ''}
- ${data.photoCount} photo${data.photoCount !== 1 ? 's' : ''} ready to view

Your photos are safely stored and ready to view, download, and share with family and friends.

HOW TO ACCESS YOUR PHOTOS:

1. Click this link to create your free PhotoVault account:
   ${invitationLink}

2. Set up your account with a secure password

3. Access your gallery and enjoy your professional photos!

From: ${data.photographerBusinessName || data.photographerName}

WHAT IS PHOTOVAULT?
PhotoVault is a secure platform where you can access all your professional photos from different photographers in one beautiful place. No more lost USB drives or expired download links!

---
This gallery was shared with you by ${data.photographerName}
Questions? Contact us at support@photovault.com

© ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}

/**
 * Welcome Email Template
 * Sent after customer creates account
 */
export function getWelcomeEmailHTML(data: WelcomeEmailData): string {
  const dashboardLink = data.accountType === 'photographer'
    ? `${process.env.NEXT_PUBLIC_APP_URL}/photographer/dashboard`
    : `${process.env.NEXT_PUBLIC_APP_URL}/client/dashboard`

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
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .content { padding: 40px 30px; }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            margin: 30px 0;
            font-weight: 600;
        }
        .cta-container { text-align: center; }
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
            <p>Your photos, beautifully organized</p>
        </div>

        <div class="content">
            <h2>Hi ${data.customerName}!</h2>
            <p>Welcome to PhotoVault! We're thrilled to have you here.</p>
            <p>Your account has been successfully created and you're ready to start organizing and accessing your professional photos.</p>

            <div class="cta-container">
                <a href="${dashboardLink}" class="cta-button">Go to Dashboard →</a>
            </div>

            <div class="footer">
                <p>Questions? Contact us at <a href="mailto:support@photovault.com">support@photovault.com</a></p>
                <p>© ${new Date().getFullYear()} PhotoVault. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}

export function getWelcomeEmailText(data: WelcomeEmailData): string {
  const dashboardLink = data.accountType === 'photographer'
    ? `${process.env.NEXT_PUBLIC_APP_URL}/photographer/dashboard`
    : `${process.env.NEXT_PUBLIC_APP_URL}/client/dashboard`

  return `
🎉 WELCOME TO PHOTOVAULT!

Hi ${data.customerName}!

Welcome to PhotoVault! We're thrilled to have you here.

Your account has been successfully created and you're ready to start organizing and accessing your professional photos.

Get started: ${dashboardLink}

Questions? Contact us at support@photovault.com

© ${new Date().getFullYear()} PhotoVault. All rights reserved.
  `.trim()
}
