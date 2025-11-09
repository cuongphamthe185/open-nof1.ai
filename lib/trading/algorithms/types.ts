/**
 * Type definitions for Support/Resistance algorithms
 */

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface VolumeNode {
  price: number;
  volume: number;
  strength: number;  // 1-10 score
}

export interface PivotLevel {
  price: number;
  type: 'high' | 'low';
  touches: number;
  strength: number;  // 1-10 score
}

export interface RejectionLevel {
  price: number;
  type: 'upper' | 'lower';  // upper = resistance, lower = support
  occurrences: number;
  strength: number;  // 1-10 score
}

export interface SRLevel {
  price: number;
  strength: number;  // Combined strength 1-10
  sources: string[];  // ['volume_profile', 'pivot_points', etc]
}

export interface SRResult {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  support1: SRLevel;
  support2?: SRLevel;
  resistance1: SRLevel;
  resistance2?: SRLevel;
  calculatedAt: Date;
  validUntil: Date;
}
