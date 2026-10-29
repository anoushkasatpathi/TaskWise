import { env, assertEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { ensurePublicCalendar } from './models/Calendar.js';
import { startPushScheduler } from './services/pushService.js';
import { createApp } from './app.js';

assertEnv();

async function main() {
  await connectDB();
  await ensurePublicCalendar();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] TaskWise listening on http://localhost:${env.port} (${env.nodeEnv})`);
    if (!env.pushEnabled) {
      console.log('[push] VAPID keys not set: reminders fire only while the site is open.');
    }
  });

  startPushScheduler();

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});
