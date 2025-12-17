/**
 * Seed Mock Data Script
 *
 * This script populates the Supabase database with mock listings
 * so you can test the app while waiting for RapidAPI subscription to activate.
 *
 * Usage: node scripts/seedMockData.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get today's date for "new" listings
const today = new Date().toISOString();
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

// Mock listings data
const mockListings = [
  {
    id: 'mock-1',
    address: '12002 Orchid Ln, Alpharetta, GA 30009',
    county: 'Fulton',
    url: 'https://redfin.com',
    estimated_price: 985000,
    price_per_sqft: 463,
    bedrooms: 3,
    bathrooms: 2.5,
    square_footage: 2126,
    year_built: 2006,
    lot_size: 0.06,
    walk_score: 54,
    school_rating: 8,
    hoa_fees: 250,
    annual_property_tax: 4014,
    seller_broker: 'HOME Luxury Real Estate',
    listed_date: yesterday,
    photo_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    photo_urls: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80'],
    property_type: 'ranch',
    is_single_floor: true,
    contract_status: 'available',
    has_backyard: true,
    has_pool: false,
    listing_type: 'both',
    monthly_rent: 3200,
    security_deposit: 3200,
    lease_terms: '12 months',
    value_score: 85,
    value_tier: 'exceptional'
  },
  {
    id: 'mock-2',
    address: '560 Windsor Pkwy, Atlanta, GA 30342',
    county: 'Fulton',
    url: 'https://redfin.com',
    estimated_price: 795000,
    price_per_sqft: 486,
    bedrooms: 3,
    bathrooms: 2,
    square_footage: 1637,
    year_built: 1960,
    lot_size: 0.46,
    walk_score: 57,
    school_rating: 7,
    hoa_fees: 0,
    annual_property_tax: 7653,
    seller_broker: 'Keller Williams Realty NE',
    listed_date: twoDaysAgo,
    photo_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    photo_urls: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'],
    property_type: 'multi-story',
    is_single_floor: false,
    contract_status: 'pending',
    has_backyard: true,
    has_pool: false,
    listing_type: 'sale',
    value_score: 65,
    value_tier: 'good'
  },
  {
    id: 'mock-3',
    address: '7933 Midway Rd, Alpharetta, GA 30004',
    county: 'Cherokee',
    url: 'https://redfin.com',
    estimated_price: 839900,
    price_per_sqft: 274,
    bedrooms: 4,
    bathrooms: 3,
    square_footage: 3066,
    year_built: 2003,
    lot_size: 2.3,
    walk_score: 54,
    school_rating: 9,
    hoa_fees: 0,
    annual_property_tax: 4775,
    seller_broker: 'HomeSmart',
    listed_date: yesterday,
    photo_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    photo_urls: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'],
    property_type: 'ranch',
    is_single_floor: true,
    contract_status: 'available',
    has_backyard: true,
    has_pool: true,
    listing_type: 'sale',
    value_score: 88,
    value_tier: 'exceptional'
  },
  {
    id: 'mock-4',
    address: '815 Fairfield Dr, Marietta, GA 30068',
    county: 'Cobb',
    url: 'https://redfin.com',
    estimated_price: 789900,
    price_per_sqft: 349,
    bedrooms: 4,
    bathrooms: 2.5,
    square_footage: 2264,
    year_built: 1973,
    lot_size: 0.27,
    walk_score: 55,
    school_rating: 6,
    hoa_fees: 0,
    annual_property_tax: 5620,
    seller_broker: 'DORSEY ALSTON REALTORS',
    listed_date: twoDaysAgo,
    photo_url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    photo_urls: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'],
    property_type: 'condo',
    is_single_floor: true,
    contract_status: 'available',
    has_backyard: false,
    has_pool: true,
    listing_type: 'both',
    monthly_rent: 2800,
    security_deposit: 2800,
    lease_terms: '12 months',
    value_score: 72,
    value_tier: 'great'
  },
  {
    id: 'mock-5',
    address: '5425 Hyde Grove Dr, Cumming, GA 30040',
    county: 'Forsyth',
    url: 'https://redfin.com',
    estimated_price: 763495,
    price_per_sqft: 219,
    bedrooms: 5,
    bathrooms: 5,
    square_footage: 3489,
    year_built: 2025,
    lot_size: 0.49,
    walk_score: 51,
    school_rating: 8,
    hoa_fees: 514,
    annual_property_tax: 0,
    seller_broker: 'PILATE REALTY OF GEORGIA, INC.',
    listed_date: today,
    photo_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    photo_urls: ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80'],
    property_type: 'ranch',
    is_single_floor: true,
    contract_status: 'available',
    has_backyard: true,
    has_pool: true,
    listing_type: 'both',
    monthly_rent: 3500,
    security_deposit: 3500,
    lease_terms: '12 months',
    value_score: 90,
    value_tier: 'exceptional'
  },
  {
    id: 'mock-6',
    address: '1391 Portage Rd, Atlanta, GA 30062',
    county: 'Cobb',
    url: 'https://redfin.com',
    estimated_price: 750000,
    price_per_sqft: 212,
    bedrooms: 5,
    bathrooms: 4,
    square_footage: 3539,
    year_built: 1978,
    lot_size: 0.52,
    walk_score: 54,
    school_rating: 7,
    hoa_fees: 0,
    annual_property_tax: 4441,
    seller_broker: 'KELLER WILLIAMS REALTY/BUCKHEAD',
    listed_date: today,
    photo_url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&q=80',
    photo_urls: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&q=80'],
    property_type: 'ranch',
    is_single_floor: true,
    contract_status: 'available',
    has_backyard: true,
    has_pool: false,
    listing_type: 'rent',
    monthly_rent: 2950,
    security_deposit: 2950,
    lease_terms: '12 months',
    value_score: 82,
    value_tier: 'exceptional'
  },
  {
    id: 'mock-7',
    address: '2171 James Av, Atlanta, GA 30345',
    county: 'DeKalb',
    url: 'https://redfin.com',
    estimated_price: 1275000,
    price_per_sqft: 420,
    bedrooms: 4,
    bathrooms: 4,
    square_footage: 3037,
    year_built: 2024,
    lot_size: 0.09,
    walk_score: 54,
    school_rating: 6,
    hoa_fees: 1345,
    annual_property_tax: 4379,
    seller_broker: "ANSLEY RE | CHRISTIE'S INT'L RE",
    listed_date: today,
    photo_url: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80',
    photo_urls: ['https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80'],
    property_type: 'townhouse',
    is_single_floor: true,
    contract_status: 'available',
    has_backyard: true,
    has_pool: false,
    listing_type: 'sale',
    value_score: 70,
    value_tier: 'great'
  },
  {
    id: 'mock-8',
    address: '5885 Match Pl, Peachtree Corners, GA 30092',
    county: 'Gwinnett',
    url: 'https://redfin.com',
    estimated_price: 700000,
    price_per_sqft: 247,
    bedrooms: 4,
    bathrooms: 3.5,
    square_footage: 2832,
    year_built: 1981,
    lot_size: 0.46,
    walk_score: 58,
    school_rating: 7,
    hoa_fees: 0,
    annual_property_tax: 8307,
    seller_broker: 'HARRY NORMAN REALTORS',
    listed_date: yesterday,
    photo_url: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&q=80',
    photo_urls: ['https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&q=80'],
    property_type: 'ranch',
    is_single_floor: true,
    contract_status: 'available',
    has_backyard: true,
    has_pool: true,
    listing_type: 'rent',
    monthly_rent: 2700,
    security_deposit: 2700,
    lease_terms: '12 months',
    value_score: 87,
    value_tier: 'exceptional'
  }
];

/**
 * Save mock listings to Supabase
 */
async function seedMockData() {
  console.log('🌱 Seeding Mock Data to Supabase');
  console.log('=================================');
  console.log(`Started at: ${new Date().toLocaleString()}`);
  console.log('');

  try {
    console.log(`💾 Saving ${mockListings.length} mock listings...`);

    const { data, error } = await supabase
      .from('listings')
      .upsert(mockListings, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error saving to Supabase:', error);
      throw error;
    }

    console.log(`✅ Successfully saved ${mockListings.length} mock listings`);
    console.log('');
    console.log('✅ Seeding complete!');
    console.log(`   - Mock listings added: ${mockListings.length}`);
    console.log(`   - Completed at: ${new Date().toLocaleString()}`);
    console.log('');
    console.log('🔍 Check your dashboard at http://localhost:5174/');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
seedMockData();
