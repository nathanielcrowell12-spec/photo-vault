-- ============================================================================
-- CLEANUP SCRIPT: Orphaned Secondary User Test Data
-- ============================================================================
-- Project: PhotoVault Hub
-- Purpose: Clean up test data for nathaniel.crowell12+secondaryuser@gmail.com
-- Generated: December 11, 2025
--
-- IMPORTANT: Execute these queries in the exact order shown
-- IMPORTANT: Review results of investigation queries before running cleanup
-- ============================================================================

-- ============================================================================
-- PHASE 1: INVESTIGATION
-- ============================================================================

-- Query 1: Find secondary invitation records
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

-- Query 2: Find user_profiles records
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

-- Query 3: Find auth.users records
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%'
ORDER BY created_at DESC;

-- Query 4: Check for any associated galleries (should be empty)
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

-- ============================================================================
-- PHASE 2: CLEANUP - OPTION 1 (SOFT RESET)
-- Use this if you want to re-test the invitation flow
-- ============================================================================

-- Step 1: Reset secondary invitation to pending
UPDATE secondaries
SET
  status = 'pending',
  accepted_at = NULL,
  secondary_user_id = NULL,
  updated_at = NOW()
WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%'
RETURNING *;

-- Step 2: Delete user_profiles record
DELETE FROM user_profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%'
)
RETURNING *;

-- Step 3: Delete auth.users record
-- IMPORTANT: This cannot be done via SQL - use Supabase Dashboard
-- 1. Go to: https://supabase.com/dashboard/project/gqmycgopitxpjkxzrnyv/auth/users
-- 2. Search for: nathaniel.crowell12+secondaryuser@gmail.com
-- 3. Click the user row and select "Delete User"

-- ============================================================================
-- PHASE 2: CLEANUP - OPTION 2 (HARD DELETE)
-- Use this for complete cleanup (removes invitation record too)
-- ============================================================================

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

-- Step 3: Delete from auth.users
-- IMPORTANT: This cannot be done via SQL - use Supabase Dashboard
-- 1. Go to: https://supabase.com/dashboard/project/gqmycgopitxpjkxzrnyv/auth/users
-- 2. Search for: nathaniel.crowell12+secondaryuser@gmail.com
-- 3. Click the user row and select "Delete User"

-- ============================================================================
-- PHASE 3: VERIFICATION
-- ============================================================================

-- Verify secondaries table is clean
SELECT COUNT(*) as secondary_count
FROM secondaries
WHERE email ILIKE '%nathaniel.crowell12+secondaryuser%';
-- Expected: 0 (hard delete) or 1 with status='pending' (soft reset)

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

-- ============================================================================
-- PHASE 4: RE-TESTING HELPERS
-- ============================================================================

-- After re-creating the invitation, use these queries to help with testing

-- Get the invitation link
SELECT
  CONCAT(
    'http://localhost:3002/family/accept?token=',
    invitation_token
  ) as invitation_link,
  email,
  name,
  relationship,
  status,
  created_at
FROM secondaries
WHERE email = 'nathaniel.crowell12+secondaryuser@gmail.com'
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 1;

-- Check invitation acceptance status
SELECT
  email,
  name,
  relationship,
  status,
  secondary_user_id,
  invited_at,
  accepted_at
FROM secondaries
WHERE email = 'nathaniel.crowell12+secondaryuser@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- Verify secondary user account was created
SELECT
  up.id,
  up.user_type,
  up.full_name,
  au.email,
  au.email_confirmed_at,
  au.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE au.email = 'nathaniel.crowell12+secondaryuser@gmail.com';

-- Check primary account details
SELECT
  id,
  full_name,
  user_type,
  family_sharing_enabled,
  max_secondaries
FROM user_profiles
WHERE id = 'a1b956e4-67ae-4516-9452-3b5a4d838f41';

-- Count total secondaries for primary account
SELECT
  COUNT(*) as total_secondaries,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
  COUNT(*) FILTER (WHERE status = 'revoked') as revoked
FROM secondaries
WHERE account_id = 'a1b956e4-67ae-4516-9452-3b5a4d838f41';

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
