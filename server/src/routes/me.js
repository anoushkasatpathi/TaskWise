// The signed-in user's own settings.
import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { REMINDER_CHANNELS, REMINDER_LEADS } from '../models/User.js';
import { Calendar } from '../models/Calendar.js';
import { readableCalendarsQuery } from '../services/access.js';
import { isValidTimeZone } from '../utils/time.js';

const router = Router();

const settingsSchema = z
  .object({
    reminderChannels: z.array(z.enum(REMINDER_CHANNELS)).max(2),
    reminderLeadMinutes: z
      .number()
      .refine((n) => REMINDER_LEADS.includes(n), 'Choose 5, 15, 30, 60, 180 or 1440 minutes'),
    theme: z.enum(['system', 'light', 'dark']),
    weekStartsOn: z.union([z.literal(0), z.literal(1)]),
    defaultView: z.enum(['month', 'week', 'day', 'list']),
    timezone: z.string().refine(isValidTimeZone, 'Unknown time zone'),
    hiddenCalendarIds: z.array(z.string().refine(mongoose.isValidObjectId, 'Invalid calendar id')).max(200),
    onboarded: z.boolean(),
  })
  .partial()
  .strict();

router.patch('/settings', validate(settingsSchema), async (req, res) => {
  const { onboarded, hiddenCalendarIds, reminderChannels, ...rest } = req.body;
  const user = req.user;

  Object.assign(user.settings, rest);
  if (reminderChannels) user.settings.reminderChannels = [...new Set(reminderChannels)];
  if (typeof onboarded === 'boolean') user.onboarded = onboarded;

  if (hiddenCalendarIds) {
    // Only keep ids of calendars this user can actually see.
    const visible = await Calendar.find({
      _id: { $in: hiddenCalendarIds },
      ...readableCalendarsQuery(user),
    }).select('_id');
    user.settings.hiddenCalendarIds = visible.map((c) => c._id);
  }

  await user.save();
  res.json({ user: user.toClient() });
});

export default router;
