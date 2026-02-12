# UI: Landing Page Redesign (Photographer-Only) - Implementation Plan

**Date:** 2026-02-12
**Author:** UI Expert Agent (Shadcn/Tailwind + UX Design)
**Persona Review:** Marketing Genius (messaging), Product Designer (layout), Cultural Storyteller (tone), Strategist (beta alignment)
**Status:** Ready for Review

---

## Summary

Complete redesign of the PhotoVault landing page from a split-audience (photographer + client) page to a **100% photographer-focused** conversion page. The current page suffers from split-personality messaging (hero talks to families, body talks to photographers), fabricated social proof (fake testimonials from "Hannah" and "Sarah", fake "247 photographers" stat), and client-oriented CTAs ("Protect My Photos"). The redesign strips all of that away and replaces it with a clear, honest, professional pitch to working photographers: "Turn your finished work into recurring income."

The page targets **5-15 founding photographers** for the beta program. Every section answers: "Why should I, a working photographer, care about this?"

---

## Aesthetic Direction

**Three-word description:** "Quiet Professional Confidence"

**Why this direction:** Photographers are visual professionals. They will judge PhotoVault by its visual presentation before reading a word. The current page uses bright amber/emerald/red colors that feel like a consumer app, not a business tool. The redesign adopts the existing design system's teal accent (`--primary: #00B3A4`) with the clean neutral palette already defined in `globals.css`, replacing the hardcoded `#1a365d` navy and `amber-500` scattered throughout the current components.

**Color approach:**
- **Primary action:** Teal (`--primary` / `bg-primary`) for CTAs and key accents
- **Backgrounds:** Clean white (`bg-background`) with subtle `bg-secondary` section alternation
- **Text:** `text-foreground` (#111111 light mode) for body, slightly lighter for secondary
- **Cards:** `bg-card` with `border-border` subtle borders
- **Dark mode is the default theme per spec** -- but the landing page should work cleanly in both. Use semantic tokens throughout.

**Font approach:** Keep the existing Geist Sans (`--font-sans`). It is clean, professional, and already loaded. No new font dependencies.

**Spacing philosophy:** Generous whitespace. Use the existing `section-spacing` and `section-spacing-sm` utility classes from `globals.css`. Sections breathe. Content doesn't feel cramped. Mobile gets slightly tighter but still open.

---

## Page Architecture (Section by Section)

### Section 1: Header / Navigation

**Layout:** Sticky top header. Logo left. Navigation center-right. Two CTAs right.

**Changes from current:**
- Remove "Community" and "Locations" nav links (not relevant to this page)
- Change CTA text from "Protect My Photos" to "Join the Beta"
- Add "Looking for your photos? Log in here" subtle text link
- Replace `bg-[#1a365d]` with semantic dark background (`bg-card` in dark mode context, or a dedicated dark header using `bg-[#0A0A0A]`)

**Navigation items (desktop):**
1. How It Works
2. Pricing
3. Beta Program
4. Log In

**Navigation items (mobile):** Same, in hamburger menu.

**Desktop right side:**
- "Looking for your photos?" text link (small, muted)
- "Join the Beta" button (primary)

**Exact copy:**
- Nav: "How It Works" | "Pricing" | "Beta Program" | "Log In"
- Muted link: "Looking for your photos? Log in here"
- CTA button: "Join the Beta"

---

### Section 2: Hero

**Layout:** NOT a generic centered hero. Two-column on desktop (content left, calculator right). Single column on mobile (content on top, calculator below).

**Why this layout:** The income calculator is the single most compelling element on the page. It should be visible immediately. Putting it in the hero alongside the value proposition means photographers see both the "what" and the "how much" within 5 seconds.

**Left column content:**

Headline:
```
Your past work should still be paying you.
```

Subheadline:
```
PhotoVault turns your completed photoshoots into monthly recurring revenue.
Clients pay $8/month to keep their galleries. You earn $4/month per client. Forever.
```

Supporting detail (small text):
```
No more one-and-done transactions. No more paying for storage that earns you nothing.
```

Primary CTA button:
```
Join the Beta -- It's Free for 12 Months
```

Secondary text below CTA:
```
Currently accepting founding photographers. No credit card required.
```

**Right column:** Income Calculator (interactive slider component, redesigned -- see Section details below).

**Visual approach:** No hero image in this section. The calculator IS the visual. Clean background. The power is in the simplicity and the number that changes as you drag the slider.

---

### Section 3: How It Works (The Revenue Model)

**Layout:** Three-step horizontal cards on desktop, vertical stack on mobile. Below the steps, a simple visual diagram showing the money flow.

**Section headline:**
```
How Photographers Earn with PhotoVault
```

**Section subheadline:**
```
Three steps. Then the income runs itself.
```

**Step 1:**
- Icon: Upload (Lucide `Upload` icon)
- Title: "Upload your galleries"
- Description: "Drag and drop your delivered photos. We handle storage, organization, and client access."

**Step 2:**
- Icon: Send (Lucide `Send` icon)
- Title: "Invite your clients"
- Description: "Send your client a link. They create an account and choose a plan to keep their photos safe."

**Step 3:**
- Icon: DollarSign (Lucide `DollarSign` icon)
- Title: "Earn every month"
- Description: "Your client pays $8/month. You receive $4/month. Automatically. For as long as they subscribe."

**Money flow visual (below the steps):**
A simple horizontal diagram:
```
Client pays $8/mo --> [ PhotoVault ] --> $4/mo to you (direct deposit via Stripe)
```

This is not a complex graphic. It is a simple `flex` row with text and an arrow icon between segments, styled as a card.

---

### Section 4: The Comparison (Why Switch)

**Layout:** Two-column comparison card. "Before" column and "After" column.

**Section headline:**
```
You're paying for storage. Your clients should be.
```

**Section subheadline:**
```
Most gallery platforms charge you more as you grow. We flipped the model.
```

**Left column ("The Old Way"):**
- You pay $20-$60/month for hosting
- Galleries expire when you cancel
- More clients = higher bill
- Income ends after delivery
- You are tech support for your clients

**Right column ("The PhotoVault Way"):**
- Clients pay for their own storage
- Galleries stay forever (even if you leave)
- More clients = more income for you
- Passive revenue from past work
- We handle billing, support, and access

Each item has a red X (left) or green check (right) icon. Clean, scannable.

---

### Section 5: Income Calculator (Standalone Section)

**Layout:** Centered card with the interactive calculator. This is a more detailed version of the hero calculator, giving photographers time to play with numbers.

**Section headline:**
```
See what your past work is worth.
```

**Section subheadline:**
```
Every client you've ever shot is potential recurring revenue.
```

**Calculator card:**
- Slider: 0 to 100 clients
- Large display: monthly income (clients x $4)
- Reference points below the slider:
  - "10 clients = $40/mo"
  - "25 clients = $100/mo"
  - "50 clients = $200/mo"
  - "100 clients = $400/mo"
- Below the calculator: "Most photographers shoot 30-50 clients per year. In 2-3 years, that's real income."
- CTA button: "Start Building Your Recurring Revenue"

**Technical note:** Reuse and modify the existing `IncomeCalculator.tsx` component. Fix the bottom text (currently says "Based on an average of 42 sessions a year" which is oddly specific and unsourced). Remove the "$22/Month" from the CTA -- at this point we haven't explained pricing yet, and the beta is free anyway.

---

### Section 6: Pricing (Transparent and Simple)

**Layout:** Two cards side by side on desktop (Photographer Plan + Client Plan), stacked on mobile.

**Section headline:**
```
Transparent pricing. No surprises.
```

**Section subheadline:**
```
Know exactly what you pay, what your clients pay, and what you earn.
```

**Card 1: "Your Platform Fee"**
- Price: "$22/month"
- Crossed out with beta badge: "FREE for 12 months during beta"
- Features:
  - Unlimited gallery uploads
  - Client portal and access management
  - Automated billing and subscriptions
  - Stripe direct deposit to your bank
  - Desktop app for large uploads
- CTA: "Join the Beta -- Free for 12 Months"

**Card 2: "What Your Clients Pay"**
- Price: "$8/month"
- OR upfront packages:
  - "$100 upfront = 12 months included (you earn $50)"
  - "$50 upfront = 6 months included (you earn $25)"
- Description: "After the included period, clients pay $8/month. You earn $4/month per client, deposited directly to your Stripe account."
- No CTA on this card -- it's informational.

**Below both cards, a simple math summary:**
```
Your cost: $22/mo (free during beta)
Your earnings: $4/client/month
Break-even: 6 paying clients covers your platform fee
After that, it's profit.
```

---

### Section 7: Orphan Protocol (Trust Differentiator)

**Layout:** Single centered card with a distinctive visual treatment. This is a trust-building section, not a feature list.

**Section headline:**
```
What happens to photos when a photographer quits?
```

**Section subheadline:**
```
On every other platform, they disappear. Not here.
```

**Body copy:**
```
PhotoVault's Orphan Protocol ensures that if a photographer cancels their account,
retires, or passes away, their clients' photos remain safe and accessible.

No other gallery platform offers this guarantee.

Your clients' memories are protected. Period.
```

**Visual:** A simple shield or lock icon (Lucide `ShieldCheck`). Not dramatic -- just confident.

---

### Section 8: Founder Story (Brief and Honest)

**Layout:** Simple text section with a small personal touch. Not a full "about" page -- just enough to say "this is real and built by a real person."

**Section headline:**
```
Built by a dad who got tired of losing his family's photos.
```

**Body copy:**
```
I'm Nate. I live in Brooklyn, Wisconsin, and I built PhotoVault because
I watched my family's photos scatter across dead hard drives, expired
cloud links, and forgotten USB sticks.

When I talked to photographers, I realized the same thing was happening
to their clients. And the platforms that were supposed to help were charging
photographers more while letting galleries expire.

PhotoVault flips that. Photographers earn from their work. Clients keep
their memories. Nobody loses.

This isn't a VC-funded startup. It's a sustainable business built to last.
I'm looking for founding photographers to help shape it.
```

**No photo of Nate required** (unless he wants to add one later). Keep it text-only for now.

---

### Section 9: Beta Program CTA (Final Conversion)

**Layout:** Full-width section with a strong visual container. This is the "close" section.

**Section headline:**
```
Join the founding photographers.
```

**Section subheadline:**
```
The beta is open to a small group of professional photographers.
12 months free. Shape the product. Lock in your spot.
```

**Beta details (bullet list):**
- 12 months free ($22/month waived)
- Direct access to the founder for feedback
- Priority feature requests
- Founding Photographer badge on your profile
- No credit card required to start

**CTA button (large):**
```
Apply for the Beta
```

**Below CTA:**
```
Questions? Email nate@photovault.photo directly.
```

---

### Section 10: Client Redirect (Tiny Footer Link)

**NOT a section** -- this is a single line above the footer or within the footer.

**Copy:**
```
Are you a client looking for your photos? Log in here.
```

Link goes to `/login`.

---

### Section 11: Footer

**Layout:** Simplified from current. Remove "Memory Insurance for families" messaging. Remove "Community" link. Keep legal/contact info.

**Changes from current:**
- Description: "PhotoVault helps professional photographers turn completed work into recurring revenue." (replaces family-focused copy)
- Remove "Community" quick link
- Remove "Photo Locations" quick link
- Keep: Privacy Policy, Terms of Service, Cancellation Policy
- Keep: Contact info, business address
- Keep: Stripe payment badges
- Update copyright year: 2026
- Keep: Cancellation policy text (Stripe requirement)
- Add: "Questions about the beta? nate@photovault.photo"

---

## Full Section List (in order)

1. **Header** -- Navigation + "Looking for your photos?" link + "Join the Beta" CTA
2. **Hero** -- Value prop headline + Income calculator side by side
3. **How It Works** -- Three-step process + money flow diagram
4. **The Comparison** -- Before/After (old gallery platforms vs. PhotoVault)
5. **Income Calculator** -- Standalone interactive calculator with reference points
6. **Pricing** -- Two cards (your fee + client fee) with beta offer
7. **Orphan Protocol** -- Trust differentiator unique to PhotoVault
8. **Founder Story** -- Brief, honest, personal
9. **Beta CTA** -- Final conversion section with beta details
10. **Footer** -- Simplified, photographer-focused

---

## Component Architecture

### Components to REWRITE (new content, new layout):

| Component | Current File | Action |
|-----------|-------------|--------|
| HeroSection | `HeroSection.tsx` | Complete rewrite. New headline, new layout, calculator embedded. |
| HowItWorksSection | `HowItWorksSection.tsx` | Complete rewrite. New 3-step process + money flow. |
| CommunitySection | `CommunitySection.tsx` | **DELETE.** Replace with ComparisonSection + OrphanProtocolSection + FounderStorySection. |
| PricingSection | `PricingSection.tsx` | Complete rewrite. Two-card layout, beta offer, correct numbers. |
| LandingHeader | `LandingHeader.tsx` | Rewrite nav links and CTAs. |
| LandingFooter | `LandingFooter.tsx` | Update copy, remove family/client messaging. |
| IncomeCalculator | `IncomeCalculator.tsx` | Modify: fix reference points, remove "$22/Month" CTA text, update bottom text. |

### Components to CREATE:

| Component | File | Purpose |
|-----------|------|---------|
| ComparisonSection | `ComparisonSection.tsx` | Before/After two-column comparison |
| OrphanProtocolSection | `OrphanProtocolSection.tsx` | Trust differentiator section |
| FounderStorySection | `FounderStorySection.tsx` | Brief founder story |
| BetaCTASection | `BetaCTASection.tsx` | Final conversion section with beta details |
| IncomeCalculatorSection | `IncomeCalculatorSection.tsx` | Wrapper section for standalone calculator (reuses IncomeCalculator) |

### Components to REMOVE:

| Component | File | Reason |
|-----------|------|--------|
| CommunitySection | `CommunitySection.tsx` | Fake testimonials, community features not built |
| LocationMap | `LocationMap.tsx` | Not relevant to photographer landing page (useful for directory, not here) |

### Component Hierarchy:

```
page.tsx
  LandingHeader
  main
    HeroSection
      IncomeCalculator (embedded)
    HowItWorksSection
    ComparisonSection
    IncomeCalculatorSection
      IncomeCalculator (reused)
    PricingSection
    OrphanProtocolSection
    FounderStorySection
    BetaCTASection
  LandingFooter
```

---

## Copy Document

All actual text that will appear on the page, section by section.

### Header
- Nav: "How It Works" | "Pricing" | "Beta Program" | "Log In"
- Muted link: "Looking for your photos? Log in here"
- CTA: "Join the Beta"

### Hero
- H1: "Your past work should still be paying you."
- Subheadline: "PhotoVault turns your completed photoshoots into monthly recurring revenue. Clients pay $8/month to keep their galleries. You earn $4/month per client. Forever."
- Body: "No more one-and-done transactions. No more paying for storage that earns you nothing."
- CTA: "Join the Beta -- It's Free for 12 Months"
- Sub-CTA: "Currently accepting founding photographers. No credit card required."

### How It Works
- H2: "How Photographers Earn with PhotoVault"
- Sub: "Three steps. Then the income runs itself."
- Step 1: "Upload your galleries" / "Drag and drop your delivered photos. We handle storage, organization, and client access."
- Step 2: "Invite your clients" / "Send your client a link. They create an account and choose a plan to keep their photos safe."
- Step 3: "Earn every month" / "Your client pays $8/month. You receive $4/month. Automatically. For as long as they subscribe."
- Flow: "Client pays $8/mo" -> "PhotoVault" -> "$4/mo to you (via Stripe)"

### Comparison
- H2: "You're paying for storage. Your clients should be."
- Sub: "Most gallery platforms charge you more as you grow. We flipped the model."
- Left column title: "The Old Way"
  - "You pay $20-$60/month for hosting"
  - "Galleries expire when you cancel"
  - "More clients = higher bill"
  - "Income ends after delivery"
  - "You are tech support for your clients"
- Right column title: "The PhotoVault Way"
  - "Clients pay for their own storage"
  - "Galleries stay forever (even if you leave)"
  - "More clients = more income for you"
  - "Passive revenue from past work"
  - "We handle billing, support, and access"

### Income Calculator Section
- H2: "See what your past work is worth."
- Sub: "Every client you've ever shot is potential recurring revenue."
- Reference points: "10 clients = $40/mo" | "25 clients = $100/mo" | "50 clients = $200/mo" | "100 clients = $400/mo"
- Below: "Most photographers shoot 30-50 clients per year. In 2-3 years, that's real income."
- CTA: "Start Building Your Recurring Revenue"

### Pricing
- H2: "Transparent pricing. No surprises."
- Sub: "Know exactly what you pay, what your clients pay, and what you earn."
- Card 1 title: "Your Platform Fee"
  - Price: "$22/month" with strikethrough
  - Badge: "FREE during beta (12 months)"
  - Features: "Unlimited gallery uploads" | "Client portal and access management" | "Automated billing and subscriptions" | "Stripe direct deposit to your bank" | "Desktop app for large uploads"
  - CTA: "Join the Beta -- Free for 12 Months"
- Card 2 title: "What Your Clients Pay"
  - Price: "$8/month"
  - OR: "$100 upfront = 12 months included (you earn $50)" | "$50 upfront = 6 months included (you earn $25)"
  - "After the included period, clients pay $8/month. You earn $4/month per client, deposited directly via Stripe."
- Math: "Your cost: $22/mo (free during beta) | Your earnings: $4/client/month | Break-even: 6 paying clients covers your platform fee | After that, it's profit."

### Orphan Protocol
- H2: "What happens to photos when a photographer quits?"
- Sub: "On every other platform, they disappear. Not here."
- Body: "PhotoVault's Orphan Protocol ensures that if a photographer cancels their account, retires, or passes away, their clients' photos remain safe and accessible. No other gallery platform offers this guarantee. Your clients' memories are protected. Period."

### Founder Story
- H2: "Built by a dad who got tired of losing his family's photos."
- Body: "I'm Nate. I live in Brooklyn, Wisconsin, and I built PhotoVault because I watched my family's photos scatter across dead hard drives, expired cloud links, and forgotten USB sticks. When I talked to photographers, I realized the same thing was happening to their clients. And the platforms that were supposed to help were charging photographers more while letting galleries expire. PhotoVault flips that. Photographers earn from their work. Clients keep their memories. Nobody loses. This isn't a VC-funded startup. It's a sustainable business built to last. I'm looking for founding photographers to help shape it."

### Beta CTA
- H2: "Join the founding photographers."
- Sub: "The beta is open to a small group of professional photographers. 12 months free. Shape the product. Lock in your spot."
- Bullets: "12 months free ($22/month waived)" | "Direct access to the founder for feedback" | "Priority feature requests" | "Founding Photographer badge on your profile" | "No credit card required to start"
- CTA: "Apply for the Beta"
- Below: "Questions? Email nate@photovault.photo directly."

### Footer
- Description: "PhotoVault helps professional photographers turn completed work into recurring revenue."
- Client redirect: "Are you a client looking for your photos? Log in here."

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/page.tsx` | **Modify** | Update metadata (title, description, OG tags to be photographer-focused), update structured data, replace section composition with new section order, use semantic colors instead of `bg-white text-gray-700` |
| `src/components/landing/LandingHeader.tsx` | **Modify** | New nav links, new CTA text, "Looking for your photos?" link, semantic colors replacing `bg-[#1a365d]` |
| `src/components/landing/HeroSection.tsx` | **Rewrite** | Completely new content: photographer headline, embedded IncomeCalculator, semantic colors |
| `src/components/landing/HowItWorksSection.tsx` | **Rewrite** | Three-step process + money flow diagram, remove fake testimonial |
| `src/components/landing/ComparisonSection.tsx` | **Create** | Before/After comparison section |
| `src/components/landing/IncomeCalculatorSection.tsx` | **Create** | Standalone section wrapper for calculator with headline + reference points |
| `src/components/landing/IncomeCalculator.tsx` | **Modify** | Fix CTA text, fix bottom reference text, keep slider logic |
| `src/components/landing/PricingSection.tsx` | **Rewrite** | Two-card layout, remove fake "247" stat, add beta offer, correct all numbers |
| `src/components/landing/OrphanProtocolSection.tsx` | **Create** | New trust differentiator section |
| `src/components/landing/FounderStorySection.tsx` | **Create** | New founder story section |
| `src/components/landing/BetaCTASection.tsx` | **Create** | New final conversion section |
| `src/components/landing/LandingFooter.tsx` | **Modify** | Update description, remove family messaging, add beta contact, update year |
| `src/components/landing/index.ts` | **Modify** | Update exports: remove CommunitySection, add new sections |
| `src/components/landing/CommunitySection.tsx` | **Delete** | Fake testimonials, irrelevant community features |
| `src/components/landing/LocationMap.tsx` | **Keep** | Do NOT delete -- still used by `/directory` page. Just remove from landing page exports if desired. |

---

## Responsive Strategy

**Mobile-first breakpoints (matching existing Tailwind defaults):**

| Breakpoint | Width | Key Changes |
|-----------|-------|-------------|
| Base (mobile) | < 640px | Single column. Full-width cards. Compact spacing. Calculator at full width below hero text. |
| `sm` | >= 640px | Slightly larger text. Some horizontal layouts begin (comparison columns). |
| `md` | >= 768px | Two-column comparison visible. Pricing cards side-by-side. |
| `lg` | >= 1024px | Hero goes two-column (text left, calculator right). Full desktop nav visible. |
| `xl` | >= 1280px | Max container width. Generous whitespace. |

**Section-specific responsive notes:**

- **Hero:** Mobile = stacked (headline, subheadline, CTA, calculator). Desktop = side by side.
- **How It Works:** Mobile = vertical steps. Desktop = horizontal cards.
- **Comparison:** Mobile = stacked columns. Desktop = side by side.
- **Pricing:** Mobile = stacked cards. Desktop = side by side.
- **Calculator:** Full-width on all breakpoints. Slider is touch-friendly (already using shadcn Slider).

**Touch targets:** All buttons and links maintain minimum 44px height (already enforced in current header/footer via `min-h-[44px]`). Continue this pattern.

---

## Accessibility Plan

### Semantic HTML
- `<header>` for navigation
- `<main>` for content
- `<section>` with `aria-label` for each major section
- `<footer>` for footer
- Proper heading hierarchy: single `<h1>` in hero, `<h2>` for each section, `<h3>` for subsections

### ARIA Labels
- All interactive elements (buttons, links, slider) have descriptive labels
- Calculator slider: `aria-label="Number of paying clients"` (already exists via `id` attribute)
- Navigation menu toggle: `aria-label` for open/close states (already exists)

### Keyboard Navigation
- All interactive elements focusable via Tab
- Skip-to-content link at top of page (add if not present)
- Focus ring visible on all interactive elements (handled by Tailwind `outline-ring/50`)

### Color Contrast
- All text meets WCAG 2.2 AA minimum (4.5:1 for body text, 3:1 for large text)
- Primary teal (#00B3A4) on white: 3.05:1 -- this is adequate for large text/buttons but NOT for body text. Use `text-foreground` (#111111) for body text and reserve teal for buttons, links, and accents.
- In dark mode, teal (#00D9C5) on dark (#0A0A0A): 9.7:1 -- excellent.

### Reduced Motion
- `prefers-reduced-motion` media query already in `globals.css`
- No essential animations -- the page works without any animation
- Slider is interactive, not animated

### Screen Reader
- Calculator value announced on change
- Comparison section uses proper list semantics
- Icons have `aria-hidden="true"` with text labels provided separately

---

## Testing Steps

### Visual Testing
1. Start dev server: `npm run dev -- -p 3002`
2. Open `http://localhost:3002` in browser
3. Verify each section renders correctly
4. Test at mobile (375px), tablet (768px), and desktop (1280px) widths
5. Toggle dark mode and verify all sections maintain contrast and readability

### Content Verification
1. Confirm NO fake testimonials appear anywhere
2. Confirm NO fake statistics ("247 photographers") appear
3. Confirm all pricing numbers match spec:
   - $22/month photographer fee
   - $8/month client fee
   - $4/month to photographer
   - $100/12mo and $50/6mo upfront options
4. Confirm calculator math: clients * $4 = monthly income
5. Confirm "Looking for your photos?" link goes to `/login`
6. Confirm "Join the Beta" / "Apply for the Beta" links go to `/photographers/signup`
7. Confirm no "Memory Insurance" language remains on the page

### Functional Testing
1. Income Calculator slider works and updates display
2. All navigation links scroll to correct sections (smooth scroll via `html { scroll-behavior: smooth }`)
3. Mobile menu opens/closes correctly
4. All external links open correctly (email links, etc.)

### Accessibility Testing
1. Run Lighthouse accessibility audit -- target > 95
2. Tab through entire page -- verify logical focus order
3. Verify all images have appropriate alt text (or `aria-hidden` for decorative)
4. Test with screen reader (or at minimum, check ARIA attributes)

### Performance Testing
1. Run Lighthouse performance audit
2. Verify no unused LocationMap/Leaflet code is loaded on landing page
3. Verify no unused hero image is loaded (new hero has no image)
4. Check that only necessary components are bundled

---

## Gotchas & Warnings

### 1. LocationMap is used elsewhere
The `LocationMap.tsx` component is imported in `CommunitySection.tsx` and also potentially used by the `/directory` page. **Do NOT delete `LocationMap.tsx`**. Just remove `CommunitySection.tsx` from the landing page and keep LocationMap available for other routes.

### 2. Hero image is no longer needed
The current hero loads `photographer-hero.jpg`. The redesigned hero has no image. The image file can stay in `/public/images/landing/` but will no longer be referenced. Do not delete it in case it's used elsewhere or wanted later.

### 3. Dark mode is default but landing uses light colors
The current landing page hardcodes `bg-white text-gray-700` on the root div. The redesign must use semantic tokens (`bg-background text-foreground`) so dark mode works. The existing `globals.css` already has both light and dark mode variables defined.

### 4. Structured data in page.tsx needs update
The current JSON-LD structured data describes the service as "Photo storage and protection platform" with family-oriented language. This must be updated to photographer-focused description for SEO.

### 5. OG image reference
The current OG image path is `/images/og-landing.webp`. If this image exists and contains client-focused messaging, it should eventually be updated. For now, keep the reference but flag for future update.

### 6. Auth signup path
CTAs link to `/photographers/signup` and `/auth/signup`. Verify which is the correct beta signup path. The existing header uses `/auth/signup` while the pricing section uses `/photographers/signup`. These should be unified. Recommend using `/auth/signup` with a query parameter like `?role=photographer` if role differentiation is needed, or `/photographers/signup` if that route exists and works.

### 7. Beta coupon flow not built yet
The beta CTA says "No credit card required" -- verify this is true. Per CURRENT_STATE.md, the coupon entry UI for Stripe subscription flow is not yet built. The signup flow should work without requiring payment during beta.

### 8. Remove all amber-500 hardcoded colors
The current components use `bg-amber-500` and `hover:bg-amber-600` extensively. The redesign should use `bg-primary` and `hover:bg-primary/90` from the design system. The amber is not part of the defined token system and creates visual inconsistency with the rest of the app (which uses teal).

### 9. Copyright year
Footer currently says "2025". Update to "2026".

### 10. Hardcoded hex colors
Current components are full of `text-[#1a365d]`, `bg-[#1a365d]`, `bg-amber-500`, `text-red-600`, `bg-red-50`, `bg-green-50`, `bg-emerald-50`, etc. The redesign should use semantic tokens from the design system (`text-foreground`, `bg-primary`, `bg-secondary`, `bg-card`, `border-border`, etc.) to ensure dark mode compatibility and design consistency.

---

## Marketing Genius Review Notes

**Messaging Hierarchy (applied):**
1. **5-second hook:** "Your past work should still be paying you." -- immediately communicates value and relevance.
2. **15-second value:** The income calculator right in the hero makes the money tangible.
3. **30-second confidence:** Transparent pricing, real founder story, no fake social proof.
4. **Conversion path:** Three CTA points (hero, pricing, final section) with consistent "Join the Beta" language.

**Voice DNA compliance:** Professional, craft-respecting, peer-level. No hype, no pressure tactics. The page speaks photographer-to-photographer, not vendor-to-customer.

## Product Designer Review Notes

**Layout rationale:**
- Calculator-in-hero pattern borrowed from SaaS pricing pages -- proven to increase engagement.
- Comparison section addresses the #1 objection (why switch from Pixieset/ShootProof).
- Information architecture follows the "Problem > Solution > Proof > Price > Trust > Convert" flow.

**Design system compliance:** All components use semantic tokens, shadcn/ui primitives, and Lucide icons. No custom fonts. No external dependencies added.

## Cultural Storyteller Review Notes

**Authenticity check:**
- No fake testimonials. No manufactured social proof. No "join hundreds of..." when we have zero.
- Founder story is honest about motivation and scale.
- "This isn't a VC-funded startup" is genuine and differentiating.
- Orphan Protocol section tells the truth about a real feature.

**Promise integrity:** Everything on this page is either built or in beta. No promises about AI features, no specific launch dates, no claims that can't be verified.

## Strategist Review Notes

**Beta alignment:**
- Page is designed for 5-15 founding photographers, not mass market.
- "Apply for the Beta" language creates appropriate exclusivity without false scarcity.
- Direct email to founder encourages the personal touch needed at this stage.
- Free 12-month offer is prominently displayed as the key incentive.

**Competitive positioning:**
- Comparison section directly addresses Pixieset/ShootProof model without naming them (avoids negativity).
- Orphan Protocol is a genuine differentiator no competitor can claim.
- Revenue model flip is the core strategic insight and it leads the page.

---

**End of Plan**
