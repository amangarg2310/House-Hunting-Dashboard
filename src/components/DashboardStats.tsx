import React from 'react';
import { Listing, CompareMode } from '../types/listing';
import { HomeIcon } from 'lucide-react';
interface DashboardStatsProps {
  listings: Listing[];
  allListings: Listing[];
  compareMode: CompareMode;
  onCompareModeChange: (mode: CompareMode) => void;
  showSingleFloorOnly: boolean;
  onToggleSingleFloor: () => void;
}
export function DashboardStats({
  listings,
  allListings,
  compareMode,
  onCompareModeChange,
  showSingleFloorOnly,
  onToggleSingleFloor
}: DashboardStatsProps) {
  const totalCount = allListings.length;
  const newCount = allListings.filter(l => l.isNew).length;
  const gradedCount = allListings.filter(l => l.grade).length;
  const ungradedCount = allListings.filter(l => !l.grade).length;
  return <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Single Floor Toggle */}
        <button onClick={onToggleSingleFloor} className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${showSingleFloorOnly ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          <HomeIcon className="w-5 h-5" />
          Single Floor Only
        </button>

        {/* Center: Stats */}
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{totalCount}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{newCount}</div>
            <div className="text-xs text-gray-500">New</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {gradedCount}
            </div>
            <div className="text-xs text-gray-500">Graded</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {ungradedCount}
            </div>
            <div className="text-xs text-gray-500">Ungraded</div>
          </div>
        </div>

        {/* Right: Buy/Rent Toggle */}
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
    </div>;
}