import React, { useState } from 'react';
import { Listing } from '../types/listing';
import { ListingCard } from './ListingCard';
import { SearchIcon, FilterIcon } from 'lucide-react';
interface AllPropertiesViewProps {
  listings: Listing[];
  onAssignGrade: (listingId: string, grade: 'A' | 'B' | 'C' | 'D' | 'F') => void;
  compareMode: 'buy' | 'rent' | 'both';
}
type HistoricalFilter = 'all' | 'graded' | 'ungraded';
export function AllPropertiesView({
  listings,
  onAssignGrade,
  compareMode
}: AllPropertiesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [historicalFilter, setHistoricalFilter] = useState<HistoricalFilter>('all');
  const filteredListings = listings.filter(listing => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!listing.address.toLowerCase().includes(query) && !listing.county.toLowerCase().includes(query)) {
        return false;
      }
    }
    // Historical filter
    if (historicalFilter === 'graded' && !listing.grade) {
      return false;
    }
    if (historicalFilter === 'ungraded' && listing.grade) {
      return false;
    }
    return true;
  });
  const gradedCount = listings.filter(l => l.grade).length;
  const ungradedCount = listings.filter(l => !l.grade).length;
  return <div className="h-full flex flex-col">
      {/* Search & Filter Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search by address or county..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex items-center gap-2">
            <FilterIcon className="w-4 h-4 text-gray-500" />
            <select value={historicalFilter} onChange={e => setHistoricalFilter(e.target.value as HistoricalFilter)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All ({listings.length})</option>
              <option value="graded">Graded ({gradedCount})</option>
              <option value="ungraded">Ungraded ({ungradedCount})</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Showing {filteredListings.length} properties</span>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredListings.length === 0 ? <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">No properties found</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your search or filters
              </p>
            </div>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => <ListingCard key={listing.id} listing={listing} onAssignGrade={grade => onAssignGrade(listing.id, grade)} compareMode={compareMode} />)}
          </div>}
      </div>
    </div>;
}