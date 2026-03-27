# Plan: PhotoVault vs Pixieset Comparison Page

**Date:** 2026-02-16
**Skill:** competitor-alternatives (Format 3: You vs Competitor)
**URL:** `/resources/photovault-vs-pixieset`
**Single file:** `src/app/resources/photovault-vs-pixieset/page.tsx`

---

## Goal

Build a comparison page targeting photographers searching "PhotoVault vs Pixieset", "Pixieset alternative", and related terms. The page should be honest, detailed, and genuinely help photographers decide which platform fits their business.

---

## Existing Code to Reference

- `src/app/resources/photo-storage-comparison/page.tsx` — Established pattern for comparison pages (metadata, structured data, breadcrumbs, section layout, CTAs, related resources)
- `src/app/resources/google-photos-alternatives/page.tsx` — TOC-driven content page pattern
- Components: `Card`, `CardContent`, `Button` from `@/components/ui/`, Lucide icons

---

## Page Structure

### SEO / Metadata

```
Title: "PhotoVault vs Pixieset 2026 | Honest Comparison for Photographers"
Description: "Detailed comparison of PhotoVault and Pixieset for professional photographers. Compare pricing, business models, features, and which platform fits your photography business."
Keywords: "PhotoVault vs Pixieset, Pixieset alternative, Pixieset vs PhotoVault, photo delivery platform comparison, photographer gallery platform"
Canonical: https://photovault.photo/resources/photovault-vs-pixieset
```

### Structured Data

- `BreadcrumbList` schema (Home > Resources > PhotoVault vs Pixieset)
- `Article` schema with datePublished/dateModified
- `FAQPage` schema for the FAQ section (captures rich snippets)

### Content Sections (in order)

#### 1. Breadcrumb Navigation
Standard breadcrumb matching existing pages.

#### 2. Hero / Title Section
- H1: "PhotoVault vs Pixieset: Which Platform Is Right for Your Photography Business?"
- Subtitle: Brief context — both are gallery delivery platforms but with fundamentally different business models
- Published date, estimated read time

#### 3. TL;DR Summary (Card)
Quick 3-4 sentence summary of the key difference: **Pixieset charges photographers more as they grow; PhotoVault's clients pay for storage and photographers earn 50% commission.** Pixieset is an all-in-one suite (galleries + website + CRM + store). PhotoVault is focused on delivery + passive income.

#### 4. Table of Contents (Card)
Links to each section below.

#### 5. At-a-Glance Comparison Table
Side-by-side table with rows:

| Category | PhotoVault | Pixieset |
|----------|-----------|----------|
| Business model | Client-pays, photographer earns commission | Photographer-pays subscription |
| Photographer cost | $22/month (flat) | $0-65/month (scales with storage/features) |
| Client cost | $8/month or $100 upfront | Free (photographer covers everything) |
| Revenue for photographer | 50% of client subscriptions | Print store markup only |
| Storage | Included in client plan | 3GB free, then tiered (10GB-unlimited) |
| Gallery delivery | Yes | Yes |
| Website builder | No | Yes |
| CRM / Contracts | No | Yes (Studio Manager) |
| Print store | No | Yes (WHCC, ProDPI, etc.) |
| Desktop upload app | Yes (large file support) | Lightroom plugin |
| Orphan protection | Yes (photos survive if photographer leaves) | No |

#### 6. The Business Model Difference (detailed section)
This is the core differentiation. Explain in prose:
- **Pixieset model:** Photographer pays Pixieset a monthly fee. Client gets galleries for free. Photographer bears all costs. As business grows (more storage needed), costs go up.
- **PhotoVault model:** Photographer pays $22/month flat. Client pays $8/month for permanent storage. Photographer earns $4/month per active client. More clients = more income, not more overhead.
- **Math example:** Photographer with 50 active clients:
  - Pixieset: Photographer pays ~$30-65/month, earns $0 from platform
  - PhotoVault: Photographer pays $22/month, earns $200/month ($4 x 50 clients) = net +$178/month

#### 7. Feature Comparison (detailed subsections)

**Gallery Delivery & Client Experience**
- Both offer clean, professional gallery interfaces
- Pixieset: Client favoriting, proofing, download PINs, password protection
- PhotoVault: Gallery viewing, permanent access, family sharing
- Honest take: Pixieset has more mature gallery features (proofing, favoriting). PhotoVault focuses on long-term access.

**Pricing & Cost Structure**
- Pixieset tiered pricing breakdown (Free through Ultimate/Suite)
- Hidden costs: 15% commission on free plan, payment processing fees
- PhotoVault flat pricing: $22/month photographer, $8/month client
- Total cost comparison at different business sizes

**All-in-One vs Focused**
- Pixieset Suite: galleries + website + CRM + contracts + invoicing + print store
- PhotoVault: gallery delivery + passive income (focused tool)
- Honest take: If you need website builder + CRM + print store in one place, Pixieset offers more. If you already have a website and want passive income from past work, PhotoVault is purpose-built.

**Data Portability & Photographer Lock-in**
- Pixieset: No bulk download/export tool (common complaint)
- PhotoVault: Desktop app for uploads, standard download for exports

**What Happens When You Leave**
- Pixieset: Galleries go dark when subscription ends
- PhotoVault: Orphan Protocol — client photos stay accessible even if photographer leaves platform

#### 8. Who PhotoVault Is Best For
- Photographers who want passive recurring revenue from completed work
- Photographers tired of platform costs scaling with success
- Wedding/portrait photographers with large back catalogs of past clients
- Photographers who already have a separate website (Squarespace, WordPress, etc.)
- Photographers who value client photo permanence

#### 9. Who Pixieset Is Best For (honest)
- Photographers who want an all-in-one platform (gallery + website + CRM + store)
- Photographers just starting out who need the free tier
- Photographers who rely heavily on print sales
- Photographers who want proofing and favoriting workflows
- Photographers who prefer Lightroom plugin upload

#### 10. Common Questions (FAQ with schema)
- "Can I use both?" — Yes, use Pixieset for CRM/contracts and PhotoVault for delivery + passive income
- "What does passive income mean for photographers?" — Explain the commission model
- "What happens to my client's photos if I stop using PhotoVault?" — Orphan Protocol
- "Does Pixieset offer any revenue sharing?" — No, print store markup is the only income
- "Is $22/month worth it if I'm just starting out?" — Honest answer about when it makes sense

#### 11. CTA Section
Centered card with:
- Headline: "Ready to earn from every photoshoot?"
- Subtext: Brief value prop
- Primary button: "Start Your PhotoVault Account" → `/photographers`
- Secondary button: "See Pricing Details" → `/terms`

#### 12. Related Resources
Grid of 3 cards linking to:
- Photo Storage Comparison 2026
- Google Photos Alternatives
- Photo Storage Guide

---

## Technical Implementation

### File Created
- `src/app/resources/photovault-vs-pixieset/page.tsx`

### Pattern
Follow the exact pattern from `photo-storage-comparison/page.tsx`:
- Next.js `Metadata` export with full OG/Twitter/canonical
- `BreadcrumbList` + `Article` JSON-LD as `<script>` in page
- Add `FAQPage` JSON-LD for the FAQ section
- Use `Card`, `CardContent`, `Button` from UI library
- Lucide icons for visual hierarchy
- Responsive grid layouts with `md:` breakpoints
- Standard color coding (green for pros, red/amber for cons)

### No Other Files Changed
This is a single new page. No layout changes, no navigation changes, no component creation needed.

---

## Content Principles

1. **Honest about PhotoVault's limitations** — No website builder, no CRM, no print store, newer platform
2. **Accurate about Pixieset** — Don't misrepresent their features or pricing
3. **Lead with the business model difference** — This is the unique angle no competitor page will have
4. **Include specific numbers** — $4/month per client, $200/month at 50 clients, etc.
5. **Acknowledge Pixieset strengths** — All-in-one, mature product, generous free tier
6. **Target the right photographer** — Don't pretend PhotoVault is for everyone

---

## SEO Strategy

- Primary: "PhotoVault vs Pixieset" / "Pixieset vs PhotoVault"
- Secondary: "Pixieset alternative" / "alternative to Pixieset"
- Long-tail: "Pixieset alternative with passive income" / "photo delivery platform that pays photographers"
- FAQ schema for rich snippet capture
- Internal links to/from existing resources pages

---

## Testing Plan

- TypeScript compilation (`npm run build`)
- Visual verification in browser at localhost:3002/resources/photovault-vs-pixieset
- Check all internal links work
- Validate structured data with Google Rich Results Test
- Responsive check (mobile/tablet/desktop)
