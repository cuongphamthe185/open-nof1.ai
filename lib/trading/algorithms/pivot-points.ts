/**
 * Pivot Points Algorithm
 * Identifies swing highs/lows and clusters them into support/resistance levels
 */

import type { OHLCV, PivotLevel } from './types';
import { SR_CONFIG } from './config';

/**
 * Find pivot highs (local maxima)
 */
export function findPivotHighs(candles: OHLCV[]): number[] {
  const { left, right } = SR_CONFIG.pivotPoints.lookbackBars;
  const pivots: number[] = [];

  for (let i = left; i < candles.length - right; i++) {
    const current = candles[i];
    let isPivot = true;

    // Check left bars
    for (let j = i - left; j < i; j++) {
      if (candles[j].high >= current.high) {
        isPivot = false;
        break;
      }
    }

    if (!isPivot) continue;

    // Check right bars
    for (let j = i + 1; j <= i + right; j++) {
      if (candles[j].high >= current.high) {
        isPivot = false;
        break;
      }
    }

    if (isPivot) {
      pivots.push(current.high);
    }
  }

  return pivots;
}

/**
 * Find pivot lows (local minima)
 */
export function findPivotLows(candles: OHLCV[]): number[] {
  const { left, right } = SR_CONFIG.pivotPoints.lookbackBars;
  const pivots: number[] = [];

  for (let i = left; i < candles.length - right; i++) {
    const current = candles[i];
    let isPivot = true;

    // Check left bars
    for (let j = i - left; j < i; j++) {
      if (candles[j].low <= current.low) {
        isPivot = false;
        break;
      }
    }

    if (!isPivot) continue;

    // Check right bars
    for (let j = i + 1; j <= i + right; j++) {
      if (candles[j].low <= current.low) {
        isPivot = false;
        break;
      }
    }

    if (isPivot) {
      pivots.push(current.low);
    }
  }

  return pivots;
}

/**
 * Cluster nearby pivot levels (merge levels within tolerance)
 */
export function clusterLevels(pivots: number[]): number[] {
  if (pivots.length === 0) return [];

  const sorted = [...pivots].sort((a, b) => a - b);
  const clustered: number[] = [];
  const tolerance = SR_CONFIG.pivotPoints.clusterTolerance;

  let cluster: number[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const clusterAvg = cluster.reduce((sum, p) => sum + p, 0) / cluster.length;

    // Check if current price is within tolerance of cluster average
    if (Math.abs(current - clusterAvg) / clusterAvg < tolerance) {
      cluster.push(current);
    } else {
      // Finalize current cluster
      clustered.push(clusterAvg);
      cluster = [current];
    }
  }

  // Add last cluster
  if (cluster.length > 0) {
    const clusterAvg = cluster.reduce((sum, p) => sum + p, 0) / cluster.length;
    clustered.push(clusterAvg);
  }

  return clustered;
}

/**
 * Count how many times price touched a level
 */
export function countTouches(candles: OHLCV[], level: number): number {
  const tolerance = SR_CONFIG.pivotPoints.touchTolerance;
  let touches = 0;

  for (const candle of candles) {
    const touchedHigh = Math.abs(candle.high - level) / level < tolerance;
    const touchedLow = Math.abs(candle.low - level) / level < tolerance;
    
    if (touchedHigh || touchedLow) {
      touches++;
    }
  }

  return touches;
}

/**
 * Calculate pivot levels with strength scores
 */
export function calculatePivotLevels(candles: OHLCV[]): PivotLevel[] {
  const highs = findPivotHighs(candles);
  const lows = findPivotLows(candles);

  const clusteredHighs = clusterLevels(highs);
  const clusteredLows = clusterLevels(lows);

  const levels: PivotLevel[] = [];

  // Process resistance levels (pivot highs)
  for (const price of clusteredHighs) {
    const touches = countTouches(candles, price);
    if (touches >= SR_CONFIG.pivotPoints.minTouches) {
      levels.push({
        price,
        type: 'high',
        touches,
        strength: calculatePivotStrength(touches),
      });
    }
  }

  // Process support levels (pivot lows)
  for (const price of clusteredLows) {
    const touches = countTouches(candles, price);
    if (touches >= SR_CONFIG.pivotPoints.minTouches) {
      levels.push({
        price,
        type: 'low',
        touches,
        strength: calculatePivotStrength(touches),
      });
    }
  }

  return levels.sort((a, b) => b.strength - a.strength);
}

/**
 * Calculate strength score (1-10) based on number of touches
 */
function calculatePivotStrength(touches: number): number {
  // Linear scale: 2 touches = 3, 5 touches = 6, 10+ touches = 10
  let strength = Math.round(touches * 0.8 + 1);
  
  // Clamp to 1-10
  return Math.max(1, Math.min(10, strength));
}
