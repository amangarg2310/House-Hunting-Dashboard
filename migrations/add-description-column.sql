-- Add description column to listings table
-- This will store property descriptions from Zillow for elevator detection

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for faster text searches
CREATE INDEX IF NOT EXISTS idx_listings_description
ON listings USING gin(to_tsvector('english', description));

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listings' AND column_name = 'description';
