import { NextRequest, NextResponse } from "next/server";
import { executeBuyOrder } from "@/lib/trading/order-executor";
import { Symbol } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentMarketState } from "@/lib/trading/current-market-state";
import { validateSymbol, symbolToTradingPair } from "@/lib/utils/symbol-validator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amountUSD, leverage = 1, symbol: inputSymbol } = body;

    if (!amountUSD || amountUSD <= 0) {
      return NextResponse.json(
        { error: "amountUSD must be greater than 0" },
        { status: 400 }
      );
    }

    // Validate symbol
    const symbol = validateSymbol(inputSymbol);
    const tradingPair = symbolToTradingPair(symbol);

    // Fetch current price from market
    const marketState = await getCurrentMarketState(tradingPair);
    const currentPrice = marketState.current_price;
    const amountCoin = amountUSD / currentPrice;

    // Create chat entry for tracking
    const chat = await prisma.chat.create({
      data: {
        reasoning: "Manual test buy",
        chat: `Testing buy ${amountUSD} USD worth of ${symbol}`,
        userPrompt: "Manual test via API",
        tradings: {
          create: {
            symbol: symbol,
            opeartion: "Buy",
            pricing: currentPrice,
            amount: amountCoin,
            leverage,
          },
        },
      },
      include: { tradings: true },
    });

    // Execute order
    const result = await executeBuyOrder({
      symbol: symbol,
      pricing: currentPrice,
      amount: amountCoin,
      leverage,
      chatId: chat.id,
    });

    return NextResponse.json({
      success: result.success,
      chatId: chat.id,
      positionId: result.positionId,
      message: result.success
        ? `Bought ${amountCoin.toFixed(8)} ${symbol} (~$${amountUSD})`
        : result.error,
      details: {
        symbol,
        tradingPair,
        amountCoin,
        currentPrice,
        leverage,
        estimatedCost: amountUSD,
        positionId: result.positionId,
      },
    });
  } catch (error: any) {
    console.error("Manual buy error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
