#!/usr/bin/env tsx
/**
 * View real-time OHLCV candle data from Binance
 * Usage: npm run script:candles [symbol] [timeframe] [limit]
 * Example: npm run script:candles BTC 3m 20
 */

import { binance } from "../lib/trading/binance";

async function viewCandles() {
  const args = process.argv.slice(2);
  const symbol = (args[0] || "BTC").toUpperCase();
  const timeframe = args[1] || "3m";
  const limit = parseInt(args[2] || "20");

  const tradingPair = `${symbol}/USDT`;

  try {
    console.log(`\n📊 Fetching ${limit} candles for ${tradingPair} (${timeframe} timeframe)...\n`);

    const candles = await binance.fetchOHLCV(tradingPair, timeframe, undefined, limit);

    if (!candles || candles.length === 0) {
      console.log("❌ No candle data available");
      return;
    }

    // Print header
    console.log("┌─────────────────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐");
    console.log("│ Timestamp               │ Open         │ High         │ Low          │ Close        │ Volume       │");
    console.log("├─────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤");

    // Print each candle
    candles.forEach((candle, index) => {
      const timestamp = new Date(candle[0]!).toISOString().replace("T", " ").slice(0, 19);
      const open = candle[1]!.toFixed(2);
      const high = candle[2]!.toFixed(2);
      const low = candle[3]!.toFixed(2);
      const close = candle[4]!.toFixed(2);
      const volume = candle[5]!.toFixed(4);

      // Highlight last candle (current)
      const prefix = index === candles.length - 1 ? "│*" : "│ ";

      console.log(
        `${prefix}${timestamp} │ ${open.padStart(12)} │ ${high.padStart(12)} │ ${low.padStart(12)} │ ${close.padStart(12)} │ ${volume.padStart(12)} │`
      );
    });

    console.log("└─────────────────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘");

    // Print summary
    const firstCandle = candles[0];
    const lastCandle = candles[candles.length - 1];
    const priceChange = lastCandle[4]! - firstCandle[1]!;
    const priceChangePercent = ((priceChange / firstCandle[1]!) * 100).toFixed(2);

    console.log(`\n📈 Summary:`);
    console.log(`   First Price: $${firstCandle[1]!.toFixed(2)}`);
    console.log(`   Last Price:  $${lastCandle[4]!.toFixed(2)}`);
    console.log(`   Change:      $${priceChange.toFixed(2)} (${priceChangePercent}%)`);
    console.log(`   Total Volume: ${candles.reduce((sum, c) => sum + (c[5] || 0), 0).toFixed(4)} ${symbol}\n`);

    console.log(`💡 Note: * indicates current/latest candle\n`);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Run
viewCandles().catch((error) => {
  console.error(error);
  process.exit(1);
});
