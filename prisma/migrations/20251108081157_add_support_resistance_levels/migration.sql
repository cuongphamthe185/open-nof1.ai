-- CreateEnum
CREATE TYPE "Opeartion" AS ENUM ('Buy', 'Sell', 'Hold');

-- CreateEnum
CREATE TYPE "Symbol" AS ENUM ('BTC', 'ETH', 'BNB', 'SOL', 'DOGE');

-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('Deepseek', 'DeepseekThinking', 'Qwen', 'Doubao');

-- CreateTable
CREATE TABLE "Metrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" "ModelType" NOT NULL,
    "metrics" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "model" "ModelType" NOT NULL DEFAULT 'Deepseek',
    "chat" TEXT NOT NULL DEFAULT '<no chat>',
    "reasoning" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trading" (
    "id" TEXT NOT NULL,
    "symbol" "Symbol" NOT NULL,
    "opeartion" "Opeartion" NOT NULL,
    "leverage" INTEGER,
    "amount" INTEGER,
    "pricing" INTEGER,
    "stopLoss" INTEGER,
    "takeProfit" INTEGER,
    "orderId" TEXT,
    "executedAt" TIMESTAMP(3),
    "executedPrice" DOUBLE PRECISION,
    "executedAmount" DOUBLE PRECISION,
    "fee" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chatId" TEXT,

    CONSTRAINT "Trading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_resistance_levels" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "support1" DECIMAL(12,2) NOT NULL,
    "support1Strength" INTEGER NOT NULL,
    "support2" DECIMAL(12,2),
    "support2Strength" INTEGER,
    "resistance1" DECIMAL(12,2) NOT NULL,
    "resistance1Strength" INTEGER NOT NULL,
    "resistance2" DECIMAL(12,2),
    "resistance2Strength" INTEGER,
    "currentPrice" DECIMAL(12,2) NOT NULL,
    "calculationMethod" TEXT NOT NULL DEFAULT 'hybrid',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_resistance_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_resistance_levels_symbol_timeframe_idx" ON "support_resistance_levels"("symbol", "timeframe");

-- CreateIndex
CREATE INDEX "support_resistance_levels_calculatedAt_idx" ON "support_resistance_levels"("calculatedAt");

-- CreateIndex
CREATE INDEX "support_resistance_levels_validUntil_idx" ON "support_resistance_levels"("validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "support_resistance_levels_symbol_timeframe_calculatedAt_key" ON "support_resistance_levels"("symbol", "timeframe", "calculatedAt");

-- AddForeignKey
ALTER TABLE "Trading" ADD CONSTRAINT "Trading_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
