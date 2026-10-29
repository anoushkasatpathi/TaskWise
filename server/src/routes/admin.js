// Admin-only endpoints. Mounted behind requireAuth + requireAdmin.
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { User } from '../models/User.js';
import { RoleGrant } from '../models/misc.js';
import { badRequest, notFound } from '../utils/errors.js';

const router = Router();
const PAGE_SIZE = 50;

const emailBody = z.object({ email: z.email('Enter a valid email address').transform((e) => e.toLowerCase().trim()) });

/** Lists admins plus pending grants (people promoted before their first sign-in). */
router.get('/admins', async (req, res) => {
  const [admins, pending] = await Promise.all([
    User.find({ role: 'admin' }).sort({ name: 1 }).limit(PAGE_SIZE),
    RoleGrant.find().sort({ createdAt: -1 }).limit(PAGE_SIZE),
  ]);
  res.json({
    admins: admins.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      picture: u.picture,
      fromEnv: env.adminEmails.includes(u.email),
    })),
    pending: pending.map((g) => ({ email: g.email })),
  });
});

router.post('/promote', validate(emailBody), async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    if (user.role === 'admin') {
      throw badRequest(`${email} is already an admin.`, { hint: 'No change needed.' });
    }
    user.role = 'admin';
    await user.save();
    return res.json({ status: 'promoted', message: `${user.name || email} is now an admin.` });
  }
  await RoleGrant.updateOne({ email }, { $setOnInsert: { email, grantedBy: req.user._id } }, { upsert: true });
  res.json({
    status: 'pending',
    message: `${email} has not signed in yet. They will become an admin on their first sign-in.`,
  });
});

router.post('/demote', validate(emailBody), async (req, res) => {
  const { email } = req.body;
  if (email === req.user.email) {
    throw badRequest('You cannot remove your own admin role.', { hint: 'Ask another admin to do it.' });
  }
  if (env.adminEmails.includes(email)) {
    throw badRequest('This admin is set in ADMIN_EMAILS.', {
      hint: 'Remove the email from the ADMIN_EMAILS environment variable instead.',
    });
  }
  const grant = await RoleGrant.findOneAndDelete({ email });
  const user = await User.findOne({ email });
  if (!user && !grant) throw notFound('No admin with that email.');
  if (user) {
    user.role = 'user';
    await user.save();
  }
  res.json({ status: 'demoted', message: `${email} is no longer an admin.` });
});

export default router;
