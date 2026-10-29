// Loads and validates environment variables once, so the rest of the
// server can import a plain, typed `env` object.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
// Look for .env in /server first, then in the repo root.
dotenv.config({ path: path.resolve(here, '../../.env'), quiet: true });
dotenv.config({ path: path.resolve(here, '../../../.env'), quiet: true });

const list = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  adminEmails: list(process.env.ADMIN_EMAILS),
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
};

env.pushEnabled = Boolean(env.vapidPublicKey && env.vapidPrivateKey);

/**
 * Fails fast with a readable message instead of a cryptic crash later.
 * Called from index.js (not from scripts that only need some variables).
 */
export function assertEnv(required = ['MONGO_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID']) {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(
      `\n[config] Missing environment variables: ${missing.join(', ')}\n` +
        '         Copy .env.example to .env (locally) or set them in the Render dashboard.\n'
    );
    process.exit(1);
  }
  if (env.isProd && env.jwtSecret.length < 32) {
    console.error('[config] JWT_SECRET must be at least 32 characters in production.');
    process.exit(1);
  }
}
