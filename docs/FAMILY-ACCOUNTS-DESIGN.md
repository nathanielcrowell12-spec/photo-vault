# PhotoVault Family Accounts Feature
## Comprehensive Design Document for External Review

**Created:** December 4, 2025
**Status:** Planned - Requirements gathered, ready for implementation

---

## 1. The Problem We're Solving

PhotoVault stores families' irreplaceable photos (weddings, baby photos, family portraits) with a subscription model. The primary account holder pays $8/month for ongoing access.

**The critical problem:** What happens when the primary account holder dies, becomes incapacitated, or simply stops managing their finances?

**Current state:** If Grandma paid for the family's wedding photos and Grandma passes away, her daughter (Mom) has NO WAY to:
- Know the account exists or is about to be suspended
- Take over payments to preserve access
- Access the photos at all

The photos sit in our system, fully intact, but the family loses access because the billing relationship died with Grandma.

---

## 2. The Business Rationale

### Revenue Recovery
- We have a 6-month grace period before suspension
- Currently, if the primary stops paying, that revenue is lost
- Family accounts create a "safety net" of people who CAN and WILL pay
- At the 3-month mark (halfway through grace), family members get notified
- This gives them 3 months to decide to take over payments

### Customer Retention
- Photos are irreplaceable - families WANT to keep access
- The barrier isn't willingness to pay, it's **awareness and ability**
- Family accounts remove that barrier

### Emotional Value
- This feature shows we understand that photos are family treasures, not individual assets
- It builds trust and differentiates us from competitors

---

## 3. How Family Accounts Work

### Primary Account Holder's Perspective

1. **Enable Family Mode**: In Settings, the primary can toggle on "Family Sharing"

2. **Invite Family Members**: They enter:
   - Email address
   - Name
   - Relationship (spouse, child, parent, sibling, other)

3. **Invitation Sent**: Family member receives an email with a special link

4. **Manage Family**: Primary can see:
   - Who has been invited
   - Who has accepted
   - Who has added a payment method (peace of mind)
   - Option to remove family members

### Family Member's Perspective

1. **Receive Invitation**: Email says "You've been invited to access [Name]'s PhotoVault"

2. **Accept Invitation**: Click the link and choose:
   - **Option A**: Access via magic link (no account needed, just click to view)
   - **Option B**: Create your own PhotoVault account (email/password)

3. **Optional - Add Payment Method**: "Want to help ensure these photos stay protected? Add a backup payment method."
   - This is optional but encouraged
   - If primary stops paying, family member can seamlessly take over

4. **Access Galleries**: Once accepted, family member can view ALL galleries belonging to the primary account

---

## 4. The Grace Period Email System

When the primary account enters the 6-month grace period (stopped paying), family members receive escalating notifications:

| Time into Grace Period | Email Message |
|------------------------|---------------|
| **3 months** | "[Name]'s PhotoVault account needs attention. Payment hasn't been received in 3 months. You can help by updating the payment method." |
| **4 months** | "Reminder: [Name]'s photos are at risk. 2 months until access is suspended." |
| **5 months** | "Urgent: [Name]'s PhotoVault will be suspended in 30 days." |
| **5.5 months** | "Final Notice: Access will be suspended in 2 weeks unless payment is received." |

Each email has a clear "Help Pay Now" button that takes them directly to the payment takeover flow.

---

## 5. Payment Takeover Flow

When a family member clicks "Help Pay" (either from email or from their dashboard):

### Step 1: Ask Why
"We'd like to understand why you're taking over this account. This helps us provide better service."

Options:
- **Death of account holder** - "I'm sorry for your loss. We'll handle this with care."
- **Financial hardship** - "We understand. You can help keep the memories safe."
- **Health issues** - "We hope they recover. You're helping preserve their memories."
- **Other** - Free text field

### Step 2: Choose Your Role
"How would you like to proceed?"

- **Option A: Become the Primary Account Holder**
  - "I want to take over this account completely"
  - They become the new owner
  - Can invite their own family members
  - Can manage all settings

- **Option B: Just Pay the Bills**
  - "I want to keep paying so everyone keeps access, but I don't need to manage the account"
  - The original primary remains the "owner" (even if deceased/inactive)
  - Family member is flagged as the "billing payer"
  - Limited to payment management only

### Step 3: Payment Method
- If they already have a payment method on file, confirm it
- If not, add one via Stripe

### Step 4: Confirmation
- Payment is processed
- Access is restored (if it was suspended)
- Photographer is notified (see below)

---

## 6. Photographer Notification

When a family member takes over payment, the photographer who originally delivered those photos receives:

### Email Notification
Subject: "Update: Your client [Original Client Name]'s account"

Body:
> Hi [Photographer Name],
>
> We wanted to let you know that [Original Client Name]'s PhotoVault account has been taken over by a family member.
>
> **New billing contact:** [Family Member Name] ([relationship])
> **Reason given:** [Death / Financial hardship / Health issues / Other: text]
>
> The photos you delivered are still protected, and your commission arrangement continues unchanged.
>
> If you'd like to reach out to the family, their contact email is: [email]

### Dashboard Notification
A banner in the photographer's dashboard:
> "Account Update: [Client Name]'s account is now managed by [Family Member Name] (reason: [reason])"

**Why notify the photographer?**
- They have a relationship with this family
- They may want to offer condolences (in case of death)
- They should know who their ongoing commission is coming from
- It's professional courtesy

---

## 7. Commission Handling After Takeover

**The rule is simple:** If the photographer is still active and associated with the client, commissions continue at the same 50/50 split.

The family member taking over payment doesn't change the photographer relationship. The photos were still delivered by that photographer, and they earned their commission.

**Edge case:** If the photographer has left PhotoVault or been suspended, then it becomes a "direct" client and 100% goes to PhotoVault. But this was already the case before the takeover - the takeover doesn't change anything.

---

## 8. Family Member Wants Their Own Account

A common scenario: Mom is a family member on Dad's account. She's been using it for years. Now she hires her own photographer for her business headshots.

**She can have both:**
1. Keep her family member access to Dad's galleries
2. Start her own $8/month subscription for her own galleries

In her dashboard, she would see:
- **My Galleries** (her own subscription)
- **Family Galleries** (shared from Dad's account)

This is a **revenue expansion** opportunity - we're not cannibalizing Dad's subscription, we're adding a new one.

---

## 9. Pricing & Limits

### Family Sharing is Free
Adding family members is included in the $8/month subscription. We don't charge extra.

**Rationale:** 
- It's a value-add that increases stickiness
- It creates more potential payers (safety net)
- It's the right thing to do for families

### Family Member Limits
Configurable by subscription tier (future-proofing):
- Default: 5 family members
- Could increase for premium tiers later

---

## 10. Technical Implementation Summary

### New Database Tables
- `family_members` - Tracks who is invited, their status, payment capability, takeover status
- `family_settings` - Per-user settings (family mode enabled, member limits)

### New API Endpoints
- `POST /api/family/invite` - Send invitation
- `POST /api/family/accept` - Accept invitation
- `POST /api/family/takeover` - Take over billing
- `DELETE /api/family/remove` - Remove family member

### New Pages
- `/family/accept/[token]` - Accept invitation landing page
- Settings page updated with Family Sharing section

### Modified Systems
- Gallery access checking (include family members)
- Stripe webhook handling (recognize family payer)
- Grace period email system (notify family members)
- Photographer dashboard (show takeover notifications)

---

## 11. Key User Stories

### Story A: The Safety Net
> Sarah adds her daughter Emma as a family member. Ten years later, Sarah passes away. At month 3 of the grace period, Emma gets an email. She takes over payments and preserves 10 years of family memories.

### Story B: The Shared Memories
> John and his wife Mary share a PhotoVault account. Both can view their wedding photos, kids' photos, etc. Either one can pay if needed.

### Story C: The Forgetful Parent
> Tom's dad signed up for PhotoVault but is terrible with technology. Tom adds himself as a family member with his own payment method. When Dad's card expires and he doesn't notice, Tom gets notified and updates the payment.

### Story D: The Growing Family
> Lisa is a family member on her parents' account. She gets married, hires her own wedding photographer, and wants her own PhotoVault. She starts her own subscription while keeping access to her parents' family photos.

---

## 12. What We're NOT Building (Scope Limits)

- **No selective gallery sharing** - Family members see ALL galleries, not cherry-picked ones
- **No family member hierarchy** - All family members are equal (no "admin" vs "viewer")
- **No family plans/pricing tiers** - It's included free, not a separate product
- **No family member-to-family member invites** - Only primary can invite

---

## 13. Questions for Review

1. **Is the takeover flow too complex?** (Ask why, choose role, payment) Should we simplify?

2. **Should we allow selective gallery sharing?** We decided "all galleries" but is that the right call?

3. **Is notifying the photographer with the "reason" too personal?** Should we just say "family member took over" without details?

4. **Are the email intervals right?** (3, 4, 5, 5.5 months) Or should it be different?

5. **Any legal/privacy concerns** with sharing the original account holder's info with family members who take over?

---

## 14. Summary

**Family Accounts** is a feature that:
- Lets primary account holders invite family members to view their galleries
- Creates a safety net of people who can take over payments if needed
- Sends escalating notifications to family during the grace period
- Allows seamless payment takeover with clear communication to all parties
- Keeps photographer commissions intact after takeover
- Allows family members to have their own accounts too

**The core value proposition:** "Your family's photos are safe, even if something happens to you."

---

## Appendix: Database Schema

```sql
-- family_members table
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL REFERENCES user_profiles(id),  -- Account owner
  member_email VARCHAR NOT NULL,
  member_user_id UUID REFERENCES user_profiles(id),  -- NULL until they create account
  member_name VARCHAR,
  relationship VARCHAR,  -- spouse, child, parent, sibling, other
  
  -- Invitation tracking
  invitation_token VARCHAR UNIQUE,
  invitation_sent_at TIMESTAMPTZ,
  invitation_accepted_at TIMESTAMPTZ,
  status VARCHAR DEFAULT 'pending',  -- pending, active, removed
  
  -- Payment capability
  has_payment_method BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR,
  can_manage_billing BOOLEAN DEFAULT FALSE,
  
  -- Takeover tracking
  is_billing_payer BOOLEAN DEFAULT FALSE,  -- Currently paying the bills
  became_payer_at TIMESTAMPTZ,
  takeover_reason VARCHAR,  -- death, financial, health, other
  takeover_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- family_settings table
CREATE TABLE family_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id),
  family_mode_enabled BOOLEAN DEFAULT FALSE,
  max_family_members INTEGER DEFAULT 5,  -- Configurable by tier
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

**Last Updated:** December 4, 2025







