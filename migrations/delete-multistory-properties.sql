-- Delete Multi-Story Properties Based on Description Keywords
-- Run this in Supabase SQL Editor to immediately remove multi-story homes
--
-- This script uses the bidirectional keyword filtering approach:
-- - Deletes properties with multi-story keywords WITHOUT single-story keywords
-- - Deletes townhouses without elevator mentions
-- - Deletes ambiguous properties (no clear indicators)

-- Step 1: Delete properties with explicit multi-story keywords (no single-story keywords)
DELETE FROM listings
WHERE description IS NOT NULL
AND (
  -- Has multi-story keywords
  description ILIKE '%two story%' OR
  description ILIKE '%2 story%' OR
  description ILIKE '%two-story%' OR
  description ILIKE '%2-story%' OR
  description ILIKE '%three story%' OR
  description ILIKE '%3 story%' OR
  description ILIKE '%multi story%' OR
  description ILIKE '%multi-story%' OR
  description ILIKE '%upstairs%' OR
  description ILIKE '%second floor%' OR
  description ILIKE '%third floor%' OR
  description ILIKE '%upper level%' OR
  description ILIKE '%lower level%' OR
  description ILIKE '%split level%'
)
AND NOT (
  -- Does NOT have single-story keywords
  description ILIKE '%ranch%' OR
  description ILIKE '%single-level%' OR
  description ILIKE '%single level%' OR
  description ILIKE '%one-story%' OR
  description ILIKE '%one story%' OR
  description ILIKE '%single-story%' OR
  description ILIKE '%single story%' OR
  description ILIKE '%one level%' OR
  description ILIKE '%one-level%' OR
  description ILIKE '%main floor living%' OR
  description ILIKE '%main level living%' OR
  description ILIKE '%no stairs%' OR
  description ILIKE '%all on one level%'
);

-- Step 2: Delete townhouses without elevator mentions
DELETE FROM listings
WHERE property_type = 'townhouse'
AND description IS NOT NULL
AND NOT (
  description ILIKE '%elevator%' OR
  description ILIKE '%lift%'
);

-- Step 3: Delete non-condo/apartment properties with ambiguous descriptions
-- (No clear single-story OR multi-story indicators)
DELETE FROM listings
WHERE description IS NOT NULL
AND property_type NOT IN ('condo')
AND NOT (
  -- Has single-story keywords
  description ILIKE '%ranch%' OR
  description ILIKE '%single-level%' OR
  description ILIKE '%single level%' OR
  description ILIKE '%one-story%' OR
  description ILIKE '%one story%' OR
  description ILIKE '%single-story%' OR
  description ILIKE '%single story%' OR
  description ILIKE '%one level%' OR
  description ILIKE '%one-level%' OR
  description ILIKE '%main floor living%' OR
  description ILIKE '%main level living%' OR
  description ILIKE '%no stairs%' OR
  description ILIKE '%all on one level%'
)
AND NOT (
  -- Has multi-story keywords
  description ILIKE '%two story%' OR
  description ILIKE '%2 story%' OR
  description ILIKE '%two-story%' OR
  description ILIKE '%2-story%' OR
  description ILIKE '%three story%' OR
  description ILIKE '%3 story%' OR
  description ILIKE '%multi story%' OR
  description ILIKE '%multi-story%' OR
  description ILIKE '%upstairs%' OR
  description ILIKE '%second floor%' OR
  description ILIKE '%third floor%' OR
  description ILIKE '%upper level%' OR
  description ILIKE '%lower level%' OR
  description ILIKE '%split level%'
);

-- Verify the cleanup
SELECT
  'After Multi-Story Cleanup' as status,
  COUNT(*) as total_remaining,
  COUNT(CASE WHEN description IS NULL THEN 1 END) as no_description,
  COUNT(CASE WHEN property_type = 'condo' THEN 1 END) as condos,
  COUNT(CASE WHEN property_type = 'townhouse' THEN 1 END) as townhouses,
  COUNT(CASE WHEN property_type = 'ranch' THEN 1 END) as ranch_homes
FROM listings;

-- Show sample of remaining properties
SELECT
  id,
  address,
  property_type,
  CASE
    WHEN description IS NULL THEN '(no description)'
    ELSE LEFT(description, 100) || '...'
  END as description_preview
FROM listings
ORDER BY created_at DESC
LIMIT 10;
