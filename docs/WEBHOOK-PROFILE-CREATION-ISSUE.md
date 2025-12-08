# Webhook User Profile Creation Failure - Technical Analysis

**Date:** December 2, 2025  
**Status:** ✅ **RESOLVED** (December 2, 2025)  
**Issue:** Webhook cannot create `user_profiles` records despite using service role client  
**Impact:** Auto-account creation flow partially broken - auth user created but profile fails  
**Resolution:** Added `SECURITY DEFINER` and `SET search_path = public, auth` to trigger function

---

## Executive Summary

When processing public checkout payments, the webhook successfully:
- ✅ Creates Supabase auth user via `supabase.auth.admin.createUser()`
- ✅ Generates temporary password
- ❌ **FAILS** to create `user_profiles` record with permission error
- ❌ Client record not linked to user (depends on profile existing)

The failure occurs even though we're using the service role client which should bypass RLS.

---

## What We're Trying To Do

### Flow
1. Client receives "gallery ready" email (photographer already has client email in `clients` table)
2. Client clicks link → sees gallery paywall (no login required)
3. Client pays via Stripe public checkout
4. Webhook processes payment:
   - Gets client email from `clients` table (via `gallery.client_id`)
   - Creates Supabase auth user with email + auto-generated temp password
   - **Creates `user_profiles` record** ← FAILING HERE
   - Links `clients.user_id` to new user
   - Sends welcome email with temp password

### Code Location
**File:** `src/app/api/webhooks/stripe/route.ts`  
**Function:** `handleCheckoutCompleted()`  
**Lines:** 239-289

---

## The Failure

### Error Message
```
permission denied for table users
Code: 42501
```

### When It Happens
The error occurs when trying to INSERT into `user_profiles` table:
```typescript
const { error: profileError } = await supabase
  .from('user_profiles')
  .insert({
    id: userId,
    full_name: customerName || '',
    user_type: 'client',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
```

### What Works
- ✅ Auth user creation: `supabase.auth.admin.createUser()` succeeds
- ✅ User ID returned: `newUser.user.id` is valid
- ✅ Payment processing continues (webhook doesn't fail)

### What Fails
- ❌ `user_profiles.insert()` fails with permission error
- ❌ Client linking fails (because profile doesn't exist)
- ❌ Welcome email may not be sent (depends on profile creation)

---

## Database Schema

### `user_profiles` Table
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'photographer', 'admin')),
  business_name VARCHAR(255),
  full_name VARCHAR(255),
  -- ... other columns ...
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Constraint:** `id` references `auth.users(id)` with `ON DELETE CASCADE`

### `clients` Table
```sql
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  -- ... other columns ...
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,  -- Added via migration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(photographer_id, email)
);
```

**Key Constraint:** `user_id` references `user_profiles(id)` with `ON DELETE SET NULL`

---

## What We've Tried

### Attempt 1: Direct Insert with Service Role Client
**Code:**
```typescript
const supabase = createServiceRoleClient() // Service role bypasses RLS

const { error: profileError } = await supabase
  .from('user_profiles')
  .insert({
    id: userId,
    full_name: customerName || '',
    user_type: 'client'
  })
```

**Result:** ❌ `permission denied for table users` (Code: 42501)

**Analysis:** Error message mentions "users" table, not "user_profiles". This suggests a trigger or foreign key constraint is trying to access `auth.users` table.

---

### Attempt 2: Check for Existing User First
**Code:**
```typescript
// Check if user exists in auth.users
const { data: authUsers } = await supabase.auth.admin.listUsers()
const existingAuthUser = authUsers.users.find(u => u.email === customerEmail.toLowerCase())
```

**Result:** ✅ Works - can list and find users

**Analysis:** Admin API works for reading, but insert still fails.

---

### Attempt 3: Remove Email Column from Insert
**Original Code:**
```typescript
.insert({
  id: userId,
  email: customerEmail.toLowerCase(),  // ← This column doesn't exist
  full_name: customerName || '',
  user_type: 'client'
})
```

**Fixed Code:**
```typescript
.insert({
  id: userId,
  full_name: customerName || '',
  user_type: 'client'
})
```

**Result:** ❌ Still fails with same permission error

**Analysis:** Not a column issue - the error persists.

---

### Attempt 4: Manual SQL Execution (Works!)
**Method:** Run SQL directly in Supabase SQL Editor

**SQL:**
```sql
INSERT INTO user_profiles (id, full_name, user_type, created_at, updated_at)
VALUES (
  '364d4cfb-13d5-4a57-a7db-826dd20c7ba5',
  'Farty McGee',
  'client',
  NOW(),
  NOW()
);
```

**Result:** ✅ **SUCCESS** - Profile created immediately

**Analysis:** SQL Editor has full database permissions. The issue is specific to the Supabase JS client, even with service role key.

---

### Attempt 5: Check RLS Policies
**Investigation:**
- Checked if RLS is enabled on `user_profiles`
- Service role should bypass RLS regardless

**Result:** RLS is enabled, but service role should bypass it.

---

### Attempt 6: Check for Triggers
**Investigation:**
- Found trigger: `trigger_link_client_to_user` on `user_profiles` AFTER INSERT
- Trigger function: `link_client_to_user_account()`
- This trigger tries to update `client_invitations` table
- `client_invitations` was missing `updated_at` column (fixed)

**Result:** Fixed `client_invitations.updated_at` issue, but profile insert still fails.

---

## Current Code Implementation

### Webhook Handler Setup
**File:** `src/app/api/webhooks/stripe/route.ts`

**Client Creation:**
```typescript
import { createServiceRoleClient } from '@/lib/supabase-server'

// In POST handler:
const supabase = createServiceRoleClient() // Service role bypasses RLS
```

**Service Role Client:**
**File:** `src/lib/supabase-server.ts`
```typescript
export function createServiceRoleClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
```

**Environment Variables:**
- `SUPABASE_SERVICE_ROLE_KEY` is set and valid
- Key starts with `eyJ...` (JWT format)
- Key has `service_role` in payload

---

### Profile Creation Code
**Location:** `src/app/api/webhooks/stripe/route.ts:274-288`

```typescript
// Create user_profiles record (user_profiles doesn't have email column)
const { error: profileError } = await supabase
  .from('user_profiles')
  .insert({
    id: userId,
    full_name: customerName || '',
    user_type: 'client',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

if (profileError) {
  console.error('[Webhook] Error creating user profile:', profileError)
  // Don't fail - profile might already exist or be created by trigger
}
```

**Error Details:**
```javascript
{
  message: "permission denied for table users",
  code: "42501",
  details: null,
  hint: null
}
```

---

## Database Triggers & Functions

### Trigger on `user_profiles`
**Name:** `trigger_link_client_to_user`  
**Event:** AFTER INSERT  
**Function:** `link_client_to_user_account()`

**Function Code:**
```sql
CREATE OR REPLACE FUNCTION link_client_to_user_account()
RETURNS TRIGGER AS $$
DECLARE
  v_client_record RECORD;
BEGIN
  -- Only process if user_type is 'client'
  IF NEW.user_type != 'client' THEN
    RETURN NEW;
  END IF;

  -- Find matching client record by email
  FOR v_client_record IN
    SELECT c.id, c.photographer_id, c.email
    FROM clients c
    INNER JOIN auth.users au ON au.email = c.email
    WHERE au.id = NEW.id
    AND c.user_id IS NULL
  LOOP
    -- Link client record to user account
    UPDATE clients
    SET user_id = NEW.id,
        updated_at = NOW()
    WHERE id = v_client_record.id;

    -- Update client_invitations
    UPDATE client_invitations
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE client_email = v_client_record.email
    AND photographer_id = v_client_record.photographer_id
    AND status = 'pending';
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Analysis:** This trigger accesses `auth.users` table via `INNER JOIN auth.users`. The permission error might be coming from this trigger execution, not the insert itself.

---

## RLS Policies

### `user_profiles` RLS Policies
```sql
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);
```

**Analysis:** These policies require `auth.uid() = id`, which means the authenticated user must match the profile ID. However, service role should bypass RLS entirely.

---

## Environment & Configuration

### Supabase Client Configuration
- **URL:** `https://gqmycgopitxpjkxzrnyv.supabase.co`
- **Service Role Key:** Set in `SUPABASE_SERVICE_ROLE_KEY`
- **Client Library:** `@supabase/supabase-js`
- **Version:** (check package.json)

### Webhook Context
- **Runtime:** Next.js API Route (server-side)
- **Environment:** Development (localhost:3002)
- **Stripe Webhook:** Forwarded via Stripe CLI
- **Webhook Secret:** Set in `STRIPE_WEBHOOK_SECRET`

---

## Test Cases & Results

### Test Case 1: First Payment (Natey McNateface)
- **Email:** `nathaniel.crowell12+testclient@gmail.com`
- **Auth User Created:** ✅ `b49ed546-a9e0-46d0-977d-f02ffc3ec19e`
- **Profile Created:** ❌ Failed (permission error)
- **Manual Fix:** ✅ Created via SQL Editor
- **Client Linked:** ✅ After manual profile creation

### Test Case 2: Second Payment (Farty McGee)
- **Email:** `nathaniel.crowell12+fartymcgee@gmail.com`
- **Auth User Created:** ✅ `364d4cfb-13d5-4a57-a7db-826dd20c7ba5`
- **Profile Created:** ❌ Failed (same permission error)
- **Manual Fix:** ⏳ Pending (SQL provided)

---

## Hypothesis

### Primary Hypothesis
The error "permission denied for table users" suggests that:
1. The trigger `link_client_to_user_account()` is executing
2. The trigger tries to JOIN `auth.users` table
3. Even with service role, the trigger execution context doesn't have permission to access `auth.users`
4. The error bubbles up and fails the INSERT

### Secondary Hypothesis
The RLS policy "Users can insert own profile" might be interfering, even though service role should bypass RLS. The policy checks `auth.uid() = id`, but in a trigger context, `auth.uid()` might be NULL or different.

---

## Potential Solutions

### Solution 1: Disable Trigger Temporarily
```sql
ALTER TABLE user_profiles DISABLE TRIGGER trigger_link_client_to_user;
-- Insert via webhook
ALTER TABLE user_profiles ENABLE TRIGGER trigger_link_client_to_user;
```
**Issue:** Can't disable triggers from webhook code easily.

### Solution 2: Use Database Function
Create a PostgreSQL function that webhook can call via RPC:
```sql
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_user_type TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, user_type)
  VALUES (p_user_id, p_full_name, p_user_type)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      user_type = EXCLUDED.user_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
**Benefit:** Function runs with definer's permissions (bypasses RLS).

### Solution 3: Fix Trigger Permissions
Modify trigger to use `SECURITY DEFINER` or check permissions:
```sql
CREATE OR REPLACE FUNCTION link_client_to_user_account()
RETURNS TRIGGER
SECURITY DEFINER  -- ← Add this
AS $$
-- ... function body ...
```

### Solution 4: Use Supabase Admin API
Check if there's an admin API method to create user profiles directly (unlikely, as profiles are custom tables).

### Solution 5: Create Profile Before Auth User
Not possible - `user_profiles.id` references `auth.users.id`, so auth user must exist first.

---

## Additional Context

### What Works in Other Parts of Codebase
- ✅ Reading from `user_profiles` with service role works
- ✅ Updating `user_profiles` with service role works (in other contexts)
- ✅ Creating auth users via `supabase.auth.admin.createUser()` works
- ✅ Manual SQL inserts work perfectly

### What's Unique About This Context
- Webhook is triggered by Stripe (external service)
- No user session/authentication context
- Must use service role for all operations
- Trigger fires automatically on INSERT

---

## Files Involved

1. **Webhook Handler:** `src/app/api/webhooks/stripe/route.ts`
   - Lines 181-289: `handleCheckoutCompleted()` function
   - Lines 274-288: Profile creation code

2. **Service Role Client:** `src/lib/supabase-server.ts`
   - Lines 42-49: `createServiceRoleClient()` function

3. **Database Schema:** `database/schema.sql`
   - Lines 6-28: `user_profiles` table definition
   - Lines 271-290: Triggers and functions

4. **Client Onboarding Schema:** `database/client-onboarding-schema.sql`
   - Lines 38-95: `link_client_to_user_account()` trigger function

---

## Error Logs

### Console Output (Expected)
```
[Webhook] Creating new user account for public checkout: nathaniel.crowell12+fartymcgee@gmail.com
[Webhook] Created new user account: 364d4cfb-13d5-4a57-a7db-826dd20c7ba5
[Webhook] Error creating user profile: [Error object with permission denied]
```

### Actual Error Object
```javascript
{
  message: "permission denied for table users",
  code: "42501",
  details: null,
  hint: null,
  // Additional Supabase client error properties
}
```

---

## Questions for Investigation

1. **Why does the error mention "users" table when inserting into "user_profiles"?**
   - Is a trigger accessing `auth.users`?
   - Is a foreign key constraint checking `auth.users`?

2. **Why does service role client work for SELECT/UPDATE but not INSERT?**
   - Is there a different permission model for INSERT operations?
   - Are triggers executed with different permissions?

3. **Why does manual SQL work but JS client doesn't?**
   - Does SQL Editor use a different connection method?
   - Are there connection-level permissions?

4. **Can we use `SECURITY DEFINER` on the trigger function?**
   - Would this allow the trigger to access `auth.users`?
   - Are there security implications?

---

## Recommended Next Steps

1. **Investigate trigger execution context**
   - Check if trigger is the source of permission error
   - Test with trigger temporarily disabled

2. **Try SECURITY DEFINER function**
   - Create RPC function with `SECURITY DEFINER`
   - Call from webhook instead of direct insert

3. **Check Supabase documentation**
   - Service role permissions for INSERT operations
   - Trigger execution permissions
   - `auth.users` table access from triggers

4. **Alternative: Create profile via separate API endpoint**
   - Webhook calls internal API endpoint
   - Endpoint uses service role to create profile
   - Might have different permission context

---

## Workaround (Current)

Until root cause is fixed, manually create profiles via SQL:
```sql
INSERT INTO user_profiles (id, full_name, user_type, created_at, updated_at)
VALUES (user_id, 'Name', 'client', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

UPDATE clients SET user_id = user_id WHERE email = 'client@email.com';
```

This works perfectly but requires manual intervention after each payment.

---

## Environment Details

- **Node.js Version:** v24.9.0 (from terminal output)
- **Supabase JS Version:** `@supabase/supabase-js@^2.74.0`
- **Supabase SSR:** `@supabase/ssr@^0.7.0`
- **Supabase Auth Helpers:** `@supabase/auth-helpers-nextjs@^0.10.0`
- **Next.js Version:** (check `package.json` - likely 14.x based on code patterns)
- **Database:** PostgreSQL (via Supabase)
- **Supabase Project:** `gqmycgopitxpjkxzrnyv`
- **Supabase URL:** `https://gqmycgopitxpjkxzrnyv.supabase.co`

---

## Code Snippets for Reference

### Complete Profile Creation Block
```typescript
// Lines 239-289 in src/app/api/webhooks/stripe/route.ts

// If no user exists and this is a public checkout, create account with temp password
if (!userId && isPublicCheckout === 'true') {
  console.log('[Webhook] Creating new user account for public checkout:', customerEmail)
  
  // Generate secure random password
  const crypto = await import('crypto')
  const randomBytes = crypto.randomBytes(12)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  tempPassword = Array.from(randomBytes)
    .map(byte => chars[byte % chars.length])
    .join('')
  
  // Create user with Supabase Admin API - THIS WORKS
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: customerEmail.toLowerCase(),
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: customerName || '',
      user_type: 'client'
    }
  })

  if (createError) {
    console.error('[Webhook] Error creating user:', createError)
    throw new Error(`Failed to create user account: ${createError.message}`)
  }

  if (!newUser.user) {
    throw new Error('User creation succeeded but no user returned')
  }

  userId = newUser.user.id
  console.log('[Webhook] Created new user account:', userId)

  // Create user_profiles record - THIS FAILS
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      full_name: customerName || '',
      user_type: 'client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (profileError) {
    console.error('[Webhook] Error creating user profile:', profileError)
    // Error: permission denied for table users (Code: 42501)
    // Don't fail - profile might already exist or be created by trigger
  }
}
```

### Service Role Client Creation
```typescript
// src/lib/supabase-server.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function createServiceRoleClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
```

---

## Test Results Summary

| Test | Auth User | Profile | Client Link | Email | Notes |
|------|-----------|---------|-------------|-------|-------|
| Payment 1 (Natey) | ✅ Created | ❌ Failed | ❌ Failed | ❓ Unknown | Fixed manually via SQL |
| Payment 2 (Farty) | ✅ Created | ❌ Failed | ❌ Failed | ❓ Unknown | Pending manual fix |

**Pattern:** Auth user creation always succeeds, profile creation always fails with same error.

---

## Key Observations

1. **Error is consistent:** Same error code (42501) and message for both test payments
2. **Auth API works:** `supabase.auth.admin.createUser()` has no issues
3. **Database client fails:** `supabase.from('user_profiles').insert()` fails
4. **Manual SQL works:** Direct SQL execution in Supabase dashboard succeeds
5. **Error mentions wrong table:** Says "users" but we're inserting into "user_profiles"
6. **Service role should work:** Service role key should bypass all RLS policies

---

## Suspected Root Cause

The error "permission denied for table users" when inserting into "user_profiles" strongly suggests:

**The trigger `link_client_to_user_account()` is executing and trying to access `auth.users` table, but the trigger execution context doesn't have permission to read from `auth.users`, even though the service role client should have full access.**

The trigger does this:
```sql
INNER JOIN auth.users au ON au.email = c.email
WHERE au.id = NEW.id
```

This JOIN operation might be failing in the trigger execution context, even though the service role has permission to insert into `user_profiles`.

---

---

## ✅ RESOLUTION (December 2, 2025)

### Root Cause Confirmed
The trigger function `link_client_to_user_account()` was trying to access `auth.users` table via `INNER JOIN`, but the trigger execution context didn't have permission to access the `auth` schema, even when called from a service role client.

### Solution Applied
Modified the trigger function to use `SECURITY DEFINER` and set the search path:

```sql
CREATE OR REPLACE FUNCTION link_client_to_user_account()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
-- ... function body ...
```

**Key Changes:**
1. Added `SECURITY DEFINER` - Function runs with the permissions of the function owner (database superuser), bypassing RLS
2. Added `SET search_path = public, auth` - Ensures the function can find tables in both schemas

### Verification
✅ Tested profile creation via webhook code path:
- Profile created successfully
- Client record automatically linked via trigger
- No permission errors

**Test Result:**
```
✅ Profile created successfully!
📋 Client record:
  User ID: 364d4cfb-13d5-4a57-a7db-826dd20c7ba5
  Linked: ✅ YES
```

### Files Updated
1. `database/client-onboarding-schema.sql` - Updated trigger function with `SECURITY DEFINER` and `SET search_path`
2. Schema applied to production database

### Next Steps
- ✅ Webhook can now create profiles automatically
- ✅ No manual intervention needed for new payments
- ✅ Full auto-account creation flow working end-to-end

---

*This document was generated on December 2, 2025. Last updated after resolution.*

