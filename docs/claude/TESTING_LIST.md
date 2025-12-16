# Testing List - Session December 14, 2025

Testing items accumulated during implementation. Run these tests together when ready.

---

## Story 2.4: Admin Dashboard Lists (COMPLETE)

### Photographers Page (`/admin/photographers`)
- [ ] Page loads without errors
- [ ] Stats cards show correct counts (Total, Active, Galleries, Revenue)
- [ ] Table displays all columns: Name, Email, Location, Galleries, Clients, Revenue, Status, Joined
- [ ] Search by name works (submit-on-enter)
- [ ] Pagination works (if >25 photographers)
- [ ] Refresh button works
- [ ] Loading state displays during fetch
- [ ] Empty state displays when no results
- [ ] Status badges show correct colors

### Clients Page (`/admin/clients`)
- [ ] Page loads without errors
- [ ] Stats cards show correct counts (Total, Active, Subscriptions, Total Spent)
- [ ] Table displays all columns: Name, Email, Galleries, Active Subs, Total Spent, Status, Joined
- [ ] Search by name works (submit-on-enter)
- [ ] Pagination works (if >25 clients)
- [ ] Refresh button works
- [ ] Loading state displays during fetch
- [ ] Empty state displays when no results
- [ ] Status badges show correct colors

### Admin Dashboard (`/admin/dashboard`)
- [ ] Photographers card appears with link
- [ ] Clients card appears with link
- [ ] Links navigate correctly

---

## Story 6.1: PostHog Foundation (IN PROGRESS)

### Setup Verification
- [ ] PostHog env vars in `.env.local` (NEXT_PUBLIC_POSTHOG_KEY, POSTHOG_API_KEY)
- [ ] No console errors related to PostHog
- [ ] PostHog loads without blocking page render

### Client-Side Tracking
- [ ] Visit any page → `$pageview` event in PostHog Live Events
- [ ] Page leave → `$pageleave` event in PostHog
- [ ] Autocapture working (button clicks, etc.)

### User Identification
- [ ] Login → user identified (not anonymous)
- [ ] User properties include: user_type, signup_date
- [ ] Logout → analytics reset (new anonymous ID)

### Server-Side Tracking
- [ ] Server events include `$source: 'server'` property
- [ ] Server tracking works from API routes

---

## Story 6.2: Core Event Tracking (PENDING)
*Will add testing items when implemented*

---

## Story 6.3: Friction & Warning Events (PENDING)
*Will add testing items when implemented*

---

## How to Test

1. Start dev server: `npm run dev -- -p 3002`
2. Open http://localhost:3002
3. Open PostHog dashboard → Live Events (or Activity tab)
4. Work through each checklist item
5. Mark completed with [x]

---

*Last updated: December 14, 2025*
