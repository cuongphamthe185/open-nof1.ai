/**
 * Price Action Algorithm
 * Detects rejection wicks (long upper/lower shadows) indicating S/R levels
 */

import type { OHLCV, RejectionLevel } from './types';
import { SR_CONFIG } from './config';

/**
 * Find rejection wicks (strong reactions at certain price levels)
 */
export function findRejectionWicks(candles: OHLCV[]): RejectionLevel[] {
  const upperRejections: number[] = [];
  const lowerRejections: number[] = [];
  const wickRatio = SR_CONFIG.priceAction.wickRatio;

  for (const candle of candles) {
    const body = Math.abs(candle.close - candle.open);
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    const totalRange = candle.high - candle.low;

    // Skip doji candles (very small body)
    if (body < totalRange * 0.1) continue;

    // Upper rejection (resistance)
    if (upperWick / totalRange >= wickRatio) {
      upperRejections.push(candle.high);
    }

    // Lower rejection (support)
    if (lowerWick / totalRange >= wickRatio) {
      lowerRejections.push(candle.low);
    }
  }

  // Cluster rejections
  const clusteredUpper = clusterRejections(upperRejections);
  const clusteredLower = clusterRejections(lowerRejections);

  const levels: RejectionLevel[] = [];

  // Add upper rejections (resistance)
  for (const [price, count] of clusteredUpper.entries()) {
    if (count >= SR_CONFIG.priceAction.minOccurrences) {
      levels.push({
        price,
        type: 'upper',
        occurrences: count,
        strength: calculateRejectionStrength(count),
      });
    }
  }

  // Add lower rejections (support)
  for (const [price, count] of clusteredLower.entries()) {
    if (count >= SR_CONFIG.priceAction.minOccurrences) {
      levels.push({
        price,
        type: 'lower',
        occurrences: count,
        strength: calculateRejectionStrength(count),
      });
    }
  }

  return levels.sort((a, b) => b.strength - a.strength);
}

/**
 * Cluster rejection prices and count occurrences
 */
function clusterRejections(rejections: number[]): Map<number, number> {
  if (rejections.length === 0) return new Map();

  const sorted = [...rejections].sort((a, b) => a - b);
  const clusters = new Map<number, number>();
  const tolerance = SR_CONFIG.priceAction.wickTolerance;

  let clusterPrices: number[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const clusterAvg = 
      clusterPrices.reduce((sum, p) => sum + p, 0) / clusterPrices.length;

    if (Math.abs(current - clusterAvg) / clusterAvg < tolerance) {
      clusterPrices.push(current);
    } else {
      // Finalize current cluster
      const finalAvg = 
        clusterPrices.reduce((sum, p) => sum + p, 0) / clusterPrices.length;
      clusters.set(finalAvg, clusterPrices.length);
      clusterPrices = [current];
    }
  }

  // Add last cluster
  if (clusterPrices.length > 0) {
    const finalAvg = 
      clusterPrices.reduce((sum, p) => sum + p, 0) / clusterPrices.length;
    clusters.set(finalAvg, clusterPrices.length);
  }

  return clusters;
}

/**
 * Calculate strength score (1-10) based on number of rejections
 */
function calculateRejectionStrength(occurrences: number): number {
  // Linear scale: 2 rejections = 4, 4 rejections = 7, 6+ rejections = 10
  let strength = Math.round(occurrences * 1.5 + 1);
  
  // Clamp to 1-10
  return Math.max(1, Math.min(10, strength));
}

/**
 * Detect candlestick patterns (simplified version)
 */
export function detectCandlePatterns(candles: OHLCV[]): RejectionLevel[] {
  const levels: RejectionLevel[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    
    const currentBody = Math.abs(current.close - current.open);
    const prevBody = Math.abs(prev.close - prev.open);
    const currentRange = current.high - current.low;

    // Hammer pattern (support)
    const lowerWick = Math.min(current.open, current.close) - current.low;
    const upperWick = current.high - Math.max(current.open, current.close);
    
    if (
      lowerWick > currentBody * 2 &&
      upperWick < currentBody * 0.3 &&
      current.close > current.open
    ) {
      levels.push({
        price: current.low,
        type: 'lower',
        occurrences: 1,
        strength: 5,  // Pattern-based strength
      });
    }

    // Shooting star pattern (resistance)
    if (
      upperWick > currentBody * 2 &&
      lowerWick < currentBody * 0.3 &&
      current.close < current.open
    ) {
      levels.push({
        price: current.high,
        type: 'upper',
        occurrences: 1,
        strength: 5,
      });
    }

    // Engulfing pattern
    if (prevBody > 0 && currentBody > prevBody * 1.5) {
      // Bullish engulfing (support at prev low)
      if (prev.close < prev.open && current.close > current.open) {
        levels.push({
          price: prev.low,
          type: 'lower',
          occurrences: 1,
          strength: 6,
        });
      }
      // Bearish engulfing (resistance at prev high)
      else if (prev.close > prev.open && current.close < current.open) {
        levels.push({
          price: prev.high,
          type: 'upper',
          occurrences: 1,
          strength: 6,
        });
      }
    }
  }

  return levels;
}
