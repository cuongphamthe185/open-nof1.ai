/**
 * Configuration for Support/Resistance calculation algorithms
 * Optimized candle counts: 15m=50, 1h=75, 4h=100
 */

export const SR_CONFIG = {
  // Optimized candle counts per timeframe
  candles: {
    '15m': 50,   // 12.5 hours - Intraday levels
    '1h': 75,    // 3 days - Swing levels
    '4h': 100,   // 17 days - Major levels
  } as Record<string, number>,

  // Volume Profile settings
  volumeProfile: {
    bins: {
      '15m': 15,   // Fewer bins for less data
      '1h': 20,    // Standard
      '4h': 25,    // More bins for more data
    } as Record<string, number>,
    minVolumeRatio: 1.5,  // HVN must have volume > 1.5x average
    topNodesCount: 5,      // Consider top 5 HVNs
  },

  // Pivot Points settings
  pivotPoints: {
    lookbackBars: {
      left: 5,   // Check 5 bars before
      right: 5,  // Check 5 bars after
    },
    clusterTolerance: 0.005,  // Cluster levels within 0.5%
    touchTolerance: 0.002,    // Count touch if within 0.2%
    minTouches: 2,            // Minimum touches to be valid
  },

  // Price Action settings
  priceAction: {
    wickRatio: 0.6,         // Wick must be >= 60% of candle body
    minOccurrences: 2,      // At least 2 rejection wicks
    wickTolerance: 0.003,   // Cluster wicks within 0.3%
  },

  // Hybrid algorithm weights
  weights: {
    volumeProfile: 0.5,   // 50% weight
    pivotPoints: 0.3,     // 30% weight
    priceAction: 0.2,     // 20% weight
  },

  // Result filtering
  result: {
    maxSupportLevels: 2,
    maxResistanceLevels: 2,
    minStrength: 1,         // Minimum strength score to include (lowered from 3)
    levelMergeTolerance: 0.004,  // Merge levels within 0.4%
  },

  // Valid until calculation
  validityDuration: {
    '15m': 60,    // Valid for 60 minutes (4 candles)
    '1h': 240,    // Valid for 4 hours (4 candles)
    '4h': 960,    // Valid for 16 hours (4 candles)
  } as Record<string, number>,
};

export type Timeframe = '15m' | '1h' | '4h';
export type Symbol = 'BTC' | 'BNB';
