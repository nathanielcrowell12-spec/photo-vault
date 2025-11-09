-- View the actual policy definitions with their USING clauses
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual as policy_using_clause,
    with_check as policy_with_check_clause
FROM pg_policies
WHERE tablename = 'gallery_photos'
  AND policyname LIKE '%Photographers can view%'
ORDER BY policyname;
