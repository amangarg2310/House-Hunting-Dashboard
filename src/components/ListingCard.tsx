import React, { useState } from 'react';
import { Listing, CompareMode } from '../types/listing';
import { BedIcon, BathIcon, HomeIcon, MapPinIcon, DollarSignIcon, ChevronLeftIcon, ChevronRightIcon, TreesIcon, WavesIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';
interface ListingCardProps {
  listing: Listing;
  onAssignGrade: (grade: 'A' | 'B' | 'C' | 'D' | 'F') => void;
  compareMode: CompareMode;
}
const GRADE_COLORS = {
  A: 'bg-green-500',
  B: 'bg-yellow-500',
  C: 'bg-orange-500',
  D: 'bg-red-500',
  F: 'bg-red-600'
};
export function ListingCard({
  listing,
  onAssignGrade,
  compareMode
}: ListingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasBothPrices = listing.listingType === 'both';
  const images = listing.photoUrls || [listing.photoUrl || ''];
  const hasMultipleImages = images.length > 1;
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };
  const goToImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  };
  const openListing = () => {
    if (listing.url) {
      window.open(listing.url, '_blank');
    }
  };

  return <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image Carousel */}
      <div className="relative h-48 bg-gray-100 group cursor-pointer" onClick={openListing}>
        <img src={images[currentImageIndex]} alt={`${listing.address} - Image ${currentImageIndex + 1}`} className="w-full h-full object-cover" />

        {/* Navigation Arrows - Always visible on hover */}
        {hasMultipleImages && <>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-all z-10 opacity-0 group-hover:opacity-100">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-all z-10 opacity-0 group-hover:opacity-100">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </>}

        {/* Dot Indicators */}
        {hasMultipleImages && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => <button key={index} onClick={e => goToImage(index, e)} className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/75'}`} />)}
          </div>}

        {/* Status & Badges - Top Right */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {listing.isNew && <div className="bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded">
              NEW
            </div>}
        </div>

        {/* Grade Badge - Bottom Right */}
        {listing.grade && <div className={`absolute bottom-3 right-3 ${GRADE_COLORS[listing.grade]} text-white text-2xl font-bold w-12 h-12 rounded-full flex items-center justify-center shadow-lg`}>
            {listing.grade}
          </div>}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Address */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            {listing.address}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPinIcon className="w-3 h-3" />
            {listing.county} County
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-3 pb-3 border-b border-gray-100">
          {compareMode === 'both' ? (
            // Both mode: check listing type to show appropriate price
            listing.listingType === 'both' ? (
              // Property available for both sale and rent - show both prices
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    Buy
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    ${listing.estimatedPrice >= 1000000
                      ? `${(listing.estimatedPrice / 1000000).toFixed(1)}M`
                      : `${(listing.estimatedPrice / 1000).toFixed(0)}k`
                    }
                  </div>
                </div>
                {listing.monthlyRent && <div className="bg-green-50 rounded-lg p-2">
                    <div className="text-xs text-green-600 font-medium mb-1">
                      Rent
                    </div>
                    <div className="text-lg font-bold text-green-900">
                      ${listing.monthlyRent}/mo
                    </div>
                  </div>}
              </div>
            ) : listing.listingType === 'rent' && listing.monthlyRent ? (
              // Rent-only property - show rent price
              <div>
                <div className="text-2xl font-bold text-green-900">
                  ${listing.monthlyRent}/mo
                </div>
                <div className="text-xs text-gray-500">
                  ${listing.securityDeposit} deposit
                </div>
              </div>
            ) : (
              // Sale-only property - show buy price
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  ${listing.estimatedPrice >= 1000000
                    ? `${(listing.estimatedPrice / 1000000).toFixed(1)}M`
                    : `${(listing.estimatedPrice / 1000).toFixed(0)}k`
                  }
                </div>
                <div className="text-xs text-gray-500">
                  ${listing.pricePerSqFt}/sq ft
                </div>
              </div>
            )
          ) : compareMode === 'rent' && listing.monthlyRent ? (
            // Rent mode - show rent price
            <div>
              <div className="text-2xl font-bold text-green-900">
                ${listing.monthlyRent}/mo
              </div>
              <div className="text-xs text-gray-500">
                ${listing.securityDeposit} deposit
              </div>
            </div>
          ) : (
            // Buy mode - show buy price
            <div>
              <div className="text-2xl font-bold text-blue-900">
                ${listing.estimatedPrice >= 1000000
                  ? `${(listing.estimatedPrice / 1000000).toFixed(1)}M`
                  : `${(listing.estimatedPrice / 1000).toFixed(0)}k`
                }
              </div>
              <div className="text-xs text-gray-500">
                ${listing.pricePerSqFt}/sq ft
              </div>
            </div>
          )}
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-3 mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <BedIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {listing.bedrooms}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <BathIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {listing.bathrooms}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <HomeIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {listing.squareFootage.toLocaleString()} sq ft
            </span>
          </div>
        </div>

        {/* HOA & Days on Market */}
        <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <DollarSignIcon className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">HOA</div>
              <span className="text-sm font-medium text-gray-900">
                {listing.hoaFees ? `$${listing.hoaFees}/mo` : 'N/A'}
              </span>
            </div>
          </div>
          {listing.daysOnMarket !== undefined && <div className="flex items-center gap-1.5">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Days Listed</div>
              <span className="text-sm font-medium text-gray-900">
                {listing.daysOnMarket}
              </span>
            </div>
          </div>}
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {listing.hasBackyard && <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-1 rounded">
              <TreesIcon className="w-3 h-3" />
              Backyard
            </span>}
          {listing.hasPool && <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 text-xs font-medium px-2 py-1 rounded">
              <WavesIcon className="w-3 h-3" />
              Pool
            </span>}
          {listing.listingType === 'both' && <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-medium px-2 py-1 rounded">
              <DollarSignIcon className="w-3 h-3" />
              Buy or Rent
            </span>}
        </div>

        {/* Grade Assignment */}
        <div>
          <div className="text-xs text-gray-500 mb-2">Grade</div>
          <div className="flex gap-1">
            {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => <button key={grade} onClick={() => onAssignGrade(grade)} className={`flex-1 py-2 rounded font-semibold text-sm transition-all ${listing.grade === grade ? `${GRADE_COLORS[grade]} text-white shadow-sm` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {grade}
              </button>)}
          </div>
        </div>
      </div>
    </div>;
}