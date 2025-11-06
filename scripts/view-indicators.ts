#!/usr/bin/env tsx
/**
 * View calculated technical indicators in detail
 * Usage: npm run script:indicators [symbol] [timeframe]
 * Example: npm run script:indicators SOL 3m
 */

import { binance } from "../lib/trading/binance";
import { RSI, MACD, SMA, BollingerBands, ATR } from "technicalindicators";

async function viewIndicators() {
  const args = process.argv.slice(2);
  const symbol = (args[0] || "BTC").toUpperCase();
  const timeframe = args[1] || "3m";
  const tradingPair = `${symbol}/USDT`;

  try {
    console.log(`\n📊 Calculating indicators for ${tradingPair} (${timeframe})...\n`);

    // Fetch candle data
    const candles = await binance.fetchOHLCV(tradingPair, timeframe, undefined, 100);
    
    if (!candles || candles.length < 100) {
      console.log("❌ Insufficient data for indicator calculation");
      return;
    }

    const closePrices = candles.map((c) => c[4]!);
    const highPrices = candles.map((c) => c[2]!);
    const lowPrices = candles.map((c) => c[3]!);

    console.log("═══════════════════════════════════════════════════════════");
    console.log("📈 TECHNICAL INDICATORS (Detailed)");
    console.log("═══════════════════════════════════════════════════════════\n");

    // RSI Calculation
    console.log("🔵 RELATIVE STRENGTH INDEX (RSI):");
    const rsiValues = RSI.calculate({ values: closePrices, period: 14 });
    const currentRSI = rsiValues[rsiValues.length - 1];
    const prevRSI = rsiValues[rsiValues.length - 2];
    
    console.log(`   Current RSI(14):  ${currentRSI.toFixed(2)}`);
    console.log(`   Previous RSI:     ${prevRSI.toFixed(2)}`);
    console.log(`   Change:           ${(currentRSI - prevRSI).toFixed(2)}`);
    console.log(`   Interpretation:   ${interpretRSI(currentRSI)}`);
    console.log(`   Signal:           ${getRSISignal(currentRSI, prevRSI)}\n`);

    // MACD Calculation
    console.log("🟢 MOVING AVERAGE CONVERGENCE DIVERGENCE (MACD):");
    const macdValues = MACD.calculate({
      values: closePrices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    
    const currentMACD = macdValues[macdValues.length - 1];
    const prevMACD = macdValues[macdValues.length - 2];
    
    console.log(`   MACD Line:        ${currentMACD.MACD?.toFixed(2) || "N/A"}`);
    console.log(`   Signal Line:      ${currentMACD.signal?.toFixed(2) || "N/A"}`);
    console.log(`   Histogram:        ${currentMACD.histogram?.toFixed(2) || "N/A"}`);
    console.log(`   Previous Hist:    ${prevMACD.histogram?.toFixed(2) || "N/A"}`);
    console.log(`   Interpretation:   ${interpretMACD(currentMACD, prevMACD)}\n`);

    // Moving Averages
    console.log("📊 SIMPLE MOVING AVERAGES (SMA):");
    const sma7 = SMA.calculate({ period: 7, values: closePrices });
    const sma25 = SMA.calculate({ period: 25, values: closePrices });
    const sma99 = SMA.calculate({ period: 99, values: closePrices });
    
    const currentPrice = closePrices[closePrices.length - 1];
    const ma7 = sma7[sma7.length - 1];
    const ma25 = sma25[sma25.length - 1];
    const ma99 = sma99[sma99.length - 1];
    
    console.log(`   Current Price:    $${currentPrice.toFixed(2)}`);
    console.log(`   SMA(7):           $${ma7.toFixed(2)} ${currentPrice > ma7 ? "✅" : "❌"}`);
    console.log(`   SMA(25):          $${ma25.toFixed(2)} ${currentPrice > ma25 ? "✅" : "❌"}`);
    console.log(`   SMA(99):          $${ma99.toFixed(2)} ${currentPrice > ma99 ? "✅" : "❌"}`);
    console.log(`   MA Alignment:     ${interpretMAAlignment(currentPrice, ma7, ma25, ma99)}\n`);

    // Bollinger Bands
    console.log("📉 BOLLINGER BANDS (BB):");
    const bbValues = BollingerBands.calculate({
      period: 20,
      values: closePrices,
      stdDev: 2,
    });
    
    const currentBB = bbValues[bbValues.length - 1];
    console.log(`   Upper Band:       $${currentBB.upper.toFixed(2)}`);
    console.log(`   Middle Band:      $${currentBB.middle.toFixed(2)}`);
    console.log(`   Lower Band:       $${currentBB.lower.toFixed(2)}`);
    console.log(`   Bandwidth:        $${(currentBB.upper - currentBB.lower).toFixed(2)}`);
    console.log(`   Price Position:   ${((currentPrice - currentBB.lower) / (currentBB.upper - currentBB.lower) * 100).toFixed(1)}%`);
    console.log(`   Interpretation:   ${interpretBB(currentPrice, currentBB)}\n`);

    // ATR (Volatility)
    console.log("💥 AVERAGE TRUE RANGE (ATR):");
    const atrValues = ATR.calculate({
      high: highPrices,
      low: lowPrices,
      close: closePrices,
      period: 14,
    });
    
    const currentATR = atrValues[atrValues.length - 1];
    const prevATR = atrValues[atrValues.length - 2];
    
    console.log(`   Current ATR:      $${currentATR.toFixed(2)}`);
    console.log(`   Previous ATR:     $${prevATR.toFixed(2)}`);
    console.log(`   ATR % of Price:   ${(currentATR / currentPrice * 100).toFixed(2)}%`);
    console.log(`   Volatility:       ${interpretATR(currentATR, prevATR, currentPrice)}\n`);

    console.log("═══════════════════════════════════════════════════════════");
    console.log("🎯 TRADING SIGNALS SUMMARY:");
    console.log("═══════════════════════════════════════════════════════════\n");
    
    const signals = generateTradingSignals({
      rsi: currentRSI,
      prevRSI,
      macd: currentMACD,
      prevMACD,
      price: currentPrice,
      ma7,
      ma25,
      ma99,
      bb: currentBB,
      atr: currentATR,
    });
    
    console.log(signals.join("\n") + "\n");

  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

function interpretRSI(rsi: number): string {
  if (rsi > 70) return "Overbought - potential reversal down";
  if (rsi < 30) return "Oversold - potential reversal up";
  if (rsi > 50) return "Bullish momentum";
  return "Bearish momentum";
}

function getRSISignal(current: number, prev: number): string {
  if (current > 70 && prev <= 70) return "🔴 Just entered overbought";
  if (current < 30 && prev >= 30) return "🟢 Just entered oversold";
  if (current > prev && current < 50) return "🟡 Building bullish momentum";
  if (current < prev && current > 50) return "🟠 Losing bullish momentum";
  return "⚪ No strong signal";
}

function interpretMACD(current: any, prev: any): string {
  const currHist = current.histogram || 0;
  const prevHist = prev.histogram || 0;
  
  if (currHist > 0 && prevHist <= 0) return "🟢 Bullish crossover (STRONG BUY signal)";
  if (currHist < 0 && prevHist >= 0) return "🔴 Bearish crossover (STRONG SELL signal)";
  if (currHist > 0 && currHist > prevHist) return "🟢 Bullish and strengthening";
  if (currHist > 0 && currHist < prevHist) return "🟡 Bullish but weakening";
  if (currHist < 0 && currHist < prevHist) return "🔴 Bearish and strengthening";
  if (currHist < 0 && currHist > prevHist) return "🟠 Bearish but weakening";
  return "⚪ Neutral";
}

function interpretMAAlignment(price: number, ma7: number, ma25: number, ma99: number): string {
  if (price > ma7 && ma7 > ma25 && ma25 > ma99) return "🚀 Perfect bullish alignment";
  if (price < ma7 && ma7 < ma25 && ma25 < ma99) return "💔 Perfect bearish alignment";
  if (price > ma7 && ma7 > ma25) return "🟢 Short-term bullish";
  if (price < ma7 && ma7 < ma25) return "🔴 Short-term bearish";
  return "⚪ Mixed signals";
}

function interpretBB(price: number, bb: any): string {
  const range = bb.upper - bb.lower;
  const position = (price - bb.lower) / range;
  
  if (position > 0.9) return "🔴 Price at upper band - potential resistance";
  if (position < 0.1) return "🟢 Price at lower band - potential support";
  if (position > 0.7) return "🟠 Price moving towards upper band";
  if (position < 0.3) return "🟡 Price moving towards lower band";
  return "⚪ Price in middle zone";
}

function interpretATR(current: number, prev: number, price: number): string {
  const atrPercent = (current / price) * 100;
  const change = ((current - prev) / prev) * 100;
  
  let volatility = "";
  if (atrPercent > 3) volatility = "Very High";
  else if (atrPercent > 2) volatility = "High";
  else if (atrPercent > 1) volatility = "Moderate";
  else volatility = "Low";
  
  const trend = change > 5 ? " (Increasing ↑)" : change < -5 ? " (Decreasing ↓)" : " (Stable →)";
  
  return `${volatility}${trend}`;
}

function generateTradingSignals(data: any): string[] {
  const signals = [];
  
  // RSI signals
  if (data.rsi < 30) signals.push("✅ BUY Signal: RSI oversold (<30)");
  if (data.rsi > 70) signals.push("⚠️  SELL Signal: RSI overbought (>70)");
  
  // MACD signals
  const currHist = data.macd.histogram || 0;
  const prevHist = data.prevMACD.histogram || 0;
  if (currHist > 0 && prevHist <= 0) signals.push("🚀 STRONG BUY: MACD bullish crossover");
  if (currHist < 0 && prevHist >= 0) signals.push("🔻 STRONG SELL: MACD bearish crossover");
  
  // MA signals
  if (data.price > data.ma7 && data.ma7 > data.ma25 && data.ma25 > data.ma99) {
    signals.push("✅ BUY Signal: Perfect MA alignment (bullish)");
  }
  if (data.price < data.ma7 && data.ma7 < data.ma25 && data.ma25 < data.ma99) {
    signals.push("⚠️  SELL Signal: Perfect MA alignment (bearish)");
  }
  
  // BB signals
  const bbPosition = (data.price - data.bb.lower) / (data.bb.upper - data.bb.lower);
  if (bbPosition < 0.1) signals.push("✅ BUY Signal: Price at lower Bollinger Band");
  if (bbPosition > 0.9) signals.push("⚠️  SELL Signal: Price at upper Bollinger Band");
  
  // Volatility warning
  const atrPercent = (data.atr / data.price) * 100;
  if (atrPercent > 3) signals.push("⚠️  WARNING: Very high volatility - use caution");
  
  if (signals.length === 0) {
    signals.push("⚪ No strong trading signals at this time");
  }
  
  return signals;
}

// Run
viewIndicators().catch((error) => {
  console.error(error);
  process.exit(1);
});
