import { NextRequest, NextResponse } from "next/server";
import { executeSellOrder } from "@/lib/trading/order-executor";
import { Symbol } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateSymbol, symbolToTradingPair } from "@/lib/utils/symbol-validator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { percentage = 100, symbol: inputSymbol } = body;

    if (percentage <= 0 || percentage > 100) {
      return NextResponse.json(
        { error: "percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate symbol
    const symbol = validateSymbol(inputSymbol);
    const tradingPair = symbolToTradingPair(symbol);

    // Create chat entry for tracking
    const chat = await prisma.chat.create({
      data: {
        reasoning: "Manual test sell",
        chat: `Testing sell ${percentage}% of ${symbol} position`,
        userPrompt: "Manual test via API",
        tradings: {
          create: {
            symbol: symbol,
            opeartion: "Sell",
          },
        },
      },
      include: { tradings: true },
    });

    // Execute order
    const result = await executeSellOrder({
      symbol: symbol,
      percentage,
      chatId: chat.id,
    });

    return NextResponse.json({
      success: result.success,
      chatId: chat.id,
      order: result.order,
      message: result.success
        ? `Sold ${percentage}% of ${symbol} position`
        : result.error,
      details: {
        symbol,
        tradingPair,
        percentage,
      },
    });
  } catch (error: any) {
    console.error("Manual sell error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
