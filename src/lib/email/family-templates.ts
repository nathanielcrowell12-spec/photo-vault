/**
 * FAMILY ACCOUNTS Email Templates for PhotoVault
 * Secondary invitations, grace period alerts, and takeover notifications
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SecondaryInvitationEmailData {
  secondaryName: string
  secondaryEmail: string
  primaryName: string
  relationship: string
  invitationToken: string
  expiresInDays?: number
}

export interface GracePeriodAlertEmailData {
  secondaryName: string
  secondaryEmail: string
  primaryName: string
  galleryCount: number
  monthsRemaining: number
  helpPayLink: string
}

export interface TakeoverConfirmationEmailData {
  newPayerName: string
  newPayerEmail: string
  previousPrimaryName: string
  takeoverType: 'full_primary' | 'billing_only'
  galleryCount: number
}

export interface PhotographerTakeoverNotificationData {
  photographerName: string
  photographerEmail: string
  originalClientName: string
  newContactName: string
  newContactEmail: string
  relationship: string
  reason: string
  reasonText?: string
}

export interface SecondaryWelcomeEmailData {
  secondaryName: string
  secondaryEmail: string
  primaryName: string
  relationship: string
  setPasswordLink: string
}

// ============================================================================
// 1. SECONDARY INVITATION EMAIL
// ============================================================================

export function getSecondaryInvitationEmailHTML(data: SecondaryInvitationEmailData): string {
  const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/family/accept/${data.invitationToken}`
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've Been Designated as Family on PhotoVault</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ec4899, #f97316); color: white; padding: 40px 30px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 10px;">👨‍👩‍👧‍👦</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">You've Been Designated as Family</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.secondaryName},</p>
            
            <p><strong>${data.primaryName}</strong> has designated you as a family member on their PhotoVault account.</p>
            
            <!-- What This Means Box -->
            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #92400e;">What does this mean?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                    <li>You can view galleries ${data.primaryName} chooses to share with family</li>
                    <li>If ${data.primaryName}'s account ever needs attention, you'll be notified</li>
                    <li>You can help ensure these precious memories stay protected</li>
                </ul>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #f97316); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 18px;">
                    Accept & View Photos
                </a>
            </div>
            
            <!-- Optional Payment Method -->
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px 0; color: #166534;">💳 Optional: Add a Backup Payment Method</h4>
                <p style="margin: 0; color: #15803d; font-size: 14px;">
                    Want to help ensure these photos stay protected? After accepting, you can add a payment method. 
                    If ${data.primaryName}'s payment ever lapses, you'll be able to seamlessly take over.
                </p>
            </div>
            
            <!-- Relationship Info -->
            <p style="color: #666; font-size: 14px;">
                You were designated as: <strong>${data.relationship}</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                <strong>What is PhotoVault?</strong><br>
                PhotoVault is where families preserve their most precious photo memories.
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Questions? Contact support@photovault.photo
            </p>
        </div>
    </div>
</body>
</html>
`
}

export function getSecondaryInvitationEmailText(data: SecondaryInvitationEmailData): string {
  const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/family/accept/${data.invitationToken}`
  
  return `
Hi ${data.secondaryName},

${data.primaryName} has designated you as a family member (${data.relationship}) on their PhotoVault account.

What does this mean?
- You can view galleries ${data.primaryName} chooses to share with family
- If ${data.primaryName}'s account ever needs attention, you'll be notified  
- You can help ensure these precious memories stay protected

Accept your invitation: ${acceptUrl}

Optional: After accepting, you can add a backup payment method. If ${data.primaryName}'s payment ever lapses, you'll be able to seamlessly take over.

---
PhotoVault - Where families preserve precious memories
Questions? Contact support@photovault.photo
`
}

// ============================================================================
// 2. GRACE PERIOD ALERT EMAILS (3, 4, 5, 5.5 months)
// ============================================================================

export function getGracePeriodAlertEmailHTML(data: GracePeriodAlertEmailData): string {
  const urgencyColor = data.monthsRemaining <= 1 ? '#dc2626' : data.monthsRemaining <= 2 ? '#f59e0b' : '#3b82f6'
  const urgencyBg = data.monthsRemaining <= 1 ? '#fef2f2' : data.monthsRemaining <= 2 ? '#fffbeb' : '#eff6ff'
  const urgencyText = data.monthsRemaining <= 0.5 ? 'FINAL NOTICE' : data.monthsRemaining <= 1 ? 'URGENT' : data.monthsRemaining <= 2 ? 'Reminder' : 'Attention Needed'
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.primaryName}'s PhotoVault Account Needs Attention</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: ${urgencyColor}; color: white; padding: 40px 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">${urgencyText}: ${data.primaryName}'s Account</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.secondaryName},</p>
            
            <p>Payment hasn't been received on <strong>${data.primaryName}'s</strong> PhotoVault account. 
            ${data.galleryCount} ${data.galleryCount === 1 ? 'gallery' : 'galleries'} containing precious family memories ${data.galleryCount === 1 ? 'is' : 'are'} at risk.</p>
            
            <!-- Time Remaining Box -->
            <div style="background: ${urgencyBg}; border: 2px solid ${urgencyColor}; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: ${urgencyColor};">Time Remaining</h3>
                <div style="font-size: 36px; font-weight: 700; color: ${urgencyColor};">
                    ${data.monthsRemaining <= 0.5 ? '2 weeks' : data.monthsRemaining === 1 ? '1 month' : `${data.monthsRemaining} months`}
                </div>
                <p style="margin: 10px 0 0 0; color: #666;">until access is suspended</p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.helpPayLink}" style="display: inline-block; background: ${urgencyColor}; color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 18px;">
                    Help Pay Now
                </a>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center;">
                You were designated as family by ${data.primaryName} to help protect these memories.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                PhotoVault | support@photovault.photo
            </p>
        </div>
    </div>
</body>
</html>
`
}

export function getGracePeriodAlertEmailText(data: GracePeriodAlertEmailData): string {
  const timeRemaining = data.monthsRemaining <= 0.5 ? '2 weeks' : data.monthsRemaining === 1 ? '1 month' : `${data.monthsRemaining} months`
  
  return `
Hi ${data.secondaryName},

ATTENTION: ${data.primaryName}'s PhotoVault account needs attention.

Payment hasn't been received. ${data.galleryCount} gallery(s) containing precious family memories are at risk.

Time remaining until suspension: ${timeRemaining}

Help Pay Now: ${data.helpPayLink}

You were designated as family by ${data.primaryName} to help protect these memories.

---
PhotoVault | support@photovault.photo
`
}

// ============================================================================
// 3. TAKEOVER CONFIRMATION EMAIL
// ============================================================================

export function getTakeoverConfirmationEmailHTML(data: TakeoverConfirmationEmailData): string {
  const roleText = data.takeoverType === 'full_primary' 
    ? 'the new primary account holder'
    : 'the billing payer'
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Takeover Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 40px 30px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 10px;">✅</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Account Takeover Confirmed</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.newPayerName},</p>
            
            <p>You are now <strong>${roleText}</strong> for ${data.previousPrimaryName}'s PhotoVault account.</p>
            
            <!-- What You Now Have -->
            <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #166534;">What you now have access to:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #15803d;">
                    <li><strong>${data.galleryCount}</strong> ${data.galleryCount === 1 ? 'gallery' : 'galleries'} of precious memories</li>
                    ${data.takeoverType === 'full_primary' ? `
                    <li>Full account management capabilities</li>
                    <li>Ability to invite your own family members</li>
                    <li>Control over which galleries are shared</li>
                    ` : `
                    <li>Billing management only</li>
                    <li>Other family members retain their access</li>
                    `}
                </ul>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/client/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 18px;">
                    Go to Dashboard
                </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
                Thank you for helping preserve these family memories. 💚
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                PhotoVault | support@photovault.photo
            </p>
        </div>
    </div>
</body>
</html>
`
}

export function getTakeoverConfirmationEmailText(data: TakeoverConfirmationEmailData): string {
  const roleText = data.takeoverType === 'full_primary' 
    ? 'the new primary account holder'
    : 'the billing payer'
  
  return `
Hi ${data.newPayerName},

Account Takeover Confirmed!

You are now ${roleText} for ${data.previousPrimaryName}'s PhotoVault account.

You now have access to ${data.galleryCount} gallery(s) of precious memories.

Go to your dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/client/dashboard

Thank you for helping preserve these family memories.

---
PhotoVault | support@photovault.photo
`
}

// ============================================================================
// 4. PHOTOGRAPHER TAKEOVER NOTIFICATION
// ============================================================================

export function getPhotographerTakeoverNotificationHTML(data: PhotographerTakeoverNotificationData): string {
  const reasonDisplay = {
    'death': 'Death of account holder',
    'financial': 'Financial hardship',
    'health': 'Health issues',
    'other': data.reasonText || 'Other reason'
  }[data.reason] || 'Not specified'
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Update: ${data.originalClientName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 40px 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Client Account Update</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.photographerName},</p>
            
            <p>We wanted to let you know that <strong>${data.originalClientName}'s</strong> PhotoVault account has been taken over by a family member.</p>
            
            <!-- New Contact Info -->
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #374151;">New Billing Contact</h3>
                <p style="margin: 0 0 5px 0;"><strong>Name:</strong> ${data.newContactName}</p>
                <p style="margin: 0 0 5px 0;"><strong>Relationship:</strong> ${data.relationship}</p>
                <p style="margin: 0 0 5px 0;"><strong>Email:</strong> <a href="mailto:${data.newContactEmail}">${data.newContactEmail}</a></p>
                <p style="margin: 0;"><strong>Reason given:</strong> ${reasonDisplay}</p>
            </div>
            
            ${data.reason === 'death' ? `
            <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>💐 Condolence Note:</strong> If you'd like to reach out to the family, please be mindful that they may be grieving.
                </p>
            </div>
            ` : ''}
            
            <p style="color: #666;">
                The photos you delivered are still protected, and your commission arrangement continues unchanged.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                PhotoVault | support@photovault.photo
            </p>
        </div>
    </div>
</body>
</html>
`
}

export function getPhotographerTakeoverNotificationText(data: PhotographerTakeoverNotificationData): string {
  const reasonDisplay = {
    'death': 'Death of account holder',
    'financial': 'Financial hardship',
    'health': 'Health issues',
    'other': data.reasonText || 'Other reason'
  }[data.reason] || 'Not specified'

  return `
Hi ${data.photographerName},

CLIENT ACCOUNT UPDATE

${data.originalClientName}'s PhotoVault account has been taken over by a family member.

New Billing Contact:
- Name: ${data.newContactName}
- Relationship: ${data.relationship}
- Email: ${data.newContactEmail}
- Reason: ${reasonDisplay}

The photos you delivered are still protected, and your commission arrangement continues unchanged.

---
PhotoVault | support@photovault.photo
`
}

// ============================================================================
// 5. SECONDARY WELCOME EMAIL (Account Created - Set Password)
// ============================================================================

export function getSecondaryWelcomeEmailHTML(data: SecondaryWelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PhotoVault - Set Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 40px 30px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 10px;">🎉</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Welcome to PhotoVault!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.secondaryName},</p>

            <p>Your PhotoVault family account has been created! <strong>${data.primaryName}</strong> has added you as a family member (${data.relationship}).</p>

            <!-- What You Can Do Box -->
            <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #166534;">🎯 Next Step: Set Your Password</h3>
                <p style="margin: 0; color: #15803d;">
                    Click the button below to set your password and start viewing shared family photos.
                </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.setPasswordLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 18px;">
                    Set Your Password
                </a>
            </div>

            <!-- What You'll Have Access To -->
            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px 0; color: #92400e;">📸 What you'll have access to:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                    <li>View galleries ${data.primaryName} shares with family</li>
                    <li>Download photos for personal use</li>
                    <li>Help protect these precious memories</li>
                </ul>
            </div>

            <p style="color: #666; font-size: 14px;">
                This link will expire in 24 hours. If it expires, you can request a new one from the login page.
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                <strong>What is PhotoVault?</strong><br>
                PhotoVault is where families preserve their most precious photo memories.
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Questions? Contact support@photovault.photo
            </p>
        </div>
    </div>
</body>
</html>
`
}

export function getSecondaryWelcomeEmailText(data: SecondaryWelcomeEmailData): string {
  return `
Hi ${data.secondaryName},

Welcome to PhotoVault!

Your family account has been created. ${data.primaryName} has added you as a family member (${data.relationship}).

NEXT STEP: Set Your Password
Click the link below to set your password and start viewing shared family photos:

${data.setPasswordLink}

What you'll have access to:
- View galleries ${data.primaryName} shares with family
- Download photos for personal use
- Help protect these precious memories

This link will expire in 24 hours. If it expires, you can request a new one from the login page.

---
PhotoVault - Where families preserve precious memories
Questions? Contact support@photovault.photo
`
}

