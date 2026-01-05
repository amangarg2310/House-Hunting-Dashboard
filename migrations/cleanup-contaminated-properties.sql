-- Cleanup Script for Contaminated Properties
-- Run this in Supabase SQL Editor AFTER running add-description-column.sql
-- This will remove properties that don't meet the filtering criteria

-- Step 1: Delete properties with insufficient bedrooms or bathrooms
-- These were added by the cron job before the bed/bath filter was implemented
DELETE FROM listings
WHERE bedrooms < 3 OR bathrooms < 3;

-- Step 2: Delete townhouses without elevator mentions (after descriptions are populated)
-- Townhouses without elevators are typically multi-story and inaccessible
-- ONLY RUN THIS AFTER a fresh fetch that populates the description field
DELETE FROM listings
WHERE property_type = 'townhouse'
AND (
  description IS NULL
  OR (
    description NOT ILIKE '%elevator%'
    AND description NOT ILIKE '%lift%'
  )
);

-- Step 3: Delete properties that are clearly multi-story based on description
-- This is for properties where the description doesn't have single-story keywords
-- ONLY RUN THIS AFTER a fresh fetch that populates the description field
-- Note: This is conservative - we only delete if we have strong evidence of multi-story
DELETE FROM listings
WHERE description IS NOT NULL
AND property_type != 'condo' -- Condos are typically single-floor units
AND property_type != 'townhouse' -- Already handled in Step 2
AND (
  description ILIKE '%two story%'
  OR description ILIKE '%2 story%'
  OR description ILIKE '%two-story%'
  OR description ILIKE '%2-story%'
  OR description ILIKE '%three story%'
  OR description ILIKE '%3 story%'
  OR description ILIKE '%multi story%'
  OR description ILIKE '%multi-story%'
  OR description ILIKE '%upstairs%'
  OR description ILIKE '%second floor%'
  OR description ILIKE '%third floor%'
)
AND description NOT ILIKE '%ranch%'
AND description NOT ILIKE '%single-level%'
AND description NOT ILIKE '%single level%'
AND description NOT ILIKE '%one-story%'
AND description NOT ILIKE '%one story%'
AND description NOT ILIKE '%single-story%'
AND description NOT ILIKE '%single story%'
AND description NOT ILIKE '%one level%'
AND description NOT ILIKE '%main floor living%'
AND description NOT ILIKE '%no stairs%'
AND description NOT ILIKE '%main level living%'
AND description NOT ILIKE '%all on one level%';

-- Verify the cleanup
SELECT
  'After Cleanup' as status,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN bedrooms < 3 THEN 1 END) as low_bedrooms,
  COUNT(CASE WHEN bathrooms < 3 THEN 1 END) as low_bathrooms,
  COUNT(CASE WHEN property_type = 'townhouse' THEN 1 END) as townhouses_remaining
FROM listings;
