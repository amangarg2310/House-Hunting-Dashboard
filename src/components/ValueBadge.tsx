import React, { useState } from 'react';
import { SparklesIcon, TrophyIcon, ThumbsUpIcon } from 'lucide-react';
import { calculateValueScore } from '../utils/valueCalculator';
import { Listing } from '../types/listing';
interface ValueBadgeProps {
  listing: Listing;
}
const TIER_CONFIG = {
  exceptional: {
    icon: SparklesIcon,
    label: 'Exceptional',
    bgColor: 'bg-amber-500',
    tooltipBg: 'bg-amber-50',
    tooltipBorder: 'border-amber-200'
  },
  great: {
    icon: TrophyIcon,
    label: 'Great Value',
    bgColor: 'bg-slate-400',
    tooltipBg: 'bg-slate-50',
    tooltipBorder: 'border-slate-200'
  },
  good: {
    icon: ThumbsUpIcon,
    label: 'Good Value',
    bgColor: 'bg-orange-400',
    tooltipBg: 'bg-orange-50',
    tooltipBorder: 'border-orange-200'
  }
};
export function ValueBadge({
  listing
}: ValueBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  if (!listing.valueTier) return null;
  const config = TIER_CONFIG[listing.valueTier];
  const Icon = config.icon;
  const valueScore = calculateValueScore(listing);
  return <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <div className={`${config.bgColor} text-white px-2 py-1 rounded-md shadow-lg flex items-center gap-1.5 cursor-help`}>
        <Icon className="w-4 h-4" />
        <span className="text-xs font-semibold">{config.label}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && <div className={`absolute top-full left-0 mt-2 w-64 ${config.tooltipBg} border ${config.tooltipBorder} rounded-lg shadow-xl p-3 z-10`}>
          <div className="mb-2">
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Score: {valueScore.total}/100
            </div>
          </div>

          <div className="space-y-1.5">
            <ScoreBar label="Single Floor" score={valueScore.breakdown.isSingleFloor} weight="40%" />
            <ScoreBar label="Price/Sq Ft" score={valueScore.breakdown.pricePerSqFt} weight="25%" />
            <ScoreBar label="Backyard" score={valueScore.breakdown.hasBackyard} weight="15%" />
            <ScoreBar label="Walk Score" score={valueScore.breakdown.walkScore} weight="10%" />
            <ScoreBar label="Schools" score={valueScore.breakdown.schoolRating} weight="5%" />
            <ScoreBar label="Pool" score={valueScore.breakdown.hasPool} weight="5%" />
          </div>
        </div>}
    </div>;
}
function ScoreBar({
  label,
  score,
  weight
}: {
  label: string;
  score: number;
  weight: string;
}) {
  return <div className="text-xs">
      <div className="flex justify-between mb-0.5">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500 font-mono">
          {score} <span className="text-gray-400">({weight})</span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full" style={{
        width: `${score}%`
      }} />
      </div>
    </div>;
}