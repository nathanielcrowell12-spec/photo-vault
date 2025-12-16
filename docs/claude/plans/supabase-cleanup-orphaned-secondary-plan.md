# Supabase Cleanup Plan: Orphaned Secondary User Test Data

**Generated:** December 11, 2025
**Project:** PhotoVault Hub
**Task:** Clean up orphaned test data from failed secondary user invitation tests

---

## Executive Summary

This document provides a comprehensive cleanup plan for orphaned test data created during secondary user invitation flow testing. The test data involves:

- **Auth User:** `nathaniel.crowell12+secondaryuser@gmail.com`
- **Associated Records:** Entries in `secondaries`, `user_profiles`, and `auth.users` tables
- **Primary Account:** `randomperson12@gmail.com` (User ID: `a1b956e4-67ae-4516-9452-3b5a4d838f41`)

---

## MCP Server Status

**IMPORTANT:** The Supabase MCP server is **NOT currently configured** in this environment. Therefore, all cleanup operations must be performed manually through the Supabase Dashboard SQL Editor.

To configure the Supabase MCP in the future, run:
```bash
claude mcp add mcp-server-supabase
```

---

## Database Schema Overview

### Tables Involved

1. **auth.users** (Supabase Auth table)
   - Stores authentication credentials
   - Primary key: `id` (UUID)
   - Relevant columns: `email`, `email_confirmed_at`, `created_at`

2. **user_profiles** (Application table)
   - Extends auth.users with profile information
   - Primary key: `id` (UUID, references auth.users.id)
   - Relevant columns: `user_type` ('photographer' | 'client' | 'admin' | 'secondary'), `full_name`, `created_at`

3. **secondaries** (Family accounts feature table)
   - Tracks designated family members for account sharing
   - Primary key: `id` (UUID)
   - Foreign keys:
     - `account_id` (references user_profiles.id) - The primary account holder
     - `secondary_user_id` (references user_profiles.id) - The secondary user's account (if created)
   - Relevant columns: `email`, `name`, `relationship`, `status`, `invitation_token`, `invited_at`, `accepted_at`

---

## Investigation Phase

### Step 1: Query the `secondaries` Table

Run this query to find any records for the test email:

```sql
-- Find secondary invitation records for the test user
SELECT
  id,
  account_id,
  email,
  name,
  relationship,
  status,
  invitation_token,
  secondary_user_id,
  invited_at,
  accepted_at,
  created_at
FROM secondaries
WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%'
ORDER BY created_at DESC;
```

**Expected Results:**
- May show one or more records with `status = 'accepted'` or `status = 'pending'`
- `secondary_user_id` may be populated if account creation succeeded
- Note the `secondary_user_id` value if present - this is the auth user ID to delete

---

### Step 2: Query the `user_profiles` Table

Run this query to find any user profile for the secondary user:

```sql
-- Find user_profiles for the test email
-- First, let's check by finding the auth user
SELECT
  up.id,
  up.user_type,
  up.full_name,
  up.created_at,
  up.updated_at,
  au.email,
  au.email_confirmed_at,
  au.created_at as auth_created_at
FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
WHERE up.user_type = 'secondary'
  AND au.email ILIKE '%nathaniel.crowell12+secondaryuser%'
ORDER BY up.created_at DESC;
```

**Expected Results:**
- May show a record with `user_type = 'secondary'`
- The `id` column is the auth user ID (references `auth.users.id`)

---

### Step 3: Query `auth.users` Table

Run this query to find the auth user:

```sql
-- Find auth.users record for the test email
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%'
ORDER BY created_at DESC;
```

**Expected Results:**
- May show an auth user with the test email
- Note the `id` value - this is the user to delete

---

### Step 4: Check for Other Orphaned Data

Check if the secondary user has any galleries or other data:

```sql
-- Check for any galleries created by or owned by the secondary user
SELECT
  id,
  gallery_name,
  photographer_id,
  user_id,
  created_at
FROM photo_galleries
WHERE photographer_id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%'
)
OR user_id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%'
);
```

**Expected Results:**
- Should be empty (secondary users should not own galleries)
- If any galleries exist, they need to be handled separately

---

## Cleanup Phase

**CRITICAL:** Execute these queries in the exact order shown to avoid foreign key constraint violations.

### Deletion Order

1. Delete from `secondaries` (no foreign key dependencies)
2. Delete from `user_profiles` (references auth.users)
3. Delete from `auth.users` (referenced by user_profiles)

---

### Option 1: Soft Reset (Recommended for First Attempt)

If you want to re-test the invitation flow, you can reset the secondary record to `pending` status without deleting anything:

```sql
-- Reset the secondary invitation to pending status
UPDATE secondaries
SET
  status = 'pending',
  accepted_at = NULL,
  secondary_user_id = NULL,
  updated_at = NOW()
WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%'
RETURNING *;
```

Then delete the auth user and user_profile:

```sql
-- Step 1: Delete user_profiles record
DELETE FROM user_profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%'
)
RETURNING *;

-- Step 2: Delete auth.users record (using admin API or Supabase Dashboard)
-- This must be done through the Supabase Dashboard or Admin API
-- because RLS policies restrict direct DELETE on auth.users
```

**For Step 2 (auth.users deletion):**
Since you cannot directly DELETE from `auth.users` via SQL, use the Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/gqmycgopitxpjkxzrnyv/auth/users
2. Search for: `nathaniel.crowell12+secondaryuser@gmail.com`
3. Click the user row
4. Click "Delete User" button
5. Confirm deletion

---

### Option 2: Hard Delete (Complete Cleanup)

Use this option if you want to completely remove all traces and start fresh:

```sql
-- Step 1: Delete from secondaries table
DELETE FROM secondaries
WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%'
RETURNING *;

-- Step 2: Delete from user_profiles
DELETE FROM user_profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%'
)
RETURNING *;

-- Step 3: Delete from auth.users (use Supabase Dashboard - see instructions above)
```

---

## Verification Phase

After cleanup, verify all records are removed:

```sql
-- Verify secondaries table is clean
SELECT COUNT(*) as secondary_count
FROM secondaries
WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%';
-- Expected: 0

-- Verify user_profiles table is clean
SELECT COUNT(*) as profile_count
FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.id
WHERE au.email ILIKE '%nathaniel.crowell12+secondaryuser%';
-- Expected: 0

-- Verify auth.users table is clean
SELECT COUNT(*) as auth_count
FROM auth.users
WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%';
-- Expected: 0
```

---

## Re-Testing the Flow

After cleanup, you can re-test the secondary user invitation flow:

### Test Procedure

1. **As Primary User** (`randomperson12@gmail.com`):
   - Login to PhotoVault
   - Navigate to `/client/settings/family`
   - Click "Add Family Member"
   - Enter details:
     - Email: `nathaniel.crowell12+secondaryuser@gmail.com`
     - Name: Test Secondary User
     - Relationship: spouse (or any relationship)
   - Click "Send Invitation"

2. **Check Database**:
   ```sql
   -- Verify invitation was created
   SELECT
     email,
     name,
     relationship,
     status,
     invitation_token,
     created_at
   FROM secondaries
   WHERE email = 'nathaniel.crowell12+secondaryuser@gmail.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **Copy Invitation Link**:
   ```sql
   -- Get the invitation link
   SELECT
     CONCAT(
       'http://localhost:3002/family/accept?token=',
       invitation_token
     ) as invitation_link
   FROM secondaries
   WHERE email = 'nathaniel.crowell12+secondaryuser@gmail.com'
     AND status = 'pending'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

4. **As Secondary User**:
   - Open invitation link in incognito browser window
   - Accept the invitation
   - Check for "Account Created! Check your email to set your password." message
   - Check email for password reset link
   - Set password and login

5. **Verify Secondary User Access**:
   - After login, should redirect to `/family/galleries`
   - Should see shared galleries from primary account
   - Should NOT be able to access `/client/*` routes (except allowed family routes)

---

## Code Reference

The secondary user invitation flow is implemented in:

### API Routes

- **Create Invitation:** `src/app/api/family/secondaries/route.ts` (POST)
- **Accept Invitation:** `src/app/api/family/secondaries/accept/route.ts` (POST)
- **Validate Token:** `src/app/api/family/secondaries/accept/route.ts` (GET)

### Key Logic (Accept Flow)

From `src/app/api/family/secondaries/accept/route.ts` (lines 136-198):

1. Creates auth user with `auth.admin.createUser()`
2. Creates user_profile with `user_type: 'secondary'`
3. Sends password reset email via `auth.resetPasswordForEmail()`
4. Updates `secondaries` record:
   - `status = 'accepted'`
   - `accepted_at = NOW()`
   - `secondary_user_id = new_user_id`

### User Profile Structure

```typescript
{
  id: UUID,                  // References auth.users.id
  full_name: string,         // From invitation
  user_type: 'secondary',    // Fixed type for secondary users
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## Known Issues & Notes

### Issue 1: Email Service Configuration

The password reset email is sent via Supabase's built-in auth email service. If emails are not arriving:

1. Check Supabase email settings: https://supabase.com/dashboard/project/gqmycgopitxpjkxzrnyv/auth/templates
2. Verify SMTP configuration (if custom SMTP is enabled)
3. Check spam folder
4. Use Supabase's email logs to debug

### Issue 2: RLS Policies

Secondary users have specific RLS policies defined in `database/family-accounts-schema.sql` (lines 224-269):

- Can view their own secondary record
- Can view galleries where `is_family_shared = true` and they are an accepted secondary
- Cannot access primary account settings or billing

### Issue 3: Middleware Restrictions

Secondary users are restricted by middleware (`src/middleware.ts`):
- Allowed paths: `/family/*`, `/api/family/*`, `/gallery/*`, `/logout`
- Redirected to `/family/galleries` for all other routes

---

## Manual Intervention Required

Since the Supabase MCP is not configured, the following steps must be performed manually:

### 1. Execute SQL Queries

Use the Supabase Dashboard SQL Editor:
- URL: https://supabase.com/dashboard/project/gqmycgopitxpjkxzrnyv/sql/new
- Copy and paste queries from this document
- Execute one at a time
- Review results before proceeding to next query

### 2. Delete Auth Users

Use the Supabase Auth Dashboard:
- URL: https://supabase.com/dashboard/project/gqmycgopitxpjkxzrnyv/auth/users
- Search for test user email
- Manually delete via UI

### 3. Verify Results

After each deletion step:
- Run verification queries
- Check that counts are zero
- Ensure no orphaned foreign key references remain

---

## Future: MCP Configuration

To enable direct database operations through the Supabase MCP in future sessions:

### 1. Install MCP Server

```bash
# Add Supabase MCP server
claude mcp add mcp-server-supabase
```

### 2. Configure Credentials

The MCP will need:
- Project URL: `https://gqmycgopitxpjkxzrnyv.supabase.co`
- Service Role Key: (from `.env.local`)

### 3. Available MCP Operations

Once configured, you'll be able to:
- Query tables directly
- Execute DELETE/UPDATE operations with service role privileges
- Bypass RLS policies for admin operations
- Automate cleanup scripts

---

## Summary

### What Was Found

- **Secondaries Table:** May contain orphaned records with `status: 'accepted'` for test email
- **User Profiles Table:** May contain a `user_type: 'secondary'` record for test user
- **Auth Users Table:** May contain auth user for test email

### What Was Cleaned

Using the provided SQL queries:
1. Secondaries record (either reset to pending or deleted)
2. User profile record (deleted)
3. Auth user record (deleted via Supabase Dashboard)

### What Needs Manual Action

Since MCP is not configured:
1. Execute SQL queries in Supabase Dashboard SQL Editor
2. Delete auth user via Supabase Dashboard Auth UI
3. Verify cleanup with provided verification queries

### Next Steps

1. Execute investigation queries to find orphaned data
2. Choose cleanup option (soft reset or hard delete)
3. Execute cleanup queries in order
4. Delete auth user via Dashboard
5. Run verification queries
6. Re-test the secondary user invitation flow

---

## Support Information

### Supabase Project Details

- **Project ID:** gqmycgopitxpjkxzrnyv
- **Project URL:** https://gqmycgopitxpjkxzrnyv.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/gqmycgopitxpjkxzrnyv

### Test Account Details

- **Primary Account Email:** randomperson12@gmail.com
- **Primary Account User ID:** a1b956e4-67ae-4516-9452-3b5a4d838f41
- **Secondary Test Email:** nathaniel.crowell12+secondaryuser@gmail.com

### Related Documentation

- **Family Accounts Schema:** `database/family-accounts-schema.sql`
- **Family Accounts Spec:** `docs/FAMILY-ACCOUNTS-SPEC-V2.md`
- **Accept API Route:** `src/app/api/family/secondaries/accept/route.ts`

---

**Generated by:** Claude Code - Supabase Expert Agent
**Date:** December 11, 2025
**Status:** Ready for Manual Execution
