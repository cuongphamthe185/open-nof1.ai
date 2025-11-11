import cron from "node-cron";
import * as jwt from "jsonwebtoken";
import "./lib/cron/sr-calculator";  // Import SR calculator cron

// Generate unique instance ID to track if file is loaded multiple times
const INSTANCE_ID = Math.random().toString(36).substring(7);
console.log(`🆔 Cron instance ID: ${INSTANCE_ID}`);

const runMetricsInterval = async () => {
  console.log("Running task 20 seconds metrics interval");
  const token = jwt.sign(
    {
      sub: "cron-token",
    },
    process.env.CRON_SECRET_KEY || ""
  );

  await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/cron/20-seconds-metrics-interval?token=${token}`,
    {
      method: "GET",
    }
  );

  console.log("20 seconds metrics interval executed");
};

// every 20 seconds
cron.schedule("*/10 * * * * *", async () => {
  await runMetricsInterval();
});

// Prevent concurrent AI runs
let isAIRunning = false;

const runChatInterval = async () => {
  // Skip if already running
  if (isAIRunning) {
    console.log(`⏭️  [${INSTANCE_ID}] Skipping AI run - already in progress`);
    return;
  }
  
  isAIRunning = true;
  console.log(`▶️  [${INSTANCE_ID}] Running task every 5 minutes`);
  
  try {
    const token = jwt.sign(
      {
        sub: "cron-token",
      },
      process.env.CRON_SECRET_KEY || ""
    );

    const url = `${process.env.NEXT_PUBLIC_URL}/api/cron/3-minutes-run-interval?token=${token}`;
    console.log(`📡 [${INSTANCE_ID}] Calling API: ${url.substring(0, 80)}...`);
    
    const response = await fetch(url, {
      method: "GET",
    });
    
    console.log(`📥 [${INSTANCE_ID}] API responded: ${response.status}`);
    
    if (!response.ok) {
      console.error(`❌ [${INSTANCE_ID}] AI cron failed: ${response.status}`);
    } else {
      console.log(`✅ [${INSTANCE_ID}] AI cron completed successfully`);
    }
  } catch (error) {
    console.error(`❌ [${INSTANCE_ID}] AI cron error:`, error);
  } finally {
    isAIRunning = false;
  }
};

// every 5 minutes (optimized for 15m timeframe trading)
cron.schedule("*/5 * * * *", async () => {
  console.log(`⏰ [${INSTANCE_ID}] Cron trigger at ${new Date().toISOString()}`);
  await runChatInterval();
});

// NOTE: Startup call removed to prevent race condition
// AI will run at next cron schedule (0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 minutes)

console.log('✅ All cron jobs scheduled');
console.log('   - Metrics: Every 10 seconds');
console.log('   - AI Decision: Every 5 minutes (next at :00, :05, :10, :15, :20, :25, :30, :35, :40, :45, :50, :55)');
console.log('   - S/R Calculator: Every 10 minutes (at :00, :10, :20, :30, :40, :50)');
