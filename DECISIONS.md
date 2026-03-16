# PhotoVault — Resolved Decisions

**Purpose:** Pre-answers to recurring questions so Claude doesn't re-ask. Update this when decisions change.

---

## Pricing & Business Model

| Decision | Answer | Date |
|----------|--------|------|
| Photographer subscription rate | $22/month standard, free during beta (coupon PHOTOVAULT_BETA_2026) | 2026-02 |
| Grandfathered rate | Founding photographers get free access during beta; post-beta they pay $22/month (no permanent discount unless explicitly changed) | 2026-02 |
| Client gallery pricing | 3 tiers: $59 (6mo), $100 (1yr), $149 (2yr) — photographer sets which to offer | 2026-03 |
| Commission split | 50% to photographer on all client payments | 2025 |
| Beta code approach | Hard-coded `PHOTOVAULT_BETA_2026` coupon in Stripe, NOT an env var | 2026-02 |

## Infrastructure & Architecture

| Decision | Answer | Date |
|----------|--------|------|
| Rate limiting | Vercel Edge-based (no Redis/Upstash needed for now) | 2026-03 |
| CSRF protection | Not implemented yet — Next.js CSRF via origin checking in middleware is sufficient for now | 2026-03 |
| Email tracking/metrics | Resend dashboard only — no custom DB table for open/click tracking | 2026-02 |
| Vercel plan | Pro plan | 2026-02 |
| Reply-to email | noreply — no reply inbox set up | 2026-02 |

## Client Behavior

| Decision | Answer | Date |
|----------|--------|------|
| Client re-enrollment in drip emails | Let first sequence finish — no second parallel sequence | 2026-02 |
| Beta end messaging | Hard-code beta messaging; manually update templates when beta ends (no env var toggle) | 2026-02 |

## Signup Paths

| Decision | Answer | Date |
|----------|--------|------|
| `/auth/signup` | General signup page with photographer/client type selector. Used on homepage, header, footer — for cold visitors who haven't self-identified yet. | 2026-03 |
| `/photographers/signup` | Direct photographer registration (business name, full name, email, phone, password). Used on /photographers page, /pricing, /features, /how-it-works, /resources — for visitors who already self-identified as photographers. | 2026-03 |
| Routing logic | Do NOT consolidate. Both paths are intentional. Homepage traffic may be either type; /photographers traffic is already qualified. | 2026-03 |

## Development Workflow

| Decision | Answer | Date |
|----------|--------|------|
| Commit behavior | NEVER auto-commit. Always ask. This is intentional. | 2025-12 |
| Push behavior | NEVER auto-push. Commit and push are separate permissions. | 2026-01 |
| UI changes | Always use full skill/expert workflow, even for "fixes" | 2026-01 |
| Permission mode | acceptEdits (all sessions) | 2026-02 |

---

*Update this file when you make a new product/architecture decision. Claude reads it to avoid re-asking.*
