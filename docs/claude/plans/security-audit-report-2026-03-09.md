# PhotoVault Hub — Security Audit Report

**Date:** 2026-03-09
**Target:** PhotoVault Hub (photovault.photo)
**Risk Level:** HIGH
**Auditor:** Claude Security Review Skill (9-phase audit)

---

## Executive Summary

PhotoVault Hub has **strong foundational security** — proper middleware authentication, role-based access control, Stripe webhook signature validation, and extensive RLS policies. However, the audit identified **6 CRITICAL**, **8 HIGH**, and **7 MEDIUM** findings that need attention before the platform handles significant payment volume.

The most urgent issues are: hardcoded Supabase service role keys in source code, missing authentication on the invoice download and upload-prepare endpoints, duplicate webhook handler without idempotency, and 31 npm vulnerabilities (3 critical).

---

## Findings by Severity

### CRITICAL (6) — Fix Immediately

| # | Finding | Phase | Location | Impact |
|---|---------|-------|----------|--------|
| C1 | **Hardcoded SERVICE_ROLE key in source code** | Secrets | `src/lib/supabase.ts:18`, `src/lib/supabase-server.ts:7`, `src/app/api/test-supabase/route.ts:8` | Bypasses ALL RLS. Anyone cloning repo gets full DB access. |
| C2 | **Invoice download — no auth check** | Access Control | `src/app/api/client/invoice/[paymentId]/download/route.ts` | IDOR: any user can download any invoice by guessing payment ID. Exposes PII (names, emails, billing). |
| C3 | **Upload prepare — no auth check** | Access Control | `src/app/api/v1/upload/prepare/route.ts` | Anyone can create galleries impersonating any photographer. Takes `userId` from request body. |
| C4 | **Secondary webhook handler has no idempotency** | Stripe | `src/app/api/stripe/webhook/route.ts` | Duplicate webhook delivery = double commission payouts to photographers. |
| C5 | **Webhook trusts metadata for commission amounts** | Stripe | `src/app/api/stripe/webhook/route.ts:631-634` | `photographerPayoutCents` read from metadata, not re-calculated from DB at fulfillment time. |
| C6 | **3 tables missing RLS entirely** | Supabase | `payment_history`, `processed_webhook_events`, `webhook_logs` | Any authenticated user can read/write all payment history and webhook audit data. |

### HIGH (8) — Fix This Week

| # | Finding | Phase | Location | Impact |
|---|---------|-------|----------|--------|
| H1 | **No Content-Security-Policy header** | Headers | `next.config.ts` | No XSS protection via CSP. Script injection possible. |
| H2 | **Gallery metadata GET — missing authorization** | Access Control | `src/app/api/photographer/galleries/[id]/metadata/route.ts:78-109` | IDOR: any authenticated user can read any gallery's metadata (event details, locations, names). |
| H3 | **No rate limiting on auth endpoints** | Vibe-Coding | All auth routes | Brute-force attacks on login/reset are unthrottled. |
| H4 | **No CSRF protection** | Vibe-Coding | Entire codebase (0 matches for csrf/CSRF) | State-changing operations (password reset, payments) vulnerable to cross-site request forgery. |
| H5 | **31 npm vulnerabilities (3 critical, 23 high)** | Dependencies | `package.json` | `jspdf` (PDF injection/XSS), `fast-xml-parser` (DoS), `next` (DoS via Image Optimizer). |
| H6 | **Conversations endpoint fetches ALL auth users** | Access Control | `src/app/api/conversations/route.ts:74` | `auth.admin.listUsers()` returns every user in the system. Wasteful + info disclosure. |
| H7 | **Stripe Connect account not validated real-time** | Stripe | `src/app/api/stripe/gallery-checkout/route.ts:142-154` | Trusts DB `stripe_connect_status` instead of checking `account.capabilities.transfers` with Stripe API. |
| H8 | **Test/debug endpoints exposed in production** | Vibe-Coding | `/api/test-env`, `/api/test-supabase`, `/api/test-email`, `/api/debug/clients` | Listed as public routes in middleware. No NODE_ENV guard on API test routes. |

### MEDIUM (7) — Fix Soon

| # | Finding | Phase | Location | Impact |
|---|---------|-------|----------|--------|
| M1 | **No Permissions-Policy header** | Headers | `next.config.ts` | Browser features (camera, mic, geolocation) not explicitly disabled. |
| M2 | **Messages/Conversations use Authorization header instead of session** | Access Control | `src/app/api/messages/route.ts:22-28` | Inconsistent auth pattern, potential token leakage in logs. |
| M3 | **Admin routes have no defense-in-depth** | Access Control | All `/api/admin/*` routes | Rely 100% on middleware. No handler-level admin verification. |
| M4 | **JWT-based role checks instead of proper role grants** | Supabase | `database/add-payment-failure-tracking.sql:54-56` | Uses `auth.jwt() ->> 'role'` instead of `TO service_role` clause. |
| M5 | **Deprecated supabase.ts still in use** | Supabase | `src/lib/supabase.ts` | Legacy file with hardcoded keys still imported in some places. |
| M6 | **Puppeteer in production dependencies** | Dependencies | `package.json` | 300+ MB package with Chromium. Should be devDependency if not needed at runtime. |
| M7 | **Orphaned js-cookie dependency** | Dependencies | `package.json` | Installed but never imported. Adds attack surface. |

### LOW / INFO (5) — Improve When Convenient

| # | Finding | Phase | Location |
|---|---------|-------|----------|
| L1 | Family takeover endpoint allows account enumeration | Access Control | `/api/family/takeover` |
| L2 | `@types/*` packages in dependencies instead of devDependencies | Dependencies | `package.json` |
| L3 | Supabase anon key hardcoded as fallback (public key, low risk) | Secrets | `src/lib/supabase-browser.ts:4` |
| L4 | Hardcoded test password in scraping scripts | Secrets | `scripts/scrape-pixieset-info.js:156` |
| L5 | Supabase tokens in documentation files | Secrets | `VERCEL-ENV-SETUP.md:21-22` |

---

## Positive Security Controls

These are implemented correctly and deserve recognition:

- **Middleware authentication** — Comprehensive public/protected route separation with role-based access
- **Stripe webhook signature validation** — `constructEvent()` used properly in primary handler
- **Server-side amount determination** — Checkout prices calculated from DB, not client input
- **PCI compliance** — Uses Stripe.js/Elements, never handles raw card data
- **Commission rate hardcoded as constant** — Cannot be modified per-photographer
- **RLS-first database design** — Extensive policies on most tables
- **Service role isolation** — Used only in API routes (server-only), never in client components
- **CORS properly configured** — Whitelisted origins, not `Access-Control-Allow-Origin: *`
- **Error pages don't leak info** — Stack traces only shown in development
- **HSTS, X-Frame-Options, X-Content-Type-Options** — All properly set
- **No XSS vectors** — Zero instances of `dangerouslySetInnerHTML` or `innerHTML`
- **Cookie security** — Delegated to Supabase SSR (HttpOnly, Secure, SameSite)
- **`.env` files in .gitignore** — Properly excluded from version control

---

## Recommended Fix Priority

### Phase 1: This Week (Critical + High)

1. **Remove hardcoded keys** from `supabase.ts`, `supabase-server.ts`, `supabase-browser.ts`, `test-supabase/route.ts` — replace with `throw new Error('env var required')`
2. **Rotate Supabase keys** — generate new anon + service_role keys in Supabase dashboard
3. **Add auth to invoice download** — verify requesting user owns the payment
4. **Add auth to upload prepare** — validate bearer token from desktop app, not `userId` from body
5. **Add authorization to gallery metadata GET** — verify `gallery.photographer_id === user.id`
6. **Consolidate webhook handlers** — use the primary handler (has idempotency), delete secondary
7. **Re-calculate commission in webhook** — query DB at fulfillment, don't trust metadata
8. **Enable RLS on 3 tables** — `payment_history`, `processed_webhook_events`, `webhook_logs`
9. **Run `npm audit fix`** — resolves most of the 31 vulnerabilities
10. **Add CSP header** — configure in `next.config.ts`
11. **Guard test endpoints** — add `NODE_ENV === 'production'` check to `/api/test-*` routes

### Phase 2: Next Week (Medium)

12. **Add rate limiting** — use Upstash Ratelimit or similar on auth endpoints
13. **Add CSRF protection** — validate origin/referer on state-changing operations
14. **Fix conversations endpoint** — only fetch users who are conversation participants
15. **Add Stripe Connect real-time validation** — `stripe.accounts.retrieve()` before checkout
16. **Standardize messaging auth** — switch from Authorization header to session cookies
17. **Add handler-level admin checks** — defense-in-depth for admin API routes

### Phase 3: Cleanup

18. Remove orphaned `js-cookie` dependency
19. Move `puppeteer`, `@types/*`, `@tailwindcss/cli` to devDependencies
20. Complete migration from deprecated `supabase.ts`
21. Replace JWT role checks with proper `TO service_role` in SQL policies
22. Add Permissions-Policy header
23. Remove `nodemailer` if fully replaced by `resend`

---

## Attack Surface Summary

| Category | Count |
|----------|-------|
| Total API routes | 112 |
| Public (no auth) | 32 (28.6%) |
| Protected (auth required) | 80 (71.4%) |
| Third-party integrations | 6 (Stripe, Supabase, Resend, PostHog, Helm, Leaflet) |
| Database migrations | 70 SQL files |
| npm vulnerabilities | 31 (3 critical, 23 high, 4 moderate, 1 low) |
| Outdated packages | 41 |

---

*Report generated by Claude Security Review Skill — 9-phase audit covering: Reconnaissance, OWASP Top 10, Supabase RLS, Stripe Payments, Security Headers, Dependencies, Secrets Scan, Vibe-Coding Risks, and Infrastructure.*
