import { NextRequest, NextResponse } from "next/server";
import { executeBuyOrder } from "@/lib/trading/order-executor";
import { Symbol } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amountUSD, leverage = 1 } = body;

    if (!amountUSD || amountUSD <= 0) {
      return NextResponse.json(
        { error: "amountUSD must be greater than 0" },
        { status: 400 }
      );
    }

    // Get current BTC price (you can replace with real-time fetch)
    const btcPrice = 95000; // TODO: Fetch from getCurrentMarketState
    const amountBTC = amountUSD / btcPrice;

    // Create chat entry for tracking
    const chat = await prisma.chat.create({
      data: {
        reasoning: "Manual test buy",
        chat: `Testing buy ${amountUSD} USD worth of BTC`,
        userPrompt: "Manual test via API",
        tradings: {
          create: {
            symbol: Symbol.BTC,
            opeartion: "Buy",
            pricing: btcPrice,
            amount: amountBTC,
            leverage,
          },
        },
      },
      include: { tradings: true },
    });

    // Execute order
    const result = await executeBuyOrder({
      symbol: Symbol.BTC,
      pricing: btcPrice,
      amount: amountBTC,
      leverage,
      chatId: chat.id,
    });

    return NextResponse.json({
      success: result.success,
      chatId: chat.id,
      positionId: result.positionId, // ✅ Return positionId
      message: result.success
        ? `Bought ${amountBTC.toFixed(8)} BTC (~$${amountUSD})`
        : result.error,
      details: {
        amountBTC,
        btcPrice,
        leverage,
        estimatedCost: amountUSD,
        positionId: result.positionId, // ✅ Include in details
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
