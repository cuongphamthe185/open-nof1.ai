/**
 * Next.js Instrumentation Hook
 * DISABLED: Cron jobs are run separately via `bun run cron.ts`
 * to avoid duplicate cron instances from Next.js workers
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 [Instrumentation] Server started');
    
    // NOTE: Cron jobs are managed separately to prevent duplicates
    // Run manually with: bun run cron.ts
    
    console.log('✅ [Instrumentation] Initialization complete');
  }
}
