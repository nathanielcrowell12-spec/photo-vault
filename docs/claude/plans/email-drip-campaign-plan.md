# Email Drip Campaign Plan: Post-Signup Sequences

**Date:** 2026-02-19
**Status:** Draft - Awaiting Review
**Author:** Claude (with Nate)

---

## Table of Contents

1. [Sequence 1: Photographer Post-Signup](#sequence-1-photographer-post-signup)
2. [Sequence 2: Client Post-Payment](#sequence-2-client-post-payment)
3. [Implementation Notes](#implementation-notes)

---

## Sequence 1: Photographer Post-Signup

### Overview

| Field | Value |
|-------|-------|
| **Trigger** | Photographer account created (after `sendPhotographerWelcomeEmail` fires on Day 0) |
| **Goal** | Stripe Connect completed + first gallery uploaded + first client invited within 14 days |
| **Aha moment** | First commission appears in dashboard |
| **Emails** | 4 emails over 14 days (Day 1, 3, 7, 14) |
| **Exit condition** | Photographer has completed all 3 setup steps (Stripe + gallery + client invite), OR photographer deletes account |
| **Suppression** | If photographer completes the action an email is nudging, skip that email |

### Key Metrics to Track

- Open rate per email (target: 50%+ for Day 1, 40%+ for Day 14)
- Click-through rate (target: 15%+ for Day 1, 10%+ for Day 14)
- Stripe Connect completion rate within 3 days of signup
- First gallery upload rate within 7 days
- First client invited rate within 14 days
- Time from signup to first commission (the real north star)

---

### Email 1: Complete Your Stripe Setup (Day 1)

**Send condition:** 24 hours after signup AND `stripe_connect_status != 'active'` on the photographer's record. Skip if Stripe Connect is already completed.

**Subject:** Your clients can't pay you yet

**Preview:** It takes 5 minutes to connect Stripe. Then you're ready to earn from every gallery you deliver.

**Body:**

Hey {{photographerName}},

Quick heads up: your PhotoVault account is set up, but you can't receive payments yet.

Until you connect Stripe, your clients won't be able to pay for gallery access -- which means no commissions flowing to you.

The good news: it takes about 5 minutes. Stripe asks for basic info (name, bank account, tax ID) and you're done. We never see your banking details.

Once connected, here's what happens:

- Client pays for gallery access
- Stripe splits the payment automatically
- Your 50% commission hits your bank account

That's it. No invoicing. No chasing payments. No waiting 30 days.

**CTA:** Connect Stripe Now → `/photographers/settings`

**P.S.:** Already connected? Ignore this -- you're ahead of the game.

---

### Email 2: Upload Your First Gallery (Day 3)

**Send condition:** 3 days after signup AND photographer has zero galleries in `photo_galleries` table. Skip if at least one gallery exists.

**Subject:** Your first gallery is 10 minutes away

**Preview:** Upload a past shoot and you're halfway to earning your first commission. Here's exactly how.

**Body:**

Hey {{photographerName}},

You've got a PhotoVault account{{stripeStatus}}. Now it's time to upload your first gallery.

Pick any recent shoot -- wedding, family session, senior portraits, whatever. You can do it two ways:

**From your browser:** Go to your dashboard, click "Create Gallery," and drag your photos in. Works great for galleries under 500 photos.

**From the desktop app:** For large galleries (500+ photos or RAW files), download our desktop uploader. No browser file size limits. It handles the heavy lifting while you keep working.

Once uploaded, you set the pricing:
- $100 upfront (12 months) -- you keep $50
- $50 upfront (6 months) -- you keep $25
- $8/month -- you keep $4/month ongoing

Then send the delivery link to your client. They pay, get instant access, and your commission shows up in your dashboard.

That first commission is a good feeling. Let's get there.

**CTA:** Upload Your First Gallery → `/photographer/upload`

---

### Email 3: The Passive Income Math (Day 7)

**Send condition:** 7 days after signup. Send regardless of setup status -- this is a motivation/vision email. However, customize the opening line based on their progress (see body variants below).

**Subject:** What 50 clients looks like in year two

**Preview:** The math on PhotoVault's commission model gets interesting fast. Here's what real numbers look like.

**Body:**

Hey {{photographerName}},

{{progressLine}}

Let me show you what this looks like when the numbers compound.

**Year 1 -- Upfront commissions:**
You shoot 50 clients this year. Each pays $100 for 12-month gallery access. You earn $50 per client.

That's **$2,500 in commissions** on top of your normal shoot fees. You didn't change your pricing. You just delivered through PhotoVault instead of a download link.

**Year 2 -- Monthly kicks in:**
Those 50 clients' prepaid plans expire. They convert to $8/month to keep access. You earn $4/month per client.

50 clients x $4/month = **$200/month in passive income.**

**Year 3 -- It compounds:**
You shot another 50 clients in year 2. Now you have 100 monthly clients.

100 clients x $4/month = **$400/month.** That's $4,800/year in recurring revenue. For work you already did.

This isn't theoretical. It's how the commission model works. The only variable is how many clients you run through the platform.

Every gallery you deliver through PhotoVault is a seed for future recurring revenue.

**CTA:** Go to My Dashboard → `/photographer/dashboard`

**Progress line variants:**
- If Stripe not connected and no galleries: "It's been a week since you signed up. You haven't connected Stripe or uploaded a gallery yet -- but it's not too late to get rolling."
- If Stripe connected but no galleries: "You've got Stripe connected -- nice. Now let's get your first gallery uploaded so you can start earning."
- If has gallery but no clients invited: "You've uploaded a gallery -- great start. The next step is sending that delivery link to your client."
- If all steps done: "You're fully set up and already ahead of most photographers on the platform. Here's why that matters."

---

### Email 4: You're Building Something (Day 14)

**Send condition:** 14 days after signup. Send to all photographers regardless of status. Include referral ask.

**Subject:** Two weeks in -- a quick note from Nate

**Preview:** A personal check-in from the founder. Plus, a way to help other photographers discover PhotoVault.

**Body:**

Hey {{photographerName}},

It's Nate, the founder of PhotoVault. Wanted to check in personally.

{{statusMessage}}

I built PhotoVault because I saw photographers giving away their work through expiring download links and gallery platforms that don't pay them anything. You do the hardest part -- the creative work. You should benefit from it long after the session is over.

We're still early. You're one of the first photographers on the platform, which means your feedback actually shapes what we build. If something's confusing, broken, or missing -- reply to this email. I read every one.

**One ask:** If you know another photographer who'd benefit from passive income on their past work, send them our way. We're growing through word of mouth right now, and a recommendation from you means more than any ad we could run.

They can sign up at photovault.photo/photographers/signup and use beta code **PHOTOVAULT_BETA_2026** for 12 months free.

Thanks for being here early.

-- Nate
Founder, PhotoVault

**CTA:** Share PhotoVault → `/photographers/signup`

**Status message variants:**
- If all 3 steps done + has commission: "You've already earned your first commission. That's exactly how this is supposed to work. Every client you add from here builds on that foundation."
- If all 3 steps done, no commission yet: "You've done everything right -- Stripe connected, gallery uploaded, client invited. Once they pay, your first commission will appear in your dashboard."
- If missing steps: "I noticed you haven't finished setting up yet. No pressure -- but the sooner you connect Stripe and upload a gallery, the sooner the commission math starts working for you. Reply if you're stuck on anything."

---

## Sequence 2: Client Post-Payment

### Overview

| Field | Value |
|-------|-------|
| **Trigger** | Client completes first gallery payment (after `sendPaymentSuccessfulEmail` fires on Day 0) |
| **Goal** | Client views gallery, downloads at least one photo, and understands ongoing value |
| **Emails** | 3 emails over 7 days (Day 1, 3, 7) |
| **Exit condition** | All 3 emails sent, OR client cancels subscription |
| **Suppression** | None -- all emails in this sequence are informational and should always send |

### Key Metrics to Track

- Open rate per email (target: 55%+ for Day 1, 35%+ for Day 7)
- Click-through to gallery (target: 30%+ for Day 1)
- Photo download rate within 7 days
- Day-30 retention rate
- Churn rate by month

---

### Email 1: Your Photos Are Waiting (Day 1)

**Send condition:** 24 hours after first successful payment. Always send.

**Subject:** Quick tip: save photos to your phone

**Preview:** One tap to download full-resolution photos directly to your camera roll. No zip files. Here's how.

**Body:**

Hey {{clientName}},

Your gallery from {{photographerName}} is live and ready. Here's how to make the most of it.

**Save to your camera roll:**
Open your gallery on your phone, tap any photo, and hit the download button. Full resolution, straight to your camera roll. No zip files to unpack. No quality loss.

**Share with family:**
See a photo your mom would love? Tap the share button to send it directly. You can also add family members to your account so they can access the full gallery too.

**Access anywhere:**
Your photos are in your PhotoVault -- protected and accessible from any device. Phone, tablet, laptop. Log in at photovault.photo anytime.

Your photos aren't going anywhere. No expiring links. No storage limits. They're yours.

**CTA:** View My Gallery → `/client/dashboard`

---

### Email 2: Why This Matters Long-Term (Day 3)

**Send condition:** 3 days after first successful payment. Always send.

**Subject:** The hard drive question nobody asks

**Preview:** 54% of people have lost digital photos permanently. Your photos are protected -- here's what that actually means.

**Body:**

Hey {{clientName}},

Quick question: where are your photos from 5 years ago?

If you're like most people, they're on a hard drive somewhere. Maybe an old laptop. Maybe a USB drive in a drawer. Maybe a Google Photos account you forgot the password to.

Here's the thing about digital storage:
- Hard drives have a 5-year average lifespan
- Cloud services change terms, shut down, or get breached
- Download links from photographers expire in 30-90 days
- Phone storage fills up, photos get deleted to make room

Your PhotoVault gallery is different. It's a permanent, protected home for these photos. As long as your subscription is active, they're safe -- backed up, full resolution, accessible from any device.

These aren't random snapshots. {{photographerName}} captured real moments from your life. The kind you'll want to pull up in 10 years, or show your kids someday.

That's what PhotoVault protects.

**CTA:** View My Protected Photos → `/client/dashboard`

---

### Email 3: More Photographers, More Memories (Day 7)

**Send condition:** 7 days after first successful payment. Always send.

**Subject:** One vault, all your photographers

**Preview:** Every photographer you work with can deliver through PhotoVault. All your galleries in one place.

**Body:**

Hey {{clientName}},

Now that you have a PhotoVault account, here's something worth knowing: it works with any photographer.

Your vault isn't limited to one gallery. Every time you work with a photographer who uses PhotoVault, that gallery gets added to your account automatically. Wedding photos, family sessions, newborn shoots, senior portraits -- all in one place.

**What you can do right now:**

Tell your next photographer about PhotoVault. If they sign up, they can deliver your gallery straight to your existing account. No new logins. No juggling platforms.

And if you work with multiple photographers in a year (family session in spring, holiday photos in winter), each gallery lives in your vault side by side.

One account. All your memories. Protected.

**CTA:** View My Galleries → `/client/dashboard`

**P.S.:** Know a photographer who should be on PhotoVault? They can sign up at photovault.photo/photographers/signup -- and you both benefit from having your photos in one protected place.

---

## Implementation Notes

### What Needs to Be Built

#### 1. Drip Campaign Infrastructure

The current email system is trigger-based (event fires, email sends immediately). Drip sequences require:

- **Email queue / scheduler:** A system to schedule emails for future delivery. Options:
  - **Option A (Recommended): Supabase `email_queue` table + Vercel Cron Job.** Create a table with `recipient_email`, `template_id`, `send_at`, `status`, `metadata`. A cron job runs every hour, picks up emails where `send_at <= now()` and `status = 'pending'`, checks send conditions, and fires via Resend.
  - **Option B: Resend's batch/scheduled send API.** Resend supports scheduling sends. Less control but less infrastructure to build.
  - **Option C: Third-party drip tool (e.g., Customer.io, Loops).** More features but adds a dependency and cost.

- **Sequence tracking table:** `drip_sequences` table to track which user is in which sequence, what step they're on, and whether they've been suppressed.

```sql
CREATE TABLE drip_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sequence_name TEXT NOT NULL,  -- 'photographer_post_signup' or 'client_post_payment'
  current_step INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  suppressed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE drip_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES drip_sequences(id) NOT NULL,
  step_number INT NOT NULL,
  template_name TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  skip_reason TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending', 'sent', 'skipped', 'failed'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. Send Condition Checks

Each email needs a pre-send check. The cron job should evaluate these before sending:

| Email | Check |
|-------|-------|
| Photographer Day 1 | Query `photographers` table for `stripe_connect_status`. Skip if `= 'active'` |
| Photographer Day 3 | Query `photo_galleries` table for count where `photographer_id = user.id`. Skip if count > 0 |
| Photographer Day 7 | No skip condition. Query progress for dynamic copy selection. |
| Photographer Day 14 | No skip condition. Query progress for dynamic status message. |
| Client Day 1 | Always send |
| Client Day 3 | Always send |
| Client Day 7 | Always send |

#### 3. Email Templates to Create

7 new email templates needed in the email system:

**New template file:** `src/lib/email/drip-templates.ts`

| Template Function | Sequence | Day |
|-------------------|----------|-----|
| `getPhotographerStripeNudgeEmailHTML/Text` | Photographer | 1 |
| `getPhotographerGalleryNudgeEmailHTML/Text` | Photographer | 3 |
| `getPhotographerPassiveIncomeMathEmailHTML/Text` | Photographer | 7 |
| `getPhotographerFounderCheckinEmailHTML/Text` | Photographer | 14 |
| `getClientGettingStartedEmailHTML/Text` | Client | 1 |
| `getClientWhyStorageMattersEmailHTML/Text` | Client | 3 |
| `getClientMorePhotographersEmailHTML/Text` | Client | 7 |

**New EmailService methods:** 7 new `static async` methods in `email-service.ts`, following the existing pattern.

#### 4. Sequence Enrollment Triggers

- **Photographer sequence:** Enroll after `sendPhotographerWelcomeEmail` fires (in the photographer signup flow). Call a function to create the `drip_sequences` record and schedule all 4 emails in `drip_emails`.
- **Client sequence:** Enroll after `sendPaymentSuccessfulEmail` fires (in the Stripe webhook handler at `src/app/api/stripe/webhook/route.ts`). Same enrollment pattern.

#### 5. Cron Job

Create a Vercel Cron Job (or use Supabase pg_cron) that runs every hour:

```
Route: /api/cron/drip-emails
Schedule: 0 * * * * (every hour)
```

Logic:
1. Query `drip_emails` where `status = 'pending'` and `scheduled_for <= now()`
2. For each email, run the send condition check
3. If condition passes: send email via `EmailService`, update status to `'sent'`
4. If condition fails (action already completed): update status to `'skipped'`, set `skip_reason`
5. If send fails: update status to `'failed'`, log error, retry on next run (max 3 retries)

#### 6. Unsubscribe Handling

All drip emails should include an unsubscribe link. When clicked:
- Set `suppressed = true` on the `drip_sequences` record
- Skip all remaining emails in the sequence
- Do NOT suppress transactional emails (payment confirmations, password resets, etc.)

### URL Paths Referenced in Emails

| CTA | URL Path | Existing? |
|-----|----------|-----------|
| Connect Stripe | `/photographers/settings` | Yes |
| Upload Gallery | `/photographer/upload` | Yes |
| Photographer Dashboard | `/photographer/dashboard` | Yes |
| Photographer Signup (referral) | `/photographers/signup` | Yes |
| Client Dashboard | `/client/dashboard` | Yes |
| Client Billing | `/client/billing` | Yes |

All paths exist. No new pages needed.

### Estimated Build Effort

| Component | Estimate |
|-----------|----------|
| Database tables (`drip_sequences`, `drip_emails`) | 1 hour |
| Drip template file (7 templates, HTML + text) | 4-6 hours |
| EmailService methods (7 new) | 1 hour |
| Enrollment triggers (2 signup flows) | 1-2 hours |
| Cron job + send condition logic | 2-3 hours |
| Unsubscribe handling | 1-2 hours |
| Testing (unit + integration) | 3-4 hours |
| **Total** | **13-19 hours** |

### Priority Order for Implementation

1. Database tables (foundation)
2. Photographer Day 1 email (highest impact -- Stripe Connect is the biggest friction point)
3. Cron job (enables all future emails)
4. Photographer Day 3 email
5. Client Day 1 email
6. Remaining photographer emails (Day 7, 14)
7. Remaining client emails (Day 3, 7)
8. Unsubscribe handling

### Risks and Considerations

- **Email deliverability:** Too many emails too fast can trigger spam filters. Resend handles this well, but monitor bounce rates.
- **Dynamic content:** The Day 7 and Day 14 photographer emails need progress-based copy variants. This adds template complexity but significantly improves relevance.
- **Beta context:** All photographer emails should acknowledge the beta context. As we exit beta, these templates will need updates (remove beta code references, adjust pricing language).
- **Desktop app mention:** Email 2 (Day 3) mentions the desktop uploader. Ensure download link is current and the app is stable before sending.
- **Reply handling:** The Day 14 founder email invites replies. Need a process to monitor and respond to incoming replies to noreply@photovault.photo (or switch to a reply-friendly from address for that email specifically).
