import { supabase } from './supabase';
import type { Listing } from '../types/listing';
import { calculateValueScore } from '../utils/valueCalculator';

/**
 * Convert database snake_case to Listing camelCase
 */
function dbRowToListing(row: any): Listing {
  const listing: Listing = {
    id: row.id,
    address: row.address,
    county: row.county,
    url: row.url || '',
    estimatedPrice: row.estimated_price,
    pricePerSqFt: row.price_per_sqft || 0,
    bedrooms: row.bedrooms || 0,
    bathrooms: row.bathrooms || 0,
    squareFootage: row.square_footage || 0,
    yearBuilt: row.year_built || 0,
    lotSize: row.lot_size || 0,
    walkScore: row.walk_score || 0,
    schoolRating: row.school_rating || 0,
    hoaFees: row.hoa_fees || 0,
    annualPropertyTax: row.annual_property_tax || 0,
    sellerBroker: row.seller_broker || '',
    photoUrl: row.photo_url,
    photoUrls: row.photo_urls || [],
    propertyType: row.property_type as Listing['propertyType'],
    isSingleFloor: row.is_single_floor,
    hasBackyard: row.has_backyard,
    hasPool: row.has_pool,
    contractStatus: row.contract_status as Listing['contractStatus'],
    listingType: row.listing_type as Listing['listingType'],
    monthlyRent: row.monthly_rent,
    securityDeposit: row.security_deposit,
    leaseTerms: row.lease_terms,
    valueScore: row.value_score,
    valueTier: row.value_tier as Listing['valueTier'],
    listedDate: row.listed_date,
    daysOnMarket: row.days_on_market,
  };

  return listing;
}

/**
 * Convert Listing to database snake_case
 */
function listingToDbRow(listing: Listing): any {
  return {
    id: listing.id,
    address: listing.address,
    county: listing.county,
    url: listing.url,
    estimated_price: listing.estimatedPrice,
    price_per_sqft: listing.pricePerSqFt,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    square_footage: listing.squareFootage,
    year_built: listing.yearBuilt,
    lot_size: listing.lotSize,
    walk_score: listing.walkScore,
    school_rating: listing.schoolRating,
    hoa_fees: listing.hoaFees,
    annual_property_tax: listing.annualPropertyTax,
    seller_broker: listing.sellerBroker,
    photo_url: listing.photoUrl,
    photo_urls: listing.photoUrls,
    property_type: listing.propertyType,
    is_single_floor: listing.isSingleFloor,
    has_backyard: listing.hasBackyard,
    has_pool: listing.hasPool,
    contract_status: listing.contractStatus,
    listing_type: listing.listingType,
    monthly_rent: listing.monthlyRent,
    security_deposit: listing.securityDeposit,
    lease_terms: listing.leaseTerms,
    value_score: listing.valueScore,
    value_tier: listing.valueTier,
    listed_date: listing.listedDate || new Date().toISOString(),
    days_on_market: listing.daysOnMarket || 0,
  };
}

/**
 * Fetch all listings from database
 */
export async function fetchAllListings(): Promise<Listing[]> {
  try {
    // Fetch all listings without limit (Supabase defaults to 1000)
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('listed_date', { ascending: false })
      .limit(10000); // Set high limit to get all properties

    if (error) {
      console.error('Error fetching listings:', error);
      throw new Error(`Failed to fetch listings: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(dbRowToListing);
  } catch (error) {
    console.error('Error in fetchAllListings:', error);
    return [];
  }
}

/**
 * Fetch listings added in the last 24 hours (New Today)
 */
export async function fetchNewListings(): Promise<Listing[]> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .gte('listed_date', yesterday.toISOString())
      .order('listed_date', { ascending: false });

    if (error) {
      console.error('Error fetching new listings:', error);
      throw new Error(`Failed to fetch new listings: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(dbRowToListing);
  } catch (error) {
    console.error('Error in fetchNewListings:', error);
    return [];
  }
}

/**
 * Save a listing to database (insert or update)
 */
export async function saveListing(listing: Listing): Promise<void> {
  try {
    // Calculate value score before saving
    const valueData = calculateValueScore(listing);
    const listingWithValue = {
      ...listing,
      valueScore: valueData.total,
      valueTier: valueData.tier,
    };

    const dbRow = listingToDbRow(listingWithValue);

    const { error } = await supabase
      .from('listings')
      .upsert(dbRow, { onConflict: 'id' });

    if (error) {
      console.error('Error saving listing:', error);
      throw new Error(`Failed to save listing: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in saveListing:', error);
    throw error;
  }
}

/**
 * Save multiple listings (bulk insert)
 */
export async function saveListings(listings: Listing[]): Promise<void> {
  try {
    // Calculate value scores for all listings
    const listingsWithValues = listings.map(listing => {
      const valueData = calculateValueScore(listing);
      return {
        ...listing,
        valueScore: valueData.total,
        valueTier: valueData.tier,
      };
    });

    const dbRows = listingsWithValues.map(listingToDbRow);

    const { error } = await supabase
      .from('listings')
      .upsert(dbRows, { onConflict: 'id' });

    if (error) {
      console.error('Error saving listings:', error);
      throw new Error(`Failed to save listings: ${error.message}`);
    }

    console.log(`Successfully saved ${listings.length} listings`);
  } catch (error) {
    console.error('Error in saveListings:', error);
    throw error;
  }
}

/**
 * Delete old listings (older than X days)
 */
export async function deleteOldListings(daysOld: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('listings')
      .delete()
      .lt('listed_date', cutoffDate.toISOString())
      .select();

    if (error) {
      console.error('Error deleting old listings:', error);
      throw new Error(`Failed to delete old listings: ${error.message}`);
    }

    const deletedCount = data?.length || 0;
    console.log(`Deleted ${deletedCount} listings older than ${daysOld} days`);

    return deletedCount;
  } catch (error) {
    console.error('Error in deleteOldListings:', error);
    return 0;
  }
}

/**
 * Get total listing count
 */
export async function getListingCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting listing count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getListingCount:', error);
    return 0;
  }
}
