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

  return properties;
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

    // Fetch from all cities
    for (const city of premiumAreas) {
      for (const type of listingTypes) {
        try {
          const properties = await fetchFromHasData(city, type, HASDATA_API_KEY);
          allListings.push(...properties);

          // Rate limit: 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          console.error(`Error fetching ${city} (${type}):`, error.message);
        }
      }
    }

    // Deduplicate
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
