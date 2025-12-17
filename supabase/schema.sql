-- House Hunting Dashboard Database Schema
-- Run this in Supabase SQL Editor to create tables

-- Create listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  county TEXT NOT NULL,
  url TEXT,
  estimated_price INTEGER NOT NULL,
  price_per_sqft DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_footage INTEGER,
  year_built INTEGER,
  lot_size BIGINT,
  walk_score INTEGER,
  school_rating INTEGER,
  hoa_fees INTEGER,
  annual_property_tax INTEGER,
  seller_broker TEXT,
  photo_url TEXT,
  photo_urls TEXT[], -- Array of image URLs
  property_type TEXT NOT NULL,
  is_single_floor BOOLEAN DEFAULT false,
  has_backyard BOOLEAN DEFAULT false,
  has_pool BOOLEAN DEFAULT false,
  contract_status TEXT DEFAULT 'available',
  listing_type TEXT DEFAULT 'sale',
  monthly_rent INTEGER,
  security_deposit INTEGER,
  lease_terms TEXT,
  value_score INTEGER,
  value_tier TEXT,
  listed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  days_on_market INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grades table (stores user grading decisions)
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id) -- One grade per listing
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_listed_date ON public.listings(listed_date DESC);
CREATE INDEX IF NOT EXISTS idx_listings_county ON public.listings(county);
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON public.listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_is_single_floor ON public.listings(is_single_floor);
CREATE INDEX IF NOT EXISTS idx_listings_contract_status ON public.listings(contract_status);
CREATE INDEX IF NOT EXISTS idx_grades_listing_id ON public.grades(listing_id);

-- Enable Row Level Security (RLS) - allow public access for personal use
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read/write (since this is personal use, no auth needed)
CREATE POLICY "Allow public read access to listings" ON public.listings
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to listings" ON public.listings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to listings" ON public.listings
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to grades" ON public.grades
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to grades" ON public.grades
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to grades" ON public.grades
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to grades" ON public.grades
  FOR DELETE USING (true);

-- Add comment
COMMENT ON TABLE public.listings IS 'Stores all real estate listings fetched from APIs';
COMMENT ON TABLE public.grades IS 'Stores user grading decisions (A-F) for each listing';
