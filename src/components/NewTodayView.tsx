import React from 'react';
import { Listing } from '../types/listing';
import { ListingCard } from './ListingCard';
import { CheckCircleIcon } from 'lucide-react';
interface NewTodayViewProps {
  listings: Listing[];
  onAssignGrade: (listingId: string, grade: 'A' | 'B' | 'C' | 'D' | 'F') => void;
  compareMode: 'buy' | 'rent' | 'both';
}
export function NewTodayView({
  listings,
  onAssignGrade,
  compareMode
}: NewTodayViewProps) {
  // Filter listings from last 24 hours based on listedDate
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const newListings = listings.filter(l => {
    if (!l.listedDate) return l.isNew; // Fallback to isNew flag if no date
    const listedDate = new Date(l.listedDate);
    return listedDate >= yesterday;
  });

  const ungradedNew = newListings.filter(l => !l.grade);
  const gradedNew = newListings.filter(l => l.grade);
  const progress = newListings.length > 0 ? Math.round(gradedNew.length / newListings.length * 100) : 0;
  return <div className="h-full flex flex-col">
      {/* Progress Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              New Listings Today
            </h2>
            <p className="text-sm text-gray-500">
              {gradedNew.length} of {newListings.length} graded
            </p>
          </div>
          {progress === 100 && newListings.length > 0 && <div className="flex items-center gap-2 text-green-600">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">All graded!</span>
            </div>}
        </div>

        {/* Progress Bar */}
        {newListings.length > 0 && <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{
          width: `${progress}%`
        }} />
          </div>}
      </div>

      {/* Listings Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {newListings.length === 0 ? <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">
                No new listings today
              </p>
              <p className="text-gray-400 text-sm">
                Check back tomorrow for fresh properties
              </p>
            </div>
          </div> : <>
            {/* Ungraded Section */}
            {ungradedNew.length > 0 && <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded">
                    {ungradedNew.length}
                  </span>
                  To Review
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ungradedNew.map(listing => <ListingCard key={listing.id} listing={listing} onAssignGrade={grade => onAssignGrade(listing.id, grade)} compareMode={compareMode} />)}
                </div>
              </div>}

            {/* Graded Section */}
            {gradedNew.length > 0 && <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4" />
                  Already Graded ({gradedNew.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                  {gradedNew.map(listing => <ListingCard key={listing.id} listing={listing} onAssignGrade={grade => onAssignGrade(listing.id, grade)} compareMode={compareMode} />)}
                </div>
              </div>}
          </>}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <p className="text-xs text-gray-500">
          <span className="font-semibold">Tip:</span> Use keyboard shortcuts:
          <kbd className="mx-1 px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">
            1
          </kbd>{' '}
          for A,
          <kbd className="mx-1 px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">
            2
          </kbd>{' '}
          for B,
          <kbd className="mx-1 px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">
            3
          </kbd>{' '}
          for C,
          <kbd className="mx-1 px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">
            4
          </kbd>{' '}
          for D,
          <kbd className="mx-1 px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">
            5
          </kbd>{' '}
          for F
        </p>
      </div>
    </div>;
}