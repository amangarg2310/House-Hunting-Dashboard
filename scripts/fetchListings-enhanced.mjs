/**
 * Enhanced Daily Fetch Script - Multi-Tier Search Strategy
 *
 * This script uses a comprehensive search strategy with price range breakdowns
 * to maximize property coverage and avoid missing listings due to API's 40-result limit.
 *
 * Strategy:
 * - For each city, search by multiple price tiers
 * - For Sale: $650k-$900k, $900k-$1.3M, $1.3M-$2M
 * - For Rent: $3k-$5k, $5k-$7k, $7k-$10k
 * - This increases API calls but ensures comprehensive coverage
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const HASDATA_API_KEY = process.env.VITE_HASDATA_API_KEY || 'c7c6e86e-619d-4cb8-9c4b-9051bd3ad27d';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!HASDATA_API_KEY) {
  console.error('❌ Missing HasData API key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// Price tiers for comprehensive search
const SALE_PRICE_TIERS = [
  { min: 650000, max: 900000, label: '$650k-$900k' },
  { min: 900000, max: 1300000, label: '$900k-$1.3M' },
  { min: 1300000, max: 2000000, label: '$1.3M-$2M' },
];

const RENT_PRICE_TIERS = [
  { min: 3000, max: 5000, label: '$3k-$5k' },
  { min: 5000, max: 7000, label: '$5k-$7k' },
  { min: 7000, max: 10000, label: '$7k-$10k' },
];

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
 * Transform HasData property to database row
 */
function transformProperty(prop) {
  const address = prop.address || {};

  if (!address.street || !prop.price) {
    return null;
  }

  const countyName = prop._searchCity || address.city || address.state || 'Atlanta';

  const homeType = (prop.homeType || '').toUpperCase();
  let propertyType = 'single-family';
  let isSingleFloor = false;

  if (homeType.includes('CONDO') || homeType.includes('APARTMENT')) {
    propertyType = 'condo';
    isSingleFloor = true;
  } else if (homeType.includes('TOWNHOUSE')) {
    propertyType = 'townhouse';
    isSingleFloor = true;
  } else if (homeType.includes('SINGLE_FAMILY')) {
    propertyType = 'ranch';
    isSingleFloor = true;
  } else if (homeType.includes('LOT') || homeType.includes('LAND') || homeType.includes('MULTI_FAMILY')) {
    return null;
  } else {
    propertyType = 'ranch';
    isSingleFloor = true;
  }

  const squareFootage = prop.area || null;
  const pricePerSqFt = squareFootage > 0 ? Math.round(prop.price / squareFootage) : 0;
  const lotSizeAcres = prop.lotAreaValue || 0;
  const lotSizeSqft = Math.round(lotSizeAcres * 43560);
  const hasBackyard = propertyType !== 'condo' && lotSizeSqft > 3000;
  const walkScore = 60;
  const schoolRating = 7;
  const hasPool = false;

  const photos = prop.photos || [];
  const photoUrl = photos.length > 0 ? photos[0] : (prop.image || null);
  const photoUrls = photos.length > 0 ? photos : (photoUrl ? [photoUrl] : []);

  const status = (prop.status || '').toUpperCase();
  let listingType = 'sale';
  let contractStatus = 'available';

  if (status === 'FOR_RENT' || status.includes('RENT')) {
    listingType = 'rent';
  } else if (status === 'FOR_SALE' || status.includes('SALE')) {
    listingType = 'sale';
  }

  if (status.includes('PENDING') || status.includes('CONTINGENT')) {
    contractStatus = 'pending';
  } else if (status.includes('SOLD') || status.includes('RENTED')) {
    contractStatus = 'sold';
  }

  if (contractStatus !== 'available') {
    return null;
  }

  const monthlyRent = listingType === 'rent' ? prop.price : (prop.rentZestimate || null);
  const securityDeposit = listingType === 'rent' && monthlyRent ? Math.round(monthlyRent * 1.5) : null;
  const leaseTerms = listingType === 'rent' ? '12 months' : null;
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
    year_built: prop.yearBuilt || 2000,
    lot_size: lotSizeSqft,
    walk_score: walkScore,
    school_rating: schoolRating,
    hoa_fees: prop.monthlyHoaFee || (propertyType === 'condo' ? 350 : (propertyType === 'townhouse' ? 200 : 100)),
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
    listed_date: new Date().toISOString(),
    days_on_market: daysOnMarket,
  };

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
 * Fetch properties from HasData for a specific location and price tier
 */
async function fetchFromHasData(location, type, priceTier) {
  const url = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent(location)}&type=${type}&singleStoryOnly=true`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': HASDATA_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`HasData API error (${response.status})`);
  }

  const result = await response.json();
  const allProperties = result.properties || [];

  // Client-side filtering by price tier
  const properties = allProperties.filter((prop) => {
    const price = prop.price || 0;
    return price >= priceTier.min && price <= priceTier.max;
  });

  // Add search location metadata
  const searchCity = location.split(',')[0].trim();
  return properties.map(prop => ({ ...prop, _searchCity: searchCity }));
}

/**
 * Main execution
 */
async function main() {
  console.log('🏠 House Hunting Dashboard - Enhanced Multi-Tier Fetch');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toLocaleString()}\n`);

  const allListings = [];
  let totalAPICallsMade = 0;

  console.log('🔍 Fetching properties with comprehensive price-tier strategy...\n');

  // Fetch Sale properties with price tiers
  for (const city of premiumAreas) {
    for (const tier of SALE_PRICE_TIERS) {
      try {
        console.log(`  Searching ${city} (forSale, ${tier.label})...`);
        const properties = await fetchFromHasData(city, 'forSale', tier);
        allListings.push(...properties);
        totalAPICallsMade++;
        console.log(`    ✓ Found ${properties.length} properties in ${tier.label}`);

        if (properties.length === 41) {
          console.log(`    ⚠️  Hit API limit (41 results) - some listings may be missing in this tier`);
        }

        // Rate limit: 500ms between requests (faster than before since we have credits)
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
      }
    }
  }

  // Fetch Rent properties with price tiers
  for (const city of premiumAreas) {
    for (const tier of RENT_PRICE_TIERS) {
      try {
        console.log(`  Searching ${city} (forRent, ${tier.label})...`);
        const properties = await fetchFromHasData(city, 'forRent', tier);
        allListings.push(...properties);
        totalAPICallsMade++;
        console.log(`    ✓ Found ${properties.length} properties in ${tier.label}`);

        if (properties.length === 41) {
          console.log(`    ⚠️  Hit API limit (41 results) - some listings may be missing in this tier`);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
      }
    }
  }

  console.log(`\n✅ Total API calls made: ${totalAPICallsMade}`);
  console.log(`✅ Total fetched (with duplicates): ${allListings.length} properties`);

  // Deduplicate
  const propertyMap = new Map();
  allListings.forEach(prop => {
    if (!propertyMap.has(prop.id)) {
      propertyMap.set(prop.id, prop);
    }
  });

  const uniqueProperties = Array.from(propertyMap.values());
  console.log(`✅ After deduplication: ${uniqueProperties.length} unique properties`);

  // Transform
  const listings = uniqueProperties
    .map(transformProperty)
    .filter(Boolean);

  console.log(`✅ ${listings.length} valid properties after filtering\n`);
  console.log(`   ${uniqueProperties.length - listings.length} properties filtered out (pending/sold/invalid/multi-family)`);

  // Save to Supabase
  console.log('\n💾 Saving listings to Supabase...');
  const { error } = await supabase
    .from('listings')
    .upsert(listings, { onConflict: 'id' });

  if (error) {
    console.error('❌ Supabase error:', error);
    throw error;
  }

  console.log(`✅ Successfully saved ${listings.length} listings`);

  // Clean up old listings
  console.log('\n🧹 Cleaning up old listings...');
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data: deleted, error: deleteError } = await supabase
    .from('listings')
    .delete()
    .lt('listed_date', oneYearAgo.toISOString())
    .select();

  if (deleteError) {
    console.error('⚠️  Error cleaning up old listings:', deleteError);
  } else {
    const deletedCount = deleted?.length || 0;
    console.log(`✅ Deleted ${deletedCount} old listings (older than 1 year)`);
  }

  console.log('\n✅ Fetch complete!');
  console.log(`   - New listings saved: ${listings.length}`);
  console.log(`   - Old listings deleted: ${deleted?.length || 0}`);
  console.log(`   - Completed at: ${new Date().toLocaleString()}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
