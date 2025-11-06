# 🛠️ Trading Scripts - Market Data Viewer

This folder contains utility scripts to view and analyze the OHLCV (Open, High, Low, Close, Volume) data and technical indicators that the AI trading system uses for decision-making.

## 📁 Available Scripts

### 1. `view-candles.ts` - View Raw OHLCV Data

Fetches and displays candlestick data in a formatted table.

**Usage:**
```bash
npx tsx scripts/view-candles.ts [symbol] [timeframe] [limit]
```

**Examples:**
```bash
# View last 20 BTC 3-minute candles (default)
npx tsx scripts/view-candles.ts

# View last 50 ETH 5-minute candles
npx tsx scripts/view-candles.ts ETH 5m 50

# View last 10 SOL 1-minute candles
npx tsx scripts/view-candles.ts SOL 1m 10
```

**Output includes:**
- Timestamp, Open, High, Low, Close, Volume for each candle
- Summary: First price, last price, price change %, total volume
- Current candle marked with `*`

---

### 2. `view-market-state.ts` - Complete Market State (AI View)

Shows the complete market state exactly as the AI receives it.

**Usage:**
```bash
npx tsx scripts/view-market-state.ts [symbol]
```

**Examples:**
```bash
# View BTC market state (default)
npx tsx scripts/view-market-state.ts

# View ETH market state
npx tsx scripts/view-market-state.ts ETH

# View DOGE market state
npx tsx scripts/view-market-state.ts DOGE
```

**Output includes:**
- Current price, 24h high/low, volume, price change
- Technical indicators: RSI, MACD, Moving Averages (7, 25, 99)
- Bollinger Bands (upper, middle, lower)
- ATR (volatility measure)
- Recent 5 candles summary
- AI analysis context with market sentiment

---

### 3. `view-indicators.ts` - Detailed Technical Indicators

Calculates and displays all technical indicators with interpretations.

**Usage:**
```bash
npx tsx scripts/view-indicators.ts [symbol] [timeframe]
```

**Examples:**
```bash
# View BTC indicators on 3-minute timeframe (default)
npx tsx scripts/view-indicators.ts

# View SOL indicators on 5-minute timeframe
npx tsx scripts/view-indicators.ts SOL 5m

# View BNB indicators on 1-minute timeframe
npx tsx scripts/view-indicators.ts BNB 1m
```

**Output includes:**
- **RSI (14):** Current value, previous value, interpretation, signal
- **MACD:** MACD line, signal line, histogram, crossover signals
- **Moving Averages:** SMA(7), SMA(25), SMA(99) with price alignment
- **Bollinger Bands:** Upper/middle/lower bands, bandwidth, price position
- **ATR:** Volatility measure with trend direction
- **Trading Signals Summary:** Aggregated buy/sell signals from all indicators

---

## 🎯 Purpose

These scripts help you:
1. **Debug AI decisions** - See exactly what data the AI uses
2. **Understand market conditions** - Visualize technical indicators
3. **Verify data accuracy** - Compare with exchange data
4. **Learn trading concepts** - See how indicators are calculated and interpreted

---

## 📊 Supported Symbols

- BTC (Bitcoin)
- ETH (Ethereum)
- SOL (Solana)
- BNB (Binance Coin)
- DOGE (Dogecoin)

All symbols are traded against USDT (e.g., BTC/USDT).

---

## ⏱️ Supported Timeframes

- `1m` - 1 minute
- `3m` - 3 minutes (default for AI)
- `5m` - 5 minutes
- `15m` - 15 minutes
- `1h` - 1 hour

---

## 🔍 How the AI Uses This Data

1. **`getCurrentMarketState()`** fetches OHLCV data from Binance API
2. Technical indicators are calculated using the `technicalindicators` library
3. Data is formatted and passed to DeepSeek AI in the prompt
4. AI analyzes the data and returns structured JSON with trading decisions

**Note:** This data is fetched in real-time and NOT stored in the database. Each AI run fetches fresh data from Binance.

---

## 🚀 Quick Start

```bash
# Install dependencies (if not already done)
npm install

# View BTC candles
npx tsx scripts/view-candles.ts

# View ETH market state as AI sees it
npx tsx scripts/view-market-state.ts ETH

# View SOL indicators with trading signals
npx tsx scripts/view-indicators.ts SOL
```

---

## 💡 Tips

- Run these scripts before/after AI trading runs to understand decisions
- Compare indicator values with exchange charts for verification
- Use `view-market-state.ts` to get a quick overview
- Use `view-indicators.ts` for detailed technical analysis
- Use `view-candles.ts` to inspect raw price data

---

## 🐛 Troubleshooting

**Error: "Symbol not supported"**
- Make sure you're using one of the supported symbols: BTC, ETH, SOL, BNB, DOGE

**Error: "Insufficient data"**
- Try a smaller limit or different timeframe
- Ensure Binance API is accessible

**Error: "Cannot find module"**
- Run `npm install` to ensure all dependencies are installed
- Make sure you're running from the project root directory

---

## 📝 Related Files

- `/lib/trading/current-market-state.ts` - Fetches market data for AI
- `/lib/ai/prompt.ts` - Builds AI prompts with market data
- `/lib/trading/binance.ts` - Binance API client
- `/lib/utils/symbol-validator.ts` - Symbol validation logic

---

Happy Trading! 🚀📈
