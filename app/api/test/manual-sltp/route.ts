import { NextRequest, NextResponse } from "next/server";
import { setStopLossTakeProfit } from "@/lib/trading/order-executor";
import { Symbol } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stopLoss, takeProfit, positionId } = body; // ✅ ADD: positionId

    if (!stopLoss && !takeProfit) {
      return NextResponse.json(
        { error: "At least one of stopLoss or takeProfit is required" },
        { status: 400 }
      );
    }

    // ✅ OPTIONAL: Validate positionId if provided
    if (positionId && typeof positionId !== 'string') {
      return NextResponse.json(
        { error: "positionId must be a string" },
        { status: 400 }
      );
    }

    // Create chat entry for tracking
    const chat = await prisma.chat.create({
      data: {
        reasoning: "Manual test SL/TP",
        chat: `Testing SL: ${stopLoss || "N/A"}, TP: ${takeProfit || "N/A"}${positionId ? ` for position ${positionId}` : ''}`,
        userPrompt: "Manual test via API",
        tradings: {
          create: {
            symbol: Symbol.BTC,
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
      symbol: Symbol.BTC,
      stopLoss,
      takeProfit,
      chatId: chat.id,
      positionId, // ✅ Pass positionId
    });

    return NextResponse.json({
      success: result.success,
      chatId: chat.id,
      positionId: result.positionId || positionId, // ✅ Return positionId
      message: result.success
        ? `Set SL: ${stopLoss || "N/A"}, TP: ${takeProfit || "N/A"}${positionId ? ` for position ${positionId}` : ''}`
        : result.error,
      details: {
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
