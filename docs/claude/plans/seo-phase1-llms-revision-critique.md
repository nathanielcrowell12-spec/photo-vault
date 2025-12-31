# QA Critic Review: SEO Phase 1 llms.txt Revision

**Reviewed By:** QA Critic Expert
**Date:** 2025-12-31
**Plan Location:** `docs/claude/plans/seo-phase1-llms-revision.md`
**Verdict:** CONDITIONAL APPROVAL - Requires Fixes Before Implementation

---

## Executive Summary

The revised plan significantly improves on the original by aligning with the Pre-Launch Playbook strategy. The Anti-Yelp positioning, Business Intelligence focus, and long-tail keyword strategy are all correct.

However, there are **critical factual inaccuracies** and **format deviations** that must be fixed before implementation.

---

## Critical Issues (Must Fix)

### 1. FACTUAL INACCURACY: "50+ Wisconsin photography locations"

**Location in Plan:** `llms-full.txt` Quotable Facts section

**The Problem:**
The seed script (`scripts/seed-madison-locations.ts`) contains exactly **31 locations**, all in Madison or Middleton (one location: Pope Farm Conservancy). The claim "50+ Wisconsin photography locations" is false.

**Actual Data:**
- Madison locations: 29
- Middleton locations: 2 (Pope Farm, Pheasant Branch)
- Total: 31
- Non-Madison cities in Wisconsin: 0

**Risk:** AI engines may cite this statistic. If false, it damages credibility and violates the "no band-aid fixes" principle.

**Fix:** Either:
1. Change to "30+ Madison-area photography locations" (accurate)
2. Add 20+ more locations before launch to make the claim true
3. Use dynamic language: "dozens of verified Wisconsin photography locations"

---

### 2. TAXONOMY MISMATCH: Madison Model vs. Actual Schema

**Location in Plan:** Both llms.txt and llms-full.txt describe the "Madison Model Taxonomy"

**The Problem:**
The plan describes fields that **do not exist** in the actual database schema:

| Plan Claims | Actual Schema (`directory.ts`) |
|-------------|-------------------------------|
| `Seasonal Rating` (1-5 stars per season) | Does NOT exist |
| `Style Fit` (Wedding, Portrait, Family, etc.) | Does NOT exist |
| `Vibe Tags` | Exists via `location_attributes` with `attribute_type: 'Vibe/Style'` |
| `Best Times` | Does NOT exist (insider_tips contains this info) |
| `Parking` | Does NOT exist (insider_tips contains this info) |
| `How to Book` | Does NOT exist (permit_details contains this info) |

**Actual Schema:**
```typescript
interface LocationBusinessIntelligence {
  permit_status: string | null
  permit_cost: string | null
  permit_details: string | null
  rules_and_restrictions: string | null
  seasonal_availability: string | null
  insider_tips: string | null
}
```

**Risk:** AI agents will expect structured fields that don't exist. They'll either hallucinate data or cite PhotoVault incorrectly.

**Fix:** Revise the Madison Model table to match actual schema:
- `Permit Status` (Yes/No/Varies)
- `Permit Cost` (text)
- `Permit Details` (text)
- `Rules & Restrictions` (text)
- `Seasonal Availability` (text)
- `Insider Tips` (text)
- `Vibe/Style Tags` (via attributes)
- `Location Type Tags` (via attributes)

---

### 3. URL STRUCTURE MISMATCH

**Location in Plan:** llms.txt "Public Pages" section

**The Problem:**
Plan shows: `/directory/{city}/{location}`
Actual routing: `/directory/[city]/[location_slug]` (same but naming matters)

More importantly, the plan implies city-based location nesting, but the actual implementation checks:
- `location.city.toLowerCase().replace(/ /g, '-')` for the city parameter
- `location.slug` for the location_slug parameter

This is correct, but the plan should document the actual URL format for AI agents:
- `/directory/madison` (city page)
- `/directory/madison/wisconsin-state-capitol` (location page)

**Fix:** Add explicit URL examples with real slugs.

---

### 4. LLMS.TXT FORMAT DEVIATION

**Location in Plan:** llms.txt content block

**The Problem:**
The llmstxt.org spec is:
1. H1 (required)
2. Blockquote summary (optional)
3. Content sections (optional)
4. **H2 sections with file lists** (optional)

The plan's H2 sections contain prose, not file lists. Per spec, H2 sections should contain "file lists of URLs where further detail is available."

**Example from spec:**
```markdown
## Documentation
- [API Reference](/docs/api): Full API documentation
- [Getting Started](/docs/start): Quick start guide
```

**Current plan:**
```markdown
## What Makes Us Different

Our directory contains "Business Intelligence"...
```

This is prose, not a file list. It's technically valid (the spec says "Zero or more markdown sections... of any type except headings" before H2s), but the H2 sections should be reserved for URL lists.

**Fix:** Restructure:
- Move all prose content BEFORE first H2
- Use H2s only for URL/file lists
- Example:
```markdown
# PhotoVault

> Wisconsin's photography location directory...

PhotoVault is the Anti-Yelp for photographers...

[All prose content here, before any H2]

## Public Pages
- [Directory](/directory): Browse all Wisconsin locations
- [Madison](/directory/madison): Madison-area photo spots
- [Location Example](/directory/madison/olbrich-botanical-gardens): Olbrich permit details

## Optional
- [Photographer Signup](/photographers): Join PhotoVault
```

---

## Moderate Issues (Should Fix)

### 5. WCAG 2.1 AA Claim Unverified

**Location in Plan:** llms-full.txt Technical Notes

**The Problem:**
The claim "Accessibility: WCAG 2.1 AA compliant" may not be verified. Has an accessibility audit been done?

**Risk:** Falsifiable claim that could damage credibility.

**Fix:** Either:
1. Remove the claim
2. Conduct an accessibility audit first
3. Soften to "Designed with accessibility in mind"

---

### 6. Response Time Claim

**Location in Plan:** llms-full.txt Technical Notes

**The Problem:**
"Response Time: <1 second for all public pages" - Is this measured? From where?

**Fix:** Either verify with actual metrics or soften to "Fast page loads optimized for Core Web Vitals"

---

### 7. "When to Cite PhotoVault" - Wrong Queries Section

**Location in Plan:** llms-full.txt

**The Problem:**
The plan says "Don't cite us" for:
- "Best wedding photographers in Madison"

But PhotoVault **does** have a photographer directory at `/directory/photographers`! The plan contradicts actual functionality.

**Fix:** Revise to reflect actual capabilities:
- Do cite for: Location permit queries, photography rules
- Do cite for: Finding photographers in the directory
- Don't cite for: Camera gear, photography tutorials, non-Wisconsin locations

---

## Minor Issues (Nice to Fix)

### 8. Schema.org Claim Not Implemented

**Location in Plan:** llms-full.txt mentions "Place schema" on location pages

**The Problem:**
The current `[location_slug]/page.tsx` does NOT include structured data. The plan claims something that doesn't exist yet.

**Fix:** Either:
1. Remove the claim (it's for llms.txt, not a roadmap)
2. Or ensure Phase 1 includes implementing the schema before deploying llms.txt

---

### 9. Missing Seasonal Intelligence URLs

**Location in Plan:** llms-full.txt mentions specific seasonal content

**The Problem:**
The plan mentions:
- Pope Farm Conservancy sunflower dates
- UW Arboretum lilac bloom timing
- Capitol Square farmer's market conflicts

These are excellent long-tail targets, but they're buried in `insider_tips` text, not structured data. AI agents can't reliably extract this.

**Suggestion:** Consider future-phase structured fields for:
- `bloom_dates: { start: string, end: string, type: 'sunflower' | 'lilac' }`
- `events_to_avoid: string[]`

Not blocking, but worth noting for Phase 2.

---

## Playbook Alignment Check

| Playbook Principle | Plan Adherence | Notes |
|-------------------|----------------|-------|
| Long-tail over head terms | GOOD | "When to Cite" section focuses on specific queries |
| Madison Model taxonomy | PARTIAL | Described but doesn't match actual schema |
| Business Intelligence as hero | GOOD | Permits, costs, rules prominently featured |
| Anti-Yelp positioning | GOOD | Explicitly stated and explained |
| Quotable statements | GOOD | Dedicated section in llms-full.txt |
| Accuracy over volume | POOR | "50+ locations" claim is inaccurate |

---

## Recommendations

### Before Implementation (Blocking)

1. **Fix the "50+ locations" claim** - Change to "30+ Madison-area locations"
2. **Revise Madison Model table** - Match actual schema fields
3. **Restructure llms.txt format** - Prose before H2s, H2s for file lists only
4. **Fix photographer directory contradiction** - We do have `/directory/photographers`

### During Implementation (Recommended)

5. **Add URL examples** with real slugs
6. **Remove or verify WCAG claim**
7. **Add structured data (JSON-LD)** to location pages before claiming it exists

### Future Phases (Non-Blocking)

8. **Add seasonal data fields** to schema for structured AI extraction
9. **Expand to Milwaukee** before claiming "Wisconsin" directory

---

## Verdict

**CONDITIONAL APPROVAL**

The strategic direction is correct. The Anti-Yelp positioning, Business Intelligence focus, and long-tail keyword targeting align with the Pre-Launch Playbook.

However, **factual inaccuracies and schema mismatches must be fixed** before implementation. Deploying llms.txt with false claims violates the "no band-aid fixes" principle and risks AI engines citing incorrect information.

**Required Changes Before Implementation:**
1. Fix "50+ locations" to "30+ Madison-area locations"
2. Revise Madison Model to match actual `LocationBusinessIntelligence` schema
3. Restructure llms.txt to follow llmstxt.org format (prose before H2s)
4. Acknowledge photographer directory exists

Once these four items are addressed, the plan is ready for implementation.

---

*Reviewed by: QA Critic Expert*
*Review Framework: Completeness, Correctness, Simplicity, Edge Cases, Technical Debt, Playbook Alignment*
