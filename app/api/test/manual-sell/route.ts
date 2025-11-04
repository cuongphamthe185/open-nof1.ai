import { NextRequest, NextResponse } from "next/server";
import { executeSellOrder } from "@/lib/trading/order-executor";
import { Symbol } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { percentage = 100 } = body;

    if (percentage <= 0 || percentage > 100) {
      return NextResponse.json(
        { error: "percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Create chat entry for tracking
    const chat = await prisma.chat.create({
      data: {
        reasoning: "Manual test sell",
        chat: `Testing sell ${percentage}% of BTC position`,
        userPrompt: "Manual test via API",
        tradings: {
          create: {
            symbol: Symbol.BTC,
            opeartion: "Sell",
          },
        },
      },
      include: { tradings: true },
    });

    // Execute order
    const result = await executeSellOrder({
      symbol: Symbol.BTC,
      percentage,
      chatId: chat.id,
    });

    return NextResponse.json({
      success: result.success,
      chatId: chat.id,
      order: result.order,
      message: result.success
        ? `Sold ${percentage}% of BTC position`
        : result.error,
      details: {
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
