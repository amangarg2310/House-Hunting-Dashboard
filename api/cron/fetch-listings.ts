import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

const listingTypes = ['forSale', 'forRent'];

// Fetch detailed property data from Zillow property API (includes description)
async function fetchZillowPropertyDetails(propertyUrl: string, apiKey: string) {
  const url = `https://api.hasdata.com/scrape/zillow/property?url=${encodeURIComponent(propertyUrl)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.property || null;
  } catch (error) {
    return null;
  }
}

// Fetch detailed property data from Redfin property API (includes description)
async function fetchRedfinPropertyDetails(propertyUrl: string, apiKey: string) {
  const url = `https://api.hasdata.com/scrape/redfin/property?url=${encodeURIComponent(propertyUrl)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.property || null;
  } catch (error) {
    return null;
  }
}

// Fetch from Redfin listing API
async function fetchFromRedfin(location: string, type: string, apiKey: string) {
  const url = `https://api.hasdata.com/scrape/redfin/listing?keyword=${encodeURIComponent(location)}&type=${type}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    const allProperties = result.properties || [];

    // Filter by price range (same as Zillow)
    const MIN_PRICE_SALE = 650000;
    const MAX_PRICE_SALE = 2000000;
    const MIN_PRICE_RENT = 3000;
    const MAX_PRICE_RENT = 10000;

    const properties = allProperties.filter((prop: any) => {
      const price = prop.price || 0;
      if (type === 'forSale') {
        return price >= MIN_PRICE_SALE && price <= MAX_PRICE_SALE;
      } else {
        return price >= MIN_PRICE_RENT && price <= MAX_PRICE_RENT;
      }
    });

    // DUAL API: Enrich with property details to get descriptions
    const enrichedProperties = [];
    for (const prop of properties) {
      const propertyDetails = await fetchRedfinPropertyDetails(prop.url, apiKey);

      if (propertyDetails && propertyDetails.description) {
        enrichedProperties.push({
          ...prop,
          description: propertyDetails.description,
          source: 'redfin'
        });
      } else {
        enrichedProperties.push({
          ...prop,
          description: null,
          source: 'redfin'
        });
      }

      // Rate limit: 500ms between property detail requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return enrichedProperties;
  } catch (error) {
    console.error(`Redfin fetch error for ${location}:`, error);
    return [];
  }
}

async function fetchFromHasData(location: string, type: string, apiKey: string) {
  const url = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent(location)}&type=${type}&singleStoryOnly=true`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`HasData API error (${response.status})`);
  }

  const result = await response.json();
  const allProperties = result.properties || [];

  // Filter by price range
  const MIN_PRICE_SALE = 650000;
  const MAX_PRICE_SALE = 2000000;
  const MIN_PRICE_RENT = 3000;
  const MAX_PRICE_RENT = 10000;

  const properties = allProperties.filter((prop: any) => {
    const price = prop.price || 0;
    if (type === 'forSale') {
      return price >= MIN_PRICE_SALE && price <= MAX_PRICE_SALE;
    } else {
      return price >= MIN_PRICE_RENT && price <= MAX_PRICE_RENT;
    }
  });

  // DUAL API: Enrich with property details to get descriptions
  const enrichedProperties = [];
  for (const prop of properties) {
    const propertyDetails = await fetchZillowPropertyDetails(prop.url, apiKey);

    if (propertyDetails && propertyDetails.description) {
      // Merge listing data with property details
      enrichedProperties.push({
        ...prop,
        description: propertyDetails.description
      });
    } else {
      // Keep property without description (will be filtered conservatively)
      enrichedProperties.push({
        ...prop,
        description: null
      });
    }

    // Rate limit: 500ms between property detail requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return enrichedProperties;
}

function transformProperty(prop: any) {
  // Same transformation logic as fetch script
  const address = prop.address || {};
  if (!address.street || !prop.price) {
    return null;
  }

  // CRITICAL: Filter out properties with < 3 bedrooms or < 3 bathrooms
  const bedrooms = prop.beds || 0;
  const bathrooms = prop.baths || 0;
  if (bedrooms < 3 || bathrooms < 3) {
    return null; // Reject properties that don't meet minimum requirements
  }

  // IMPROVED: Combined filtering logic (Primary-on-Main + Severe Multi-Story + Light Multi-Story)
  const description = (prop.description || '').toLowerCase();
  const homeType = (prop.homeType || '').toUpperCase();

  // If we have a description, use the new combined filtering logic
  if (description) {
    // Option 1: Primary-on-Main indicators (ACCEPT these)
    const primaryOnMainKeywords = [
      'primary on main', 'primary on the main', 'main level primary',
      'master on main', 'master on the main', 'main level master',
      'owner suite on main', 'owner\'s suite on main', 'owner suite on the main',
      'primary-on-main', 'master-on-main',
      'primary bedroom on main', 'master bedroom on main',
      'primary suite on main', 'master suite on main'
    ];
    const hasPrimaryOnMain = primaryOnMainKeywords.some(kw => description.includes(kw));

    // Option 2: Severe multi-story keywords (REJECT these - 3+ stories or primary upstairs)
    const severeMultiStoryKeywords = [
      'three story', '3 story', 'three-story', '3-story',
      'four story', '4 story', 'four-story', '4-story',
      'primary upstairs', 'primary bedroom upstairs', 'primary suite upstairs',
      'master upstairs', 'master bedroom upstairs', 'master suite upstairs',
      'owner suite upstairs', 'owner\'s suite upstairs',
      'stairs to primary', 'stairs to master'
    ];
    const hasSevereMultiStory = severeMultiStoryKeywords.some(kw => description.includes(kw));

    // Option 3: Light multi-story keywords (secondary bedrooms upstairs - OK if primary on main)
    const lightMultiStoryKeywords = [
      'upstairs', 'second floor', 'upper level', 'lower level',
      'two story', '2 story', 'two-story', '2-story',
      'split level'
    ];
    const hasLightMultiStory = lightMultiStoryKeywords.some(kw => description.includes(kw));

    // Single-story indicators
    const singleStoryKeywords = [
      'ranch', 'single-level', 'single level',
      'one-story', 'one story', 'single-story', 'single story',
      'main floor living', 'no stairs', 'one level', 'all on one level'
    ];
    const hasSingleStory = singleStoryKeywords.some(kw => description.includes(kw));

    // Elevator keywords for townhouses
    const elevatorKeywords = ['elevator', 'lift'];
    const hasElevatorKeyword = elevatorKeywords.some(kw => description.includes(kw));

    // DECISION LOGIC:
    // 1. If has primary-on-main, ACCEPT (even if has upstairs bedrooms)
    // 2. If has severe multi-story (3+ stories or primary upstairs), REJECT
    // 3. If has single-story indicators, ACCEPT
    // 4. If only has light multi-story (like upstairs bedrooms) without primary-on-main, REJECT
    // 5. Special handling for townhouses: require elevator mention

    // Special handling for townhouses
    if (homeType.includes('TOWNHOUSE') || homeType.includes('TOWNHOME')) {
      if (!hasElevatorKeyword && !hasPrimaryOnMain) {
        return null; // Townhouse without elevator or primary-on-main = multi-story
      }
    }

    // Apply combined filtering logic
    if (hasPrimaryOnMain) {
      // ACCEPT: Has primary-on-main (can live entirely on main floor)
      // Continue processing
    } else if (hasSevereMultiStory) {
      return null; // REJECT: Has severe multi-story (3+ stories or primary upstairs)
    } else if (hasSingleStory) {
      // ACCEPT: Has single-story keywords
      // Continue processing
    } else if (hasLightMultiStory) {
      return null; // REJECT: Has multi-story keywords without primary-on-main confirmation
    }
    // Otherwise ACCEPT (no clear multi-story indicators)

  } else {
    // No description available - use conservative API-only filtering
    const stories = prop.resoFacts?.stories || null;

    // STRICT filtering: Reject if API says multi-story (stories > 1)
    if (stories !== null && stories > 1) {
      return null;
    }

    // Conservative: Reject townhouses without description (can't verify elevator)
    if (homeType.includes('TOWNHOUSE') || homeType.includes('TOWNHOME')) {
      return null;
    }

    // Conservative: Without story data or description, only accept safe types
    if (stories === null) {
      const isSafeType = homeType.includes('CONDO') ||
                         homeType.includes('APARTMENT') ||
                         homeType.includes('SINGLE_FAMILY');

      if (!isSafeType) {
        return null;
      }
    }
  }

  const status = (prop.status || '').toUpperCase();
  let contractStatus = 'available';
  if (status.includes('PENDING') || status.includes('CONTINGENT')) {
    contractStatus = 'pending';
  } else if (status.includes('SOLD') || status.includes('RENTED')) {
    contractStatus = 'sold';
  }

  if (contractStatus !== 'available') {
    return null;
  }

  return {
    id: prop.id?.toString() || '',
    address: `${address.street}, ${address.city || ''}, ${address.state || ''} ${address.zipcode || ''}`.trim(),
    county: address.city || 'Unknown',
    url: prop.url || `https://www.zillow.com/homedetails/${prop.id}_zpid/`,
    estimated_price: prop.price || 0,
    price_per_sqft: prop.pricePerSqFt || 0,
    bedrooms: prop.beds || 0,
    bathrooms: prop.baths || 0,
    square_footage: prop.area || 0,
    year_built: prop.yearBuilt || 0,
    lot_size: prop.lotSize || 0,
    walk_score: 60,
    school_rating: 7,
    hoa_fees: prop.hoaFees || 0,
    annual_property_tax: prop.annualTaxes || 0,
    seller_broker: 'Unknown',
    photo_url: prop.photos?.[0] || '',
    photo_urls: prop.photos || [],
    property_type: prop.homeType === 'CONDO' || prop.homeType === 'APARTMENT' ? 'condo' :
                   prop.homeType === 'TOWNHOUSE' ? 'townhouse' : 'ranch',
    is_single_floor: true,
    has_backyard: false,
    has_pool: false,
    contract_status: contractStatus,
    listing_type: prop.listingType === 'forSale' ? 'sale' : 'rent',
    monthly_rent: prop.listingType === 'forRent' ? prop.price : prop.price * 0.004,
    security_deposit: prop.listingType === 'forRent' ? prop.price * 1.5 : 0,
    lease_terms: prop.listingType === 'forRent' ? '12 months' : null,
    listed_date: new Date().toISOString(),
    days_on_market: prop.daysOnZillow || 0,
    description: prop.description || null,
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Optional: Verify this is a cron job request (Vercel automatically handles this)
  // const authHeader = req.headers['authorization'];
  // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
    const HASDATA_API_KEY = process.env.VITE_HASDATA_API_KEY;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

    if (!HASDATA_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const allListings: any[] = [];

    // Layer 1: Fetch from Zillow (all cities)
    for (const city of premiumAreas) {
      for (const type of listingTypes) {
        try {
          const properties = await fetchFromHasData(city, type, HASDATA_API_KEY);
          allListings.push(...properties);

          // Rate limit: 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          console.error(`Error fetching Zillow ${city} (${type}):`, error.message);
        }
      }
    }

    // Layer 2: Fetch from Redfin (all cities) to catch additional properties
    for (const city of premiumAreas) {
      for (const type of listingTypes) {
        try {
          const properties = await fetchFromRedfin(city, type, HASDATA_API_KEY);
          allListings.push(...properties);

          // Rate limit: 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          console.error(`Error fetching Redfin ${city} (${type}):`, error.message);
        }
      }
    }

    // Deduplicate across both sources
    const propertyMap = new Map();
    allListings.forEach(prop => {
      if (!propertyMap.has(prop.id)) {
        propertyMap.set(prop.id, prop);
      }
    });

    const uniqueProperties = Array.from(propertyMap.values());

    // Transform
    const listings = uniqueProperties
      .map(transformProperty)
      .filter(Boolean);

    // Save to Supabase
    const { error } = await supabase
      .from('listings')
      .upsert(listings, { onConflict: 'id' });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      fetched: allListings.length,
      unique: uniqueProperties.length,
      saved: listings.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
