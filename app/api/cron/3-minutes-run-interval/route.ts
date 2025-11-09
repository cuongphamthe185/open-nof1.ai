import { run } from "@/lib/ai/run";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// Request deduplication - prevent duplicate runs in dev mode
let isRunning = false;
let lastRunTimestamp = 0;
const MIN_RUN_INTERVAL = 10000; // 10 seconds minimum between runs

export const GET = async (request: NextRequest) => {
  // Extract token from query parameters
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Token is required", { status: 400 });
  }

  try {
    jwt.verify(token, process.env.CRON_SECRET_KEY || "");
  } catch (error) {
    return new Response("Invalid token", { status: 401 });
  }

  // Deduplication check
  const now = Date.now();
  if (isRunning) {
    console.log('[Cron API] ⏭️ Skipping - already running');
    return new Response("Already running", { status: 429 });
  }
  
  if (now - lastRunTimestamp < MIN_RUN_INTERVAL) {
    console.log(`[Cron API] ⏭️ Skipping - last run was ${now - lastRunTimestamp}ms ago`);
    return new Response("Too soon", { status: 429 });
  }

  try {
    isRunning = true;
    lastRunTimestamp = now;
    
    console.log('[Cron API] Starting AI trading run...');
    await run(Number(process.env.START_MONEY));
    console.log('[Cron API] ✅ AI trading completed');
    return new Response("Process executed successfully");
  } catch (error: any) {
    console.error('[Cron API] ❌ Error:', error.message, error.stack);
    return new Response(`Error: ${error.message}`, { status: 500 });
  } finally {
    isRunning = false;
  }
};
