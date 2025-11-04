import { binance } from "./binance";
import { prisma } from "../prisma";
import { Opeartion, Symbol } from "@prisma/client";

// ===========================
// Helper: Get minimum order size
// ===========================
async function getMinOrderSize(symbol: string): Promise<number> {
  try {
    const markets = await binance.loadMarkets();
    const market = markets[symbol];
    return market?.limits?.amount?.min || 0.001; // Default 0.001 BTC
  } catch (error) {
    console.error("Failed to load market limits:", error);
    return 0.001; // Fallback
  }
}

// ===========================
// Helper: Check if real trading is enabled
// ===========================
function isRealTradingEnabled(): boolean {
  return process.env.ENABLE_REAL_TRADING === "true";
}

// ===========================
// Execute BUY Order
// ===========================
export async function executeBuyOrder(params: {
  symbol: Symbol;
  pricing: number;
  amount: number;
  leverage: number;
  chatId: string;
}) {
  const { symbol, pricing, amount, leverage, chatId } = params;
  const tradingSymbol = `${symbol}/USDT`;
  const isDryRun = !isRealTradingEnabled();

  try {
    if (isDryRun) {
      console.log("🧪 [DRY RUN] Would execute BUY:", {
        symbol: tradingSymbol,
        amount,
        leverage,
        pricing,
        estimatedCost: amount * pricing,
      });

      // Simulate success in dry-run mode
      await prisma.trading.updateMany({
        where: { chatId, opeartion: Opeartion.Buy },
        data: {
          orderId: `dry-run-${Date.now()}`,
          executedAt: new Date(),
          executedPrice: pricing,
          executedAmount: amount,
          fee: 0,
          status: "FILLED",
        },
      });

      return {
        success: true,
        order: null,
        message: `[DRY RUN] Simulated buy of ${amount} ${symbol}`,
      };
    }

    // REAL TRADING MODE
    console.log("💰 [REAL] Executing BUY:", {
      symbol: tradingSymbol,
      amount,
      leverage,
    });

    // Set leverage
    await binance.setLeverage(leverage, tradingSymbol);

    // Calculate position size (with safety buffer for fees)
    const minSize = await getMinOrderSize(tradingSymbol);
    const safeAmount = Math.max(amount * 0.95, minSize); // 95% for fees

    // Execute MARKET BUY
    const order = await binance.createMarketBuyOrder(
      tradingSymbol,
      safeAmount
    );

    // Log to database
    await prisma.trading.updateMany({
      where: { chatId, opeartion: Opeartion.Buy },
      data: {
        orderId: order.id,
        executedAt: new Date(),
        executedPrice: order.average || pricing,
        executedAmount: order.filled || safeAmount,
        fee: order.fee?.cost || 0,
        status: "FILLED",
      },
    });

    console.log(
      `✅ BUY executed: ${order.filled} ${symbol} @ ${order.average}`
    );
    return { success: true, order };
  } catch (error: any) {
    console.error("❌ BUY failed:", error.message);

    await prisma.trading.updateMany({
      where: { chatId, opeartion: Opeartion.Buy },
      data: {
        status: "FAILED",
        errorMessage: error.message,
      },
    });

    return { success: false, error: error.message };
  }
}

// ===========================
// Execute SELL Order
// ===========================
export async function executeSellOrder(params: {
  symbol: Symbol;
  percentage: number;
  chatId: string;
}) {
  const { symbol, percentage, chatId } = params;
  const tradingSymbol = `${symbol}/USDT`;
  const isDryRun = !isRealTradingEnabled();

  try {
    if (isDryRun) {
      console.log("🧪 [DRY RUN] Would execute SELL:", {
        symbol: tradingSymbol,
        percentage,
      });

      // Simulate success in dry-run mode
      await prisma.trading.updateMany({
        where: { chatId, opeartion: Opeartion.Sell },
        data: {
          orderId: `dry-run-${Date.now()}`,
          executedAt: new Date(),
          status: "FILLED",
        },
      });

      return {
        success: true,
        order: null,
        message: `[DRY RUN] Simulated sell of ${percentage}% ${symbol}`,
      };
    }

    // REAL TRADING MODE
    console.log("💰 [REAL] Executing SELL:", {
      symbol: tradingSymbol,
      percentage,
    });

    // Get current position
    const positions = await binance.fetchPositions([tradingSymbol]);
    const position = positions.find((p) => p.symbol === tradingSymbol);

    if (!position || position.contracts === 0) {
      throw new Error("No position to sell");
    }

    // Calculate sell amount
    const sellAmount = (position.contracts * percentage) / 100;
    const minSize = await getMinOrderSize(tradingSymbol);

    if (sellAmount < minSize) {
      throw new Error(
        `Sell amount ${sellAmount} is less than minimum ${minSize}`
      );
    }

    // Execute MARKET SELL
    const order = await binance.createMarketSellOrder(
      tradingSymbol,
      sellAmount
    );

    // Log to database
    await prisma.trading.updateMany({
      where: { chatId, opeartion: Opeartion.Sell },
      data: {
        orderId: order.id,
        executedAt: new Date(),
        executedPrice: order.average,
        executedAmount: order.filled || sellAmount,
        fee: order.fee?.cost || 0,
        status: "FILLED",
      },
    });

    console.log(
      `✅ SELL executed: ${order.filled} ${symbol} @ ${order.average}`
    );
    return { success: true, order };
  } catch (error: any) {
    console.error("❌ SELL failed:", error.message);

    await prisma.trading.updateMany({
      where: { chatId, opeartion: Opeartion.Sell },
      data: {
        status: "FAILED",
        errorMessage: error.message,
      },
    });

    return { success: false, error: error.message };
  }
}

// ===========================
// Set Stop Loss & Take Profit
// ===========================
export async function setStopLossTakeProfit(params: {
  symbol: Symbol;
  stopLoss?: number;
  takeProfit?: number;
  chatId: string;
}) {
  const { symbol, stopLoss, takeProfit, chatId } = params;
  const tradingSymbol = `${symbol}/USDT`;
  const isDryRun = !isRealTradingEnabled();

  try {
    if (isDryRun) {
      console.log("🧪 [DRY RUN] Would set SL/TP:", {
        symbol: tradingSymbol,
        stopLoss,
        takeProfit,
      });

      // Simulate success in dry-run mode
      await prisma.trading.updateMany({
        where: { chatId, opeartion: Opeartion.Hold },
        data: {
          executedAt: new Date(),
          status: "FILLED",
        },
      });

      return {
        success: true,
        message: `[DRY RUN] Simulated SL: ${stopLoss}, TP: ${takeProfit}`,
      };
    }

    // REAL TRADING MODE
    console.log("💰 [REAL] Setting SL/TP:", {
      symbol: tradingSymbol,
      stopLoss,
      takeProfit,
    });

    // Get current position
    const positions = await binance.fetchPositions([tradingSymbol]);
    const position = positions.find((p) => p.symbol === tradingSymbol);

    if (!position || position.contracts === 0) {
      throw new Error("No position to set SL/TP");
    }

    const amount = position.contracts;

    // Set Stop Loss (if provided)
    if (stopLoss) {
      await binance.createOrder(
        tradingSymbol,
        "STOP_MARKET",
        "sell",
        amount,
        undefined,
        { stopPrice: stopLoss }
      );
      console.log(`✅ Stop Loss set at ${stopLoss}`);
    }

    // Set Take Profit (if provided)
    if (takeProfit) {
      await binance.createOrder(
        tradingSymbol,
        "TAKE_PROFIT_MARKET",
        "sell",
        amount,
        undefined,
        { stopPrice: takeProfit }
      );
      console.log(`✅ Take Profit set at ${takeProfit}`);
    }

    // Update database
    await prisma.trading.updateMany({
      where: { chatId, opeartion: Opeartion.Hold },
      data: {
        executedAt: new Date(),
        status: "FILLED",
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ SL/TP failed:", error.message);

    await prisma.trading.updateMany({
      where: { chatId, opeartion: Opeartion.Hold },
      data: {
        status: "FAILED",
        errorMessage: error.message,
      },
    });

    return { success: false, error: error.message };
  }
}
