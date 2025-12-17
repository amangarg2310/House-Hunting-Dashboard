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
  const headers = ['Address', 'County', 'Property Type', 'Grade', 'Price', 'Price/Sq Ft', 'Bedrooms', 'Bathrooms', 'Sq Ft', 'Year Built', 'Backyard', 'Pool', 'Contract Status', 'Walk Score', 'School Rating', 'Value Score'];
  const rows = listings.map(l => [l.address, l.county, l.propertyType, l.grade || 'Ungraded', l.estimatedPrice, l.pricePerSqFt, l.bedrooms, l.bathrooms, l.squareFootage, l.yearBuilt, l.hasBackyard ? 'Yes' : 'No', l.hasPool ? 'Yes' : 'No', l.contractStatus, l.walkScore, l.schoolRating, l.valueScore || 0]);
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csv], {
    type: 'text/csv'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `house-hunting-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}