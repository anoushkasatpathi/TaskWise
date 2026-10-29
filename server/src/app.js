// Builds the Express app: security headers, API routes, and the built React
// client. Kept separate from index.js so tests can import it without listening.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { requireAuth, requireAdmin, requireAppHeader } from './middleware/auth.js';
import { errorHandler, notFoundApi } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import calendarRoutes from './routes/calendars.js';
import taskRoutes from './routes/tasks.js';
import adminRoutes from './routes/admin.js';
import reminderRoutes from './routes/reminders.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, '../../client/dist');

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Render (and most hosts) sit behind one proxy; needed for secure cookies and rate limits.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", 'https://accounts.google.com/gsi/client'],
          'frame-src': ["'self'", 'https://accounts.google.com/gsi/'],
          'connect-src': ["'self'", 'https://accounts.google.com/gsi/'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://accounts.google.com/gsi/style'],
          'font-src': ["'self'", 'data:'],
          'img-src': ["'self'", 'data:', 'https://*.googleusercontent.com'],
          'worker-src': ["'self'"],
          'upgrade-insecure-requests': env.isProd ? [] : null,
        },
      },
      // Google's sign-in popup needs to talk back to this window.
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // ---- API ----
  const api = express.Router();
  api.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: { code: 'rate_limited', message: 'Too many requests.', hint: 'Slow down for a minute.' } },
    })
  );
  api.use(requireAppHeader);

  api.get('/health', (req, res) => {
    res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'up' : 'down' });
  });
  api.use('/auth', authRoutes);
  api.use('/me', requireAuth, meRoutes);
  api.use('/calendars', requireAuth, calendarRoutes);
  api.use('/tasks', requireAuth, taskRoutes);
  api.use('/reminders', requireAuth, reminderRoutes);
  api.use('/admin', requireAuth, requireAdmin, adminRoutes);
  api.use(notFoundApi);

  app.use('/api', api);

  // ---- Built React client (production) ----
  if (fs.existsSync(clientDist)) {
    app.use(
      express.static(clientDist, {
        index: false,
        setHeaders(res, filePath) {
          // Hashed assets can be cached forever; the service worker and HTML must not be.
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    app.get('/{*splat}', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => {
      res
        .type('text')
        .send('TaskWise API is running. Start the client with "npm run dev:client", or run "npm run build" first.');
    });
  }

  app.use(errorHandler);
  return app;
}
