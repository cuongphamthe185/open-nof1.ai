/**
 * Support/Resistance Calculator Service
 * Fetches OHLCV data, calculates S/R levels, and stores in database
 */

import { binance } from '../trading/binance';
import { prisma } from '../prisma';
import { SR_CONFIG, type Timeframe, type Symbol } from '../trading/algorithms/config';
import { calculateSupportResistance, formatSRResult } from '../trading/algorithms/hybrid-sr';
import type { OHLCV } from '../trading/algorithms/types';

/**
 * Main function to calculate and store S/R levels
 */
export async function calculateAndStoreSR(
  symbol: Symbol,
  timeframe: Timeframe
): Promise<void> {
  const startTime = Date.now();
  
  try {
    // 1. Fetch OHLCV data with optimized candle count
    const candleCount = SR_CONFIG.candles[timeframe];
    const tradingPair = `${symbol}/USDT`;
    
    console.log(`[SR Calculator] Fetching ${candleCount} candles for ${symbol} ${timeframe}...`);
    
    const rawCandles = await binance.fetchOHLCV(
      tradingPair,
      timeframe,
      undefined,
      candleCount
    );

    if (!rawCandles || rawCandles.length === 0) {
      throw new Error(`No candles returned for ${symbol} ${timeframe}`);
    }

    // Convert to OHLCV format
    const candles: OHLCV[] = rawCandles.map(c => ({
      timestamp: c[0] as number,
      open: c[1] as number,
      high: c[2] as number,
      low: c[3] as number,
      close: c[4] as number,
      volume: c[5] as number,
    }));

    console.log(`[SR Calculator] ✓ Fetched ${candles.length} candles`);

    // 2. Calculate S/R using hybrid algorithm
    console.log(`[SR Calculator] Calculating S/R levels...`);
    const result = await calculateSupportResistance(symbol, timeframe, candles);
    
    console.log(`[SR Calculator] ✓ Calculated:\n${formatSRResult(result)}`);

    // 3. Store in database
    await prisma.supportResistanceLevel.create({
      data: {
        symbol,
        timeframe,
        support1: result.support1.price,
        support1Strength: result.support1.strength,
        support2: result.support2?.price ?? null,
        support2Strength: result.support2?.strength ?? null,
        resistance1: result.resistance1.price,
        resistance1Strength: result.resistance1.strength,
        resistance2: result.resistance2?.price ?? null,
        resistance2Strength: result.resistance2?.strength ?? null,
        currentPrice: result.currentPrice,
        calculationMethod: 'hybrid',
        calculatedAt: result.calculatedAt,
        validUntil: result.validUntil,
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[SR Calculator] ✓ Stored in database (${duration}ms)\n`);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[SR Calculator] ✗ Error for ${symbol} ${timeframe} (${duration}ms):`, error.message);
    throw error;
  }
}

/**
 * Calculate S/R for multiple symbols and timeframes
 */
export async function calculateBatch(
  symbols: Symbol[],
  timeframes: Timeframe[]
): Promise<void> {
  const jobs = [];
  
  for (const symbol of symbols) {
    for (const timeframe of timeframes) {
      jobs.push(calculateAndStoreSR(symbol, timeframe));
    }
  }

  const results = await Promise.allSettled(jobs);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`[SR Calculator] Batch complete: ${successful} successful, ${failed} failed`);
  
  if (failed > 0) {
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason);
    console.error('[SR Calculator] Errors:', errors);
  }
}
