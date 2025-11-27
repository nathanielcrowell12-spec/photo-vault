# PhotoVault Hub - Claude Code Context

**Last Updated:** November 26, 2025 (Stripe Setup Complete)
**Project:** PhotoVault Hub - Professional Photo Gallery Platform
**Status:** Active Development

---

## Quick Context

PhotoVault is a SaaS platform for professional photographers to:
1. Deliver photos to clients via beautiful galleries
2. Earn recurring revenue through client subscriptions
3. Build long-term client relationships

**Business Model:**
- Year 1: Client pays $100 upfront (or $50 for 6-month package)
  - Photographer earns: $50 commission (or $25 for 6-month)
  - PhotoVault keeps: $50 (or $25)
- Year 2+: Client pays $8/month ongoing
  - Photographer earns: $4/month passive income
  - PhotoVault keeps: $4/month

---

## Current Architecture

```
photovault-hub/                 # Next.js 15 App Router
├── src/
│   ├── app/                    # App router pages
│   │   ├── api/               # API routes
│   │   │   ├── stripe/        # Stripe checkout & connect
│   │   │   └── webhooks/      # Stripe webhooks
│   │   ├── photographer/      # Photographer portal
│   │   ├── client/            # Client portal
│   │   ├── admin/             # Admin dashboard
│   │   └── gallery/           # Public gallery pages
│   ├── components/            # React components
│   ├── contexts/              # React contexts (AuthContext)
│   ├── lib/                   # Utilities
│   │   ├── stripe.ts         # Stripe configuration (50% commission)
│   │   ├── email/            # Email templates
│   │   └── supabase/         # Supabase clients
│   └── middleware.ts          # Auth & route protection
├── public/
│   └── landing-page.html      # Static landing page
└── database/                   # SQL schemas
```

---

## Critical Configuration

### Stripe Integration
- **File:** `src/lib/stripe.ts`
- **Commission Rate:** `PHOTOGRAPHER_COMMISSION_RATE = 0.50` (50%)
- **Client Pricing:**
  - Year 1: `$100` (10000 cents) or `$50` for 6-month (5000 cents)
  - Year 2+: `$8/month` (800 cents)
- **API Version:** `2025-09-30.clover`

### Authentication
- **Provider:** Supabase Auth
- **Middleware:** `src/middleware.ts`
- **User Types:** `photographer`, `client`, `admin`

### Homepage Flow
- `/` redirects to `/landing-page.html` (static file)
- Landing page has links to `/login` and `/photographers/signup`
- Unauthenticated users on protected routes go to `/login`

---

## Key Files to Know

| Purpose | File |
|---------|------|
| Homepage redirect | `src/app/page.tsx` |
| Stripe config | `src/lib/stripe.ts` |
| Webhook handler | `src/app/api/webhooks/stripe/route.ts` |
| Auth middleware | `src/middleware.ts` |
| Login page | `src/app/login/page.tsx` |
| Photographer dashboard | `src/app/photographer/dashboard/page.tsx` |
| Client dashboard | `src/app/client/dashboard/page.tsx` |
| Landing page | `public/landing-page.html` |

---

## Public Routes (No Auth Required)

From `src/middleware.ts`:
```typescript
const publicRoutes = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/financial-model',
  '/application',
  '/download-desktop-app',
  '/signup',
  '/auth/signup',
  '/photographers/signup',
  '/auth/desktop-callback',
  '/connect',
  '/logout',
]
```

**Note:** Static files (`.html`, `.png`, `.jpg`, etc.) bypass middleware automatically.

---

## Database Schema (Core Tables)

- `user_profiles` - User type and metadata
- `clients` - Client records for photographers
- `galleries` / `photo_galleries` - Photo collections
- `photos` - Individual photos
- `subscriptions` - Client subscription status
- `commissions` - Photographer earnings
- `payment_history` - Payment records

---

## Development Commands

```bash
cd "C:\Users\natha\.cursor\Photo Vault\photovault-hub"
npm run dev          # Start dev server (usually port 3002)
npm run build        # Production build
npm run type-check   # TypeScript validation
```

---

## Recent Changes (Nov 2025)

### Stripe Integration (by Cursor, updated Nov 26)
- 50% commission rate
- Updated to $100/$50 Year 1 + $8/month Year 2+ pricing model
- Checkout session API endpoint
- Webhook handler with email notifications
- Commission calculation service

### Homepage Fix (Nov 26)
- Fixed redirect from `/landing-page` to `/landing-page.html`
- Landing page now accessible to unauthenticated users

### Dashboard Redesign (Nov 23)
- Modern dark theme with glassmorphism
- Custom navigation for photographer dashboard
- Mobile responsive bottom nav

---

## Known Issues

1. **Multiple GoTrueClient Instances** - Console warning, low impact
2. **Some photos missing `photo_url`** - Fallback to `thumbnail_url` implemented

---

## Stripe Setup Status

| Component | Status |
|-----------|--------|
| Code Implementation | ✅ Complete |
| Stripe Account Setup | ✅ Complete (Sandbox) |
| API Keys Configuration | ✅ Complete |
| Webhook Configuration | ✅ Complete |
| Stripe Connect (Express) | ✅ Complete |
| UI Components | ✅ Complete |

### Stripe Product Configuration
- **Product:** Client Gallery Subscription (`prod_TUvIAG3NEbbcBU`)
- **$100 one-time price (Year 1):** `price_1SXvU48jZm4oWQdn5lNwjXqH`
- **$8/month recurring (Year 2+):** `price_1SXvS38jZm4oWQdnMvTxZWrw`

### Stripe Connect
- **Account Type:** Express (Stripe-hosted onboarding)
- **Capabilities:** card_payments, transfers
- **Payout Schedule:** Manual (platform controls 14-day delay per commission rules)

### Brand Colors for Stripe
- **Primary (Gold):** `#f59e0b`
- **Secondary (Navy):** `#1a365d`

---

## Billing Modes (Future Feature)

PhotoVault will support two billing modes for photographers:

### Mode 1: Storage Only (Current)
- Photographer invoices clients separately for photoshoots (their existing system)
- PhotoVault only bills the $100 Year 1 / $8 month Year 2+ storage fee
- Simple, works with photographers who already have invoicing set up

### Mode 2: All-in-One Billing (Planned)
- Photographer sets their session price in PhotoVault (e.g., $2,500)
- PhotoVault adds the $100 storage fee automatically
- Client pays one invoice, Stripe splits payment automatically
- Requires: Dynamic pricing UI, custom checkout, destination charges

---

## BMad Protocol

This project uses BMad Method for structured development:
- Commands: `.claude/commands/BMad/`
- Tasks: Create stories, execute checklists
- Agents: Dev, QA, Architect, etc.

---

## Environment Variables

Required in Vercel/`.env.local`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CLIENT_YEAR1_PRICE_ID=price_...      # $100 one-time
STRIPE_CLIENT_MONTHLY_PRICE_ID=price_...    # $8/month recurring

# Site URL
NEXT_PUBLIC_SITE_URL=https://photovault.photo
```

**Note:** `STRIPE_CONNECT_CLIENT_ID` is NOT needed for Express accounts (uses Account Links instead of OAuth).

---

## Code Standards

- TypeScript strict mode
- shadcn/ui components
- Tailwind CSS v4
- Next.js App Router patterns
- Supabase for auth and database
- Proper error handling with type guards

See `.cursorrules` for detailed coding standards.
