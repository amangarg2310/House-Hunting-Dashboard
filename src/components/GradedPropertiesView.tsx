import React from 'react';
import { Listing } from '../types/listing';
import { ListingCard } from './ListingCard';
import { DownloadIcon } from 'lucide-react';
import { exportToCSV } from '../utils/localStorage';
interface GradedPropertiesViewProps {
  listings: Listing[];
  onAssignGrade: (listingId: string, grade: 'A' | 'B' | 'C' | 'D' | 'F') => void;
  compareMode: 'buy' | 'rent' | 'both';
}
const GRADE_TIERS = [{
  grade: 'A' as const,
  label: 'A Tier',
  color: 'bg-green-50 border-green-200',
  textColor: 'text-green-900'
}, {
  grade: 'B' as const,
  label: 'B Tier',
  color: 'bg-yellow-50 border-yellow-200',
  textColor: 'text-yellow-900'
}, {
  grade: 'C' as const,
  label: 'C Tier',
  color: 'bg-orange-50 border-orange-200',
  textColor: 'text-orange-900'
}, {
  grade: 'D' as const,
  label: 'D Tier',
  color: 'bg-red-50 border-red-200',
  textColor: 'text-red-900'
}, {
  grade: 'F' as const,
  label: 'F Tier',
  color: 'bg-red-100 border-red-300',
  textColor: 'text-red-900'
}];
export function GradedPropertiesView({
  listings,
  onAssignGrade,
  compareMode
}: GradedPropertiesViewProps) {
  const gradedListings = listings.filter(l => l.grade);
  const handleExport = () => {
    exportToCSV(gradedListings);
  };
  if (gradedListings.length === 0) {
    return <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No graded properties yet</p>
          <p className="text-gray-400 text-sm">
            Start grading properties in the "New Today" tab
          </p>
        </div>
      </div>;
  }
  return <div className="h-full flex flex-col">
      {/* Header Actions */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              My Graded Properties
            </h2>
            <p className="text-sm text-gray-500">
              {gradedListings.length} properties organized by grade
            </p>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors">
            <DownloadIcon className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Grade Tiers */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 min-w-max">
          {GRADE_TIERS.map(tier => {
          const tierListings = gradedListings.filter(l => l.grade === tier.grade);
          return <div key={tier.grade} className="flex-shrink-0 w-96">
                <div className={`rounded-lg border-2 ${tier.color} p-4 h-full`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${tier.textColor}`}>
                      {tier.label}
                    </h3>
                    <span className={`text-sm font-semibold ${tier.textColor}`}>
                      {tierListings.length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {tierListings.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">
                        No {tier.grade} grade properties
                      </div> : tierListings.map(listing => <ListingCard key={listing.id} listing={listing} onAssignGrade={grade => onAssignGrade(listing.id, grade)} compareMode={compareMode} />)}
                  </div>
                </div>
              </div>;
        })}
        </div>
      </div>
    </div>;
}