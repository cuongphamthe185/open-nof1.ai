/**
 * Calculate monthly API cost based on actual usage data
 * 
 * Usage: npx tsx scripts/calculate-monthly-cost.ts
 */

// ========================================
// DATA FROM DEEPSEEK DASHBOARD (Nov 9, 2025)
// ========================================
const todayUsage = {
  // Time range: 07:28 - 09:55 (2.46 hours of operation)
  hoursActive: 2.46,
  totalDecisions: 104, // AI decisions created
  
  // DeepSeek API usage breakdown:
  requestCount: 130,
  outputTokens: 52271,
  inputCacheHitTokens: 268800,
  inputCacheMissTokens: 196120,
  
  // DeepSeek pricing (from data)
  pricePerOutputToken: 0.00000042, // $0.42 per 1M tokens
  pricePerInputCacheHit: 0.000000028, // $0.028 per 1M tokens (cache hit = cheaper)
  pricePerInputCacheMiss: 0.00000028, // $0.28 per 1M tokens (cache miss = normal price)
};

// ========================================
// SYSTEM CONFIGURATION
// ========================================
const systemConfig = {
  // Current cron schedule:
  aiDecisionIntervalMinutes: 5, // AI runs every 5 minutes
  symbolsPerRun: 2, // BTC + BNB
  
  // Operating hours:
  hoursPerDay: 24, // Bot runs 24/7
  daysPerMonth: 30,
};

// ========================================
// CALCULATE COSTS
// ========================================

console.log("━".repeat(70));
console.log("📊 DEEPSEEK API COST ANALYSIS - OPEN-NOF1.AI");
console.log("━".repeat(70));
console.log();

// Calculate costs from today's actual data
const todayCost = {
  output: todayUsage.outputTokens * todayUsage.pricePerOutputToken,
  inputCacheHit: todayUsage.inputCacheHitTokens * todayUsage.pricePerInputCacheHit,
  inputCacheMiss: todayUsage.inputCacheMissTokens * todayUsage.pricePerInputCacheMiss,
};

const totalCostToday = todayCost.output + todayCost.inputCacheHit + todayCost.inputCacheMiss;

console.log("📅 TODAY'S ACTUAL USAGE (Nov 9, 2025):");
console.log(`   Time Active: ${todayUsage.hoursActive.toFixed(2)} hours`);
console.log(`   AI Decisions: ${todayUsage.totalDecisions}`);
console.log(`   API Requests: ${todayUsage.requestCount}`);
console.log();

console.log("💰 TODAY'S TOKEN COSTS:");
console.log(`   Output tokens:      ${todayUsage.outputTokens.toLocaleString()} × $${todayUsage.pricePerOutputToken} = $${todayCost.output.toFixed(6)}`);
console.log(`   Input (cache hit):  ${todayUsage.inputCacheHitTokens.toLocaleString()} × $${todayUsage.pricePerInputCacheHit} = $${todayCost.inputCacheHit.toFixed(6)}`);
console.log(`   Input (cache miss): ${todayUsage.inputCacheMissTokens.toLocaleString()} × $${todayUsage.pricePerInputCacheMiss} = $${todayCost.inputCacheMiss.toFixed(6)}`);
console.log(`   ${"━".repeat(55)}`);
console.log(`   TOTAL TODAY:        $${totalCostToday.toFixed(6)}`);
console.log();

// Calculate per-hour cost rate
const costPerHour = totalCostToday / todayUsage.hoursActive;
console.log(`⏱️  COST RATE: $${costPerHour.toFixed(6)} per hour`);
console.log();

// ========================================
// MONTHLY PROJECTIONS
// ========================================

console.log("━".repeat(70));
console.log("📈 MONTHLY COST PROJECTIONS");
console.log("━".repeat(70));
console.log();

// Scenario 1: Current partial day usage
const hoursInMonth = systemConfig.hoursPerDay * systemConfig.daysPerMonth;
const monthlyCostBasic = costPerHour * hoursInMonth;

console.log("🔵 SCENARIO 1: Current Schedule (AI every 5 min, 24/7)");
console.log(`   Hours/month: ${hoursInMonth}`);
console.log(`   Decisions/month: ~${Math.round((todayUsage.totalDecisions / todayUsage.hoursActive) * hoursInMonth)}`);
console.log(`   Requests/month: ~${Math.round((todayUsage.requestCount / todayUsage.hoursActive) * hoursInMonth)}`);
console.log(`   💵 ESTIMATED COST: $${monthlyCostBasic.toFixed(2)}/month`);
console.log();

// Scenario 2: More aggressive (every 3 minutes)
const scenario2Multiplier = 5 / 3; // From 5min to 3min = 1.67x more requests
const monthlyCost3Min = monthlyCostBasic * scenario2Multiplier;

console.log("🟡 SCENARIO 2: Aggressive (AI every 3 min, 24/7)");
console.log(`   Frequency: Every 3 minutes`);
console.log(`   Multiplier: ${scenario2Multiplier.toFixed(2)}x`);
console.log(`   💵 ESTIMATED COST: $${monthlyCost3Min.toFixed(2)}/month`);
console.log();

// Scenario 3: Less frequent (every 10 minutes)
const scenario3Multiplier = 5 / 10; // From 5min to 10min = 0.5x requests
const monthlyCost10Min = monthlyCostBasic * scenario3Multiplier;

console.log("🟢 SCENARIO 3: Conservative (AI every 10 min, 24/7)");
console.log(`   Frequency: Every 10 minutes`);
console.log(`   Multiplier: ${scenario3Multiplier.toFixed(2)}x`);
console.log(`   💵 ESTIMATED COST: $${monthlyCost10Min.toFixed(2)}/month`);
console.log();

// Scenario 4: Market hours only (8am-10pm = 14 hours/day)
const marketHoursMultiplier = 14 / 24;
const monthlyCostMarketHours = monthlyCostBasic * marketHoursMultiplier;

console.log("🟣 SCENARIO 4: Market Hours Only (5min, 14hrs/day)");
console.log(`   Active hours: 8am-10pm (14 hours/day)`);
console.log(`   Multiplier: ${marketHoursMultiplier.toFixed(2)}x`);
console.log(`   💵 ESTIMATED COST: $${monthlyCostMarketHours.toFixed(2)}/month`);
console.log();

// ========================================
// COST BREAKDOWN ANALYSIS
// ========================================

console.log("━".repeat(70));
console.log("🔍 COST BREAKDOWN & OPTIMIZATION");
console.log("━".repeat(70));
console.log();

const costPercentages = {
  output: (todayCost.output / totalCostToday) * 100,
  cacheHit: (todayCost.inputCacheHit / totalCostToday) * 100,
  cacheMiss: (todayCost.inputCacheMiss / totalCostToday) * 100,
};

console.log("📊 TOKEN TYPE DISTRIBUTION:");
console.log(`   Output tokens:      ${costPercentages.output.toFixed(1)}% of cost`);
console.log(`   Input (cache hit):  ${costPercentages.cacheHit.toFixed(1)}% of cost`);
console.log(`   Input (cache miss): ${costPercentages.cacheMiss.toFixed(1)}% of cost`);
console.log();

const cacheHitRate = (todayUsage.inputCacheHitTokens / (todayUsage.inputCacheHitTokens + todayUsage.inputCacheMissTokens)) * 100;
console.log(`🎯 CACHE EFFICIENCY:`);
console.log(`   Cache hit rate: ${cacheHitRate.toFixed(1)}%`);
console.log(`   ✅ Excellent! High cache hit rate = Lower costs`);
console.log();

// Calculate cost per decision
const costPerDecision = totalCostToday / todayUsage.totalDecisions;
console.log(`💡 COST PER AI DECISION:`);
console.log(`   $${costPerDecision.toFixed(6)} per decision`);
console.log(`   = $${(costPerDecision * 1000).toFixed(3)} per 1000 decisions`);
console.log();

// ========================================
// RECOMMENDATIONS
// ========================================

console.log("━".repeat(70));
console.log("💡 RECOMMENDATIONS");
console.log("━".repeat(70));
console.log();

console.log("1. 🎯 CURRENT SCHEDULE IS OPTIMAL:");
console.log(`   • 5-minute interval balances frequency vs cost`);
console.log(`   • Projected ~$${monthlyCostBasic.toFixed(2)}/month is very affordable`);
console.log();

console.log("2. 💰 COST OPTIMIZATION TIPS:");
console.log(`   • Cache hit rate is already excellent (${cacheHitRate.toFixed(1)}%)`);
console.log(`   • Consider market hours only to save ${((1 - marketHoursMultiplier) * 100).toFixed(0)}% ($${(monthlyCostBasic - monthlyCostMarketHours).toFixed(2)}/month)`);
console.log(`   • Keep prompt concise to reduce output tokens`);
console.log();

console.log("3. 📈 SCALING CONSIDERATIONS:");
console.log(`   • Adding more symbols: Linear cost increase`);
console.log(`   • 4 symbols = ~$${(monthlyCostBasic * 2).toFixed(2)}/month`);
console.log(`   • 10 symbols = ~$${(monthlyCostBasic * 5).toFixed(2)}/month`);
console.log();

console.log("4. ⚠️  IF IMPLEMENTING AUTO-EXECUTION:");
console.log(`   • Monitor Binance trading fees separately`);
console.log(`   • Futures fees: ~0.02% maker, ~0.04% taker`);
console.log(`   • Cost scales with trading volume, not API calls`);
console.log();

console.log("━".repeat(70));
console.log("✅ SUMMARY: DeepSeek API costs are VERY LOW");
console.log(`   Current projection: $${monthlyCostBasic.toFixed(2)}/month for 24/7 operation`);
console.log(`   That's only $${(monthlyCostBasic / 30).toFixed(3)}/day or $${(monthlyCostBasic / 30 / 24).toFixed(5)}/hour!`);
console.log("━".repeat(70));
console.log();
