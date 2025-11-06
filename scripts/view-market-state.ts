#!/usr/bin/env tsx
/**
 * View complete market state as seen by the AI
 * Usage: npm run script:market [symbol]
 * Example: npm run script:market ETH
 */

import { getCurrentMarketState } from "../lib/trading/current-market-state";
import { binance } from "../lib/trading/binance";

async function viewMarketState() {
  const args = process.argv.slice(2);
  const symbol = (args[0] || "BTC").toUpperCase();
  const tradingPair = `${symbol}/USDT`;

  try {
    console.log(`\n🌐 Fetching market state for ${tradingPair}...\n`);

    // Get market state (as AI sees it)
    const marketState = await getCurrentMarketState(symbol);

    // Get additional ticker data for 24h stats
    const ticker = await binance.fetchTicker(tradingPair);

    console.log("═══════════════════════════════════════════════════════════");
    console.log("📊 CURRENT MARKET STATE (As AI Sees It)");
    console.log("═══════════════════════════════════════════════════════════\n");

    // Price Information
    console.log("💰 PRICE INFORMATION:");
    console.log(`   Current Price:    $${marketState.current_price.toFixed(2)}`);
    console.log(`   24h High:         $${ticker.high?.toFixed(2) || "N/A"}`);
    console.log(`   24h Low:          $${ticker.low?.toFixed(2) || "N/A"}`);
    console.log(`   24h Volume:       ${ticker.baseVolume?.toFixed(2) || "N/A"} ${symbol}`);
    console.log(`   24h Change:       ${ticker.percentage ? (ticker.percentage > 0 ? "+" : "") + ticker.percentage.toFixed(2) + "%" : "N/A"}\n`);

    // Technical Indicators - Intraday (1-minute)
    console.log("📈 TECHNICAL INDICATORS (1-minute timeframe):");
    console.log(`   Current RSI(7):   ${marketState.current_rsi.toFixed(2)} ${getRSISignal(marketState.current_rsi)}`);
    console.log(`   Current EMA(20):  $${marketState.current_ema20.toFixed(2)}`);
    console.log(`   Current MACD:     ${marketState.current_macd.toFixed(3)}`);
    console.log(`   Price vs EMA:     ${marketState.current_price > marketState.current_ema20 ? "🟢 Above EMA (bullish)" : "🔴 Below EMA (bearish)"}\n`);

    // Longer-term indicators (4-hour)
    console.log("📈 LONGER-TERM INDICATORS (4-hour timeframe):");
    console.log(`   EMA(20):          $${marketState.longer_term.ema_20.toFixed(2)}`);
    console.log(`   EMA(50):          $${marketState.longer_term.ema_50.toFixed(2)}`);
    console.log(`   EMA Alignment:    ${getEMASignal(marketState.longer_term.ema_20, marketState.longer_term.ema_50)}`);
    console.log(`   ATR(3):           $${marketState.longer_term.atr_3.toFixed(2)}`);
    console.log(`   ATR(14):          $${marketState.longer_term.atr_14.toFixed(2)} (volatility)`);
    console.log(`   Current Volume:   ${marketState.longer_term.current_volume.toFixed(2)}`);
    console.log(`   Average Volume:   ${marketState.longer_term.average_volume.toFixed(2)}`);
    console.log(`   Volume Status:    ${getVolumeSignal(marketState.longer_term.current_volume, marketState.longer_term.average_volume)}\n`);

    // Futures-specific data
    console.log("🔮 FUTURES DATA:");
    console.log(`   Open Interest:    ${marketState.open_interest.latest.toFixed(2)}`);
    console.log(`   Funding Rate:     ${(marketState.funding_rate * 100).toFixed(4)}%`);
    console.log(`   Funding Signal:   ${getFundingSignal(marketState.funding_rate)}\n`);

    // Recent price movements (intraday)
    console.log("🕯️  RECENT PRICE MOVEMENTS (1-minute, last 10):");
    marketState.intraday.mid_prices.forEach((price, index) => {
      const rsi7 = marketState.intraday.rsi_7[index];
      const rsi14 = marketState.intraday.rsi_14[index];
      const ema20 = marketState.intraday.ema_20[index];
      const macd = marketState.intraday.macd[index];
      
      const trend = index > 0 && price > marketState.intraday.mid_prices[index - 1] ? "🟢" : index > 0 ? "🔴" : "⚪";
      console.log(`   ${index + 1}. ${trend} Price: $${price.toFixed(2)} | RSI7: ${rsi7.toFixed(1)} | RSI14: ${rsi14.toFixed(1)} | EMA20: $${ema20.toFixed(2)}`);
    });

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("🤖 AI ANALYSIS CONTEXT:");
    console.log("═══════════════════════════════════════════════════════════");
    
    // Overall market sentiment
    const sentiment = determineMarketSentiment(marketState);
    console.log(`\n${sentiment}\n`);

  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

function getRSISignal(rsi: number): string {
  if (rsi > 70) return "(🔴 Overbought)";
  if (rsi < 30) return "(🟢 Oversold)";
  return "(⚪ Neutral)";
}

function getEMASignal(ema20: number, ema50: number): string {
  if (ema20 > ema50) return "🟢 Bullish (EMA20 > EMA50)";
  return "🔴 Bearish (EMA20 < EMA50)";
}

function getVolumeSignal(current: number, average: number): string {
  const ratio = current / average;
  if (ratio > 1.5) return `� High (${ratio.toFixed(2)}x average)`;
  if (ratio < 0.7) return `🔴 Low (${ratio.toFixed(2)}x average)`;
  return `⚪ Normal (${ratio.toFixed(2)}x average)`;
}

function getFundingSignal(rate: number): string {
  const ratePercent = rate * 100;
  if (ratePercent > 0.05) return `🔴 High positive funding (${ratePercent.toFixed(4)}% - longs paying)`;
  if (ratePercent < -0.05) return `🟢 High negative funding (${ratePercent.toFixed(4)}% - shorts paying)`;
  return `⚪ Neutral funding (${ratePercent.toFixed(4)}%)`;
}

function determineMarketSentiment(state: any): string {
  const signals = [];
  
  // RSI signal (intraday)
  if (state.current_rsi > 70) signals.push("⚠️  RSI(7) indicates overbought conditions");
  if (state.current_rsi < 30) signals.push("✅ RSI(7) indicates oversold conditions");
  
  // EMA signal (1-minute)
  if (state.current_price > state.current_ema20) {
    signals.push("✅ Price above EMA(20) - short-term bullish");
  } else {
    signals.push("⚠️  Price below EMA(20) - short-term bearish");
  }
  
  // MACD signal (1-minute)
  if (state.current_macd > 0) {
    signals.push("✅ MACD positive - bullish momentum");
  } else if (state.current_macd < 0) {
    signals.push("⚠️  MACD negative - bearish momentum");
  }
  
  // EMA alignment (4-hour)
  if (state.longer_term.ema_20 > state.longer_term.ema_50) {
    signals.push("✅ Long-term trend: EMA20 > EMA50 (bullish)");
  } else {
    signals.push("⚠️  Long-term trend: EMA20 < EMA50 (bearish)");
  }
  
  // Volume analysis
  const volumeRatio = state.longer_term.current_volume / state.longer_term.average_volume;
  if (volumeRatio > 1.5) {
    signals.push(`🔥 High volume activity (${volumeRatio.toFixed(2)}x average)`);
  }
  
  // Funding rate
  if (state.funding_rate > 0.0005) {
    signals.push("⚠️  High positive funding rate - many longs (potential reversal)");
  } else if (state.funding_rate < -0.0005) {
    signals.push("✅ High negative funding rate - many shorts (potential squeeze)");
  }
  
  return signals.length > 0 ? signals.join("\n") : "⚪ Market appears neutral";
}

// Run
viewMarketState().catch((error) => {
  console.error(error);
  process.exit(1);
});
