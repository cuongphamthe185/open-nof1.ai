import { NextRequest, NextResponse } from "next/server";
import { setStopLossTakeProfit } from "@/lib/trading/order-executor";
import { Symbol } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateSymbol, symbolToTradingPair } from "@/lib/utils/symbol-validator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stopLoss, takeProfit, positionId, symbol: inputSymbol } = body;

    if (!stopLoss && !takeProfit) {
      return NextResponse.json(
        { error: "At least one of stopLoss or takeProfit is required" },
        { status: 400 }
      );
    }

    // If positionId is provided, use it to determine symbol
    // Otherwise, validate symbol parameter
    let symbol: Symbol;
    let tradingPair: string;

    if (positionId) {
      // Validate positionId format
      if (typeof positionId !== 'string') {
        return NextResponse.json(
          { error: "positionId must be a string" },
          { status: 400 }
        );
      }
      
      // If symbol also provided, validate it
      if (inputSymbol) {
        symbol = validateSymbol(inputSymbol);
        tradingPair = symbolToTradingPair(symbol);
      } else {
        // Need to fetch position to determine symbol
        // Will be handled in order executor
        symbol = Symbol.BTC; // Temporary, will be determined by positionId
        tradingPair = "BTC/USDT"; // Temporary
      }
    } else {
      // No positionId - require symbol
      if (!inputSymbol) {
        return NextResponse.json(
          { error: "Either positionId or symbol must be provided" },
          { status: 400 }
        );
      }
      symbol = validateSymbol(inputSymbol);
      tradingPair = symbolToTradingPair(symbol);
    }

    // Create chat entry for tracking
    const chat = await prisma.chat.create({
      data: {
        reasoning: "Manual test SL/TP",
        chat: `Testing SL: ${stopLoss || "N/A"}, TP: ${takeProfit || "N/A"} for ${symbol}${positionId ? ` (position ${positionId})` : ''}`,
        userPrompt: "Manual test via API",
        tradings: {
          create: {
            symbol: symbol,
            opeartion: "Hold",
            stopLoss: stopLoss ? Math.floor(stopLoss) : undefined,
            takeProfit: takeProfit ? Math.floor(takeProfit) : undefined,
          },
        },
      },
      include: { tradings: true },
    });

    // Execute SL/TP setting
    const result = await setStopLossTakeProfit({
      symbol: symbol,
      stopLoss,
      takeProfit,
      chatId: chat.id,
      positionId,
    });

    return NextResponse.json({
      success: result.success,
      chatId: chat.id,
      positionId: result.positionId || positionId,
      message: result.success
        ? `Set SL: ${stopLoss || "N/A"}, TP: ${takeProfit || "N/A"} for ${symbol}${positionId ? ` (position ${positionId})` : ''}`
        : result.error,
      details: {
        symbol,
        tradingPair,
        stopLoss,
        takeProfit,
        positionId: result.positionId || positionId,
      },
    });
  } catch (error: any) {
    console.error("Manual SL/TP error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
