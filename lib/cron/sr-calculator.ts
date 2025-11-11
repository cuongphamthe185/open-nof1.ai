/**
 * Support/Resistance Calculator Cron Job
 * UNIFIED SCHEDULE: Calculates ALL timeframes (15m, 1h, 4h) together
 * Runs every 10 minutes at XX:00, XX:10, XX:20, XX:30, XX:40, XX:50
 * Benefits: Consistent timestamps, simpler logic, always fresh data
 */

import cron from 'node-cron';
import { calculateAndStoreSR } from './sr-service';
import type { Symbol, Timeframe } from '../trading/algorithms/config';

const SYMBOLS: Symbol[] = ['BTC', 'BNB'];
const TIMEFRAMES: Timeframe[] = ['15m', '1h', '4h'];

/**
 * Helper to get next run time
 */
function getNextRunTime(): string {
  const now = new Date();
  const currentMinute = now.getMinutes();
  
  const nextMinute = Math.ceil((currentMinute + 1) / 10) * 10 % 60;
  const nextHour = nextMinute <= currentMinute ? now.getHours() + 1 : now.getHours();
  
  return `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
}

/**
 * Main SR calculation task - calculates ALL timeframes together
 */
const runSRCalculation = async () => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`[${timestamp}] 🚀 S/R Calculator: Starting unified calculation`);
  console.log(`Symbols: ${SYMBOLS.join(', ')}`);
  console.log(`Timeframes: ${TIMEFRAMES.join(', ')}`);
  console.log(`═══════════════════════════════════════════════════\n`);
  
  try {
    // Calculate all combinations: 2 symbols × 3 timeframes = 6 calculations
    const jobs = SYMBOLS.flatMap(symbol =>
      TIMEFRAMES.map(timeframe => 
        calculateAndStoreSR(symbol, timeframe)
          .then(() => ({
            symbol,
            timeframe,
            status: 'success' as const,
          }))
          .catch((error: Error) => ({
            symbol,
            timeframe,
            status: 'failed' as const,
            error: error.message,
          }))
      )
    );
    
    const results = await Promise.all(jobs);
    
    // Summary
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');
    const duration = Date.now() - startTime;
    
    console.log(`\n═══════════════════════════════════════════════════`);
    console.log(`[${new Date().toISOString()}] ✅ S/R Calculator: Completed`);
    console.log(`Duration: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
    console.log(`Success: ${successful.length}/${results.length}`);
    if (failed.length > 0) {
      console.log(`Failed: ${failed.length}`);
      failed.forEach(f => {
        console.log(`  ❌ ${f.symbol} ${f.timeframe}: ${f.error}`);
      });
    }
    console.log(`Next run: ${getNextRunTime()}`);
    console.log(`═══════════════════════════════════════════════════\n`);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ [${new Date().toISOString()}] S/R Calculator Error (${duration}ms):`, error.message);
    console.log(`Next run: ${getNextRunTime()}\n`);
  }
};

// Schedule to run every 10 minutes
cron.schedule('*/10 * * * *', runSRCalculation);

console.log('✅ S/R Calculator cron started (UNIFIED SCHEDULE)');
console.log('📅 Schedule: Every 10 minutes at XX:00, XX:10, XX:20, XX:30, XX:40, XX:50');
console.log('📊 Calculates ALL timeframes together: 15m, 1h, 4h');
console.log('💰 Symbols: BTC, BNB');
console.log(`⏰ Next run: ${getNextRunTime()}\n`);
