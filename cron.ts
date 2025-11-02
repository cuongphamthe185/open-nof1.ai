import cron from "node-cron";
import jwt from "jsonwebtoken";

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

const runChatInterval = async () => {
  console.log("Running task every 5 minutes");
  const token = jwt.sign(
    {
      sub: "cron-token",
    },
    process.env.CRON_SECRET_KEY || ""
  );

  await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/cron/3-minutes-run-interval?token=${token}`,
    {
      method: "GET",
    }
  );
};

// every 5 minutes (reduced from 3 to save costs)
cron.schedule("*/5 * * * *", async () => {
  await runChatInterval();
});

await runChatInterval();
