export interface Listing {
  id: string;
  address: string;
  county: string;
  url: string;
  estimatedPrice: number;
  pricePerSqFt: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  yearBuilt: number;
  lotSize: number;
  walkScore: number;
  schoolRating: number;
  hoaFees: number;
  annualPropertyTax: number;
  sellerBroker: string;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  isNew?: boolean;
  listedDate?: string; // ISO date string for when the listing was added
  daysOnMarket?: number; // Days the listing has been on Zillow
  photoUrl?: string;
  photoUrls?: string[];
  // Property features
  propertyType: 'ranch' | 'condo' | 'townhouse' | 'single-family' | 'multi-story';
  isSingleFloor: boolean;
  hasBackyard: boolean;
  hasPool: boolean;
  contractStatus: 'available' | 'pending' | 'sold';
  // Rent vs Buy
  listingType: 'sale' | 'rent' | 'both';
  monthlyRent?: number;
  securityDeposit?: number;
  leaseTerms?: string;
  // Value score
  valueScore?: number;
  valueTier?: 'exceptional' | 'great' | 'good' | null;
}
export interface FilterState {
  propertyTypes: ('ranch' | 'condo' | 'townhouse')[];
  showSingleFloorOnly: boolean;
  contractStatus: 'available' | 'pending' | 'all';
  hasBackyard: boolean | null;
  hasPool: boolean | null;
  priceRange: [number, number]; // For buy mode: $0 - $2M
  rentPriceRange: [number, number]; // For rent mode: $0 - $15k/month
  counties: string[];
  listingType: 'sale' | 'rent' | 'both' | 'all';
  sortBy: 'price-low' | 'price-high' | 'newest';
  maxDaysListed: number | null; // null = all, number = max days since listed
}
export type CompareMode = 'buy' | 'rent' | 'both';