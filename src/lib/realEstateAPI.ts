import axios from 'axios';
import type { Listing } from '../types/listing';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'realty-in-us.p.rapidapi.com';

// Atlanta area configuration
const ATLANTA_COUNTIES = ['Fulton', 'Cobb', 'DeKalb', 'Forsyth', 'Gwinnett', 'Cherokee'];
const ATLANTA_STATE = 'GA';

interface RealtyAPIProperty {
  property_id?: string;
  list_price?: number;
  price_per_sqft?: number;
  location?: {
    address?: {
      line?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      county?: string;
    };
  };
  description?: {
    beds?: number;
    baths?: number;
    sqft?: number;
    lot_sqft?: number;
    year_built?: number;
    type?: string;
  };
  photos?: Array<{ href?: string }>;
  list_date?: string;
  status?: string;
  href?: string;
}

/**
 * Fetch properties for sale in Atlanta area (single-floor only)
 */
export async function fetchAtlantaProperties(limit: number = 50): Promise<Listing[]> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not configured. Please add it to your .env file.');
  }

  try {
    const listings: Listing[] = [];

    // Search for properties in Atlanta area
    // Note: Realty in US API endpoints - adjust based on actual API docs
    const response = await axios.get(`https://${RAPIDAPI_HOST}/properties/v2/list-for-sale`, {
      params: {
        state_code: ATLANTA_STATE,
        city: 'Atlanta',
        limit: limit,
        offset: 0,
        sort: 'relevance',
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    const properties: RealtyAPIProperty[] = response.data?.properties || [];

    for (const prop of properties) {
      // Transform API response to our Listing interface
      const listing = transformAPIPropertyToListing(prop);

      // Filter: Only include single-floor properties
      if (listing && listing.isSingleFloor) {
        listings.push(listing);
      }
    }

    return listings;
  } catch (error) {
    console.error('Error fetching properties from Realty API:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    throw new Error('Failed to fetch properties. Please check your API key and quota.');
  }
}

/**
 * Transform Realty in US API property to our Listing interface
 */
function transformAPIPropertyToListing(prop: RealtyAPIProperty): Listing | null {
  try {
    const address = prop.location?.address;
    const description = prop.description;

    if (!address?.line || !prop.list_price) {
      return null; // Skip properties without address or price
    }

    // Determine property type and if it's single floor
    const propertyTypeRaw = description?.type?.toLowerCase() || '';
    const { propertyType, isSingleFloor } = determinePropertyType(propertyTypeRaw, description?.beds || 0);

    // Determine county (default to Fulton if not available)
    const county = address.county || 'Fulton';

    // Generate a unique ID
    const id = prop.property_id || `${address.line}-${address.postal_code}`.replace(/\s+/g, '-');

    // Calculate values
    const squareFootage = description?.sqft || 0;
    const pricePerSqFt = squareFootage > 0 ? prop.list_price / squareFootage : 0;

    // Extract photos
    const photoUrls = prop.photos?.map(p => p.href).filter(Boolean) as string[] | undefined;
    const photoUrl = photoUrls?.[0];

    // Estimate HOA fees, taxes, walk score, school rating
    const hoaFees = estimateHOAFees(propertyType);
    const annualPropertyTax = Math.round(prop.list_price * 0.0095); // ~0.95% property tax in GA
    const walkScore = estimateWalkScore(address.city || '');
    const schoolRating = 7; // Default middle rating

    const listing: Listing = {
      id,
      address: `${address.line}, ${address.city}, ${address.state} ${address.postal_code}`,
      county,
      url: prop.href || '',
      estimatedPrice: prop.list_price,
      pricePerSqFt: Math.round(pricePerSqFt),
      bedrooms: description?.beds || 0,
      bathrooms: description?.baths || 0,
      squareFootage,
      yearBuilt: description?.year_built || 2000,
      lotSize: description?.lot_sqft || 0,
      walkScore,
      schoolRating,
      hoaFees,
      annualPropertyTax,
      sellerBroker: 'Unknown',
      photoUrl,
      photoUrls,
      propertyType,
      isSingleFloor,
      hasBackyard: estimateBackyard(propertyType, description?.lot_sqft || 0),
      hasPool: false, // Hard to determine from basic API data
      contractStatus: mapContractStatus(prop.status),
      listingType: 'sale',
      listedDate: prop.list_date || new Date().toISOString(),
    };

    return listing;
  } catch (error) {
    console.error('Error transforming property:', error);
    return null;
  }
}

/**
 * Determine property type and if it's single floor living
 */
function determinePropertyType(
  typeRaw: string,
  bedrooms: number
): { propertyType: Listing['propertyType']; isSingleFloor: boolean } {
  // Single floor types (what we want!)
  if (typeRaw.includes('ranch') || typeRaw.includes('rambler')) {
    return { propertyType: 'ranch', isSingleFloor: true };
  }
  if (typeRaw.includes('condo') || typeRaw.includes('apartment')) {
    return { propertyType: 'condo', isSingleFloor: true };
  }
  if (typeRaw.includes('townhouse') || typeRaw.includes('townhome')) {
    // Townhouses can be single or multi-floor, default to multi
    // In real implementation, would need additional data
    return { propertyType: 'townhouse', isSingleFloor: false };
  }

  // Multi-level types (filter these out)
  if (typeRaw.includes('two-story') || typeRaw.includes('multi-level') || typeRaw.includes('split-level')) {
    return { propertyType: 'multi-story', isSingleFloor: false };
  }

  // Default: assume single-family, likely multi-story if 3+ bedrooms
  const isSingleFloor = bedrooms <= 2;
  return { propertyType: 'single-family', isSingleFloor };
}

/**
 * Map API status to our contract status
 */
function mapContractStatus(status?: string): Listing['contractStatus'] {
  const statusLower = (status || '').toLowerCase();
  if (statusLower.includes('pending') || statusLower.includes('contingent')) {
    return 'pending';
  }
  if (statusLower.includes('sold')) {
    return 'sold';
  }
  return 'available';
}

/**
 * Estimate HOA fees based on property type
 */
function estimateHOAFees(propertyType: string): number {
  switch (propertyType) {
    case 'condo':
      return 350; // Condos typically have higher HOA
    case 'townhouse':
      return 200;
    case 'ranch':
      return 100;
    default:
      return 0;
  }
}

/**
 * Estimate walk score based on city/area
 */
function estimateWalkScore(city: string): number {
  const cityLower = city.toLowerCase();
  if (cityLower.includes('atlanta') || cityLower.includes('decatur')) {
    return 70; // Urban areas
  }
  if (cityLower.includes('alpharetta') || cityLower.includes('roswell')) {
    return 40; // Suburban
  }
  return 30; // Default suburban/rural
}

/**
 * Estimate if property has backyard based on type and lot size
 */
function estimateBackyard(propertyType: string, lotSize: number): boolean {
  if (propertyType === 'condo') {
    return false; // Condos rarely have yards
  }
  if (lotSize > 5000) {
    return true; // Decent lot size = likely has yard
  }
  if (propertyType === 'ranch' && lotSize > 3000) {
    return true;
  }
  return false;
}

/**
 * Fetch a single property by ID (for updates)
 */
export async function fetchPropertyById(propertyId: string): Promise<Listing | null> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not configured');
  }

  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/properties/v2/detail`, {
      params: {
        property_id: propertyId,
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    return transformAPIPropertyToListing(response.data);
  } catch (error) {
    console.error('Error fetching property detail:', error);
    return null;
  }
}
