import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { issueSession, clearSession, requireAuth } from '../middleware/auth.js';
import { verifyGoogleCredential, findOrCreateUser } from '../services/authService.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'rate_limited',
      message: 'Too many sign-in attempts.',
      hint: 'Wait a few minutes, then try again.',
    },
  },
});

// Public config the sign-in screen needs. The client id is not a secret.
router.get('/config', (req, res) => {
  res.json({
    googleClientId: env.googleClientId,
    pushPublicKey: env.pushEnabled ? env.vapidPublicKey : null,
  });
});

router.post(
  '/google',
  loginLimiter,
  validate(z.object({ credential: z.string().min(20, 'Missing Google credential') })),
  async (req, res) => {
    const payload = await verifyGoogleCredential(req.body.credential);
    const { user, created } = await findOrCreateUser(payload);
    issueSession(res, user);
    res.status(created ? 201 : 200).json({ user: user.toClient(), created });
  }
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toClient() });
});

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

export default router;
