# CLAUDE.md - PhotoVault Hub

> Guide for AI assistants working on this codebase

## Project Overview

PhotoVault is a B2B2C SaaS platform for photographers to deliver and monetize client photo galleries with recurring subscription revenue.

**Business Model:**
- Photographers upload galleries and invite clients
- Clients subscribe ($10/month) to access their photos
- PhotoVault handles infrastructure, billing, and pays photographers 50% commission

**Tech Stack:**
- **Framework:** Next.js 15.5 with App Router
- **Language:** TypeScript 5 (strict mode)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui (new-york style)
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Auth:** Supabase Auth with multi-role system
- **Payments:** Stripe (subscriptions + Connect for payouts)
- **Email:** Resend API
- **Deployment:** Vercel

---

## Quick Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript type checking
npm run hygiene      # Full code hygiene check (lint + types + build)
npm run format       # Prettier formatting
npm run ci:gate      # Pre-commit checks (hygiene + prompt:verify + type-check)
```

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── admin/         # Admin-only endpoints
│   │   ├── client/        # Client-specific endpoints
│   │   ├── photographer/  # Photographer endpoints
│   │   ├── webhooks/      # Stripe webhooks
│   │   └── v1/            # Versioned API (upload endpoints)
│   ├── admin/             # Admin dashboard pages
│   ├── client/            # Client portal pages
│   ├── photographer/      # Photographer portal pages
│   ├── photographers/     # Public photographer pages
│   └── directory/         # Public directory pages
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── photovault/        # Custom PhotoVault components
│   ├── gallery/           # Gallery-specific components
│   └── directory/         # Directory components
├── contexts/              # React contexts (AuthContext, ViewContext)
├── hooks/                 # Custom React hooks
├── lib/
│   ├── server/            # Server-only services (admin, analytics)
│   ├── platforms/         # Platform integrations (Pixieset, etc.)
│   ├── email/             # Email templates and services
│   └── *.ts               # Shared utilities
├── types/                 # TypeScript type definitions
└── middleware.ts          # Auth & route protection

database/                  # SQL migration files
scripts/                   # Utility scripts (hygiene, sync, etc.)
```

---

## Key Conventions

### Supabase Client Usage

**IMPORTANT:** Use the correct Supabase client based on context:

```typescript
// Client-side (React components)
import { supabaseBrowser } from '@/lib/supabase-browser'

// Server-side (API routes, Server Components) - respects RLS
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Server-side - bypasses RLS (admin operations only)
import { createServiceRoleClient } from '@/lib/supabase-server'
```

**Never use** the deprecated `@/lib/supabase` export in new code.

### User Roles

Three user types with role-based access:
- `client` - Photo recipients, access `/client/*` routes
- `photographer` - Photo providers, access `/photographer/*` and `/photographers/*` routes
- `admin` - Platform administrators, access `/admin/*` routes

Middleware enforces role-based routing in `src/middleware.ts`.

### UI Components

- Use shadcn/ui components from `@/components/ui/*`
- Style: `new-york` variant with Tailwind CSS 4
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Icons: lucide-react

```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

### API Routes

- Use Next.js App Router conventions
- Return proper HTTP status codes
- Always validate user authentication via middleware or manual check
- Admin routes require `userType === 'admin'`

```typescript
// Example API route pattern
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... handler logic
}
```

---

## Database Schema

Key tables (see `database/schema.sql` for full schema):

| Table | Purpose |
|-------|---------|
| `user_profiles` | User data extending Supabase auth |
| `photographers` | Photographer business info |
| `clients` | Client records per photographer |
| `photo_galleries` | Gallery metadata |
| `photos` | Individual photo records |
| `client_payments` | Payment/subscription records |
| `commission_payments` | Photographer commission tracking |
| `platform_connections` | Third-party platform OAuth tokens |

**RLS is enabled** on all tables. Use service role client only when necessary.

---

## Environment Variables

Required in `.env.local`:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (required for payments)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=
STRIPE_CLIENT_MONTHLY_PRICE_ID=

# Email (required for notifications)
RESEND_API_KEY=
FROM_EMAIL=noreply@photovault.photo

# Site URL
NEXT_PUBLIC_SITE_URL=
SITE_URL=
```

See `env.example` for full list with descriptions.

---

## Common Patterns

### Stripe Integration

```typescript
import { getStripeClient, PHOTOGRAPHER_COMMISSION_RATE } from '@/lib/stripe'

// Lazy initialization - safe during build
const stripe = getStripeClient()

// Commission: 50/50 split
const commission = calculateCommission(amountInCents) // Returns photographer's share
```

### Email Sending

```typescript
import { EmailService } from '@/lib/email/email-service'

await EmailService.sendGalleryReadyEmail({
  clientEmail: 'client@example.com',
  clientName: 'John',
  galleryName: 'Wedding Photos',
  photographerName: 'Jane Studio',
  galleryUrl: 'https://...'
})
```

### Dynamic Route Params (Next.js 15)

```typescript
// Next.js 15 requires async params
export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // ...
}
```

---

## Testing

- Unit tests in `src/__tests__/`
- Run with standard test commands
- Commission service has dedicated tests: `src/__tests__/lib/server/commission-service.test.ts`

---

## Known Pitfalls

1. **Turbopack in production:** Don't use `--turbopack` flag in production builds
2. **Dynamic imports:** Some packages need `serverExternalPackages` in `next.config.ts`
3. **RLS bypass:** Only use `createServiceRoleClient()` when truly needed
4. **Stripe initialization:** Uses lazy loading to avoid build-time errors
5. **Route params:** Must be awaited in Next.js 15 dynamic routes

---

## Important Files

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Auth & route protection |
| `src/lib/stripe.ts` | Stripe config & utilities |
| `src/lib/supabase-server.ts` | Server-side Supabase clients |
| `src/lib/supabase-browser.ts` | Client-side Supabase client |
| `src/contexts/AuthContext.tsx` | Auth state management |
| `database/schema.sql` | Main database schema |
| `scripts/hygiene.mjs` | Code quality checks |

---

## Documentation

Additional documentation in project root:
- `STRIPE-SETUP-GUIDE.md` - Stripe configuration
- `DEPLOYMENT-CHECKLIST.md` - Production deployment
- `PROJECT_STATUS.md` - Feature completion tracking
- `COMMISSION-SYSTEM-IMPLEMENTATION.md` - Commission logic
- `EMAIL_SYSTEM_IMPLEMENTATION.md` - Email templates

---

## Development Workflow

1. **Before coding:** Run `npm run type-check` to verify types
2. **During development:** Use `npm run dev` with Turbopack
3. **Before committing:** Run `npm run ci:gate`
4. **Code style:** ESLint + Prettier (run `npm run format`)

### ESLint Rules

- `@typescript-eslint/no-explicit-any`: warn
- `react-hooks/rules-of-hooks`: error
- `prefer-const`: warn

---

## Security Notes

- Never commit `.env.local` - use `env.example` as template
- Service role key bypasses RLS - use sparingly
- Webhook routes (`/api/webhooks/*`) bypass auth intentionally
- Admin routes require explicit role check
