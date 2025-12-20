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

// Premium Atlanta metro ZIP codes for granular search
// Using ZIP codes instead of cities to work around API's 40-result limit
const premiumZipCodes = [
  // Atlanta proper
  '30305', '30306', '30307', '30308', '30309', '30310', '30312', '30313', '30314', '30315',
  '30316', '30317', '30318', '30324', '30326', '30327', '30328', '30329', '30331', '30332',
  '30334', '30336', '30337', '30342', '30344', '30345', '30346', '30354', '30363',
  // Alpharetta
  '30004', '30005', '30009', '30022', '30023',
  // Roswell
  '30075', '30076',
  // Johns Creek
  '30022', '30024', '30097', '30005',
  // Sandy Springs
  '30328', '30342', '30350',
  // Cumming
  '30028', '30040', '30041',
  // Dunwoody
  '30338', '30346', '30360',
  // Marietta
  '30060', '30062', '30063', '30064', '30066', '30067', '30068',
  // Smyrna
  '30080', '30081', '30082',
  // Milton
  '30004', '30009',
  // Duluth
  '30095', '30096', '30097', '30099',
  // Kennesaw
  '30144', '30152',
  // Decatur
  '30030', '30031', '30032', '30033', '30034', '30035',
  // Suwanee
  '30024',
  // Brookhaven
  '30319', '30324', '30329', '30341',
  // Canton
  '30114', '30115',
  // Gainesville
  '30501', '30504', '30506', '30507',
  // Athens
  '30601', '30602', '30605', '30606', '30607',
  // Forsyth County
  '30028', '30040', '30041',
];

// Price tiers for comprehensive search
const SALE_PRICE_TIERS = [
  { min: 750000, max: 1100000, label: '$750k-$1.1M' },
  { min: 1100000, max: 1600000, label: '$1.1M-$1.6M' },
];

const RENT_PRICE_TIERS = [
  { min: 3500, max: 5000, label: '$3.5k-$5k' },
  { min: 5000, max: 7000, label: '$5k-$7k' },
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

  // Filter: Must have 3+ bedrooms AND 3+ bathrooms
  const beds = prop.beds || 0;
  const baths = prop.baths || 0;

  if (beds < 3 || baths < 3) {
    return null; // Skip properties that don't meet bed/bath requirements
  }

  // CRITICAL: Smart multi-story detection using API data + description keywords
  const stories = prop.resoFacts?.stories || null;
  const homeType = (prop.homeType || '').toUpperCase();
  const description = (prop.description || '').toLowerCase();

  // Check for single-story keywords in description
  const singleStoryKeywords = [
    'ranch', 'single-level', 'single level', 'one-story', 'one story',
    'single-story', 'single story', 'one level', 'main floor living',
    'no stairs', 'main level living', 'all on one level'
  ];
  const hasSingleStoryKeyword = singleStoryKeywords.some(keyword => description.includes(keyword));

  // Reject if API says multi-story AND description doesn't mention single-story keywords
  if (stories !== null && stories > 1 && !hasSingleStoryKeyword) {
    return null; // Definitely multi-story
  }

  // Smart townhouse filtering - accept only if has elevator
  if (homeType.includes('TOWNHOUSE') || homeType.includes('TOWNHOME')) {
    // Townhouses are typically multi-story
    // ONLY accept if description mentions "elevator" (indicates accessibility for single-floor living)
    const hasElevator = description.includes('elevator') || description.includes('lift');
    if (!hasElevator) {
      return null; // Reject townhouses without elevator
    }
  }

  let propertyType = 'single-family';
  let isSingleFloor = false;

  if (homeType.includes('CONDO') || homeType.includes('APARTMENT')) {
    propertyType = 'condo';
    isSingleFloor = true; // Condos/apartments are typically single-floor units
  } else if (homeType.includes('TOWNHOUSE')) {
    propertyType = 'townhouse';
    isSingleFloor = true; // Only townhouses with elevators reach this point
  } else if (homeType.includes('SINGLE_FAMILY')) {
    propertyType = 'ranch';
    isSingleFloor = true; // Passed multi-story filtering, so it's single-story
  } else if (homeType.includes('LOT') || homeType.includes('LAND') || homeType.includes('MULTI_FAMILY')) {
    return null;
  } else {
    propertyType = 'ranch';
    isSingleFloor = true; // Passed filtering, so consider single-story
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
    description: prop.description || null,
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
 * @param {string} searchMode - 'singleStory' or 'ranch'
 */
async function fetchFromHasData(location, type, priceTier, searchMode = 'singleStory') {
  let url;

  if (searchMode === 'singleStory') {
    // Search with singleStoryOnly filter
    url = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent(location)}&type=${type}&singleStoryOnly=true`;
  } else {
    // Search for ranch properties (ALSO use singleStoryOnly filter to prevent multi-story homes)
    url = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent(location)}&type=${type}&singleStoryOnly=true`;
  }

  // Add 10-second timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': HASDATA_API_KEY
    },
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`HasData API error (${response.status})`);
  }

  const result = await response.json();

  // Collect properties from both array and singular fields
  const allProperties = [];

  // Add from properties array (standard response for broad searches)
  if (result.properties && Array.isArray(result.properties)) {
    allProperties.push(...result.properties);
  }

  // Add from singular property field (specific property searches)
  if (result.property && typeof result.property === 'object') {
    allProperties.push(result.property);
  }

  // Client-side filtering by price tier and search mode
  const properties = allProperties.filter((prop) => {
    const price = prop.price || 0;
    if (price < priceTier.min || price > priceTier.max) {
      return false;
    }

    // If in ranch mode, only keep properties that have RANCH in homeType
    if (searchMode === 'ranch') {
      const homeType = (prop.homeType || '').toUpperCase();
      if (!homeType.includes('SINGLE_FAMILY') && !homeType.includes('RANCH')) {
        return false;
      }
    }

    return true;
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

  console.log(`🔍 Fetching properties from ${premiumZipCodes.length} ZIP codes with price-tier strategy...\n`);

  // Deduplicate ZIP codes first
  const uniqueZips = [...new Set(premiumZipCodes)];
  console.log(`   Using ${uniqueZips.length} unique ZIP codes\n`);

  // Fetch Sale properties with price tiers by ZIP
  // Strategy: Make two passes - one for singleStoryOnly, one for Ranch properties
  console.log('  🏠 Pass 1: Searching for single-story properties...\n');
  for (const zip of uniqueZips) {
    for (const tier of SALE_PRICE_TIERS) {
      try {
        console.log(`  Searching ZIP ${zip} (forSale, singleStory, ${tier.label})...`);
        const properties = await fetchFromHasData(zip, 'forSale', tier, 'singleStory');
        allListings.push(...properties);
        totalAPICallsMade++;
        console.log(`    ✓ Found ${properties.length} properties in ${tier.label}`);

        if (properties.length >= 40) {
          console.log(`    ⚠️  Hit API limit (~40 results) - some listings may be missing in this tier`);
        }

        // Rate limit: 300ms between requests (we have 200k credits)
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n  🏡 Pass 2: Searching for ranch properties...\n');
  for (const zip of uniqueZips) {
    for (const tier of SALE_PRICE_TIERS) {
      try {
        console.log(`  Searching ZIP ${zip} (forSale, ranch, ${tier.label})...`);
        const properties = await fetchFromHasData(zip, 'forSale', tier, 'ranch');
        allListings.push(...properties);
        totalAPICallsMade++;
        console.log(`    ✓ Found ${properties.length} properties in ${tier.label}`);

        if (properties.length >= 40) {
          console.log(`    ⚠️  Hit API limit (~40 results) - some listings may be missing in this tier`);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
      }
    }
  }

  // Fetch Rent properties with price tiers by ZIP (single-story only for efficiency)
  console.log('\n  🏠 Pass 3: Searching for single-story rentals...\n');
  for (const zip of uniqueZips) {
    for (const tier of RENT_PRICE_TIERS) {
      try {
        console.log(`  Searching ZIP ${zip} (forRent, ${tier.label})...`);
        const properties = await fetchFromHasData(zip, 'forRent', tier, 'singleStory');
        allListings.push(...properties);
        totalAPICallsMade++;
        console.log(`    ✓ Found ${properties.length} properties in ${tier.label}`);

        if (properties.length >= 40) {
          console.log(`    ⚠️  Hit API limit (~40 results) - some listings may be missing in this tier`);
        }

        // Rate limit: 500ms between requests for stability
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
        // Continue on error - don't let one failure stop everything
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

  // Preserve user grades before upserting
  console.log('\n🔍 Fetching existing user grades...');
  const { data: existingGrades } = await supabase
    .from('listings')
    .select('id, my_grade')
    .not('my_grade', 'is', null);

  const gradeMap = new Map();
  if (existingGrades) {
    existingGrades.forEach(row => {
      if (row.my_grade) {
        gradeMap.set(row.id, row.my_grade);
      }
    });
    console.log(`✅ Found ${gradeMap.size} properties with existing grades`);
  }

  // Merge grades back into listings
  listings.forEach(listing => {
    if (gradeMap.has(listing.id)) {
      listing.my_grade = gradeMap.get(listing.id);
    }
  });

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
