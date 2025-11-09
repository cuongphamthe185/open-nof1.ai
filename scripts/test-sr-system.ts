#!/usr/bin/env tsx
/**
 * Test Support/Resistance calculation system
 * Usage: npx tsx scripts/test-sr-system.ts [symbol] [timeframe]
 * Example: npx tsx scripts/test-sr-system.ts BTC 15m
 */

import { calculateAndStoreSR } from '../lib/cron/sr-service';
import type { Symbol, Timeframe } from '../lib/trading/algorithms/config';

async function testSRSystem() {
  const args = process.argv.slice(2);
  const symbol = (args[0] || 'BTC').toUpperCase() as Symbol;
  const timeframe = (args[1] || '15m') as Timeframe;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 Testing Support/Resistance Calculation System');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Symbol: ${symbol}`);
  console.log(`Timeframe: ${timeframe}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    const startTime = Date.now();
    
    console.log('🚀 Starting calculation...\n');
    await calculateAndStoreSR(symbol, timeframe);
    
    const duration = Date.now() - startTime;
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ TEST PASSED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total execution time: ${duration}ms`);
    console.log(`Data stored in database successfully\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('\n═══════════════════════════════════════════════════════════');
    console.error('❌ TEST FAILED');
    console.error('═══════════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}\n`);
    process.exit(1);
  }
}

testSRSystem();
