import { Listing } from '../types/listing';
const STORAGE_KEY = 'house-hunting-grades';
export interface GradedListing {
  listing: Listing;
  gradedAt: string;
  notes?: string;
}
export interface StoredData {
  gradedListings: GradedListing[];
  lastReviewDate: string;
}
export function saveGradedListing(listing: Listing): void {
  const data = loadStoredData();

  // Remove existing grade for this listing if it exists
  const filtered = data.gradedListings.filter(g => g.listing.id !== listing.id);

  // Add new grade
  filtered.push({
    listing,
    gradedAt: new Date().toISOString()
  });
  data.gradedListings = filtered;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
export function loadStoredData(): StoredData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      gradedListings: [],
      lastReviewDate: new Date().toISOString()
    };
  }
  return JSON.parse(stored);
}
export function updateLastReviewDate(): void {
  const data = loadStoredData();
  data.lastReviewDate = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
export function exportToCSV(listings: Listing[]): void {
  const headers = [
    'Grade',
    'Address',
    'City',
    'Price',
    'Bedrooms',
    'Bathrooms',
    'Sq Ft',
    'Price/Sq Ft',
    'Year Built',
    'Property Type',
    'Backyard',
    'Pool',
    'Days Listed',
    'HOA/Month',
    'School Rating',
    'Listing URL'
  ];

  const rows = listings.map(l => {
    return [
      l.grade || 'Ungraded',
      `"${l.address}"`, // Quoted to handle commas
      l.county,
      l.estimatedPrice ? `$${l.estimatedPrice.toLocaleString()}` : 'N/A',
      l.bedrooms || 0,
      l.bathrooms || 0,
      l.squareFootage || 'N/A',
      l.pricePerSqFt ? `$${l.pricePerSqFt}` : 'N/A',
      l.yearBuilt || 'N/A',
      l.propertyType,
      l.hasBackyard ? 'Yes' : 'No',
      l.hasPool ? 'Yes' : 'No',
      l.daysOnMarket !== undefined && l.daysOnMarket !== null ? l.daysOnMarket : 'N/A',
      l.hoaFees ? `$${l.hoaFees}` : 'N/A',
      l.schoolRating || 'N/A',
      l.url || 'N/A'
    ];
  });

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csv], {
    type: 'text/csv'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `house-hunting-A-B-tier-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}