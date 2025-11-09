/**
 * Hybrid Support/Resistance Algorithm
 * Combines Volume Profile (50%), Pivot Points (30%), Price Action (20%)
 */

import type { OHLCV, SRLevel, SRResult } from './types';
import { SR_CONFIG, type Timeframe } from './config';
import { calculateVolumeProfile, clusterVolumeNodes } from './volume-profile';
import { calculatePivotLevels } from './pivot-points';
import { findRejectionWicks, detectCandlePatterns } from './price-action';

/**
 * Main function to calculate Support/Resistance levels
 */
export async function calculateSupportResistance(
  symbol: string,
  timeframe: Timeframe,
  candles: OHLCV[]
): Promise<SRResult> {
  if (candles.length === 0) {
    throw new Error('No candles provided');
  }

  const currentPrice = candles[candles.length - 1].close;

  // 1. Get candidates from each method
  const volumeNodes = calculateVolumeProfile(candles, timeframe);
  const pivotLevels = calculatePivotLevels(candles);
  const rejectionLevels = findRejectionWicks(candles);
  const patternLevels = detectCandlePatterns(candles);

    // 2. Combine and score all levels
  const allLevels: SRLevel[] = [];

  // Add volume profile levels (50% weight)
  for (const node of volumeNodes) {
    allLevels.push({
      price: node.price,
      strength: Math.round(node.strength * SR_CONFIG.weights.volumeProfile), // Max: 10 * 0.5 = 5
      sources: ['volume_profile'],
    });
  }

  // Add pivot point levels (30% weight)
  for (const pivot of pivotLevels) {
    const existing = findNearbyLevel(allLevels, pivot.price);
    const weightedStrength = Math.round(pivot.strength * SR_CONFIG.weights.pivotPoints); // Max: 10 * 0.3 = 3

    if (existing) {
      existing.strength = Math.min(10, existing.strength + weightedStrength);
      existing.sources.push('pivot_points');
    } else {
      allLevels.push({
        price: pivot.price,
        strength: weightedStrength,
        sources: ['pivot_points'],
      });
    }
  }

  // Add price action levels (20% weight)
  const allPriceAction = [...rejectionLevels, ...patternLevels];
  for (const rejection of allPriceAction) {
    const existing = findNearbyLevel(allLevels, rejection.price);
    const weightedStrength = Math.round(rejection.strength * SR_CONFIG.weights.priceAction); // Max: 10 * 0.2 = 2

    if (existing) {
      existing.strength = Math.min(10, existing.strength + weightedStrength);
      existing.sources.push('price_action');
    } else {
      allLevels.push({
        price: rejection.price,
        strength: weightedStrength,
        sources: ['price_action'],
      });
    }
  }

  // 3. Merge nearby levels
  const mergedLevels = mergeLevels(allLevels);

  // 4. Filter by minimum strength
  const validLevels = mergedLevels.filter(
    l => l.strength >= SR_CONFIG.result.minStrength
  );

  // 5. Separate into supports and resistances
  const supports = validLevels
    .filter(l => l.price < currentPrice)
    .sort((a, b) => b.price - a.price)  // Closest first
    .slice(0, SR_CONFIG.result.maxSupportLevels);

  const resistances = validLevels
    .filter(l => l.price > currentPrice)
    .sort((a, b) => a.price - b.price)  // Closest first
    .slice(0, SR_CONFIG.result.maxResistanceLevels);

  // 6. Calculate validity period
  const calculatedAt = new Date();
  const validUntil = new Date(
    calculatedAt.getTime() + SR_CONFIG.validityDuration[timeframe] * 60 * 1000
  );

  // 7. Create fallback levels using actual data range
  const lowestPrice = Math.min(...candles.map(c => c.low));
  const highestPrice = Math.max(...candles.map(c => c.high));

  // 8. Construct result
  return {
    symbol,
    timeframe,
    currentPrice,
    support1: supports[0] || { price: lowestPrice, strength: 1, sources: ['fallback:lowest'] },
    support2: supports[1],
    resistance1: resistances[0] || { price: highestPrice, strength: 1, sources: ['fallback:highest'] },
    resistance2: resistances[1],
    calculatedAt,
    validUntil,
  };
}

/**
 * Find nearby level within merge tolerance
 */
function findNearbyLevel(levels: SRLevel[], price: number): SRLevel | undefined {
  const tolerance = SR_CONFIG.result.levelMergeTolerance;
  return levels.find(l => Math.abs(l.price - price) / price < tolerance);
}

/**
 * Merge levels that are very close together
 */
function mergeLevels(levels: SRLevel[]): SRLevel[] {
  if (levels.length === 0) return [];

  const sorted = [...levels].sort((a, b) => a.price - b.price);
  const merged: SRLevel[] = [];
  const tolerance = SR_CONFIG.result.levelMergeTolerance;

  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    
    if (Math.abs(next.price - current.price) / current.price < tolerance) {
      // Merge: weighted average price, max strength, combine sources
      const totalStrength = current.strength + next.strength;
      current.price = 
        (current.price * current.strength + next.price * next.strength) / totalStrength;
      current.strength = Math.min(10, Math.round(totalStrength / 2));
      current.sources = [...new Set([...current.sources, ...next.sources])];
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);

  return merged.sort((a, b) => b.strength - a.strength);
}

/**
 * Format SR result for logging/debugging
 */
export function formatSRResult(result: SRResult): string {
  return `
${result.symbol} ${result.timeframe} - Support/Resistance
Current Price: $${result.currentPrice.toFixed(2)}

Support Levels:
  1. $${result.support1.price.toFixed(2)} (Strength: ${result.support1.strength}/10) [${result.support1.sources.join(', ')}]
  ${result.support2 ? `2. $${result.support2.price.toFixed(2)} (Strength: ${result.support2.strength}/10) [${result.support2.sources.join(', ')}]` : ''}

Resistance Levels:
  1. $${result.resistance1.price.toFixed(2)} (Strength: ${result.resistance1.strength}/10) [${result.resistance1.sources.join(', ')}]
  ${result.resistance2 ? `2. $${result.resistance2.price.toFixed(2)} (Strength: ${result.resistance2.strength}/10) [${result.resistance2.sources.join(', ')}]` : ''}

Calculated: ${result.calculatedAt.toISOString()}
Valid Until: ${result.validUntil.toISOString()}
`.trim();
}
