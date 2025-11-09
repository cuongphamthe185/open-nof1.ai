# 📊 Support/Resistance Detection System - Implementation Summary

## 🎯 Mục Tiêu
Xây dựng hệ thống tự động phát hiện vùng hỗ trợ (Support) và kháng cự (Resistance) để hỗ trợ AI trading ra quyết định chính xác hơn.

---

## 🏗️ Kiến Trúc Hệ Thống

### 1. Database Schema (PostgreSQL + Prisma)
**File:** `prisma/schema.prisma`

```prisma
model SupportResistanceLevel {
  id                    String   @id @default(uuid())
  symbol                String   // 'BTC', 'BNB'
  timeframe             String   // '15m', '1h', '4h'
  
  // Support levels (2 levels)
  support1              Decimal  @db.Decimal(12, 2)
  support1Strength      Int      // 1-10
  support2              Decimal? @db.Decimal(12, 2)
  support2Strength      Int?
  
  // Resistance levels (2 levels)
  resistance1           Decimal  @db.Decimal(12, 2)
  resistance1Strength   Int      // 1-10
  resistance2           Decimal? @db.Decimal(12, 2)
  resistance2Strength   Int?
  
  // Metadata
  currentPrice          Decimal  @db.Decimal(12, 2)
  calculationMethod     String   @default("hybrid")
  calculatedAt          DateTime @default(now())
  validUntil            DateTime
  createdAt             DateTime @default(now())
  
  @@unique([symbol, timeframe, calculatedAt])
  @@index([symbol, timeframe])
  @@index([calculatedAt])
  @@index([validUntil])
}
```

**Migration:** `20251108081157_add_support_resistance_levels`

---

### 2. Thuật Toán (Hybrid Approach)

#### 2.1 Configuration
**File:** `lib/trading/algorithms/config.ts`

```typescript
export const SR_CONFIG = {
  // Số nến tối ưu cho mỗi timeframe
  candles: {
    '15m': 50,  // ~12.5 giờ dữ liệu
    '1h': 75,   // ~3 ngày dữ liệu
    '4h': 100,  // ~16 ngày dữ liệu
  },
  
  // Trọng số cho mỗi thuật toán
  weights: {
    volumeProfile: 0.5,  // 50%
    pivotPoints: 0.3,    // 30%
    priceAction: 0.2,    // 20%
  },
  
  // Thời gian valid của kết quả
  validityDuration: {
    '15m': 60,   // 60 phút
    '1h': 240,   // 4 giờ
    '4h': 960,   // 16 giờ
  },
  
  // Kết quả
  result: {
    minStrength: 1,  // Chấp nhận signals yếu hơn (1-10)
    maxLevels: 2,    // Tối đa 2 support + 2 resistance
  },
};
```

#### 2.2 Ba Thuật Toán Kết Hợp

##### A. Volume Profile (50% weight)
**File:** `lib/trading/algorithms/volume-profile.ts`

**Cách hoạt động:**
1. Chia price range thành 15-25 buckets
2. Tính tổng volume cho mỗi bucket
3. Tìm High Volume Nodes (HVN) - vùng có volume cao
4. HVN = vùng mà giá có xu hướng quay lại (support/resistance mạnh)

**Output:** Danh sách levels với strength 0-10

##### B. Pivot Points (30% weight)
**File:** `lib/trading/algorithms/pivot-points.ts`

**Cách hoạt động:**
1. Tìm local highs/lows (swing points) với lookback/lookahead 5 nến
2. Cluster các pivot points gần nhau (±0.3%)
3. Pivot points = vùng giá đã reverse nhiều lần trong quá khứ

**Output:** Danh sách levels với strength dựa trên số lần test

##### C. Price Action (20% weight)
**File:** `lib/trading/algorithms/price-action.ts`

**Cách hoạt động:**
1. Tìm rejection wicks (bấc dài ≥60% tổng chiều dài nến)
2. Detect candlestick patterns (hammer, shooting star, engulfing)
3. Patterns cho thấy tâm lý thị trường reject giá tại vùng đó

**Output:** Danh sách levels từ rejection zones

##### D. Hybrid Algorithm (Tổng hợp)
**File:** `lib/trading/algorithms/hybrid-sr.ts`

**Cách hoạt động:**
```typescript
1. Chạy cả 3 thuật toán song song
2. Gộp tất cả levels lại
3. Cluster levels gần nhau (±0.5%)
4. Tính strength tổng hợp:
   strength = (volume_score * 0.5) + (pivot_score * 0.3) + (price_action_score * 0.2)
5. Filter levels có minStrength ≥ 1
6. Chọn 2 support mạnh nhất + 2 resistance mạnh nhất
7. Fallback: Nếu không tìm thấy level nào:
   - Support = Math.min(...candles.map(c => c.low))
   - Resistance = Math.max(...candles.map(c => c.high))
```

**Tại sao fallback dùng min/max thay vì currentPrice ± 5%?**
- ❌ `currentPrice * 0.95` có thể ra số ngoài range dữ liệu
- ✅ `Math.min(lows)` đảm bảo support nằm trong range thực tế của 50-100 nến
- ✅ Realistic: Support phải là vùng giá đã từng chạm trong lịch sử gần đây

---

### 3. Cron Job System

#### 3.1 Scheduler
**File:** `lib/cron/sr-calculator.ts`

```typescript
// Chạy mỗi phút, check xem có cần calculate không
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const minute = now.getMinutes();
  const hour = now.getHours();

  // 15m: Chạy vào phút 02, 17, 32, 47 của mỗi giờ
  if ([2, 17, 32, 47].includes(minute)) {
    await calculateAndStoreSR('BTC', '15m');
    await calculateAndStoreSR('BNB', '15m');
  }

  // 1h: Chạy vào phút 02 của mỗi giờ
  if (minute === 2) {
    await calculateAndStoreSR('BTC', '1h');
    await calculateAndStoreSR('BNB', '1h');
  }

  // 4h: Chạy vào phút 02 của giờ 00, 04, 08, 12, 16, 20
  if (minute === 2 && [0, 4, 8, 12, 16, 20].includes(hour)) {
    await calculateAndStoreSR('BTC', '4h');
    await calculateAndStoreSR('BNB', '4h');
  }
});
```

#### 3.2 Service
**File:** `lib/cron/sr-service.ts`

```typescript
export async function calculateAndStoreSR(symbol, timeframe) {
  // 1. Fetch OHLCV từ Binance
  const candles = await binance.fetchOHLCV(
    `${symbol}/USDT`,
    timeframe,
    undefined,
    SR_CONFIG.candles[timeframe]
  );

  // 2. Calculate S/R
  const result = await calculateSupportResistance(symbol, timeframe, candles);

  // 3. Store vào PostgreSQL
  await prisma.supportResistanceLevel.create({
    data: {
      symbol,
      timeframe,
      support1: result.support1.price,
      support1Strength: result.support1.strength,
      resistance1: result.resistance1.price,
      resistance1Strength: result.resistance1.strength,
      calculatedAt: result.calculatedAt,
      validUntil: result.validUntil,
      // ... other fields
    },
  });
}
```

#### 3.3 Integration
**File:** `cron.ts`

```typescript
import './lib/cron/sr-calculator';  // Kích hoạt cron job
```

---

### 4. AI Integration

#### 4.1 Fetch S/R Data
**File:** `lib/ai/support-resistance.ts`

```typescript
export async function getLatestSupportResistance(symbol: string) {
  const data = {
    '15m': await prisma.supportResistanceLevel.findFirst({
      where: { symbol, timeframe: '15m', validUntil: { gt: new Date() } },
      orderBy: { calculatedAt: 'desc' },
    }),
    '1h': await prisma.supportResistanceLevel.findFirst({
      where: { symbol, timeframe: '1h', validUntil: { gt: new Date() } },
      orderBy: { calculatedAt: 'desc' },
    }),
    '4h': await prisma.supportResistanceLevel.findFirst({
      where: { symbol, timeframe: '4h', validUntil: { gt: new Date() } },
      orderBy: { calculatedAt: 'desc' },
    }),
  };

  return formatSRForAI(symbol, data);
}
```

#### 4.2 Format cho AI
**File:** `lib/ai/support-resistance.ts`

```typescript
export function formatSRForAI(symbol, data) {
  return `
📊 SUPPORT & RESISTANCE ANALYSIS FOR ${symbol}

⏱️  15-MINUTE TIMEFRAME (Primary Trading):
   🟢 Support:  $${data['15m'].support1} (Strength: ${data['15m'].support1Strength}/10)
   🔴 Resistance: $${data['15m'].resistance1} (Strength: ${data['15m'].resistance1Strength}/10)

⏱️  1-HOUR TIMEFRAME (Trend Filter):
   🟢 Support:  $${data['1h'].support1} (Strength: ${data['1h'].support1Strength}/10)
   🔴 Resistance: $${data['1h'].resistance1} (Strength: ${data['1h'].resistance1Strength}/10)

⏱️  4-HOUR TIMEFRAME (Big Picture):
   🟢 Major Support:  $${data['4h'].support1} (Strength: ${data['4h'].support1Strength}/10)
   🔴 Major Resistance: $${data['4h'].resistance1} (Strength: ${data['4h'].resistance1Strength}/10)

💡 TRADING GUIDELINES:
   🎯 BUY near 15m support + above 1h support + above 4h support
   🎯 SELL near 15m resistance + below 1h resistance + below 4h resistance
   ⚠️  Set stop-loss below nearest strong support
  `;
}
```

#### 4.3 Update AI Prompt
**File:** `lib/ai/prompt.ts`

```typescript
export const getSystemPrompt = async (symbol: string) => {
  // Fetch S/R data
  const srData = await getLatestSupportResistance(symbol);
  
  return `
You are an AI trading assistant.

${srData}  // ← Thêm S/R data vào prompt

Current market state:
...
  `;
};
```

---

## 🧪 Testing & Monitoring

### 5.1 Test Scripts

#### A. Manual Test
**File:** `scripts/test-sr-system.ts`
```bash
npx tsx scripts/test-sr-system.ts BTC 15m
```

**Output:**
```
BTC 15m - Support/Resistance
Current Price: $101,664.00

Support Levels:
  1. $101,400.10 (Strength: 1/10) [fallback:lowest]

Resistance Levels:
  1. $101,964.07 (Strength: 10/10) [volume_profile, pivot_points, price_action]
  2. $102,503.86 (Strength: 4/10) [volume_profile, price_action]

Execution time: 3014ms
✅ TEST PASSED
```

#### B. View Stored Data
**File:** `scripts/view-sr-levels.ts`
```bash
npx tsx scripts/view-sr-levels.ts BTC
```

Shows all 3 timeframes with formatted trading guidelines.

#### C. Monitor System
**File:** `scripts/monitor-sr-system.ts`
```bash
npx tsx scripts/monitor-sr-system.ts
```

Real-time monitoring của cron jobs và database updates.

---

## 📈 Kết Quả Thực Tế

### Test với BTC (November 8, 2025)
**Current Price:** $101,664

#### 15m Timeframe (50 candles):
- ✅ Support: $101,400 (trong range chart)
- ✅ Resistance: $101,964 (Strength 10/10)

#### 1h Timeframe (75 candles):
- ✅ Support: $101,186 → $100,238
- ✅ Resistance: $101,716 (Strength 7/10)

#### 4h Timeframe (100 candles):
- ✅ Support: $100,637 → $99,044 (major support!)
- ✅ Resistance: $102,037

**So sánh với TradingView:**
- Chart range: $99,500 - $104,700
- ✅ 4h support $99,044 ≈ chart bottom $99,500
- ✅ Tất cả levels nằm trong visible range
- ✅ Không còn levels "bay ngoài" như trước ($96,519)

---

## 🐛 Bugs Đã Fix

### Bug #1: Strength Scores Vượt 10
**Hiện tượng:** Thấy "24/10", "30/10" strength
**Nguyên nhân:** Nhân thêm `* 20` trong volume profile calculation
```typescript
// ❌ SAI:
strength = Math.round(node.strength * weight * 20)
// Result: 10 * 0.5 * 20 = 100 (sai!)

// ✅ ĐÚNG:
strength = Math.round(node.strength * weight)
// Result: 10 * 0.5 = 5 (đúng!)
```

### Bug #2: Support Levels Không Realistic
**Hiện tượng:** Support $96,519 khi current price $101,664 (5% xa)
**Nguyên nhân:** 
1. `minStrength: 3` quá strict → filter hết levels → dùng fallback
2. Fallback dùng `currentPrice * 0.95` → ra số ngoài candle range

**Fix:**
```typescript
// ❌ SAI:
support: currentPrice * 0.95  // $101,664 * 0.95 = $96,580
minStrength: 3

// ✅ ĐÚNG:
support: Math.min(...candles.map(c => c.low))  // $101,400 (thực tế)
minStrength: 1
```

---

## 🚀 Cách Sử Dụng

### 1. Start Cron Job
```bash
npm run dev  # hoặc npm start
# Cron tự động chạy theo schedule
```

### 2. Manual Test
```bash
npx tsx scripts/test-sr-system.ts BTC 15m
npx tsx scripts/test-sr-system.ts BNB 1h
```

### 3. View Current Levels
```bash
npx tsx scripts/view-sr-levels.ts BTC
npx tsx scripts/view-sr-levels.ts BNB
```

### 4. Monitor System
```bash
npx tsx scripts/monitor-sr-system.ts
```

---

## 📊 Performance

- **15m calculation:** ~3 seconds
- **1h calculation:** ~5 seconds
- **4h calculation:** ~4 seconds
- **Database queries:** <100ms
- **Memory usage:** Minimal (stateless)

---

## 🔮 Future Enhancements

1. **Backtesting:** Track accuracy của S/R predictions
2. **Visualization:** Chart overlay với S/R levels
3. **More symbols:** Extend sang ETH, SOL, DOGE
4. **Dynamic weights:** Adjust weights dựa trên market conditions
5. **Machine Learning:** Learn optimal parameters from historical data

---

## 📝 Files Created/Modified

### Created:
1. `prisma/migrations/20251108081157_add_support_resistance_levels/`
2. `lib/trading/algorithms/config.ts`
3. `lib/trading/algorithms/types.ts`
4. `lib/trading/algorithms/volume-profile.ts`
5. `lib/trading/algorithms/pivot-points.ts`
6. `lib/trading/algorithms/price-action.ts`
7. `lib/trading/algorithms/hybrid-sr.ts`
8. `lib/cron/sr-service.ts`
9. `lib/cron/sr-calculator.ts`
10. `lib/ai/support-resistance.ts`
11. `scripts/test-sr-system.ts`
12. `scripts/view-sr-levels.ts`
13. `scripts/monitor-sr-system.ts`
14. `scripts/view-candles.ts`
15. `scripts/view-indicators.ts`
16. `scripts/view-market-state.ts`

### Modified:
1. `prisma/schema.prisma` - Added SupportResistanceLevel model
2. `cron.ts` - Import SR calculator
3. `lib/ai/prompt.ts` - Include S/R data in AI prompt

---

## ✅ Checklist Hoàn Thành

- [x] Database schema design
- [x] Volume Profile algorithm
- [x] Pivot Points algorithm
- [x] Price Action algorithm
- [x] Hybrid algorithm
- [x] Cron job scheduler
- [x] Database service
- [x] AI integration
- [x] Test scripts
- [x] Bug fixes (strength scores)
- [x] Bug fixes (realistic levels)
- [x] **Timezone verification (UTC+7 ✅)**
- [ ] Production deployment
- [ ] 24-hour monitoring

---

## 🌏 Timezone Configuration

**Status:** ✅ VERIFIED & WORKING

### System Timezone Setup:

| Component | Timezone | Status |
|-----------|----------|--------|
| **Node.js** | GMT+0700 (Indochina Time) | ✅ |
| **PostgreSQL** | Asia/Bangkok (UTC+7) | ✅ |
| **Prisma ORM** | Stores in UTC, displays in local | ✅ |
| **Application** | UTC+7 (Vietnam timezone) | ✅ |

### How It Works:

1. **Storage (Database):**
   ```
   calculatedAt: 2025-11-08T16:09:48.447Z  (UTC)
   validUntil:   2025-11-08T17:09:48.447Z  (UTC)
   ```
   - All DateTime fields stored in **UTC** (best practice)
   - Prisma uses `@default(now())` which saves in UTC

2. **Display (Application):**
   ```
   Local time: Sat Nov 08 2025 23:09:55 GMT+0700
   UTC time:   2025-11-08T16:09:55.105Z
   ```
   - JavaScript automatically converts to local timezone (UTC+7)
   - 16:09 UTC = 23:09 ICT (16 + 7 = 23) ✅

3. **Verification:**
   ```bash
   npx tsx scripts/check-timezone.ts
   ```
   Output:
   ```
   PostgreSQL timezone: Asia/Bangkok
   Node.js timezone: GMT+0700 (Indochina Time)
   Offset: -420 minutes (-7 hours = UTC+7) ✅
   ```

### Why Store in UTC?

✅ **Best Practices:**
- Universal standard for storage
- Avoid daylight saving time issues
- Easy to convert to any timezone
- Database portable across regions

✅ **Display in Local:**
- Users see time in their timezone (UTC+7)
- No manual conversion needed
- JavaScript handles it automatically

### Testing:

```bash
# Check current timezone setup
npx tsx scripts/check-timezone.ts

# All test scripts display in UTC+7
npx tsx scripts/test-sr-system.ts BTC 15m
npx tsx scripts/view-sr-levels.ts BTC
```

**Conclusion:** Hệ thống đã được cấu hình đúng UTC+7 cho Vietnam timezone. Database lưu UTC (standard), application hiển thị UTC+7 (user-friendly).

