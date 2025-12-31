# Plan Critique: SEO/GEO Beta Launch Implementation

**Plan Reviewed:** `docs/claude/plans/seo-geo-beta-launch-plan.md`
**Skill Reference:** `Stone-Fence-Brain/VENTURES/PhotoVault/claude/skills/seo-skill.md`
**Date:** 2025-12-29

## Summary Verdict

**APPROVE WITH CONCERNS**

The plan is comprehensive and addresses the key SEO/GEO requirements for beta launch. It correctly identifies critical gaps (missing sitemap, wrong domain in robots.txt) and proposes sensible solutions. However, there are concerns around the llms.txt implementation deviating from the emerging standard, potential schema.org misuse, and missing investigation of existing code patterns.

---

## Critical Issues (Must Fix)

### 1. llms.txt Format Does Not Follow Emerging Standard

- **What's wrong:** The proposed `llms.txt` format is a prose document, but the [llmstxt.org](https://llmstxt.org/) specification calls for a specific structured format:
  1. H1 heading (required) - project name only
  2. Blockquote (optional) - brief summary
  3. Detailed content sections
  4. **File lists with H2-delimited sections containing URLs** - this is the key differentiator

  The plan's `llms.txt` reads like documentation, not the structured link-based format the standard defines. The standard expects `[name](url): description` format for curating important pages, not prose descriptions.

- **Why it matters:** AI crawlers looking for llms.txt may expect parseable URL lists, not free-form markdown. Following the wrong format defeats the purpose of adopting the standard early.

- **Suggested fix:** Restructure llms.txt to match the standard:
  ```markdown
  # PhotoVault

  > Professional photo gallery platform connecting photographers with clients for Memory Insurance.

  ## Public Pages
  - [Landing Page](https://photovault.photo/): Memory Insurance value proposition
  - [Photographer Landing](https://photovault.photo/photographers): B2B signup
  - [Directory](https://photovault.photo/directory): Wisconsin photography locations
  - [Privacy Policy](https://photovault.photo/privacy): Privacy terms
  - [Terms of Service](https://photovault.photo/terms): Service terms

  ## Optional
  - [llms-full.txt](https://photovault.photo/llms-full.txt): Extended context for AI agents
  ```

---

## Concerns (Should Address)

### 1. Schema.org LocalBusiness Used Incorrectly on Photographer Landing

- **What's wrong:** The existing `src/app/photographers/layout.tsx` already uses `LocalBusiness` schema for the photographer landing page. The plan proposes an `OrganizationSchema` component but doesn't address that `LocalBusiness` is semantically wrong for a software platform (LocalBusiness is for physical businesses like restaurants, shops).

- **Why it matters:** Google may ignore or downrank schema that doesn't match the page content. PhotoVault is a SaaS, not a local business with foot traffic.

- **Suggested fix:** The plan correctly proposes `SoftwareApplication` schema, but should explicitly state that `LocalBusiness` in `photographers/layout.tsx` needs to be replaced, not supplemented. Use `Organization` + `SoftwareApplication`, not `LocalBusiness`.

### 2. No "Existing Code to Reference" Section

- **What's wrong:** The QA Critic framework requires plans to document "what already exists that should be extended." While the plan mentions finding existing schema in layout.tsx and photographers/layout.tsx, it doesn't have a dedicated section documenting these patterns or explain how the new `StructuredData.tsx` component will relate to the existing inline JSON-LD.

- **Why it matters:** Without clear guidance, the implementer might:
  - Create duplicate schema (OrganizationSchema component + existing inline)
  - Miss updating existing files
  - Introduce inconsistent patterns

- **Suggested fix:** Add a section:
  ```markdown
  ## Existing Code to Reference

  | File | Current State | Action |
  |------|---------------|--------|
  | `src/app/layout.tsx` | Inline JSON-LD with WebSite+Service+FAQPage | UPDATE: Fix domain, consider extracting to component |
  | `src/app/photographers/layout.tsx` | Inline JSON-LD with LocalBusiness (incorrect) | UPDATE: Replace with Organization+SoftwareApplication |
  ```

### 3. AI Crawler Access Security Not Addressed

- **What's wrong:** The plan explicitly allows multiple AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, etc.) full access. There's no discussion of:
  - Rate limiting (the commented `Crawl-delay: 1` is not enforced)
  - Monitoring for abuse
  - Whether AI crawlers should access gallery pages (even public ones may have privacy implications)
  - Cost implications if AI crawlers hammer the site

- **Why it matters:** AI crawlers can be aggressive. Without rate limiting or monitoring, they could:
  - Drive up hosting/CDN costs
  - Slow down the site for real users
  - Index content that clients expect to be semi-private

- **Suggested fix:** Add a section on security considerations:
  1. Start with monitoring (Phase 6.2 mentions this but as "nice to have")
  2. Consider blocking AI crawlers from `/gallery/*` routes initially
  3. Add Cloudflare or similar rate limiting rules for bot user agents
  4. Make monitoring a "should do" not "nice to have"

---

## Minor Notes (Consider)

- **Pricing Discrepancy:** The plan's `SoftwareApplicationSchema` shows `price: "22.00"` but the `llms-full.txt` also mentions $22/month. However, `photographers/layout.tsx` currently shows `price: "40"`. These need to be reconciled.

- **Social Media Links:** Both existing schemas and proposed schemas reference Facebook/Instagram URLs that may not exist (`https://www.facebook.com/PhotoVault`). Verify these are real or remove them to avoid broken sameAs references.

- **llms-full.txt redundancy:** The plan creates both `llms.txt` and `llms-full.txt`, but the content overlap is significant. Per the standard, `llms-full.txt` is for the complete unabridged version, while `llms.txt` is the curated summary. The current proposal has `llms.txt` as detailed prose and `llms-full.txt` as even more prose - consider making `llms.txt` the link-based index and `llms-full.txt` the prose context.

- **Missing canonical on directory pages:** Plan mentions this but doesn't show the actual file locations or current state. The directory pages likely need investigation to see if `generateMetadata` is already implemented.

---

## Questions for the User

1. **Privacy vs. Discoverability:** Do you want AI engines to index and potentially quote from public gallery pages (`/gallery/{id}`)? These might surface in AI responses when users ask about PhotoVault galleries.

2. **Social Media:** Do the Facebook and Instagram URLs in the schema actually exist, or should they be removed?

3. **Rate Limiting:** Are you comfortable allowing unlimited AI crawler access, or should we implement rate limiting from day one?

---

## What the Plan Gets Right

- **Phased approach is sensible:** Critical fixes (sitemap, robots.txt domain) are correctly prioritized before schema enhancements. This is the right order for a beta launch.

- **Identified the real critical gaps:** Missing sitemap.xml and wrong domain are genuine blockers. Good catch that robots.txt references a non-existent sitemap.

- **Comprehensive AI bot coverage:** The robots.txt includes all major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Applebot-Extended, Google-Extended). This is forward-looking.

- **Domain standardization:** Correctly identified that `photovault.com` vs `photovault.photo` inconsistency needs fixing. The constants.ts approach is the right pattern.

- **Realistic time estimates:** 15-17 hours total seems accurate for the scope. Not over-promising.

- **Clear implementation checklist:** The must-do/should-do/nice-to-have prioritization is helpful for making beta launch decisions.

---

## Recommendation

**Proceed with implementation after addressing:**

1. **MUST FIX:** Reformat `llms.txt` to follow the llmstxt.org standard (URL-list format, not prose)

2. **SHOULD FIX:** Add explicit guidance on replacing `LocalBusiness` schema in photographers/layout.tsx

3. **SHOULD ADD:** Security/monitoring section for AI crawler access

4. **NICE TO HAVE:** Reconcile pricing inconsistencies in schema

The plan is solid for a beta launch. The phased approach is correct, and the critical issues are genuinely critical. With the llms.txt format fix, this plan can proceed to implementation.

---

**Verdict: APPROVE WITH CONCERNS**

**Top 3 Concerns:**
1. llms.txt format deviates from the emerging standard - needs restructuring
2. No explicit plan to fix incorrect LocalBusiness schema on photographer landing
3. AI crawler security/monitoring treated as afterthought rather than consideration

---

*Critique by QA Critic Expert*
*December 29, 2025*
