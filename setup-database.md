# Database Setup Instructions

## ✅ Environment Variables Configured!

Your `.env.local` file has been created with Supabase credentials.

---

## Next Step: Run Database Schema

You need to run the SQL schema in your Supabase project to create all the tables.

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to:** https://supabase.com/dashboard
2. **Click on:** Your `photovault-1` project
3. **Go to:** SQL Editor (in left sidebar)
4. **Click:** "+ New Query"
5. **Copy the entire contents** of `database/schema.sql`
6. **Paste** into the SQL editor
7. **Click:** "Run" (or press Ctrl+Enter)
8. **Wait:** for success message

This will create all tables, indexes, and security policies.

### Option 2: Via Supabase CLI (Advanced)

If you have Supabase CLI installed:
```bash
supabase db push
```

---

## After Running the Schema

Once the database is set up, restart your dev server:

```powershell
# Stop current server (Ctrl+C if running)
# Then restart:
npm run dev
```

Authentication and all features will then be fully functional!

---

## What the Schema Creates:

- ✅ `user_profiles` - User accounts (clients, photographers, admins)
- ✅ `photographers` - Photographer business profiles
- ✅ `clients` - Client accounts linked to photographers
- ✅ `photo_galleries` - Gallery management
- ✅ `photos` - Individual photo records
- ✅ `payment_options` - Payment plan definitions
- ✅ `client_payments` - Payment tracking
- ✅ `photo_sessions` - Session booking records
- ✅ `commission_payments` - Commission tracking
- ✅ `platform_connections` - External platform integrations
- ✅ `memory_refresh_events` - Memory feature (Phase 3)
- ✅ `client_invitations` - Photographer client invites

Plus indexes, Row Level Security policies, and triggers!

---

## Let me know when you've run the schema!

I'll then:
1. Set up Storage buckets
2. Test authentication
3. Verify everything works
4. Make all features live! 🚀

