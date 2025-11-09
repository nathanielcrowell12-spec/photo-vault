# Photographer Client Onboarding - Payment Options

## Overview
You want to give photographers **flexibility** in how they charge their clients. Here are the recommended options to offer:

---

## 🎯 Recommended Payment Options for Photographers

### **Option 1: Include in Session Fee (Easiest for Clients)**
**How it works:**
- Photographer adds PhotoVault cost to their session price
- Client pays photographer directly (as part of normal session payment)
- Photographer invites client to PhotoVault (free activation link)
- Client gets Year 1 free, auto-charged Year 2+ ($8/month)

**Example:**
- Normal session: $500
- With PhotoVault: $600 ($500 session + $100 PhotoVault year 1)
- Photographer keeps $550 total ($500 session + $50 commission)
- PhotoVault gets $50 upfront

**Pros:**
- ✅ Simplest for client (one payment)
- ✅ No "extra" charge feeling
- ✅ Higher perceived value
- ✅ Photographer gets commission immediately

**Stripe Setup:**
- Photographer sends invitation link
- Client activates free account
- Client enters payment method (for Year 2+)
- Client gets 1-year free trial
- Auto-charged $8/month after year 1

---

### **Option 2: Separate Add-On Purchase (Most Transparent)**
**How it works:**
- Client pays photographer for session
- Photographer offers PhotoVault as optional add-on: "$100 for lifetime access"
- If client accepts, photographer sends payment link
- Client pays directly in PhotoVault checkout
- Split happens automatically ($50 photographer, $50 PhotoVault)

**Example:**
- Session: $500 (paid to photographer)
- PhotoVault add-on: $100 (paid through PhotoVault)
- Photographer sees $50 commission in dashboard

**Pros:**
- ✅ Transparent pricing
- ✅ Client knows exactly what they're paying for
- ✅ Photographer doesn't handle the PhotoVault payment
- ✅ Easy upsell after session

**Stripe Setup:**
- Use Stripe Checkout with `customer.subscription.created` webhook
- Photographer gets custom invitation link with their ID
- Commission automatically tracked in database

---

### **Option 3: Monthly Subscription from Day 1 (Predictable Revenue)**
**How it works:**
- Client starts paying $8/month immediately (no upfront cost)
- Photographer gets $4/month commission forever
- Lower barrier to entry for clients
- More predictable revenue for both parties

**Example:**
- Month 1-12: Client pays $8/month ($96 total year 1)
- Photographer earns $4/month ($48 year 1)
- PhotoVault gets $4/month ($48 year 1)

**Pros:**
- ✅ Lower upfront cost for clients
- ✅ More accessible to budget-conscious clients
- ✅ Higher lifetime value
- ✅ Recurring revenue starts immediately

**Cons:**
- ⚠️ Less upfront revenue
- ⚠️ Client could cancel early

**Stripe Setup:**
- Use `price_...` for $8/month subscription (no trial)
- Split happens automatically via Stripe Connect or database tracking

---

## 💡 Recommended Implementation

Offer **all three options** and let photographers choose:

### In Photographer Dashboard:
```
┌─────────────────────────────────────────────┐
│  How do you want to onboard clients?        │
├─────────────────────────────────────────────┤
│                                              │
│  ○ Include in Session Fee (Recommended)     │
│    Client pays you $100 extra in session    │
│    → You send them free activation link     │
│    → They pay $8/month after Year 1         │
│                                              │
│  ○ Separate Add-On Purchase                 │
│    Send client a $100 payment link          │
│    → Split automatically ($50 each)         │
│    → They pay $8/month after Year 1         │
│                                              │
│  ○ Monthly Subscription                     │
│    Client pays $8/month from day 1          │
│    → You earn $4/month recurring            │
│    → No upfront payment needed              │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Technical Implementation

### Stripe Products Needed:

**You already have:**
1. ✅ Client Monthly ($8/month) - `price_...`
2. ✅ Client One-Time ($100) - `price_...`

**What each option uses:**

| Option | Stripe Product | Setup |
|--------|----------------|-------|
| Include in Session | `$8/month` with 1-year trial | Free invitation link, client adds payment method |
| Separate Add-On | `$100 one-time` then `$8/month` | Checkout link with photographer metadata |
| Monthly from Day 1 | `$8/month` no trial | Checkout link, commission tracked |

---

## 📝 Invitation Link Examples

### Option 1: Free Activation (Include in Session)
```
https://photovault.com/invite/[photographer_id]/included
```
→ Client creates account, adds payment method, Year 1 free

### Option 2: $100 Payment Link (Separate Add-On)
```
https://photovault.com/invite/[photographer_id]/addon
```
→ Client pays $100, Year 1 covered, Year 2+ auto-charged

### Option 3: Monthly Subscription
```
https://photovault.com/invite/[photographer_id]/monthly
```
→ Client pays $8/month from day 1

---

## 🎨 Photographer Invitation Flow

### Step 1: Photographer Clicks "Invite Client"
```typescript
// In photographer dashboard
const inviteClient = (option: 'included' | 'addon' | 'monthly') => {
  // Generate unique invitation link
  const inviteUrl = `/invite/${photographerId}/${option}`

  // Show modal with link + email option
  return {
    link: inviteUrl,
    emailTemplate: getEmailTemplate(option)
  }
}
```

### Step 2: Client Receives Invitation
Email includes:
- Explanation of PhotoVault
- What they get
- Pricing (based on option chosen)
- CTA button to activate

### Step 3: Client Clicks Link
- Lands on signup page
- Pre-filled with photographer info
- Shows pricing based on option
- Stripe checkout or free activation

### Step 4: Webhook Processes Payment
Your webhook handler already supports this:
- Tracks photographer commission
- Creates subscription record
- Updates photographer earnings

---

## 💰 Commission Tracking

### Database Structure (Already Built)
```sql
-- Track photographer earnings
CREATE TABLE photographer_commissions (
  id UUID PRIMARY KEY,
  photographer_id UUID REFERENCES users(id),
  client_id UUID REFERENCES users(id),
  commission_type TEXT, -- 'upfront' | 'recurring'
  amount_cents INTEGER,
  status TEXT, -- 'pending' | 'paid' | 'processing'
  payment_option TEXT, -- 'included' | 'addon' | 'monthly'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Automatic Tracking
Your webhook already handles:
- ✅ Upfront commission ($50 when client pays $100)
- ✅ Recurring commission ($4/month when client pays $8/month)
- ✅ Linking client to photographer

---

## 🎁 Recommended Default

**For your MVP, I recommend:**

1. **Start with Option 1 (Include in Session)** as the default
   - Easiest for photographers to understand
   - No extra checkout flows to build
   - Free invitation links are simple

2. **Add Option 2 (Separate Add-On)** next
   - Just need to create checkout page
   - Stripe handles payment + split

3. **Add Option 3 (Monthly)** later if requested
   - Less common use case
   - Can gauge demand first

---

## 🚀 Quick Start

To implement Option 1 (Include in Session) right now:

### 1. Create Invitation Page
```typescript
// app/invite/[photographerId]/[paymentOption]/page.tsx

export default function InvitationPage({
  params
}: {
  params: { photographerId: string, paymentOption: string }
}) {
  const { photographerId, paymentOption } = params

  if (paymentOption === 'included') {
    // Show free signup form
    // Client adds payment method
    // Subscription created with 1-year trial
  }

  // Handle other options...
}
```

### 2. Generate Invitation Links
```typescript
// In photographer dashboard
const generateInviteLink = (photographerId: string, option: string) => {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${photographerId}/${option}`
}
```

### 3. Webhook Tracks Commission
Already built! When subscription created:
```typescript
// In webhook handler (already exists)
await supabase.from('photographer_commissions').insert({
  photographer_id: metadata.photographer_id,
  client_id: subscription.customer,
  commission_type: 'recurring',
  amount_cents: 400, // $4
  payment_option: metadata.payment_option
})
```

---

## 📊 Photographer Dashboard View

Show photographers their earnings:

```
┌─────────────────────────────────────────┐
│  Your Commissions This Month            │
├─────────────────────────────────────────┤
│  Active Clients: 25                     │
│  Recurring: $100/month ($4 × 25)        │
│  Upfront (This Month): $150 (3 new)    │
│  Total This Month: $250                 │
│                                          │
│  [ View Details ] [ Request Payout ]    │
└─────────────────────────────────────────┘
```

---

## ✅ Summary

**What You Control:**
- ✅ Offer multiple payment options to photographers
- ✅ Let them choose what works for their business
- ✅ Track all commissions automatically
- ✅ Simple invitation links

**What Photographers Control:**
- ✅ Which option to offer their clients
- ✅ How to present PhotoVault (bundle vs add-on)
- ✅ When to send invitations

**What Clients Get:**
- ✅ Clear, simple pricing
- ✅ Choice that works for their budget
- ✅ Transparent billing

---

**Recommendation:** Start with Option 1 (Include in Session) for MVP. It's the simplest to build and most photographer-friendly. Add other options based on photographer feedback.

Want me to build the invitation page flow for you?
