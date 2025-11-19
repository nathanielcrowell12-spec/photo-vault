# Complete Email Templates Implementation Guide

## Status: All Critical Email Templates Defined

This document contains all the email templates needed for PhotoVault. Each template needs to be added to the codebase.

---

## 📧 Implementation Plan

### Files to Update:
1. `src/lib/email/templates.ts` - Add all new email template functions
2. `src/lib/email/email-service.ts` - Add methods to send each email type

---

## ✅ Templates Already Implemented

1. **Gallery Ready Email** - ✅ Complete
2. **Welcome Email** - ✅ Complete
3. **Password Reset Email** - ✅ Complete
4. **Payment Reminder Email** - ✅ Complete

---

## 🚀 NEW TEMPLATES TO ADD

### 5. Client Invitation Email (CRITICAL - Priority 1)

**When**: Photographer invites client to view gallery
**To**: Client email
**From**: noreply@photovault.photo

**Data Interface**:
```typescript
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
```

**Email Service Method**:
```typescript
static async sendClientInvitationEmail(data: ClientInvitationEmailData) {
  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.clientEmail,
    subject: `📸 ${data.photographerName} invited you to view your photos!`,
    html: getClientInvitationEmailHTML(data),
    text: getClientInvitationEmailText(data)
  })
}
```

**Key Features**:
- Personalized greeting
- Optional personal message from photographer
- Clear CTA button to view photos
- Expiration warning
- Photographer branding

---

### 6. Photographer Welcome Email (Priority 1)

**When**: New photographer signs up
**To**: Photographer email
**From**: noreply@photovault.photo

**Data Interface**:
```typescript
export interface PhotographerWelcomeEmailData {
  photographerName: string
  photographerEmail: string
  businessName?: string
}
```

**Email Service Method**:
```typescript
static async sendPhotographerWelcomeEmail(data: PhotographerWelcomeEmailData) {
  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.photographerEmail,
    subject: '🎉 Welcome to PhotoVault - Let\'s Get Started!',
    html: getPhotographerWelcomeEmailHTML(data),
    text: getPhotographerWelcomeEmailText(data)
  })
}
```

**Content**:
- Welcome message
- 3-step getting started guide:
  1. Upload first gallery
  2. Invite client
  3. Connect Stripe for payouts
- Links to dashboard, upload page, Stripe setup
- Feature list
- Pro tip about starting with recent clients

---

### 7. Payment Successful Confirmation (Priority 1)

**When**: Client completes payment for gallery access
**To**: Client email
**From**: noreply@photovault.photo

**Data Interface**:
```typescript
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
```

**Email Service Method**:
```typescript
static async sendPaymentSuccessfulEmail(data: PaymentSuccessfulEmailData) {
  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: '✅ Payment Successful - Your Photos Are Ready!',
    html: getPaymentSuccessfulEmailHTML(data),
    text: getPaymentSuccessfulEmailText(data)
  })
}
```

**Content**:
- Payment confirmation
- Receipt details (amount, plan, next billing date)
- Link to access photos
- Download receipt link (if available)
- What's next section

---

### 8. Subscription Expiring Warning (Priority 2)

**When**: 7 days before subscription ends
**To**: Client email
**From**: noreply@photovault.photo

**Data Interface**:
```typescript
export interface SubscriptionExpiringEmailData {
  customerName: string
  customerEmail: string
  galleryName: string
  expiresInDays: number
  renewalLink: string
  monthlyPrice: number
}
```

**Email Service Method**:
```typescript
static async sendSubscriptionExpiringEmail(data: SubscriptionExpiringEmailData) {
  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: `⚠️ Your ${data.galleryName} subscription expires in ${data.expiresInDays} days`,
    html: getSubscriptionExpiringEmailHTML(data),
    text: getSubscriptionExpiringEmailText(data)
  })
}
```

**Content**:
- Friendly reminder about expiration
- What happens if they don't renew (90-day grace period)
- Easy renewal button
- Benefits of keeping subscription active
- Pricing reminder

---

### 9. Payment Failed Notification (Priority 2)

**When**: Subscription payment fails
**To**: Client email
**From**: noreply@photovault.photo

**Data Interface**:
```typescript
export interface PaymentFailedEmailData {
  customerName: string
  customerEmail: string
  amountDue: number
  galleryName?: string
  updatePaymentLink: string
  gracePeriodDays: number
}
```

**Email Service Method**:
```typescript
static async sendPaymentFailedEmail(data: PaymentFailedEmailData) {
  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: '⚠️ Payment Failed - Update Your Payment Method',
    html: getPaymentFailedEmailHTML(data),
    text: getPaymentFailedEmailText(data)
  })
}
```

**Content**:
- Payment failure notification
- Grace period information
- Update payment method button
- What happens if not resolved
- Support contact info

---

### 10. Payout Notification (Priority 2)

**When**: Photographer receives commission payout
**To**: Photographer email
**From**: noreply@photovault.photo

**Data Interface**:
```typescript
export interface PayoutNotificationEmailData {
  photographerName: string
  photographerEmail: string
  payoutAmount: number
  payoutDate: string
  clientCount: number
  period: string
}
```

**Email Service Method**:
```typescript
static async sendPayoutNotificationEmail(data: PayoutNotificationEmailData) {
  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.photographerEmail,
    subject: `💰 Payout Processed: $${data.payoutAmount.toFixed(2)}`,
    html: getPayoutNotificationEmailHTML(data),
    text: getPayoutNotificationEmailText(data)
  })
}
```

**Content**:
- Payout confirmation
- Amount and period
- Number of active clients
- Bank transfer timeline
- Link to detailed earnings report

---

### 11. First Gallery Upload Confirmation (Priority 3)

**When**: Photographer uploads their first gallery
**To**: Photographer email
**From**: noreply@photovault.photo

**Data Interface**:
```typescript
export interface FirstGalleryUploadEmailData {
  photographerName: string
  galleryName: string
  photoCount: number
  nextStepsLink: string
}
```

**Email Service Method**:
```typescript
static async sendFirstGalleryUploadEmail(data: FirstGalleryUploadEmailData) {
  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.photographerEmail,
    subject: '🎉 First Gallery Uploaded Successfully!',
    html: getFirstGalleryUploadEmailHTML(data),
    text: getFirstGalleryUploadEmailText(data)
  })
}
```

**Content**:
- Celebration of milestone
- Gallery details
- Next step: Invite client
- Tips for best results
- Encouragement

---

### 12. Gallery Access Restored (Priority 3)

**When**: Client renews after cancellation
**To**: Client email
**From**: noreply@photovault.photo

**Data Interface**:
```typescript
export interface GalleryAccessRestoredEmailData {
  customerName: string
  galleryName: string
  photographerName: string
  accessLink: string
}
```

**Email Service Method**:
```typescript
static async sendGalleryAccessRestoredEmail(data: GalleryAccessRestoredEmailData) {
  return await resend.emails.send({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: '✅ Welcome Back! Your Gallery Access Has Been Restored',
    html: getGalleryAccessRestoredEmailHTML(data),
    text: getGalleryAccessRestoredEmailText(data)
  })
}
```

**Content**:
- Welcome back message
- Confirmation that access is restored
- Link to gallery
- Reminder of benefits
- Thank you for returning

---

## 📝 Implementation Checklist

### Phase 1: Critical Emails (Must Have Before Launch)
- [ ] Add ClientInvitationEmail template functions to templates.ts
- [ ] Add PhotographerWelcomeEmail template functions to templates.ts
- [ ] Add PaymentSuccessfulEmail template functions to templates.ts
- [ ] Add sendClientInvitationEmail() to email-service.ts
- [ ] Add sendPhotographerWelcomeEmail() to email-service.ts
- [ ] Add sendPaymentSuccessfulEmail() to email-service.ts

### Phase 2: Revenue Protection (Important)
- [ ] Add SubscriptionExpiringEmail template functions to templates.ts
- [ ] Add PaymentFailedEmail template functions to templates.ts
- [ ] Add PayoutNotificationEmail template functions to templates.ts
- [ ] Add corresponding send methods to email-service.ts

### Phase 3: Nice to Have (Post-Launch)
- [ ] Add FirstGalleryUploadEmail template functions
- [ ] Add GalleryAccessRestoredEmail template functions
- [ ] Add corresponding send methods

---

## 🧪 Testing Checklist

After implementation, test each email:
- [ ] Client Invitation - Send test invitation
- [ ] Photographer Welcome - Create test photographer account
- [ ] Payment Successful - Process test payment
- [ ] Subscription Expiring - Manually trigger
- [ ] Payment Failed - Test failed payment
- [ ] Payout Notification - Process test payout
- [ ] First Gallery Upload - Upload test gallery
- [ ] Gallery Access Restored - Test renewal flow

---

## 📧 Email Addresses Referenced

All templates use:
- **From**: noreply@photovault.photo
- **Support**: support@photovault.photo
- **Reply-To**: (same as From, unless specified)

---

## 🎨 Branding Guidelines

All emails follow these design principles:
- **Colors**: Gradient headers (purple/pink for photographer, green/blue for client)
- **Font**: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- **Tone**: Professional but friendly, encouraging
- **CTAs**: Clear, action-oriented buttons
- **Mobile**: Responsive design, max-width 600px
- **Accessibility**: Good contrast, readable fonts, alt text

---

## 🔗 Dynamic Links

All emails include proper app links:
- Gallery access: `/invite/{token}` or `/client/gallery/{id}`
- Dashboard: `/photographer/dashboard` or `/client/dashboard`
- Upload: `/photographer/upload`
- Stripe: `/photographer/settings/payments`
- Billing: `/client/billing`

---

**Status**: Ready for implementation
**Last Updated**: 2025-11-19
**Priority**: Implement Phase 1 (critical emails) immediately

