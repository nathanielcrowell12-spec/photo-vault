/**
 * DRIP Email Templates for PhotoVault
 * Post-signup nurture sequences for photographers and clients
 *
 * Design: Intentionally minimal/personal layout (no heavy gradients).
 * Nurture emails perform better when they look like personal emails, not marketing.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://photovault.photo'

// Shared email wrapper for drip emails — clean, personal, mobile-first
function wrapDripEmail(content: string, unsubscribeUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #1a1a1a;
            max-width: 580px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            font-size: 16px;
        }
        p { margin: 0 0 16px 0; }
        strong { color: #111; }
        .cta-button {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
        }
        .cta-button:hover { background: #059669; }
        .cta-wrap { text-align: center; margin: 24px 0; }
        ul { padding-left: 20px; margin: 16px 0; }
        li { margin: 6px 0; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #9ca3af;
            text-align: center;
        }
        .footer a { color: #9ca3af; text-decoration: underline; }
        .ps { margin-top: 24px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    ${content}
    <div class="footer">
        <p>PhotoVault &middot; photovault.photo</p>
        <p><a href="${unsubscribeUrl}">Unsubscribe from these emails</a></p>
    </div>
</body>
</html>`
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PhotographerStripeNudgeData {
  photographerName: string
  photographerEmail: string
  unsubscribeToken: string
}

export interface PhotographerGalleryNudgeData {
  photographerName: string
  photographerEmail: string
  stripeConnected: boolean
  unsubscribeToken: string
}

export interface PhotographerPassiveIncomeMathData {
  photographerName: string
  photographerEmail: string
  progressLine: string
  unsubscribeToken: string
}

export interface PhotographerFounderCheckinData {
  photographerName: string
  photographerEmail: string
  statusMessage: string
  unsubscribeToken: string
}

export interface ClientGettingStartedData {
  clientName: string
  clientEmail: string
  photographerName: string
  unsubscribeToken: string
}

export interface ClientWhyStorageMattersData {
  clientName: string
  clientEmail: string
  photographerName: string
  unsubscribeToken: string
}

export interface ClientMorePhotographersData {
  clientName: string
  clientEmail: string
  unsubscribeToken: string
}

// ============================================================================
// HELPER: Build unsubscribe URL
// ============================================================================
function unsubUrl(token: string): string {
  return `${APP_URL}/api/email/unsubscribe?token=${token}`
}

// ============================================================================
// 1. PHOTOGRAPHER DAY 1: STRIPE CONNECT NUDGE
// ============================================================================

export function getPhotographerStripeNudgeEmailHTML(data: PhotographerStripeNudgeData): string {
  return wrapDripEmail(`
    <p>Hey ${data.photographerName},</p>

    <p>Quick heads up: your PhotoVault account is set up, but you can't receive payments yet.</p>

    <p>Until you connect Stripe, your clients won't be able to pay for gallery access &mdash; which means no commissions flowing to you.</p>

    <p>The good news: it takes about 5 minutes. Stripe asks for basic info (name, bank account, tax ID) and you're done. We never see your banking details.</p>

    <p>Once connected, here's what happens:</p>
    <ul>
        <li>Client pays for gallery access</li>
        <li>Stripe splits the payment automatically</li>
        <li>Your 50% commission hits your bank account</li>
    </ul>

    <p>That's it. No invoicing. No chasing payments. No waiting 30 days.</p>

    <div class="cta-wrap">
        <a href="${APP_URL}/photographers/settings" class="cta-button">Connect Stripe Now</a>
    </div>

    <p class="ps">P.S. Already connected? Ignore this &mdash; you're ahead of the game.</p>
  `, unsubUrl(data.unsubscribeToken))
}

export function getPhotographerStripeNudgeEmailText(data: PhotographerStripeNudgeData): string {
  return `Hey ${data.photographerName},

Quick heads up: your PhotoVault account is set up, but you can't receive payments yet.

Until you connect Stripe, your clients won't be able to pay for gallery access — which means no commissions flowing to you.

The good news: it takes about 5 minutes. Stripe asks for basic info (name, bank account, tax ID) and you're done. We never see your banking details.

Once connected, here's what happens:
- Client pays for gallery access
- Stripe splits the payment automatically
- Your 50% commission hits your bank account

That's it. No invoicing. No chasing payments. No waiting 30 days.

Connect Stripe Now: ${APP_URL}/photographers/settings

P.S. Already connected? Ignore this — you're ahead of the game.

---
Unsubscribe: ${unsubUrl(data.unsubscribeToken)}`
}

// ============================================================================
// 2. PHOTOGRAPHER DAY 3: GALLERY UPLOAD NUDGE
// ============================================================================

export function getPhotographerGalleryNudgeEmailHTML(data: PhotographerGalleryNudgeData): string {
  const stripeNote = data.stripeConnected
    ? ', and Stripe is connected'
    : '. Next step after this: connect Stripe so you can get paid'

  return wrapDripEmail(`
    <p>Hey ${data.photographerName},</p>

    <p>You've got a PhotoVault account${stripeNote}. Now it's time to upload your first gallery.</p>

    <p>Pick any recent shoot &mdash; wedding, family session, senior portraits, whatever. You can do it two ways:</p>

    <p><strong>From your browser:</strong> Go to your dashboard, click "Create Gallery," and drag your photos in. Works great for galleries under 500 photos.</p>

    <p><strong>From the desktop app:</strong> For large galleries (500+ photos or RAW files), download our desktop uploader. No browser file size limits. It handles the heavy lifting while you keep working.</p>

    <p>Once uploaded, you set the pricing:</p>
    <ul>
        <li>$100 upfront (12 months) &mdash; you keep $50</li>
        <li>$50 upfront (6 months) &mdash; you keep $25</li>
        <li>$8/month &mdash; you keep $4/month ongoing</li>
    </ul>

    <p>Then send the delivery link to your client. They pay, get instant access, and your commission shows up in your dashboard.</p>

    <p>That first commission is a good feeling. Let's get there.</p>

    <div class="cta-wrap">
        <a href="${APP_URL}/photographer/upload" class="cta-button">Upload Your First Gallery</a>
    </div>
  `, unsubUrl(data.unsubscribeToken))
}

export function getPhotographerGalleryNudgeEmailText(data: PhotographerGalleryNudgeData): string {
  const stripeNote = data.stripeConnected
    ? ', and Stripe is connected'
    : '. Next step after this: connect Stripe so you can get paid'

  return `Hey ${data.photographerName},

You've got a PhotoVault account${stripeNote}. Now it's time to upload your first gallery.

Pick any recent shoot — wedding, family session, senior portraits, whatever. You can do it two ways:

From your browser: Go to your dashboard, click "Create Gallery," and drag your photos in. Works great for galleries under 500 photos.

From the desktop app: For large galleries (500+ photos or RAW files), download our desktop uploader. No browser file size limits. It handles the heavy lifting while you keep working.

Once uploaded, you set the pricing:
- $100 upfront (12 months) — you keep $50
- $50 upfront (6 months) — you keep $25
- $8/month — you keep $4/month ongoing

Then send the delivery link to your client. They pay, get instant access, and your commission shows up in your dashboard.

That first commission is a good feeling. Let's get there.

Upload Your First Gallery: ${APP_URL}/photographer/upload

---
Unsubscribe: ${unsubUrl(data.unsubscribeToken)}`
}

// ============================================================================
// 3. PHOTOGRAPHER DAY 7: PASSIVE INCOME MATH
// ============================================================================

export function getPhotographerPassiveIncomeMathEmailHTML(data: PhotographerPassiveIncomeMathData): string {
  return wrapDripEmail(`
    <p>Hey ${data.photographerName},</p>

    <p>${data.progressLine}</p>

    <p>Let me show you what this looks like when the numbers compound.</p>

    <p><strong>Year 1 &mdash; Upfront commissions:</strong><br>
    You shoot 50 clients this year. Each pays $100 for 12-month gallery access. You earn $50 per client.</p>

    <p>That's <strong>$2,500 in commissions</strong> on top of your normal shoot fees. You didn't change your pricing. You just delivered through PhotoVault instead of a download link.</p>

    <p><strong>Year 2 &mdash; Monthly kicks in:</strong><br>
    Those 50 clients' prepaid plans expire. They convert to $8/month to keep access. You earn $4/month per client.</p>

    <p>50 clients &times; $4/month = <strong>$200/month in passive income.</strong></p>

    <p><strong>Year 3 &mdash; It compounds:</strong><br>
    You shot another 50 clients in year 2. Now you have 100 monthly clients.</p>

    <p>100 clients &times; $4/month = <strong>$400/month.</strong> That's $4,800/year in recurring revenue. For work you already did.</p>

    <p>This isn't theoretical. It's how the commission model works. The only variable is how many clients you run through the platform.</p>

    <p>Every gallery you deliver through PhotoVault is a seed for future recurring revenue.</p>

    <div class="cta-wrap">
        <a href="${APP_URL}/photographer/dashboard" class="cta-button">Go to My Dashboard</a>
    </div>
  `, unsubUrl(data.unsubscribeToken))
}

export function getPhotographerPassiveIncomeMathEmailText(data: PhotographerPassiveIncomeMathData): string {
  return `Hey ${data.photographerName},

${data.progressLine}

Let me show you what this looks like when the numbers compound.

Year 1 — Upfront commissions:
You shoot 50 clients this year. Each pays $100 for 12-month gallery access. You earn $50 per client.

That's $2,500 in commissions on top of your normal shoot fees. You didn't change your pricing. You just delivered through PhotoVault instead of a download link.

Year 2 — Monthly kicks in:
Those 50 clients' prepaid plans expire. They convert to $8/month to keep access. You earn $4/month per client.

50 clients x $4/month = $200/month in passive income.

Year 3 — It compounds:
You shot another 50 clients in year 2. Now you have 100 monthly clients.

100 clients x $4/month = $400/month. That's $4,800/year in recurring revenue. For work you already did.

This isn't theoretical. It's how the commission model works. The only variable is how many clients you run through the platform.

Every gallery you deliver through PhotoVault is a seed for future recurring revenue.

Go to My Dashboard: ${APP_URL}/photographer/dashboard

---
Unsubscribe: ${unsubUrl(data.unsubscribeToken)}`
}

// ============================================================================
// 4. PHOTOGRAPHER DAY 14: FOUNDER CHECK-IN
// ============================================================================

export function getPhotographerFounderCheckinEmailHTML(data: PhotographerFounderCheckinData): string {
  return wrapDripEmail(`
    <p>Hey ${data.photographerName},</p>

    <p>It's Nate, the founder of PhotoVault. Wanted to check in personally.</p>

    <p>${data.statusMessage}</p>

    <p>I built PhotoVault because I saw photographers giving away their work through expiring download links and gallery platforms that don't pay them anything. You do the hardest part &mdash; the creative work. You should benefit from it long after the session is over.</p>

    <p>We're still early. You're one of the first photographers on the platform, which means your feedback actually shapes what we build. If something's confusing, broken, or missing &mdash; reply to this email. I read every one.</p>

    <p><strong>One ask:</strong> If you know another photographer who'd benefit from passive income on their past work, send them our way. We're growing through word of mouth right now, and a recommendation from you means more than any ad we could run.</p>

    <p>They can sign up at <a href="${APP_URL}/photographers/signup">photovault.photo/photographers/signup</a> and use beta code <strong>PHOTOVAULT_BETA_2026</strong> for 12 months free.</p>

    <p>Thanks for being here early.</p>

    <p>&mdash; Nate<br>Founder, PhotoVault</p>

    <div class="cta-wrap">
        <a href="${APP_URL}/photographers/signup" class="cta-button">Share PhotoVault</a>
    </div>
  `, unsubUrl(data.unsubscribeToken))
}

export function getPhotographerFounderCheckinEmailText(data: PhotographerFounderCheckinData): string {
  return `Hey ${data.photographerName},

It's Nate, the founder of PhotoVault. Wanted to check in personally.

${data.statusMessage}

I built PhotoVault because I saw photographers giving away their work through expiring download links and gallery platforms that don't pay them anything. You do the hardest part — the creative work. You should benefit from it long after the session is over.

We're still early. You're one of the first photographers on the platform, which means your feedback actually shapes what we build. If something's confusing, broken, or missing — reply to this email. I read every one.

One ask: If you know another photographer who'd benefit from passive income on their past work, send them our way. We're growing through word of mouth right now, and a recommendation from you means more than any ad we could run.

They can sign up at ${APP_URL}/photographers/signup and use beta code PHOTOVAULT_BETA_2026 for 12 months free.

Thanks for being here early.

— Nate
Founder, PhotoVault

Share PhotoVault: ${APP_URL}/photographers/signup

---
Unsubscribe: ${unsubUrl(data.unsubscribeToken)}`
}

// ============================================================================
// 5. CLIENT DAY 1: GETTING STARTED
// ============================================================================

export function getClientGettingStartedEmailHTML(data: ClientGettingStartedData): string {
  return wrapDripEmail(`
    <p>Hey ${data.clientName},</p>

    <p>Your gallery from ${data.photographerName} is live and ready. Here's how to make the most of it.</p>

    <p><strong>Save to your camera roll:</strong><br>
    Open your gallery on your phone, tap any photo, and hit the download button. Full resolution, straight to your camera roll. No zip files to unpack. No quality loss.</p>

    <p><strong>Share with family:</strong><br>
    See a photo your mom would love? Tap the share button to send it directly. You can also add family members to your account so they can access the full gallery too.</p>

    <p><strong>Access anywhere:</strong><br>
    Your photos are in your PhotoVault &mdash; protected and accessible from any device. Phone, tablet, laptop. Log in at photovault.photo anytime.</p>

    <p>Your photos aren't going anywhere. No expiring links. No storage limits. They're yours.</p>

    <div class="cta-wrap">
        <a href="${APP_URL}/family/galleries" class="cta-button">View My Gallery</a>
    </div>
  `, unsubUrl(data.unsubscribeToken))
}

export function getClientGettingStartedEmailText(data: ClientGettingStartedData): string {
  return `Hey ${data.clientName},

Your gallery from ${data.photographerName} is live and ready. Here's how to make the most of it.

Save to your camera roll:
Open your gallery on your phone, tap any photo, and hit the download button. Full resolution, straight to your camera roll. No zip files to unpack. No quality loss.

Share with family:
See a photo your mom would love? Tap the share button to send it directly. You can also add family members to your account so they can access the full gallery too.

Access anywhere:
Your photos are in your PhotoVault — protected and accessible from any device. Phone, tablet, laptop. Log in at photovault.photo anytime.

Your photos aren't going anywhere. No expiring links. No storage limits. They're yours.

View My Gallery: ${APP_URL}/family/galleries

---
Unsubscribe: ${unsubUrl(data.unsubscribeToken)}`
}

// ============================================================================
// 6. CLIENT DAY 3: WHY STORAGE MATTERS
// ============================================================================

export function getClientWhyStorageMattersEmailHTML(data: ClientWhyStorageMattersData): string {
  return wrapDripEmail(`
    <p>Hey ${data.clientName},</p>

    <p>Quick question: where are your photos from 5 years ago?</p>

    <p>If you're like most people, they're on a hard drive somewhere. Maybe an old laptop. Maybe a USB drive in a drawer. Maybe a cloud account you forgot the password to.</p>

    <p>Here's the thing about digital storage:</p>
    <ul>
        <li>Hard drives have a 5-year average lifespan</li>
        <li>Cloud services change terms, shut down, or get breached</li>
        <li>Download links from photographers expire in 30&ndash;90 days</li>
        <li>Phone storage fills up, photos get deleted to make room</li>
    </ul>

    <p>Your PhotoVault gallery is different. It's a permanent, protected home for these photos. As long as your subscription is active, they're safe &mdash; backed up, full resolution, accessible from any device.</p>

    <p>These aren't random snapshots. ${data.photographerName} captured real moments from your life. The kind you'll want to pull up in 10 years, or show your kids someday.</p>

    <p>That's what PhotoVault protects.</p>

    <div class="cta-wrap">
        <a href="${APP_URL}/family/galleries" class="cta-button">View My Protected Photos</a>
    </div>
  `, unsubUrl(data.unsubscribeToken))
}

export function getClientWhyStorageMattersEmailText(data: ClientWhyStorageMattersData): string {
  return `Hey ${data.clientName},

Quick question: where are your photos from 5 years ago?

If you're like most people, they're on a hard drive somewhere. Maybe an old laptop. Maybe a USB drive in a drawer. Maybe a cloud account you forgot the password to.

Here's the thing about digital storage:
- Hard drives have a 5-year average lifespan
- Cloud services change terms, shut down, or get breached
- Download links from photographers expire in 30-90 days
- Phone storage fills up, photos get deleted to make room

Your PhotoVault gallery is different. It's a permanent, protected home for these photos. As long as your subscription is active, they're safe — backed up, full resolution, accessible from any device.

These aren't random snapshots. ${data.photographerName} captured real moments from your life. The kind you'll want to pull up in 10 years, or show your kids someday.

That's what PhotoVault protects.

View My Protected Photos: ${APP_URL}/family/galleries

---
Unsubscribe: ${unsubUrl(data.unsubscribeToken)}`
}

// ============================================================================
// 7. CLIENT DAY 7: MORE PHOTOGRAPHERS
// ============================================================================

export function getClientMorePhotographersEmailHTML(data: ClientMorePhotographersData): string {
  return wrapDripEmail(`
    <p>Hey ${data.clientName},</p>

    <p>Now that you have a PhotoVault account, here's something worth knowing: it works with any photographer.</p>

    <p>Your vault isn't limited to one gallery. Every time you work with a photographer who uses PhotoVault, that gallery gets added to your account automatically. Wedding photos, family sessions, newborn shoots, senior portraits &mdash; all in one place.</p>

    <p><strong>What you can do right now:</strong></p>

    <p>Tell your next photographer about PhotoVault. If they sign up, they can deliver your gallery straight to your existing account. No new logins. No juggling platforms.</p>

    <p>And if you work with multiple photographers in a year (family session in spring, holiday photos in winter), each gallery lives in your vault side by side.</p>

    <p>One account. All your memories. Protected.</p>

    <div class="cta-wrap">
        <a href="${APP_URL}/family/galleries" class="cta-button">View My Galleries</a>
    </div>

    <p class="ps">P.S. Know a photographer who should be on PhotoVault? They can sign up at <a href="${APP_URL}/photographers/signup">photovault.photo/photographers/signup</a> &mdash; and you both benefit from having your photos in one protected place.</p>
  `, unsubUrl(data.unsubscribeToken))
}

export function getClientMorePhotographersEmailText(data: ClientMorePhotographersData): string {
  return `Hey ${data.clientName},

Now that you have a PhotoVault account, here's something worth knowing: it works with any photographer.

Your vault isn't limited to one gallery. Every time you work with a photographer who uses PhotoVault, that gallery gets added to your account automatically. Wedding photos, family sessions, newborn shoots, senior portraits — all in one place.

What you can do right now:

Tell your next photographer about PhotoVault. If they sign up, they can deliver your gallery straight to your existing account. No new logins. No juggling platforms.

And if you work with multiple photographers in a year (family session in spring, holiday photos in winter), each gallery lives in your vault side by side.

One account. All your memories. Protected.

View My Galleries: ${APP_URL}/family/galleries

P.S. Know a photographer who should be on PhotoVault? They can sign up at ${APP_URL}/photographers/signup — and you both benefit from having your photos in one protected place.

---
Unsubscribe: ${unsubUrl(data.unsubscribeToken)}`
}
