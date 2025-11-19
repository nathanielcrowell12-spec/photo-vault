-- Run this in Supabase SQL Editor to see all your tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check for key PhotoVault tables
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN '✓ user_profiles exists'
        ELSE '✗ user_profiles missing'
    END as user_profiles_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photo_galleries') THEN '✓ photo_galleries exists'
        ELSE '✗ photo_galleries missing'
    END as galleries_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN '✓ conversations exists (messaging system)'
        ELSE '✗ conversations missing (messaging not set up)'
    END as conversations_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commission_payments') THEN '✓ commission_payments exists (payment system)'
        ELSE '✗ commission_payments missing (payment system not set up)'
    END as payments_status;

