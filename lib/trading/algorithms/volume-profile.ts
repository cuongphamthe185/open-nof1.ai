/**
 * Volume Profile Algorithm
 * Identifies High Volume Nodes (HVN) which act as support/resistance
 */

import type { OHLCV, VolumeNode } from './types';
import { SR_CONFIG } from './config';

export function calculateVolumeProfile(
  candles: OHLCV[],
  timeframe: '15m' | '1h' | '4h'
): VolumeNode[] {
  if (candles.length === 0) return [];

  const bins = SR_CONFIG.volumeProfile.bins[timeframe];
  
  // Find price range
  const prices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const binSize = priceRange / bins;

  // Initialize bins
  const volumeBins: { price: number; volume: number }[] = [];
  for (let i = 0; i < bins; i++) {
    volumeBins.push({
      price: minPrice + (i + 0.5) * binSize,  // Middle of bin
      volume: 0,
    });
  }

  // Distribute volume into bins
  for (const candle of candles) {
    const candleMidPrice = (candle.high + candle.low) / 2;
    const binIndex = Math.min(
      Math.floor((candleMidPrice - minPrice) / binSize),
      bins - 1
    );
    
    if (binIndex >= 0 && binIndex < bins) {
      volumeBins[binIndex].volume += candle.volume;
    }
  }

  // Calculate average volume
  const totalVolume = volumeBins.reduce((sum, bin) => sum + bin.volume, 0);
  const avgVolume = totalVolume / bins;

  // Filter High Volume Nodes (volume > minVolumeRatio * average)
  const minVolume = avgVolume * SR_CONFIG.volumeProfile.minVolumeRatio;
  const hvns = volumeBins
    .filter(bin => bin.volume > minVolume)
    .map(bin => ({
      price: bin.price,
      volume: bin.volume,
      strength: calculateVolumeStrength(bin.volume, avgVolume),
    }))
    .sort((a, b) => b.volume - a.volume)  // Sort by volume descending
    .slice(0, SR_CONFIG.volumeProfile.topNodesCount);

  return hvns;
}

/**
 * Calculate strength score (1-10) based on volume ratio
 */
function calculateVolumeStrength(volume: number, avgVolume: number): number {
  const ratio = volume / avgVolume;
  
  // Linear scale: 1.5x avg = 5, 3x avg = 10
  let strength = Math.round((ratio - 1) * 3.33);
  
  // Clamp to 1-10
  return Math.max(1, Math.min(10, strength));
}

/**
 * Cluster nearby volume nodes (merge levels within tolerance)
 */
export function clusterVolumeNodes(nodes: VolumeNode[]): VolumeNode[] {
  if (nodes.length === 0) return [];

  const clustered: VolumeNode[] = [];
  const tolerance = SR_CONFIG.result.levelMergeTolerance;

  for (const node of nodes) {
    const existing = clustered.find(
      c => Math.abs(c.price - node.price) / node.price < tolerance
    );

    if (existing) {
      // Merge: weighted average price, sum volumes, max strength
      const totalVolume = existing.volume + node.volume;
      existing.price = 
        (existing.price * existing.volume + node.price * node.volume) / totalVolume;
      existing.volume = totalVolume;
      existing.strength = Math.max(existing.strength, node.strength);
    } else {
      clustered.push({ ...node });
    }
  }

  return clustered.sort((a, b) => b.volume - a.volume);
}
