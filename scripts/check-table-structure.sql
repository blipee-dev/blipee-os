-- Check organizations table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
ORDER BY ordinal_position;

-- Check sites table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sites'
ORDER BY ordinal_position;