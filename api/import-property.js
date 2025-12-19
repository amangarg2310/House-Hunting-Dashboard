const { createClient } = require('@supabase/supabase-js');

/**
 * API endpoint for manually importing properties by URL or address
 * Accepts single property or batch of properties
 */

/**
 * Extract property ID from Zillow URL
 */
function extractPropertyId(url: string): string | null {
  const match = url.match(/\/(\d+)_zpid/);
  return match ? match[1] : null;
}

/**
 * Fetch property from HasData API
 * MUST include singleStoryOnly filter to avoid importing multi-story homes
 */
async function fetchProperty(query: string, apiKey: string) {
  const url = `https://api.hasdata.com/scrape/zillow/listing?keyword=${encodeURIComponent(query)}&singleStoryOnly=true`;

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

  // Check both singular property field and properties array
  if (result.property && typeof result.property === 'object') {
    return result.property;
  }

  if (result.properties && Array.isArray(result.properties) && result.properties.length > 0) {
    return result.properties[0];
  }

  return null;
}

/**
 * Calculate value score for a listing
 */
function calculateValueScore(listing: any) {
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
function transformProperty(prop: any) {
  const address = prop.address || {};

  if (!address.street || !prop.price) {
    return null;
  }

  const countyName = address.city || address.state || 'Atlanta';

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

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const HASDATA_API_KEY = process.env.VITE_HASDATA_API_KEY;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

    if (!HASDATA_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    const { entries } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries array is required' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const results = [];

    // Process each entry
    for (const entry of entries) {
      const trimmedEntry = entry.trim();
      if (!trimmedEntry) {
        results.push({
          success: false,
          entry: trimmedEntry,
          error: 'Empty entry'
        });
        continue;
      }

      try {
        // Determine if entry is URL or address
        let query = trimmedEntry;

        // If it's a Zillow URL, extract property ID or use full URL
        if (trimmedEntry.startsWith('http')) {
          const propertyId = extractPropertyId(trimmedEntry);
          if (propertyId) {
            query = propertyId;
          }
        }

        // Fetch property from HasData
        const property = await fetchProperty(query, HASDATA_API_KEY);

        if (!property) {
          results.push({
            success: false,
            entry: trimmedEntry,
            error: 'Property not found'
          });
          continue;
        }

        // Transform property
        const listing = transformProperty(property);

        if (!listing) {
          results.push({
            success: false,
            entry: trimmedEntry,
            error: 'Property does not meet criteria (pending/sold/invalid/multi-family)'
          });
          continue;
        }

        // Insert into Supabase
        const { error } = await supabase
          .from('listings')
          .upsert(listing, { onConflict: 'id' });

        if (error) {
          results.push({
            success: false,
            entry: trimmedEntry,
            address: listing.address,
            error: error.message
          });
        } else {
          results.push({
            success: true,
            entry: trimmedEntry,
            address: listing.address
          });
        }

        // Rate limit: 300ms between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        results.push({
          success: false,
          entry: trimmedEntry,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      total: entries.length,
      successCount,
      failureCount,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
