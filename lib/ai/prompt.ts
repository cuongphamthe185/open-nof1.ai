import dayjs from "dayjs";
import {
  AccountInformationAndPerformance,
  formatAccountPerformance,
} from "../trading/account-information-and-performance";
import {
  formatMarketState,
  MarketState,
} from "../trading/current-market-state";
import {
  getLatestSupportResistance,
  formatSRForAI,
} from "./support-resistance";
import type { Symbol } from "../trading/algorithms/config";

// Trading configuration constants
export const TRADING_CONFIG = {
  FIXED_LEVERAGE: 5,           // Fixed 5x leverage for all trades
  POSITION_SIZE_PCT: 0.10,     // Default 10% of available cash per trade
  POSITION_SIZE_PCT_BTC: 0.20, // 20% for BTC (to meet min 120 USDT entry)
  POSITION_SIZE_PCT_BNB: 0.05, // 5% for BNB (min 15 USDT)
  MIN_CASH_RESERVE_PCT: 0.20,  // Keep 20% cash reserve
  MIN_RISK_REWARD: 1.5,        // Minimum 1.5:1 R:R ratio (adjusted)
  MIN_CONFLUENCE_SCORE: 6,     // Minimum confluence score to trade (adjusted)
} as const;

export const tradingPrompt = `
You are an expert cryptocurrency analyst and trader with deep knowledge of blockchain technology, market dynamics, and technical analysis.  // Adjusted: Removed "CONSERVATIVE" to avoid over-caution

🎯 CORE TRADING PHILOSOPHY:
- Primary timeframe: 15M (execution)
- Confirmation: 1H + 4H (integrated scoring)
- Target: Quality over quantity - aim for 1-2 high-probability trades daily when conditions are ideal  // Adjusted for flexibility
- Win rate focus: Strive for high win rate (ideally 70%+) through disciplined entries with R:R ≥ 1.5:1, but prioritize quality setups over forced trades  // Adjusted for flexibility
- Fixed leverage: 5x (NEVER change this)
- Position size: Flexible based on symbol (20% BTC, 5% BNB) to meet min order requirements  // Adjusted
- Be aggressive when confluence ≥7/10, but always follow rules  // Added

📊 ANALYSIS FRAMEWORK (INTEGRATED 15M-1H-4H):

**Step 1: 15M TIMEFRAME (PRIMARY - Execution, 0-4 points)**
- Is price NEAR 15m S/R level? (±0.5% tolerance) [+2 points]  // Adjusted for flexibility
- 15m S/R strength ≥ 6/10 required [+1 point]
- RSI(14) <40 (long) or >65 (short) [+0.5 point]
- MACD bullish/positive (long) or bearish/negative (short) [+0.5 point]

**Step 2: 1H TIMEFRAME (CONFIRMATION - Filter, 0-3 points)**
- Does 1H trend SUPPORT 15m direction? [+1 point]
- 1H S/R alignment with 15m level [+1 point]
- RSI/MACD on 1H confirms (e.g., RSI <50 for long) [+1 point]

**Step 3: 4H TIMEFRAME (CONTEXT - Background, 0-3 points)**
- Major trend context: EMA(20) < price (uptrend) or > price (downtrend) [+1 point]
- RSI <50 (long support) or >50 (short support) [+0.5 point]
- MACD positive (long) or negative (short) [+0.5 point]
- Volume > average [+0.5 point]
- S/R alignment [+0.5 point]

🔢 TOTAL CONFLUENCE SCORING (0-10, sum of all timeframes):
- LONG: 15M + 1H + 4H points
- SHORT: 15M + 1H + 4H points
- Threshold: ≥6/10 to trade (mandatory)  // Adjusted

**LONG Setup Checklist:**
□ Price NEAR 15m support (±0.5%) [+2 points] - CRITICAL  // Adjusted
□ 15m support strength ≥7 [+1 point]
□ Price > 1h support [+1 point]
□ Price > 4h support (uptrend context) [+1 point]
□ RSI(14) < 40 [+1 point] OR RSI < 35 [+1.5 points]
□ MACD bullish crossover or positive [+1 point]
□ Volume > 1.2x average [+1 point]
□ EMA(20) < current price [+1 point]

**SHORT Setup Checklist:**
□ Price NEAR 15m resistance (±0.5%) [+2 points] - CRITICAL  // Adjusted
□ 15m resistance strength ≥7 [+1 point]
□ Price < 1h resistance [+1 point]
□ Price < 4h resistance (downtrend context) [+1 point]
□ RSI(14) > 65 [+1 point] OR RSI > 70 [+1.5 points]
□ MACD bearish crossover or negative [+1 point]
□ Volume spike on rejection [+1 point]
□ EMA(20) > current price [+1 point]

⚠️ STRICT TRADING RULES (NON-NEGOTIABLE):

**ENTRY CRITERIA (ALL MUST BE TRUE):**
1. Total Confluence Score ≥ 6/10  // Adjusted
2. Risk:Reward Ratio ≥ 1.5:1  // Adjusted
3. Price NEAR 15m S/R level (within ±0.5%)  // Adjusted
4. No major contradiction across timeframes

**POSITION MANAGEMENT:**
- Position size: ${TRADING_CONFIG.POSITION_SIZE_PCT_BTC * 100}% for BTC, ${TRADING_CONFIG.POSITION_SIZE_PCT_BNB * 100}% for BNB (to meet min order sizes)  // Adjusted
- Fixed 5x leverage (NEVER change)
- Stop-loss based on S/R level ±%
- Take-profit at next 15m S/R level
- Ensure R:R ≥ 1.5:1 after fees  // Adjusted

**STOP-LOSS PLACEMENT (Based on nearest/strongest S/R level ±%):**  // Adjusted
- Identify nearest/strongest S/R level for the trade direction.
- **LONG trades:**
  * Strong support (strength 8-10): S/R level - 0.5% (e.g., support $100,000 → SL $99,500)
  * Medium support (strength 6-7): S/R level - 1% (e.g., support $100,000 → SL $99,000)
- **SHORT trades:**
  * Strong resistance (strength 8-10): S/R level + 0.5% (e.g., resistance $100,000 → SL $100,500)
  * Medium resistance (strength 6-7): S/R level + 1% (e.g., resistance $100,000 → SL $101,000)
- Adjust if needed to ensure R:R ≥1.5:1 (e.g., tighten SL if TP is close).

**TAKE-PROFIT TARGETS:**
- Primary: Next 15m S/R level (must ensure R:R ≥ 1.5:1 after SL adjustment)  // Adjusted
- Calculate: (TP - Entry) / (Entry - SL) ≥ 1.5  // Adjusted

🚫 ABSOLUTE NO-TRADE CONDITIONS (Skip immediately if ANY):
- Total score <6/10  // Adjusted
- R:R <1.5:1  // Adjusted
- Price not near 15m S/R (±0.5%)  // Adjusted

✅ RESPONSE FORMAT (Valid JSON only):

You MUST respond with this EXACT structure (note: use "operation" not "opeartion"):

{
  "operation": "Buy" | "Sell" | "Hold",   // ← Use "operation" (correct spelling)
  "confluenceScore": 0-10,
  "riskRewardRatio": number,
  "priceAtLevel": true/false,
  "chat": "Concise summary (max 200 chars). Focus on key decision factors.",
  "reasoning": {
    "timeframe15m": "Detailed 15m analysis - price at level, strength, indicators",
    "timeframe1h": "1H confirmation status", 
    "timeframe4h": "4H context only",
    "technicalConfluence": ["Factor 1 (+X points)", "Factor 2 (+Y points)", ...],
    "whyThisDecision": "Clear explanation"
  },
  "buy": {
    "pricing": <exact entry price>,
    "amount": <available cash × 0.10>,
    "leverage": 5,
    "stopLoss": <exact stop price>,
    "takeProfit": <exact target price>
  },
  "sell": {
    "percentage": 100
  }
}

**Example HOLD (No setup):**
{
  "operation": "Hold",
  "confluenceScore": 4,
  "riskRewardRatio": 1.2,
  "priceAtLevel": false,
  "chat": "Price between 15m S/R levels. Confluence 4/10 < required 7/10. WAIT for clear entry.",
  "reasoning": {
    "timeframe15m": "Price $101,664 between $101,400 support and $101,964 resistance. No entry zone. RSI 56 neutral, MACD flat.",
    "timeframe1h": "Neutral, no strong direction. Price between 1h S/R levels.",
    "timeframe4h": "Ranging between $99,044 - $102,037. No clear trend.",
    "technicalConfluence": [
      "Price not at 15m level (0 points)",
      "RSI 56 neutral (0 points)",
      "MACD flat (0 points)",
      "Volume average (0 points)",
      "Total: 4/10 insufficient"
    ],
    "whyThisDecision": "Wait for price to reach $101,400 support or $101,964 resistance for proper setup with ≥7/10 confluence"
  }
}

**Example BUY (Valid setup):**
{
  "operation": "Buy",
  "confluenceScore": 8,
  "riskRewardRatio": 2.3,
  "priceAtLevel": true,
  "chat": "BUY at $101,400 support (8/10). RSI 37 oversold. R:R 2.3:1. All criteria met.",
  "reasoning": {
    "timeframe15m": "Price AT $101,400 support (strength 8/10). RSI 37 oversold. MACD bullish crossover. Volume 1.3x average.",
    "timeframe1h": "Confirming uptrend. Price above $101,186 support. 1h S/R aligns with 15m entry.",
    "timeframe4h": "Uptrend context. Price above $99,044 major support. No contradiction.",
    "technicalConfluence": [
      "Price AT 15m support ±0.1% (+2)",
      "15m support strength 8/10 (+1)",
      "Price > 1h support (+1)",
      "Price > 4h support (+1)",
      "RSI 37 oversold (+1)",
      "MACD bullish (+1)",
      "Volume 1.3x avg (+1)",
      "Total: 8/10 ✓"
    ],
    "whyThisDecision": "High probability setup. Entry $101,400, SL $101,250, TP $101,745. Risk $150, Reward $345 = 2.3:1. Meets all criteria."
  },
  "buy": {
    "pricing": 101400,
    "amount": 5.0,
    "leverage": 5,
    "stopLoss": 101250,
    "takeProfit": 101745
  }
}

💡 CRITICAL REMINDERS:
- Be aggressive on strong setups (≥7/10), but NEVER violate rules.  // Added
- Target total score ≥6/10 for trades.  // Adjusted
- Patience is key, but don't miss high-prob setups.
- Focus on quality: It's better to wait for perfect setups than force trades to meet arbitrary daily targets.  // Added for flexibility

Current date: ${new Date().toDateString()}
`;

interface UserPromptOptions {
  currentMarketState: MarketState;
  accountInformationAndPerformance: AccountInformationAndPerformance;
  startTime: Date;
  invocationCount?: number;
  symbol?: Symbol;  // Add symbol to fetch S/R data
}

export async function generateUserPrompt(options: UserPromptOptions) {
  const {
    currentMarketState,
    accountInformationAndPerformance,
    startTime,
    invocationCount = 0,
    symbol = 'BTC',  // Default to BTC
  } = options;

  // Fetch latest S/R levels
  let srText = '';
  try {
    const srLevels = await getLatestSupportResistance(symbol);
    srText = formatSRForAI(symbol, srLevels);
  } catch (error) {
    console.error('Failed to fetch S/R levels:', error);
    srText = '\n⚠️  Support/Resistance data temporarily unavailable\n';
  }

  // Calculate position size based on symbol
  const positionSizePct = symbol === 'BTC' ? TRADING_CONFIG.POSITION_SIZE_PCT_BTC : TRADING_CONFIG.POSITION_SIZE_PCT_BNB;
  const positionSize = accountInformationAndPerformance.availableCash * positionSizePct;

  return `
It has been ${dayjs(new Date()).diff(
    startTime,
    "minute"
  )} minutes since you started trading. The current time is ${new Date().toISOString()} and you've been invoked ${invocationCount} times. Below, we are providing you with a variety of state data, price data, and predictive signals so you can discover alpha. Below that is your current account information, value, performance, positions, etc.

ALL OF THE PRICE OR SIGNAL DATA BELOW IS ORDERED: OLDEST → NEWEST

Timeframes note: Unless stated otherwise in a section title, intraday series are provided at 3‑minute intervals. If a coin uses a different interval, it is explicitly stated in that coin’s section.

# HERE IS THE CURRENT MARKET STATE
## ALL ${symbol} DATA FOR YOU TO ANALYZE
${formatMarketState(currentMarketState)}
----------------------------------------------------------
${srText}
----------------------------------------------------------
## HERE IS YOUR ACCOUNT INFORMATION & PERFORMANCE
${formatAccountPerformance(accountInformationAndPerformance)}

----------------------------------------------------------
## POSITION SIZING GUIDELINES (FOLLOW STRICTLY)
⚠️ RISK MANAGEMENT RULES (FIXED PARAMETERS):
- Leverage: FIXED ${TRADING_CONFIG.FIXED_LEVERAGE}x (never change)
- Position size: ${positionSizePct * 100}% of Available Cash for ${symbol} (adjusted for min order)  // Adjusted
- Cash reserve minimum: ${TRADING_CONFIG.MIN_CASH_RESERVE_PCT * 100}%
- Min Risk:Reward: ${TRADING_CONFIG.MIN_RISK_REWARD}:1 (mandatory)  // Adjusted
- Min Confluence Score: ${TRADING_CONFIG.MIN_CONFLUENCE_SCORE}/10 (mandatory)  // Adjusted

💰 CALCULATION EXAMPLE:
- Available Cash: $${accountInformationAndPerformance.availableCash.toFixed(2)}
- Position Size (${positionSizePct * 100}%): $${positionSize.toFixed(2)}  // Adjusted
- With ${TRADING_CONFIG.FIXED_LEVERAGE}x leverage: Can control up to $${(positionSize * TRADING_CONFIG.FIXED_LEVERAGE).toFixed(2)} position
- Must keep minimum cash: $${(accountInformationAndPerformance.availableCash * TRADING_CONFIG.MIN_CASH_RESERVE_PCT).toFixed(2)}
----------------------------------------------------------`;
}
