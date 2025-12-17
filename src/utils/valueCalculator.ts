import { Listing } from '../types/listing';
export interface ValueScore {
  total: number;
  tier: 'exceptional' | 'great' | 'good' | null;
  breakdown: {
    pricePerSqFt: number;
    isSingleFloor: number;
    hasBackyard: number;
    walkScore: number;
    schoolRating: number;
    hasPool: number;
  };
}
export function calculateValueScore(listing: Listing): ValueScore {
  // Price per sq ft (lower is better)
  const priceScore = Math.max(0, Math.min(100, 100 - (listing.pricePerSqFt - 200) / 3));

  // Single floor (YOUR #1 CRITERIA)
  const singleFloorScore = listing.isSingleFloor ? 100 : 0;

  // Backyard (important)
  const backyardScore = listing.hasBackyard ? 100 : 0;

  // Walk score
  const walkScore = listing.walkScore;

  // School rating
  const schoolScore = listing.schoolRating * 10;

  // Pool (nice to have)
  const poolScore = listing.hasPool ? 100 : 50;

  // Weighted total - SIMPLIFIED
  const total = Math.round(singleFloorScore * 0.4 +
  // Single floor: 40% (YOUR MAIN CRITERIA)
  priceScore * 0.25 +
  // Price: 25%
  backyardScore * 0.15 +
  // Backyard: 15%
  walkScore * 0.1 +
  // Walk score: 10%
  schoolScore * 0.05 +
  // School: 5%
  poolScore * 0.05 // Pool: 5%
  );
  let tier: 'exceptional' | 'great' | 'good' | null = null;
  if (total >= 85) tier = 'exceptional';else if (total >= 70) tier = 'great';else if (total >= 55) tier = 'good';
  return {
    total,
    tier,
    breakdown: {
      pricePerSqFt: Math.round(priceScore),
      isSingleFloor: Math.round(singleFloorScore),
      hasBackyard: Math.round(backyardScore),
      walkScore: Math.round(walkScore),
      schoolRating: Math.round(schoolScore),
      hasPool: Math.round(poolScore)
    }
  };
}