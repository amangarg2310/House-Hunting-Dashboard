import React from 'react';
import { FilterState, CompareMode } from '../types/listing';
import { XIcon, DollarSignIcon, HomeIcon, BuildingIcon, Building2Icon } from 'lucide-react';
interface FilterSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onClearFilters: () => void;
  compareMode: CompareMode;
}
const COUNTIES = ['Atlanta', 'Alpharetta', 'Roswell', 'Johns Creek', 'Sandy Springs', 'Cumming', 'Buckhead', 'Vinings', 'Dunwoody', 'Marietta', 'Smyrna', 'Athens', 'Gainesville', 'Forsyth', 'Canton', 'Milton', 'Duluth', 'Kennesaw', 'Decatur', 'Suwanee', 'Midtown', 'Virginia-Highland', 'Inman Park', 'Old Fourth Ward', 'Brookhaven', 'Druid Hills', 'Grant Park', 'East Atlanta'];
const PROPERTY_TYPES = [{
  value: 'ranch' as const,
  label: 'Ranch',
  icon: HomeIcon
}, {
  value: 'condo' as const,
  label: 'Condo',
  icon: BuildingIcon
}, {
  value: 'townhouse' as const,
  label: 'Townhouse',
  icon: Building2Icon
}];
export function FilterSidebar({
  filters,
  setFilters,
  onClearFilters,
  compareMode
}: FilterSidebarProps) {
  const selectPropertyType = (type: 'ranch' | 'condo' | 'townhouse' | null) => {
    setFilters(prev => ({
      ...prev,
      propertyTypes: type === null ? [] : [type]
    }));
  };
  const toggleCounty = (county: string) => {
    setFilters(prev => ({
      ...prev,
      counties: prev.counties.includes(county) ? prev.counties.filter(c => c !== county) : [...prev.counties, county]
    }));
  };
  return <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button onClick={onClearFilters} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <XIcon className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {/* Days Listed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Days Listed
          </label>
          <select
            value={filters.maxDaysListed || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, maxDaysListed: e.target.value === 'all' ? null : parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Listings</option>
            <option value="7">Past 7 Days</option>
            <option value="14">Past 14 Days</option>
            <option value="30">Past 30 Days</option>
            <option value="60">Past 60 Days</option>
            <option value="90">Past 90 Days</option>
            <option value="180">Past 6 Months</option>
            <option value="365">Past Year</option>
          </select>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Property Type
          </label>
          <div className="space-y-2">
            <button onClick={() => selectPropertyType(null)} className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${filters.propertyTypes.length === 0 ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <span className={`text-sm font-medium ${filters.propertyTypes.length === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                All Types
              </span>
            </button>
            {PROPERTY_TYPES.map(type => {
            const Icon = type.icon;
            const isSelected = filters.propertyTypes.includes(type.value);
            return <button key={type.value} onClick={() => selectPropertyType(type.value)} className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {type.label}
                  </span>
                </button>;
          })}
          </div>
        </div>

        {/* Price Range - Buy Mode */}
        {(compareMode === 'buy' || compareMode === 'both') && <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <DollarSignIcon className="w-4 h-4 text-gray-600" />
            {compareMode === 'both' ? 'Buy Price Range' : 'Price Range'}
          </label>
          <div className="space-y-3">
            <div className="relative pt-1">
              {/* Background track */}
              <div className="absolute w-full h-2 bg-gray-200 rounded-lg"></div>
              {/* Active range fill */}
              <div className="absolute h-2 bg-blue-600 rounded-lg" style={{
                left: `${((filters.priceRange[0] - 650000) / (2000000 - 650000)) * 100}%`,
                right: `${100 - ((filters.priceRange[1] - 650000) / (2000000 - 650000)) * 100}%`
              }}></div>
              {/* Min Price Slider */}
              <input type="range" min="650000" max="2000000" step="50000" value={filters.priceRange[0]} onChange={e => {
                const newMin = parseInt(e.target.value);
                setFilters(prev => ({
                  ...prev,
                  priceRange: [Math.min(newMin, prev.priceRange[1]), prev.priceRange[1]]
                }));
              }} className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md" style={{zIndex: 3}} />
              {/* Max Price Slider */}
              <input type="range" min="650000" max="2000000" step="50000" value={filters.priceRange[1]} onChange={e => {
                const newMax = parseInt(e.target.value);
                setFilters(prev => ({
                  ...prev,
                  priceRange: [prev.priceRange[0], Math.max(newMax, prev.priceRange[0])]
                }));
              }} className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md" style={{zIndex: 4}} />
              <div className="h-2"></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">
                {filters.priceRange[0] >= 1000000
                  ? `$${(filters.priceRange[0] / 1000000).toFixed(1)}M`
                  : `$${(filters.priceRange[0] / 1000).toFixed(0)}k`
                }
              </span>
              <span className="text-xs text-gray-500">to</span>
              <span className="text-sm font-bold text-gray-900">
                {filters.priceRange[1] >= 1000000
                  ? `$${(filters.priceRange[1] / 1000000).toFixed(1)}M`
                  : `$${(filters.priceRange[1] / 1000).toFixed(0)}k`
                }
              </span>
            </div>
          </div>
        </div>}

        {/* Price Range - Rent Mode */}
        {(compareMode === 'rent' || compareMode === 'both') && <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <DollarSignIcon className="w-4 h-4 text-gray-600" />
            {compareMode === 'both' ? 'Rent Price Range' : 'Monthly Rent Range'}
          </label>
          <div className="space-y-3">
            <div className="relative pt-1">
              {/* Background track */}
              <div className="absolute w-full h-2 bg-gray-200 rounded-lg"></div>
              {/* Active range fill */}
              <div className="absolute h-2 bg-green-600 rounded-lg" style={{
                left: `${((filters.rentPriceRange[0] - 3000) / (10000 - 3000)) * 100}%`,
                right: `${100 - ((filters.rentPriceRange[1] - 3000) / (10000 - 3000)) * 100}%`
              }}></div>
              {/* Min Price Slider */}
              <input type="range" min="3000" max="10000" step="100" value={filters.rentPriceRange[0]} onChange={e => {
                const newMin = parseInt(e.target.value);
                setFilters(prev => ({
                  ...prev,
                  rentPriceRange: [Math.min(newMin, prev.rentPriceRange[1]), prev.rentPriceRange[1]]
                }));
              }} className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md" style={{zIndex: 3}} />
              {/* Max Price Slider */}
              <input type="range" min="3000" max="10000" step="100" value={filters.rentPriceRange[1]} onChange={e => {
                const newMax = parseInt(e.target.value);
                setFilters(prev => ({
                  ...prev,
                  rentPriceRange: [prev.rentPriceRange[0], Math.max(newMax, prev.rentPriceRange[0])]
                }));
              }} className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md" style={{zIndex: 4}} />
              <div className="h-2"></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">
                ${filters.rentPriceRange[0].toLocaleString()}/mo
              </span>
              <span className="text-xs text-gray-500">to</span>
              <span className="text-sm font-bold text-gray-900">
                ${filters.rentPriceRange[1].toLocaleString()}/mo
              </span>
            </div>
          </div>
        </div>}

        {/* Cities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cities
          </label>
          <div className="space-y-2">
            {COUNTIES.map(county => <label key={county} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.counties.includes(county)} onChange={() => toggleCounty(county)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">{county}</span>
              </label>)}
          </div>
        </div>
      </div>
    </div>;
}