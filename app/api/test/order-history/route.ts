import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch recent orders
    const orders = await prisma.trading.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { 
        Chat: {
          select: {
            chat: true,
            reasoning: true,
            createdAt: true,
          },
        },
      },
    });

    // Calculate summary
    const summary = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "PENDING").length,
      filled: orders.filter((o) => o.status === "FILLED").length,
      failed: orders.filter((o) => o.status === "FAILED").length,
      totalFees: orders.reduce((sum, o) => sum + (o.fee || 0), 0),
    };

    return NextResponse.json({ 
      orders,
      summary,
    });
  } catch (error: any) {
    console.error("Order history error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
