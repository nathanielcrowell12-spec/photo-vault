# Family Accounts Specification v2.0

**PhotoVault Feature Specification**  

**Last Updated:** December 4, 2025  

**Status:** Final Draft



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

- Secondary accounts create a "safety net" of people who CAN and WILL pay

- At the 3-month mark (halfway through grace), secondaries get notified

- This gives them 3 months to decide to take over payments



### Customer Retention

- Photos are irreplaceable - families WANT to keep access

- The barrier isn't willingness to pay, it's awareness and ability

- Secondary accounts remove that barrier



### Emotional Value

- This feature shows we understand that photos are family treasures, not individual assets

- It builds trust and differentiates us from competitors



### Multi-Generational Legacy

- Photos can flow down family trees naturally

- One account can become a family archive spanning generations



---



## 3. Terminology



| Term | Definition |

|------|------------|

| **Primary** | Account owner. Pays the subscription. Full control over all settings, galleries, and secondary designations. |

| **Secondary** | Designated family member. Can view shared galleries. Can take over as primary if needed. Receives grace period notifications. |

| **Family Shared Gallery** | A gallery the primary has explicitly marked for secondary access. |

| **Gallery View Link** | A shareable link anyone can use to view a gallery. Does NOT make someone a secondary. |

| **Takeover** | When a secondary assumes the primary role and billing responsibility. |

| **Incorporation** | When a secondary copies inherited galleries into their own existing PhotoVault account. |



---



## 4. How Family Accounts Work



### Primary Account Holder's Perspective



**Step 1: Enable Family Sharing**

In Settings, the primary can toggle on "Family Sharing" for their account.



**Step 2: Mark Galleries for Sharing**

For each gallery, the primary can toggle "Share with Family" on or off.

- Only galleries marked for sharing are visible to secondaries

- Unmarked galleries remain completely private

- This setting can be changed at any time



**Step 3: Designate Secondaries**

In the Family Settings UI, the primary enters:

- Email address

- Name

- Relationship (spouse, child, parent, sibling, other)



This is separate from sharing a gallery view link. Designating a secondary activates:

- Access to all family-shared galleries

- Grace period email notifications

- Ability to take over the account



**Step 4: Invitation Sent**

Secondary receives a welcome email with:

- Explanation of what PhotoVault is

- What being a secondary means

- A magic link to accept and access shared galleries

- Note: "You'll be notified if this account ever needs attention"



**Step 5: Manage Secondaries**

Primary can see:

- Who has been invited

- Who has accepted

- Who has added a payment method (peace of mind indicator)

- Option to remove secondaries



### Secondary's Perspective



**Receive Welcome Email**

Email says: "You've been designated as family on [Name]'s PhotoVault account"



Contains:

- Magic link to access shared galleries

- Explanation that they'll be notified if the account needs attention

- Optional: Add a backup payment method now



**Accept and Access**

Click the magic link. Choose:

- **Option A:** Access via magic link (no account needed, just click to view shared galleries)

- **Option B:** Create your own PhotoVault account (email/password) - recommended for takeover capability



**Optional: Add Payment Method**

"Want to help ensure these photos stay protected? Add a backup payment method."

- This is optional but encouraged

- If primary stops paying, secondary can seamlessly take over



**View Shared Galleries**

Once accepted, secondary can view all galleries the primary has marked as "Family Shared."

- Cannot see unmarked galleries

- Cannot modify photos or settings

- Can download photos from shared galleries



---



## 5. Gallery Sharing Model



### Per-Gallery, Opt-In Sharing



The primary controls exactly which galleries are shared:



| Gallery | Family Shared | Secondaries See It? |

|---------|---------------|---------------------|

| Wedding 2020 | ✅ Yes | Yes |

| Kids Birthday | ✅ Yes | Yes |

| Boudoir Session | ❌ No | No |

| Business Headshots | ❌ No | No |



### All Secondaries See All Shared Galleries



When a gallery is marked "Family Shared," ALL designated secondaries can see it.

- No per-secondary, per-gallery permissions

- Keeps the model simple

- Primary should only designate trusted family as secondaries



### Gallery View Links Are Different



A primary can share a **Gallery View Link** with anyone (cousin, friend, coworker).

- This does NOT make them a secondary

- They cannot take over the account

- They won't receive grace period notifications

- It's just a view link



---



## 6. The Grace Period Email System



When the primary account enters the 6-month grace period (stopped paying), **secondaries** receive escalating notifications:



| Time into Grace Period | Email Message |

|------------------------|---------------|

| 3 months | "[Name]'s PhotoVault account needs attention. Payment hasn't been received in 3 months. You can help by updating the payment method." |

| 4 months | "Reminder: [Name]'s photos are at risk. 2 months until access is suspended." |

| 5 months | "Urgent: [Name]'s PhotoVault will be suspended in 30 days." |

| 5.5 months | "Final Notice: Access will be suspended in 2 weeks unless payment is received." |



Each email has a clear **"Help Pay Now"** button that takes them directly to the payment takeover flow.



### Why Wait Until Month 3?



The first 3 months after a death are overwhelming. Families are dealing with funerals, estates, and dozens of account closures. We give them breathing room before adding another task.



The welcome email (sent when first designated) sets expectations: "You'll be notified if this account ever needs attention."



---



## 7. Payment Takeover Flow



When a secondary clicks "Help Pay" (either from email or from their dashboard):



### Step 1: Ask Why (Optional but Encouraged)



"We'd like to understand why you're taking over this account. This helps us provide better service."



Options:

- **Death of account holder** - "I'm sorry for your loss. We'll handle this with care."

- **Financial hardship** - "We understand. You're helping preserve their memories."

- **Health issues** - "We hope they recover. You're helping preserve their memories."

- **Other** - Free text field



*This can be skipped, but we encourage it for photographer notification purposes.*



### Step 2: Choose Your Role



"How would you like to proceed?"



**Option A: Become the New Primary**

- "I want to take over this account completely"

- They become the new primary

- Can invite their own secondaries

- Can manage all settings

- Can mark/unmark galleries for family sharing

- Full control



**Option B: Just Pay the Bills**

- "I want to keep paying so everyone keeps access, but I don't need to manage the account"

- The original primary remains the "owner" (even if deceased/inactive)

- Secondary is flagged as the "billing payer"

- Limited to payment management only

- Other secondaries retain their access



### Step 3: Payment Method



- If they already have a payment method on file, confirm it

- If not, add one via Stripe



### Step 4: Confirmation



- Payment is processed

- Access is restored (if it was suspended)

- Photographer is notified (see below)

- Other secondaries are notified of the change



---



## 8. Multiple Secondaries: Who Becomes Primary?



**Rule: First to click "Take Over" wins.**



If Grandma has 3 kids as secondaries and she dies:

- All 3 receive grace period emails

- The first one to complete the takeover flow becomes the new primary

- The other 2 remain as secondaries (unless the new primary removes them)



### Why This Approach?



- Simple to implement

- No need for Grandma to predict who should take over

- Avoids the problem of a designated backup also dying

- Family can coordinate among themselves



### Potential Family Drama



This may cause disputes. Our policy:

- We don't mediate family disputes

- The account belongs to whoever is paying

- If families want to coordinate, they should do so before clicking

- We can provide documentation of who took over and when (for legal purposes if needed)



---



## 9. What Happens to Unshared Galleries After Death



**Rule: Unshared galleries are permanently inaccessible to secondaries.**



If the primary marked 3 of 10 galleries for family sharing:

- Secondaries can only ever access those 3 galleries

- The other 7 remain private, even after death

- When the account is deleted, those 7 are deleted with it



### Why?



The primary made an explicit choice about what to share. We honor that choice. If they didn't share the boudoir photos, they didn't want family to see them.



### Account Deletion Timeline



- **6 months:** Account suspended (no access, no payments)

- **12 months:** Account and all data permanently deleted



Secondaries have 6 months from suspension (12 months from last payment) to:

- Take over the account, OR

- Download what they need from shared galleries



---



## 10. Photographer Notification



When a secondary takes over payment, the photographer who originally delivered those photos receives:



### Email Notification



**Subject:** "Update: Your client [Original Client Name]'s account"



**Body:**

> Hi [Photographer Name],

>

> We wanted to let you know that [Original Client Name]'s PhotoVault account has been taken over by a family member.

>

> **New billing contact:** [Secondary Name] ([relationship])  

> **Reason given:** [Death / Financial hardship / Health issues / Other: text]

>

> The photos you delivered are still protected, and your commission arrangement continues unchanged.

>

> If you'd like to reach out to the family, their contact email is: [email]



### Dashboard Notification



A banner in the photographer's dashboard:

> "Account Update: [Client Name]'s account is now managed by [Secondary Name] (reason: [reason])"



### Why Include the Reason?



Photographers have human relationships with these families. If a client died, the photographer should know so they don't appear callous in future communications (e.g., sending a "hope you loved your photos!" email to a grieving family).



---



## 11. Commission Handling



### Core Rule: Commission Follows the Account, Not the Galleries



| Scenario | Commission |

|----------|------------|

| Primary paying normally | Original photographer gets 50% |

| Secondary takes over as primary (same account) | Original photographer keeps 50% |

| Secondary takes over as bill payer only | Original photographer keeps 50% |

| Account becomes orphaned (photographer left/died) | PhotoVault keeps 100% |

| Secondary incorporates galleries into their own account | Secondary's photographer gets 50% (see Section 12) |



### Why This Approach?



- Clean and simple: one account = one photographer relationship

- No complex per-gallery commission tracking

- No splitting $8/month across multiple photographers

- Natural lifecycle: photographers' client bases shrink as clients die, grow as they book new ones



---



## 12. Gallery Incorporation



A secondary who has their **own** PhotoVault account can choose to "incorporate" inherited galleries.



### What Incorporation Means



**It's a COPY, not a transfer.**



- Galleries are duplicated into the secondary's own account

- Original account still exists (until grace period ends or someone else takes it over)

- Other secondaries still have access to the original account's shared galleries

- They should download what they need before the original account is deleted



### Incorporation Flow



1. Secondary has their own PhotoVault account (set up by their own photographer)

2. They're also a secondary on Grandma's account

3. Grandma dies

4. Secondary sees option: "Incorporate these galleries into your account"

5. They select which shared galleries to copy

6. Galleries are copied to their account

7. Original account continues its grace period countdown



### Commission After Incorporation



**The secondary's photographer gets all commission.**



Example:

- Grandma's account → Photographer X

- Mom's account → Photographer Y

- Mom incorporates Grandma's galleries into her account

- Photographer Y now gets commission on Mom's account (which includes the incorporated galleries)

- Photographer X loses that revenue (the client died)



This is the natural lifecycle. Clients die. Photographers should expect some accounts to end. Incorporation is a bonus for the receiving photographer.



### Multiple Incorporations



Mom could incorporate galleries from:

- Grandma (Photographer X)

- Great Aunt (Photographer Z)

- Her own photos (Photographer Y)



All in one account. Photographer Y gets all commission. No splitting.



---



## 13. Secondary Wants Their Own Account



A common scenario: Mom is a secondary on Dad's account. She wants her own PhotoVault for her business headshots.



**She can have both:**

- Keep her secondary access to Dad's shared galleries

- Start her own $8/month subscription for her own galleries



In her dashboard, she would see:



```

MY ACCOUNT

├── My Galleries (her own subscription)

│   ├── Business Headshots 2024

│   └── Family Reunion 2023

│

└── FAMILY ACCESS

    └── Dad's Shared Galleries (secondary access)

        ├── Wedding 1985

        └── Kids Growing Up

```



**This is revenue expansion** - we're not cannibalizing Dad's subscription, we're adding a new one.



---



## 14. Orphan Protocol Integration



The Orphan Protocol (what happens when a photographer leaves) is unchanged:



| Scenario | Result |

|----------|--------|

| Photographer leaves PhotoVault | Account becomes "orphaned" - direct client |

| Orphaned account continues paying | PhotoVault keeps 100% |

| Secondary takes over orphaned account | Still orphaned, PhotoVault keeps 100% |

| Secondary incorporates orphaned galleries | Secondary's photographer gets commission on their account |

| New photographer added to account | New photographer only gets commission on NEW galleries they deliver |



**Key principle:** Photographer relationships are per-gallery at delivery time, but commission is calculated at account level for simplicity.



---



## 15. Pricing & Limits



### Family Sharing is Free



Adding secondaries is included in the $8/month subscription. We don't charge extra.



**Rationale:**

- It's a value-add that increases stickiness

- It creates more potential payers (safety net)

- It's the right thing to do for families



### Secondary Limits



Configurable by subscription tier (future-proofing):

- **Default:** 5 secondaries

- Could increase for premium tiers later



### Gallery Sharing Limits



No limit on how many galleries can be marked for family sharing.



---



## 16. Technical Implementation Summary



### New Database Tables



**`secondaries`** - Tracks designated family members

```

- id

- account_id (the primary's account)

- email

- name

- relationship (spouse, child, parent, sibling, other)

- status (pending, accepted, revoked)

- has_payment_method (boolean)

- is_billing_payer (boolean - took over payments but not primary role)

- invited_at

- accepted_at

- created_at

- updated_at

```



**`gallery_sharing`** - Tracks which galleries are family shared

```

- id

- gallery_id

- account_id

- is_family_shared (boolean)

- shared_at

- created_at

- updated_at

```



**`account_takeovers`** - Audit log of takeovers

```

- id

- account_id

- previous_primary_id

- new_primary_id (or billing_payer_id)

- takeover_type (full_primary, billing_only)

- reason (death, financial, health, other)

- reason_text (if other)

- taken_over_at

- created_at

```



**`gallery_incorporations`** - Tracks copied galleries

```

- id

- source_account_id

- destination_account_id

- source_gallery_id

- destination_gallery_id

- incorporated_at

- created_at

```



### Modified Tables



**`accounts`** - Add fields:

```

- family_sharing_enabled (boolean)

- max_secondaries (integer, default 5)

- original_primary_id (for tracking after takeover)

```



**`galleries`** - Add fields:

```

- is_family_shared (boolean, default false)

- incorporated_from_gallery_id (nullable, for tracking origin)

- incorporated_from_account_id (nullable)

```



### New API Endpoints



```

POST   /api/family/enable              - Enable family sharing on account

POST   /api/family/secondaries         - Invite a secondary

DELETE /api/family/secondaries/:id     - Remove a secondary

POST   /api/family/secondaries/accept  - Accept invitation (with magic link token)

POST   /api/family/takeover            - Take over billing/primary role

POST   /api/family/incorporate         - Copy galleries to own account



PATCH  /api/galleries/:id/sharing      - Toggle family sharing on a gallery

GET    /api/family/shared-galleries    - Get galleries shared with me (as secondary)

```



### New Pages



```

/family/accept/[token]     - Accept invitation landing page

/family/takeover           - Takeover flow (from grace period email)

/settings/family           - Family sharing settings (for primary)

/family/galleries          - View shared galleries (for secondary)

```



### Modified Systems



- **Gallery access checking** - Include secondaries for family-shared galleries

- **Stripe webhook handling** - Recognize secondary as billing payer

- **Grace period email system** - Notify secondaries at 3, 4, 5, 5.5 months

- **Photographer dashboard** - Show takeover notifications with reason

- **Account deletion job** - Delete accounts 12 months after last payment



---



## 17. Key User Stories



### Story A: The Safety Net

> Sarah designates her daughter Emma as a secondary and shares 5 galleries. Ten years later, Sarah passes away. At month 3 of the grace period, Emma gets an email. She takes over as primary and preserves 10 years of family memories. Emma can now invite her own kids as secondaries.



### Story B: The Private Photos

> John has 10 galleries. He shares 7 with his wife Mary as a secondary, but keeps 3 private (old relationship photos). When John dies, Mary only sees the 7 shared galleries. The 3 private ones are deleted after 12 months.



### Story C: The Forgetful Parent

> Tom's dad signed up for PhotoVault but is terrible with technology. Tom is designated as a secondary with his own payment method. When Dad's card expires and he doesn't notice, Tom gets notified at month 3 and updates the payment.



### Story D: The Growing Family

> Lisa is a secondary on her parents' account. She gets married, hires her own wedding photographer, and starts her own PhotoVault subscription. She now has her own account PLUS secondary access to her parents' shared galleries.



### Story E: The Incorporation

> Mom has her own PhotoVault account (Photographer Y). Grandma dies. Mom incorporates Grandma's shared wedding galleries into her own account. Photographer Y now gets commission on Mom's account. Mom's siblings (also secondaries) have 6 months to download from Grandma's original account before it's deleted.



### Story F: The First Click

> Grandma has 3 kids as secondaries. She dies. All 3 get the month-3 email. Kid A clicks "Take Over" first and becomes the new primary. Kids B and C remain as secondaries. Kid A can now manage the account and invite new secondaries (like grandkids).



---



## 18. What We're NOT Building (Scope Limits)



| Not Building | Why |

|--------------|-----|

| Selective per-secondary gallery sharing | Too complex. Share with all secondaries or none. |

| Secondary hierarchy (admin vs viewer) | All secondaries are equal. Primary controls everything. |

| Family plans/pricing tiers | Family sharing is free, included in base subscription. |

| Secondary-to-secondary invites | Only primary can designate secondaries. |

| Automatic backup primary designation | First to click wins. Simpler, avoids edge cases. |

| Mediation for family disputes | Not our role. Account belongs to whoever is paying. |



---



## 19. Legal & Privacy Notes



### Items to Review with Legal



1. **Sharing account holder info with secondaries** - Is consent needed? GDPR/CCPA implications?

2. **Deletion after 12 months** - Is this sufficient notice? Do we need to notify before deletion?

3. **Takeover reason sharing with photographer** - Privacy concern? (We've decided it's appropriate for human relationships)

4. **Deceased user data handling** - Any specific regulations?



### TOS Updates Required



Section 5 of our Terms of Service covers Family Sharing. Updates needed:

- Clarify per-gallery sharing model

- Explain secondary designation vs. gallery view links

- Document takeover process

- Explain incorporation and commission handling

- 12-month deletion policy



---



## 20. Summary



Family Accounts is a feature that:



1. **Lets primaries designate secondaries** - trusted family members who can view shared galleries and take over if needed

2. **Per-gallery sharing control** - primary decides exactly what to share

3. **Creates a safety net** - secondaries can take over payments during grace period

4. **Sends escalating notifications** - at months 3, 4, 5, and 5.5

5. **Allows seamless takeover** - first to click becomes new primary

6. **Honors privacy choices** - unshared galleries stay private, even after death

7. **Enables incorporation** - copy galleries to your own account

8. **Keeps commission simple** - follows the account, not the galleries

9. **Supports multi-generational legacy** - photos flow down family trees naturally



**The core value proposition:**



> "Your family's photos are safe, even if something happens to you. Share what you want, keep private what you don't, and know that someone you trust can always step in."



---



## Document History



| Version | Date | Changes |

|---------|------|---------|

| 1.0 | Dec 2025 | Initial spec |

| 2.0 | Dec 4, 2025 | Per-gallery sharing, secondary terminology, incorporation model, commission rules, unshared gallery handling, first-click takeover |






