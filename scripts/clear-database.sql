-- Clear all data from listings and grades tables
-- Run this in Supabase SQL Editor

-- First, delete all grades (child table)
TRUNCATE TABLE grades CASCADE;

-- Then, delete all listings (parent table)
TRUNCATE TABLE listings CASCADE;

-- Verify deletion
SELECT 'grades' as table_name, COUNT(*) as count FROM grades
UNION ALL
SELECT 'listings' as table_name, COUNT(*) as count FROM listings;
