/**
 * Daily Fetch Script - HasData Zillow API
 *
 * This script fetches new Atlanta property listings from the HasData Zillow API
 * and saves them to Supabase. It's designed to run daily at 7 AM via GitHub Actions.
 *
 * Usage: node scripts/fetchListings.js
 *
 * Environment variables required:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * - VITE_HASDATA_API_KEY
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const HASDATA_API_KEY = process.env.VITE_HASDATA_API_KEY || 'c7c6e86e-619d-4cb8-9c4b-9051bd3ad27d';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!HASDATA_API_KEY) {
  console.error('❌ Missing HasData API key. Please set VITE_HASDATA_API_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Calculate value score for a listing
 */
function calculateValueScore(listing) {
  const { isSingleFloor, pricePerSqFt, hasBackyard, walkScore, schoolRating, hasPool } = listing;

  const singleFloorScore = isSingleFloor ? 100 : 0;
  const priceScore = Math.max(0, Math.min(100, 100 - ((pricePerSqFt - 200) / 3)));
  const backyardScore = hasBackyard ? 100 : 0;
  const poolScore = hasPool ? 100 : 50;

  const total = Math.round(
    singleFloorScore * 0.4 +
    priceScore * 0.25 +
    backyardScore * 0.15 +
    walkScore * 0.1 +
    schoolRating * 10 * 0.05 +
    poolScore * 0.05
  );

  let tier = null;
  if (total >= 85) tier = 'exceptional';
  else if (total >= 70) tier = 'great';
  else if (total >= 55) tier = 'good';

  return { total, tier };
}

/**
 * Transform HasData Zillow property to database row
 */
function transformProperty(prop) {
  const address = prop.address || {};

  if (!address.street || !prop.price) {
    return null;
  }

  // Use city as county (since we're searching by premium areas)
  const countyName = address.city || address.state || 'Atlanta';

  // Determine property type from homeType
  const homeType = (prop.homeType || '').toUpperCase();
  let propertyType = 'single-family';
  let isSingleFloor = false;

  // CONDO / APARTMENT - Always single-floor by definition
  if (homeType.includes('CONDO') || homeType.includes('APARTMENT')) {
    propertyType = 'condo';
    isSingleFloor = true;
  }
  // TOWNHOUSE - We'll keep all townhouses for now
  // (User mentioned only single-story or with elevator, but API doesn't provide stories/elevator info)
  else if (homeType.includes('TOWNHOUSE')) {
    propertyType = 'townhouse';
    isSingleFloor = true; // Assume single floor for now, can be manually filtered later
  }
  // SINGLE_FAMILY - Treat as ranch if it passes our filters
  else if (homeType.includes('SINGLE_FAMILY')) {
    propertyType = 'ranch';
    isSingleFloor = true;
  }
  // LOT / LAND - Skip these
  else if (homeType.includes('LOT') || homeType.includes('LAND')) {
    return null;
  }
  // MULTI_FAMILY - Skip these
  else if (homeType.includes('MULTI_FAMILY')) {
    return null;
  }
  // DEFAULT - Include as ranch
  else {
    propertyType = 'ranch';
    isSingleFloor = true;
  }

  // Calculate property details
  const squareFootage = prop.area || null;
  const pricePerSqFt = squareFootage > 0 ? Math.round(prop.price / squareFootage) : 0;
  const lotSizeAcres = prop.lotAreaValue || 0;
  const lotSizeSqft = Math.round(lotSizeAcres * 43560); // Convert acres to sq ft

  // Determine if property has a backyard
  // - Condos: generally no backyard
  // - Ranch/Single-family: check lot size (need at least 3000 sq ft for meaningful backyard)
  // - Townhouse: rarely have backyards unless large lot
  const hasBackyard = propertyType !== 'condo' && lotSizeSqft > 3000;

  const walkScore = 60; // Default, can be enhanced later
  const schoolRating = 7; // Default, can be enhanced later

  // Check for pool (not available in search results, will be null)
  const hasPool = false; // HasData API doesn't provide pool info in search results

  // Get all photo URLs
  const photos = prop.photos || [];
  const photoUrl = photos.length > 0 ? photos[0] : (prop.image || null);
  const photoUrls = photos.length > 0 ? photos : (photoUrl ? [photoUrl] : []);

  // Determine listing type and contract status
  const status = (prop.status || '').toUpperCase();
  let listingType = 'sale'; // default
  let contractStatus = 'available';

  // CRITICAL: Check FOR_RENT first before FOR_SALE
  // API returns "FOR_RENT" or "FOR_SALE" as exact status values
  if (status === 'FOR_RENT' || status.includes('RENT')) {
    listingType = 'rent';
  } else if (status === 'FOR_SALE' || status.includes('SALE')) {
    listingType = 'sale';
  }

  // Contract status
  if (status.includes('PENDING') || status.includes('CONTINGENT')) {
    contractStatus = 'pending';
  } else if (status.includes('SOLD') || status.includes('RENTED')) {
    contractStatus = 'sold';
  }

  // Skip pending and sold properties - only include available properties
  if (contractStatus !== 'available') {
    return null;
  }

  // Calculate rent if it's a rental property
  const monthlyRent = listingType === 'rent' ? prop.price : (prop.rentZestimate || null);
  const securityDeposit = listingType === 'rent' && monthlyRent ? Math.round(monthlyRent * 1.5) : null;
  const leaseTerms = listingType === 'rent' ? '12 months' : null;

  // Get days on market
  const daysOnMarket = Math.abs(prop.daysOnZillow || 0);

  const listing = {
    id: prop.id || `${address.street}-${address.zipcode}`.replace(/\s+/g, '-'),
    address: `${address.street}, ${address.city || ''}, ${address.state || ''} ${address.zipcode || ''}`,
    county: countyName,
    url: prop.url || '',
    estimated_price: listingType === 'sale' ? prop.price : (prop.zestimate || prop.price),
    price_per_sqft: pricePerSqFt,
    bedrooms: prop.beds || 0,
    bathrooms: prop.baths || 0,
    square_footage: squareFootage,
    year_built: 2000, // HasData API doesn't provide this in search results
    lot_size: lotSizeSqft,
    walk_score: walkScore,
    school_rating: schoolRating,
    hoa_fees: propertyType === 'condo' ? 350 : (propertyType === 'townhouse' ? 200 : 100),
    annual_property_tax: Math.round((prop.zestimate || prop.price) * 0.0095),
    seller_broker: prop.brokerName || 'Unknown',
    photo_url: photoUrl,
    photo_urls: photoUrls,
    property_type: propertyType,
    is_single_floor: isSingleFloor,
    has_backyard: hasBackyard,
    has_pool: hasPool,
    contract_status: contractStatus,
    listing_type: listingType,
    monthly_rent: monthlyRent,
    security_deposit: securityDeposit,
    lease_terms: leaseTerms,
    listed_date: new Date().toISOString(), // HasData doesn't provide exact list date
    days_on_market: daysOnMarket,
  };

  // Calculate value score
  const { total, tier } = calculateValueScore({
    ...listing,
    isSingleFloor: listing.is_single_floor,
    pricePerSqFt: listing.price_per_sqft,
    hasBackyard: listing.has_backyard,
    walkScore: listing.walk_score,
    schoolRating: listing.school_rating,
    hasPool: listing.has_pool,
  });

  listing.value_score = total;
  listing.value_tier = tier;

  return listing;
}

/**
 * Fetch properties from HasData Zillow API for a specific location and type
 */
async function fetchFromHasData(location, type, otherAmenities = null) {
  // Note: sort parameter breaks the API, so we use default sorting
  let url = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent(location)}&type=${type}&singleStoryOnly=true`;

  // Add other amenities filter if specified (e.g., pool)
  if (otherAmenities) {
    url += `&otherAmenities=${otherAmenities}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': HASDATA_API_KEY
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HasData API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const properties = result.properties || [];

  // Log if we're hitting the API limit (usually ~40 results)
  if (properties.length >= 40) {
    console.log(`    ⚠️  Hit API limit (${properties.length} results) - some listings may be missing`);
  }

  return properties;
}

/**
 * Fetch properties from HasData Zillow API for multiple premium Atlanta areas
 */
async function fetchPropertiesFromAPI() {
  console.log('🔍 Fetching properties from HasData Zillow API...');
  console.log('🔑 API Key (first 10 chars):', HASDATA_API_KEY?.substring(0, 10) + '...');

  // Premium Atlanta areas to search
  const premiumAreas = [
    'Atlanta, GA',
    'Alpharetta, GA',
    'Roswell, GA',
    'Johns Creek, GA',
    'Sandy Springs, GA',
    'Cumming, GA',
    'Buckhead, GA',
    'Vinings, GA',
    'Dunwoody, GA',
    'Marietta, GA',
    'Smyrna, GA',
    'Athens, GA',
    'Gainesville, GA',
    'Forsyth, GA',
    'Canton, GA',
    'Milton, GA',
    'Duluth, GA',
    'Kennesaw, GA',
    'Decatur, GA',
    'Suwanee, GA',
    'Midtown, GA',
    'Virginia-Highland, GA',
    'Inman Park, GA',
    'Old Fourth Ward, GA',
    'Brookhaven, GA',
    'Druid Hills, GA',
    'Grant Park, GA',
    'East Atlanta, GA',
  ];

  // Listing types to fetch
  const listingTypes = ['forSale', 'forRent'];

  const allListings = [];

  try {
    // Fetch properties for each area and listing type
    // OPTIMIZED: Only one API call per city/type combo (40 calls total instead of 80)
    for (const city of premiumAreas) {
      for (const type of listingTypes) {
        console.log(`  Searching ${city} (${type})...`);
        try {
          const properties = await fetchFromHasData(city, type);
          console.log(`    ✓ Found ${properties.length} single-story properties`);

          // Note: Pool info not reliably available from API, will default to false
          allListings.push(...properties);

          // Rate limit: 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (cityError) {
          console.error(`    ✗ Error:`, cityError.message);
        }
      }
    }

    console.log(`✅ Total fetched (with duplicates): ${allListings.length} properties`);

    // Deduplicate by ID
    const propertyMap = new Map();
    allListings.forEach(prop => {
      if (!propertyMap.has(prop.id)) {
        propertyMap.set(prop.id, prop);
      }
    });

    const uniqueProperties = Array.from(propertyMap.values());
    console.log(`✅ After deduplication: ${uniqueProperties.length} unique properties`);

    // Transform and filter properties with detailed logging
    let filteredOut = 0;
    const listings = uniqueProperties
      .map(prop => {
        const transformed = transformProperty(prop);
        if (!transformed) {
          filteredOut++;
          // Log why specific properties were filtered out (for debugging)
          if (prop.address && prop.address.street && prop.address.street.includes('Creekside')) {
            console.log(`⚠️  FILTERED OUT: ${prop.address.street}, ${prop.address.city || 'Unknown'}`);
            console.log(`   Reason: homeType=${prop.homeType}, status=${prop.status}, price=${prop.price}`);
          }
        }
        return transformed;
      })
      .filter(Boolean); // Remove null entries

    console.log(`✅ ${listings.length} valid properties after filtering`);
    console.log(`   ${filteredOut} properties filtered out (pending/sold/invalid/multi-family)`);

    return listings;
  } catch (error) {
    console.error('❌ Error fetching from API:', error.message);
    throw error;
  }
}

/**
 * Save listings to Supabase
 */
async function saveListingsToDatabase(listings) {
  if (listings.length === 0) {
    console.log('⚠️  No listings to save');
    return 0;
  }

  // Deduplicate listings by ID before saving
  const uniqueListings = Array.from(
    new Map(listings.map(listing => [listing.id, listing])).values()
  );

  if (uniqueListings.length < listings.length) {
    console.log(`⚠️  Removed ${listings.length - uniqueListings.length} duplicate listings`);
  }

  console.log(`💾 Saving ${uniqueListings.length} listings to Supabase...`);

  try {
    const { error } = await supabase
      .from('listings')
      .upsert(uniqueListings, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error saving to Supabase:', error);
      throw error;
    }

    console.log(`✅ Successfully saved ${uniqueListings.length} listings`);
    return uniqueListings.length;
  } catch (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
}

/**
 * Clean up old listings (older than 1 year to keep historical data)
 */
async function cleanupOldListings() {
  console.log('🧹 Cleaning up old listings...');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 365); // Changed from 90 to 365 days

  try {
    const { data, error } = await supabase
      .from('listings')
      .delete()
      .lt('listed_date', cutoffDate.toISOString())
      .select();

    if (error) {
      console.error('❌ Error cleaning up old listings:', error);
      return 0;
    }

    const deletedCount = data?.length || 0;
    console.log(`✅ Deleted ${deletedCount} old listings (older than 1 year)`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return 0;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🏠 House Hunting Dashboard - Daily Listing Fetch');
  console.log('================================================');
  console.log(`Started at: ${new Date().toLocaleString()}`);
  console.log('');

  try {
    // Fetch new listings from API
    const listings = await fetchPropertiesFromAPI();

    // Save to database
    const savedCount = await saveListingsToDatabase(listings);

    // Cleanup old listings
    const deletedCount = await cleanupOldListings();

    console.log('');
    console.log('✅ Fetch complete!');
    console.log(`   - New listings saved: ${savedCount}`);
    console.log(`   - Old listings deleted: ${deletedCount}`);
    console.log(`   - Completed at: ${new Date().toLocaleString()}`);

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
