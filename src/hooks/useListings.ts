import { useState, useMemo, useEffect } from 'react';
import { Listing, FilterState, CompareMode } from '../types/listing';
import { fetchAllListings } from '../lib/listings';
import { saveGrade, removeGrade, fetchAllGrades, clearAllGrades } from '../lib/grades';
import { mockListings } from '../utils/mockData';

// Check if we're in demo mode (no real API credentials)
const DEMO_MODE = import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co' ||
                  import.meta.env.VITE_SUPABASE_URL === undefined;

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [grades, setGrades] = useState<Map<string, 'A' | 'B' | 'C' | 'D' | 'F'>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<CompareMode>('both');
  const [filters, setFilters] = useState<FilterState>({
    propertyTypes: [],
    showSingleFloorOnly: true,
    contractStatus: 'all',
    hasBackyard: null,
    hasPool: null,
    priceRange: [0, 2000000],
    rentPriceRange: [0, 15000],
    counties: [],
    listingType: 'all',
    sortBy: 'price-low',
    maxDaysListed: null
  });

  // Load listings and grades (from Supabase or mock data)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        if (DEMO_MODE) {
          // Demo mode: use mock data
          console.log('🎭 Running in DEMO MODE - using mock data');
          console.log('💡 To use real data, update your .env file with Supabase credentials');

          setListings(mockListings);

          // Load grades from localStorage for demo mode
          const savedGrades = localStorage.getItem('demo_grades');
          if (savedGrades) {
            const gradesObj = JSON.parse(savedGrades);
            setGrades(new Map(Object.entries(gradesObj)));
          }
        } else {
          // Production mode: fetch from Supabase
          console.log('🚀 Running in PRODUCTION MODE - fetching from Supabase');

          const [listingsData, gradesData] = await Promise.all([
            fetchAllListings(),
            fetchAllGrades()
          ]);

          setListings(listingsData);
          setGrades(gradesData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Merge listings with grades
  const listingsWithGrades = useMemo(() => {
    return listings.map(listing => ({
      ...listing,
      grade: grades.get(listing.id)
    }));
  }, [listings, grades]);

  // Apply filters and sort
  const filteredListings = useMemo(() => {
    const filtered = listingsWithGrades.filter(listing => {
      // Property type filter
      if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(listing.propertyType as any)) {
        return false;
      }

      // Single floor filter
      if (filters.showSingleFloorOnly && !listing.isSingleFloor) {
        return false;
      }

      // Contract status
      if (filters.contractStatus !== 'all' && listing.contractStatus !== filters.contractStatus) {
        return false;
      }

      // Backyard
      if (filters.hasBackyard !== null && listing.hasBackyard !== filters.hasBackyard) {
        return false;
      }

      // Pool
      if (filters.hasPool !== null && listing.hasPool !== filters.hasPool) {
        return false;
      }

      // Price range - use appropriate range based on compareMode
      if (compareMode === 'buy' || compareMode === 'both') {
        // Check buy price range for sale properties
        if (listing.listingType === 'sale' || listing.listingType === 'both') {
          const price = listing.estimatedPrice;
          if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
            return false;
          }
        }
      }

      if (compareMode === 'rent' || compareMode === 'both') {
        // Check rent price range for rent properties
        if (listing.listingType === 'rent' || listing.listingType === 'both') {
          const monthlyRent = listing.monthlyRent || 0;
          if (monthlyRent < filters.rentPriceRange[0] || monthlyRent > filters.rentPriceRange[1]) {
            return false;
          }
        }
      }

      // Counties
      if (filters.counties.length > 0 && !filters.counties.includes(listing.county)) {
        return false;
      }

      // Days listed filter - use daysOnMarket field
      if (filters.maxDaysListed !== null && listing.daysOnMarket !== undefined) {
        if (listing.daysOnMarket > filters.maxDaysListed) {
          return false;
        }
      }

      // Listing type based on compareMode
      if (compareMode === 'buy') {
        // Buy mode: show only for-sale and both
        if (listing.listingType === 'rent') {
          return false;
        }
      } else if (compareMode === 'rent') {
        // Rent mode: show only for-rent and both
        if (listing.listingType === 'sale') {
          return false;
        }
      }
      // compareMode === 'both' shows all listing types

      // Additional listing type filter from filters
      if (filters.listingType !== 'all') {
        if (filters.listingType === 'sale' && listing.listingType === 'rent') {
          return false;
        }
        if (filters.listingType === 'rent' && listing.listingType === 'sale') {
          return false;
        }
        if (filters.listingType === 'both' && listing.listingType !== 'both') {
          return false;
        }
      }
      return true;
    });

    // Sort based on selected sort option
    return filtered.sort((a, b) => {
      let aPrice = a.estimatedPrice;
      let bPrice = b.estimatedPrice;

      // Use monthly rent for price comparison in rent mode
      if (compareMode === 'rent' && a.monthlyRent) aPrice = a.monthlyRent * 12;
      if (compareMode === 'rent' && b.monthlyRent) bPrice = b.monthlyRent * 12;

      switch (filters.sortBy) {
        case 'price-low':
          return aPrice - bPrice;
        case 'price-high':
          return bPrice - aPrice;
        case 'newest':
          const aDate = a.listedDate ? new Date(a.listedDate).getTime() : 0;
          const bDate = b.listedDate ? new Date(b.listedDate).getTime() : 0;
          return bDate - aDate;
        default:
          return 0;
      }
    });
  }, [listingsWithGrades, filters, compareMode]);

  // Assign or update a grade
  const assignGrade = async (listingId: string, grade: 'A' | 'B' | 'C' | 'D' | 'F') => {
    try {
      // Optimistically update local state
      setGrades(prev => {
        const newGrades = new Map(prev);
        newGrades.set(listingId, grade);

        // Save to localStorage in demo mode
        if (DEMO_MODE) {
          const gradesObj = Object.fromEntries(newGrades);
          localStorage.setItem('demo_grades', JSON.stringify(gradesObj));
        }

        return newGrades;
      });

      // Save to Supabase in production mode
      if (!DEMO_MODE) {
        await saveGrade(listingId, grade);
      }
    } catch (err) {
      console.error('Error assigning grade:', err);
      // Revert on error
      setGrades(prev => {
        const newGrades = new Map(prev);
        newGrades.delete(listingId);
        return newGrades;
      });
      alert('Failed to save grade. Please try again.');
    }
  };

  // Remove a grade
  const clearGrade = async (listingId: string) => {
    try {
      // Optimistically update local state
      setGrades(prev => {
        const newGrades = new Map(prev);
        newGrades.delete(listingId);

        // Update localStorage in demo mode
        if (DEMO_MODE) {
          const gradesObj = Object.fromEntries(newGrades);
          localStorage.setItem('demo_grades', JSON.stringify(gradesObj));
        }

        return newGrades;
      });

      // Remove from Supabase in production mode
      if (!DEMO_MODE) {
        await removeGrade(listingId);
      }
    } catch (err) {
      console.error('Error removing grade:', err);
      alert('Failed to remove grade. Please try again.');
    }
  };

  const clearFilters = () => {
    setFilters({
      propertyTypes: [],
      showSingleFloorOnly: true,
      contractStatus: 'all',
      hasBackyard: null,
      hasPool: null,
      priceRange: [0, 2000000],
      rentPriceRange: [0, 15000],
      counties: [],
      listingType: 'all',
      sortBy: 'price-low',
      maxDaysListed: null
    });
  };

  const toggleSingleFloor = () => {
    setFilters(prev => ({
      ...prev,
      showSingleFloorOnly: !prev.showSingleFloorOnly
    }));
  };

  // Calculate graded counts
  const gradedCounts = useMemo(() => {
    const counts = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0
    };

    for (const [, grade] of grades) {
      counts[grade]++;
    }

    return counts;
  }, [grades]);

  // Refresh data from Supabase (or reload mock data in demo mode)
  const refresh = async () => {
    try {
      setLoading(true);

      if (DEMO_MODE) {
        // Demo mode: reload mock data
        setListings(mockListings);
        const savedGrades = localStorage.getItem('demo_grades');
        if (savedGrades) {
          const gradesObj = JSON.parse(savedGrades);
          setGrades(new Map(Object.entries(gradesObj)));
        }
      } else {
        // Production mode: fetch from Supabase
        const [listingsData, gradesData] = await Promise.all([
          fetchAllListings(),
          fetchAllGrades()
        ]);
        setListings(listingsData);
        setGrades(gradesData);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Reset all grades
  const resetAllGrades = async () => {
    if (!confirm('Are you sure you want to reset ALL grades? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      if (DEMO_MODE) {
        // Demo mode: clear localStorage
        localStorage.removeItem('demo_grades');
        setGrades(new Map());
      } else {
        // Production mode: clear all grades from Supabase
        await clearAllGrades();
        setGrades(new Map());
      }
    } catch (err) {
      console.error('Error resetting all grades:', err);
      alert('Failed to reset all grades. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    listings: filteredListings,
    allListings: listingsWithGrades,
    filters,
    setFilters,
    assignGrade,
    clearGrade,
    clearFilters,
    compareMode,
    setCompareMode,
    toggleSingleFloor,
    gradedCounts,
    loading,
    error,
    refresh,
    resetAllGrades
  };
}
