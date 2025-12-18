import React, { useState } from 'react';
import { Listing } from '../types/listing';
import { ListingCard } from './ListingCard';
import { ImportPropertyModal } from './ImportPropertyModal';
import { SearchIcon, FilterIcon, UploadIcon } from 'lucide-react';
interface AllPropertiesViewProps {
  listings: Listing[];
  onAssignGrade: (listingId: string, grade: 'A' | 'B' | 'C' | 'D' | 'F') => void;
  compareMode: 'buy' | 'rent' | 'both';
  onCompareModeChange: (mode: 'buy' | 'rent' | 'both') => void;
  onRefreshListings?: () => void;
}
type HistoricalFilter = 'all' | 'graded' | 'ungraded';
export function AllPropertiesView({
  listings,
  onAssignGrade,
  compareMode,
  onCompareModeChange,
  onRefreshListings
}: AllPropertiesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [historicalFilter, setHistoricalFilter] = useState<HistoricalFilter>('all');
  const [showImportModal, setShowImportModal] = useState(false);
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

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <UploadIcon className="w-4 h-4" />
            Import
          </button>

          <div className="flex items-center gap-2">
            <FilterIcon className="w-4 h-4 text-gray-500" />
            <select value={historicalFilter} onChange={e => setHistoricalFilter(e.target.value as HistoricalFilter)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All ({listings.length})</option>
              <option value="graded">Graded ({gradedCount})</option>
              <option value="ungraded">Ungraded ({ungradedCount})</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Showing {filteredListings.length} properties</span>

          {/* Buy/Rent/Both Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button onClick={() => onCompareModeChange('buy')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${compareMode === 'buy' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                Buy
              </button>
              <button onClick={() => onCompareModeChange('rent')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${compareMode === 'rent' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                Rent
              </button>
              <button onClick={() => onCompareModeChange('both')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${compareMode === 'both' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                Both
              </button>
            </div>
          </div>
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

      {/* Import Modal */}
      <ImportPropertyModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          if (onRefreshListings) {
            onRefreshListings();
          }
        }}
      />
    </div>;
}