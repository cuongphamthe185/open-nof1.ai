#!/usr/bin/env tsx
/**
 * View current Support/Resistance levels
 * Usage: npx tsx scripts/view-sr-levels.ts [symbol]
 * Example: npx tsx scripts/view-sr-levels.ts BTC
 */

import { getLatestSupportResistance, formatSRForAI } from '../lib/ai/support-resistance';
import type { Symbol } from '../lib/trading/algorithms/config';

async function viewSRLevels() {
  const args = process.argv.slice(2);
  const symbol = (args[0] || 'BTC').toUpperCase() as Symbol;

  console.log(`\n🔍 Fetching latest S/R levels for ${symbol}...\n`);

  try {
    const srLevels = await getLatestSupportResistance(symbol);
    const formatted = formatSRForAI(symbol, srLevels);
    
    console.log(formatted);

    // Check if any data exists
    const hasData = srLevels['15m'] || srLevels['1h'] || srLevels['4h'];
    
    if (!hasData) {
      console.log('⚠️  No S/R data found in database');
      console.log('💡 Tip: Run the test script to calculate levels:');
      console.log(`   npx tsx scripts/test-sr-system.ts ${symbol} 15m\n`);
    } else {
      console.log('⏰ TIMEZONE INFO:');
      console.log(`   Current time (UTC+7): ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}`);
      console.log(`   Current time (UTC):   ${new Date().toISOString()}`);
      console.log('   Note: All timestamps stored in UTC, displayed in local timezone\n');
      console.log('✅ Data retrieved successfully\n');
    }

  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

viewSRLevels();
