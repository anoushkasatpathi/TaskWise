import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { env } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { PushSubscription } from '../models/misc.js';
import { Task } from '../models/Task.js';
import { upcomingOccurrences, claimReminder } from '../services/reminderService.js';
import { sendToUser } from '../services/pushService.js';
import { loadCalendar } from '../services/access.js';
import { badRequest, notFound } from '../utils/errors.js';

const router = Router();

/** Reminders due in roughly the next day. The browser schedules in-app alerts from this. */
router.get('/upcoming', async (req, res) => {
  const items = await upcomingOccurrences(req.user, { hours: 26 });
  res.json({ items, serverTime: new Date().toISOString(), pushEnabled: env.pushEnabled });
});

/**
 * A tab asks to show a reminder. Only the first request per reminder and
 * channel gets { claimed: true }, which is how duplicates are prevented.
 */
router.post(
  '/claim',
  validate(
    z.object({
      taskId: z.string().refine(mongoose.isValidObjectId, 'Invalid task'),
      occurrence: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
      channel: z.enum(['browser', 'inapp']),
    })
  ),
  async (req, res) => {
    const task = await Task.findById(req.body.taskId).select('calendar');
    if (!task) throw notFound('That task no longer exists.');
    await loadCalendar(req.user, task.calendar); // must be able to read it
    const claimed = await claimReminder(req.user._id, task._id, req.body.occurrence, req.body.channel);
    res.json({ claimed });
  }
);

// ---- Web Push subscriptions ----

const subscriptionSchema = z.object({
  endpoint: z.url().max(2000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

router.post('/push/subscribe', validate(subscriptionSchema), async (req, res) => {
  if (!env.pushEnabled) {
    throw badRequest('Background notifications are not set up on this server.', {
      hint: 'Reminders will still show while TaskWise is open. Admins: add VAPID keys to enable them.',
    });
  }
  await PushSubscription.findOneAndUpdate(
    { endpoint: req.body.endpoint },
    { user: req.user._id, endpoint: req.body.endpoint, keys: req.body.keys },
    { upsert: true }
  );
  res.status(201).json({ ok: true });
});

router.post('/push/unsubscribe', validate(z.object({ endpoint: z.string().max(2000) })), async (req, res) => {
  await PushSubscription.deleteOne({ endpoint: req.body.endpoint, user: req.user._id });
  res.json({ ok: true });
});

router.post('/push/test', async (req, res) => {
  if (!env.pushEnabled) throw badRequest('Background notifications are not set up on this server.');
  const delivered = await sendToUser(req.user._id, {
    title: 'TaskWise notifications are on',
    body: 'Reminders will reach you here, even when the tab is closed.',
    tag: 'taskwise-test',
    url: '/#/settings',
  });
  if (!delivered) {
    throw badRequest('No browser is subscribed yet.', { hint: 'Turn on browser notifications in Settings first.' });
  }
  res.json({ ok: true, delivered });
});

export default router;
