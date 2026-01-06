# SEO Landing Page Conversion Plan

**Date:** 2026-01-06
**Author:** SEO & UI Expert
**Status:** APPROVED - User Decisions Finalized

---

## User Decisions (2026-01-06)

| Question | Decision |
|----------|----------|
| Conversion approach | **Refine** - Improve copy/design, make more PhotoVault-specific |
| Image hosting | **Download & self-host** - Better performance |
| Map fallback | **Static image** - If Leaflet fails to load |
| Cancellation page | **Minimal** - "Cancel at any time, six month grace period after cancellation" |
| Font | Keep **Inter** (project standard) |

---

## 1. Summary

### Problem
Google Search Console reports "Page with redirect" errors because:
- `src/app/page.tsx` currently redirects `/` to `/landing-page.html`
- This creates redirect chains: HTTP -> HTTPS -> www -> non-www -> /landing-page.html
- The sitemap lists `https://photovault.photo/` but that URL redirects
- Static HTML file in `/public` bypasses Next.js rendering and SEO optimizations

### Solution
Convert `public/landing-page.html` to a proper Next.js React component at `src/app/page.tsx`. This:
- Eliminates ALL redirects from the root URL
- Enables server-side rendering for better SEO
- Allows Next.js metadata API for proper SEO tags
- Integrates with existing global layout (navigation, footer, providers)
- Preserves all Stripe compliance requirements

### Scope
- Convert 444-line static HTML to React components
- Replace Tailwind CDN with project's Tailwind v4
- Replace Leaflet CDN with react-leaflet integration
- Integrate with existing shadcn/ui components
- Preserve all Stripe compliance requirements

---

## 2. Existing Code to Reference

### Pre-Implementation Investigation Results

**Searched for:** Similar landing/marketing page patterns in codebase
- `src/app/layout.tsx` - Root layout with Navigation/Footer components
- `src/components/navigation.tsx` - Existing Navigation and Footer components
- `src/app/globals.css` - Project's CSS with custom properties
- `src/components/ui/slider.tsx` - Existing Slider component for income calculator

**What already exists that should be extended:**
- Navigation component in `src/components/navigation.tsx` (lines 41-366)
- Footer component in `src/components/navigation.tsx` (lines 369-526)
- Slider component in `src/components/ui/slider.tsx`
- Card components in `src/components/ui/card.tsx`
- Button components in `src/components/ui/button.tsx`

**Potential duplication risk:**
- The landing page has its OWN header/footer with different styling than the app
- The landing header uses Material Icons; the app uses Lucide
- The landing footer has MORE Stripe compliance info than the app footer
- **Decision:** Create landing-specific header/footer components, NOT modify existing

---

## 3. Stripe Compliance Audit

The landing page contains critical Stripe-required elements that MUST be preserved:

### 3.1 Pricing Disclosure (REQUIRED)
| Element | Location (Line) | Requirement |
|---------|-----------------|-------------|
| Photographer Plan: $22/month | Lines 254-256 | Clear pricing display |
| Client pricing: $8/month | Lines 109, 123 | Mentioned in value proposition |
| "$50 upfront" mention | Lines 108-109 | First-year payment structure |

### 3.2 Contact Information (REQUIRED)
| Element | Location (Line) | Status |
|---------|-----------------|--------|
| Business Name | Line 308 | "PhotoVault LLC" |
| Physical Address | Lines 309-312 | "3639 Old Stage Road, Brooklyn, WI 53521" |
| Phone Number | Line 317 | "(608) 571-7532" with clickable tel: link |
| Email Address | Line 318 | "support@photovault.photo" with mailto: link |
| Support Hours | Line 319 | "Mon-Fri, 9am-6pm CST" |

### 3.3 Refund/Cancellation Policy (REQUIRED)
| Element | Location (Line) | Content |
|---------|-----------------|---------|
| Cancellation Policy Link | Line 344 | Links to /cancellation |
| Photographer Policy | Line 365 | "Cancel anytime. Billing stops immediately. 6-month grace period." |
| Client Policy | Line 366 | "6-month grace period to download photos after cancellation." |
| Billing Disputes | Line 367 | "Contact support within 60 days" |

**NOTE:** User specified 6-month grace period (not 90-day as in original HTML). Update footer content accordingly.

### 3.4 Legal Documents (REQUIRED)
| Element | Location (Line) | URL |
|---------|-----------------|-----|
| Privacy Policy | Line 342 | /privacy (EXISTS) |
| Terms of Service | Line 343 | /terms (EXISTS) |
| Cancellation Policy | Line 344 | /cancellation (DOES NOT EXIST) |

### 3.5 Payment Security Indicators
| Element | Location (Line) | Content |
|---------|-----------------|---------|
| Secure Payment Badge | Lines 347-350 | Lock icon + "Secure payments via Stripe" |
| Accepted Cards | Lines 353-357 | VISA, MC, AMEX, DISCOVER badges |

### 3.6 Preservation Strategy
All Stripe compliance elements will be:
1. Extracted into a dedicated `<LandingFooter>` component
2. Content preserved exactly as-is (no rewording)
3. Links verified to work before deployment
4. **ACTION REQUIRED:** Create `/cancellation` page before launch

---

## 4. Component Breakdown

### 4.1 Proposed Component Structure

```
src/
  app/
    page.tsx                    # Main landing page (replaces redirect)
    cancellation/
      page.tsx                  # NEW: Cancellation policy page
  components/
    landing/
      index.ts                  # Barrel export
      HeroSection.tsx           # Hero with income calculator
      HowItWorksSection.tsx     # Before/After comparison
      CommunitySection.tsx      # Community features + Map
      PricingSection.tsx        # Pricing cards + FAQ
      LocationMap.tsx           # Leaflet map component (client-only)
      IncomeCalculator.tsx      # Interactive slider component
      LandingHeader.tsx         # Landing-specific header (different from app nav)
      LandingFooter.tsx         # Stripe-compliant footer with all legal info
```

### 4.2 Component Details

#### HeroSection.tsx
- Main headline: "Your memories deserve better than a failing hard drive"
- Subheadline and Memory Insurance messaging
- Hard drive warning text
- Income Potential Calculator card
- Photographer portrait image
- Risk vs Solution comparison cards

#### IncomeCalculator.tsx (Client Component)
- Uses shadcn `Slider` component (already exists)
- State: `clientCount` (0-100, default 20)
- Calculation: `monthlyRevenue = clientCount * 4`
- CTA button linking to `/photographers/signup`

#### HowItWorksSection.tsx
- "Get Your Nights and Weekends Back" section
- Before/After comparison grid
- Testimonial avatars
- Feature checklist (Reloads, Releases, Renews, Forever)

#### CommunitySection.tsx
- "Stop Competing. Start Collaborating" section
- 4-card grid of community features
- 2 blockquote testimonials
- Location map container (30+ locations)

#### LocationMap.tsx (Client Component)
- Dynamic import with `ssr: false`
- Uses react-leaflet (needs installation)
- 30 Madison area location markers
- Custom orange marker icon
- Links to `/directory`

#### PricingSection.tsx
- "247 photographers" stat badge
- Photographer Plan pricing card ($22/month)
- FAQ accordion
- Final CTA section

#### LandingHeader.tsx
- Navy background (`#1a365d`)
- PhotoVault logo with camera icon
- Desktop nav: How It Works, Pricing, Community, Locations, Login
- Mobile hamburger menu
- CTA button: "Protect My Photos"

#### LandingFooter.tsx (STRIPE-CRITICAL)
- 4-column grid: Company Info, Quick Links, Legal & Security
- Full contact information block
- Cancellation & Refund Policy section
- Payment security badges
- Copyright and attribution

---

## 5. Dependency Analysis

### 5.1 Current Dependencies (Already Installed)
| Package | Version | Usage |
|---------|---------|-------|
| `@radix-ui/react-slider` | ^1.3.6 | Income calculator slider |
| `lucide-react` | ^0.544.0 | Icons (replacing Material Icons) |
| `tailwindcss` | ^4 | Styling (replaces CDN) |

### 5.2 New Dependencies Required
| Package | Version | Purpose |
|---------|---------|---------|
| `react-leaflet` | ^5.0.0 | React wrapper for Leaflet maps |
| `leaflet` | ^1.9.4 | Map library |
| `@types/leaflet` | ^1.9.12 | TypeScript definitions |

### 5.3 Font Changes
**Current HTML:** Uses Poppins from Google Fonts CDN
**Project Standard:** Uses Inter (already configured in layout.tsx)

**Decision:** Keep Inter font (project standard) - maintains consistency with the rest of the app.

### 5.4 Icon Migration
**Current HTML:** Material Icons Outlined (CDN)
**Project Standard:** Lucide React (already installed)

**Migration Map:**
| Material Icon | Lucide Icon |
|---------------|-------------|
| `photo_camera` | `Camera` |
| `menu` | `Menu` |
| `cancel` | `XCircle` |
| `check_circle` | `CheckCircle` |
| `check` | `Check` |
| `groups` | `Users` |
| `swap_horiz` | `ArrowLeftRight` |
| `school` | `GraduationCap` |
| `business_center` | `Briefcase` |
| `lock` | `Lock` |
| `explore` | `Compass` |

### 5.5 Color Migration
**HTML Colors -> Tailwind Classes:**

| HTML Color | Usage | Tailwind Equivalent |
|------------|-------|---------------------|
| `#1a365d` | Navy (header/headings) | Custom: `--landing-navy` |
| `#f59e0b` | Amber (CTA buttons) | `bg-amber-500` |
| `#374151` | Gray (body text) | `text-gray-700` |
| `#10b981` | Green (success) | `text-emerald-500` |
| `#ef4444` | Red (cancel/risk) | `text-red-500` |
| `#f9fafb` | Light gray (bg) | `bg-gray-50` |
| `#ecfdf5` | Mint (pricing bg) | `bg-emerald-50` |

---

## 6. Implementation Steps

### Phase 1: Setup & Dependencies (15 min)
1. Install react-leaflet dependencies:
   ```bash
   npm install react-leaflet leaflet @types/leaflet
   ```
2. Create `src/components/landing/` directory
3. Add landing-specific colors to `globals.css`

### Phase 2: Component Creation (2-3 hours)
4. Create `src/components/landing/index.ts` (barrel export)
5. Create `src/components/landing/IncomeCalculator.tsx`
6. Create `src/components/landing/LocationMap.tsx`
7. Create `src/components/landing/HeroSection.tsx`
8. Create `src/components/landing/HowItWorksSection.tsx`
9. Create `src/components/landing/CommunitySection.tsx`
10. Create `src/components/landing/PricingSection.tsx`
11. Create `src/components/landing/LandingHeader.tsx`
12. Create `src/components/landing/LandingFooter.tsx`

### Phase 3: Main Page Integration (30 min)
13. Replace `src/app/page.tsx` content:
    - Remove redirect
    - Import all landing components
    - Add page-specific metadata
    - Compose full page

### Phase 4: Layout Integration (30 min)
14. Update `src/app/layout.tsx`:
    - Add `/` to Navigation `hideOnPaths` array
    - Add `/` to Footer `hideOnPaths` array
15. Landing page uses its own header/footer

### Phase 5: SEO Metadata (15 min)
16. Create page-specific metadata in `src/app/page.tsx`
17. Add structured data (JSON-LD) for LocalBusiness schema

### Phase 6: Missing Page Creation (30 min)
18. **CRITICAL:** Create `src/app/cancellation/page.tsx`

### Phase 7: Cleanup (15 min)
19. Rename `public/landing-page.html` to `landing-page.html.backup`
20. Test all internal links

---

## 7. SEO Preservation

### 7.1 Page Metadata
```typescript
export const metadata: Metadata = {
  title: 'PhotoVault - Memory Insurance for Your Most Precious Photos',
  description: 'Professional-grade photo protection for families. Photographers earn passive income while families never lose another memory. $8/month.',
  keywords: 'photo storage, memory insurance, photographer income, photo backup, professional photos',
  openGraph: {
    type: 'website',
    title: 'PhotoVault - Memory Insurance for Your Most Precious Photos',
    description: 'Professional-grade photo protection. Photographers earn passive income.',
    url: 'https://photovault.photo',
    siteName: 'PhotoVault',
    images: [{ url: 'https://photovault.photo/images/og-landing.webp', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://photovault.photo',
  },
}
```

### 7.2 Structured Data
Add LocalBusiness JSON-LD for rich search results (using content from footer).

### 7.3 Sitemap
- `src/app/sitemap.ts` already lists `/` with priority 1
- No changes needed

---

## 8. Files to Create/Modify

### Files to CREATE:
| File | Purpose |
|------|---------|
| `src/components/landing/index.ts` | Barrel export |
| `src/components/landing/IncomeCalculator.tsx` | Slider calculator |
| `src/components/landing/LocationMap.tsx` | Leaflet map |
| `src/components/landing/HeroSection.tsx` | Hero content |
| `src/components/landing/HowItWorksSection.tsx` | Features section |
| `src/components/landing/CommunitySection.tsx` | Community + map |
| `src/components/landing/PricingSection.tsx` | Pricing + FAQ |
| `src/components/landing/LandingHeader.tsx` | Custom header |
| `src/components/landing/LandingFooter.tsx` | Stripe-compliant footer |
| `src/app/cancellation/page.tsx` | Cancellation policy page |

### Files to MODIFY:
| File | Change |
|------|--------|
| `src/app/page.tsx` | Replace redirect with component composition |
| `src/app/layout.tsx` | Add `/` to hideOnPaths arrays |
| `src/app/globals.css` | Add landing-specific custom properties |

### Files to ARCHIVE:
| File | Action |
|------|--------|
| `public/landing-page.html` | Rename to `.backup` |

---

## 9. Testing Checklist

### 9.1 Functional Testing
- [ ] Income calculator slider works (0-100 range)
- [ ] Map loads with all 30 location markers
- [ ] Mobile hamburger menu opens/closes
- [ ] All internal links work
- [ ] All anchor links scroll to sections

### 9.2 SEO Verification
- [ ] `curl -I https://photovault.photo` returns 200
- [ ] Page title in `<head>` matches metadata
- [ ] Open Graph tags present
- [ ] JSON-LD structured data present
- [ ] Canonical URL correct

### 9.3 Stripe Compliance Verification
- [ ] Business name visible in footer
- [ ] Full address visible
- [ ] Phone/email clickable
- [ ] All policy links work
- [ ] Payment security indicators visible

### 9.4 Performance
- [ ] Lighthouse SEO score > 90
- [ ] Map lazy-loads
- [ ] Images have alt text

---

## 10. Rollback Plan

### Immediate Rollback (< 5 minutes)
1. Revert `src/app/page.tsx` to redirect version
2. Restore `public/landing-page.html` from backup
3. Redeploy

### Files to Retain for 30 Days
- `public/landing-page.html.backup`

---

## 11. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Leaflet map fails to load | Medium | Low | Fallback to static image |
| Styling differs from original | High | Low | Side-by-side comparison |
| Missing cancellation page | High | High | **Must create before launch** |
| SEO ranking drop | Low | Medium | Monitor Search Console |

---

## 12. Timeline Estimate

| Phase | Duration |
|-------|----------|
| Phase 1: Setup | 15 min |
| Phase 2: Components | 2-3 hours |
| Phase 3-5: Integration | 1.25 hours |
| Phase 6: Cancellation Page | 30 min |
| Phase 7: Cleanup | 15 min |
| Testing | 1 hour |
| **Total** | **5-6 hours** |

---

## 13. User Decisions Summary

All questions resolved:

1. **Font Decision:** Keep Inter (project standard) ✅
2. **Image Hosting:** Download & self-host to `public/images/landing/` ✅
3. **Map Alternative:** Static image fallback if Leaflet fails ✅
4. **Cancellation Page:** Minimal - "Cancel at any time, six month grace period after cancellation" ✅
5. **Conversion Approach:** Refine copy/design to be more PhotoVault-specific ✅

---

## 14. Image Download Task

Download these Unsplash images to `public/images/landing/`:

| Current URL | New Path | Alt Text |
|-------------|----------|----------|
| Photographer portrait | `/images/landing/photographer-hero.jpg` | Professional photographer at work |
| Hero/feature images | `/images/landing/hero-*.jpg` | Various |
| Testimonial avatars | `/images/landing/avatar-*.jpg` | Customer photos |

---

## 15. Cancellation Page Content

**File:** `src/app/cancellation/page.tsx`

**Content:**
```
# Cancellation Policy

Cancel at any time. Six month grace period after cancellation.

## For Photographers
- Cancel your subscription anytime from your dashboard
- Billing stops immediately upon cancellation
- Your galleries remain accessible to clients for 6 months
- After grace period, galleries are archived

## For Clients
- Cancel your subscription anytime from your dashboard
- Billing stops immediately upon cancellation
- You have 6 months to download your photos
- After grace period, access is removed

## Questions?
Contact support@photovault.photo
```

---

**Status:** APPROVED - Ready for Implementation
