import { Router } from 'express';
import { z } from 'zod';
import { validate, validId } from '../middleware/validate.js';
import { Calendar } from '../models/Calendar.js';
import { Task } from '../models/Task.js';
import { loadCalendar, readableCalendarsQuery } from '../services/access.js';
import { badRequest, forbidden } from '../utils/errors.js';

const router = Router();
const MAX_CALENDARS = 30;

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a color from the palette');
const name = z.string().trim().min(1, 'Give the calendar a name').max(60, 'Keep the name under 60 characters');

router.get('/', async (req, res) => {
  const calendars = await Calendar.find(readableCalendarsQuery(req.user)).sort({ type: -1, isDefault: -1, createdAt: 1 });
  res.json({ calendars: calendars.map((c) => c.toClient(req.user)) });
});

router.post('/', validate(z.object({ name, color: color.optional() })), async (req, res) => {
  const count = await Calendar.countDocuments({ owner: req.user._id });
  if (count >= MAX_CALENDARS) {
    throw badRequest(`You can have up to ${MAX_CALENDARS} calendars.`, { hint: 'Delete a calendar you no longer use.' });
  }
  const calendar = await Calendar.create({ ...req.body, type: 'private', owner: req.user._id });
  res.status(201).json({ calendar: calendar.toClient(req.user) });
});

router.patch(
  '/:id',
  validId(),
  validate(z.object({ name, color }).partial().strict()),
  async (req, res) => {
    const calendar = await loadCalendar(req.user, req.params.id, { write: true });
    Object.assign(calendar, req.body);
    await calendar.save();
    res.json({ calendar: calendar.toClient(req.user) });
  }
);

router.delete('/:id', validId(), async (req, res) => {
  const calendar = await loadCalendar(req.user, req.params.id, { write: true });
  if (calendar.type === 'public') throw forbidden('The public calendar cannot be deleted.');
  if (calendar.isDefault) {
    throw badRequest('Your main calendar cannot be deleted.', { hint: 'You can rename or recolor it instead.' });
  }
  await Task.deleteMany({ calendar: calendar._id });
  await calendar.deleteOne();
  res.json({ ok: true });
});

/**
 * Copies every task in the public calendar into a brand-new private calendar
 * owned by the caller. Completion state is reset on the copies.
 */
router.post(
  '/public/copy',
  validate(z.object({ name: name.optional(), color: color.optional() })),
  async (req, res) => {
    const pub = await Calendar.findOne({ type: 'public' });
    if (!pub) throw badRequest('There is no public calendar yet.', { hint: 'Ask an admin to set it up.' });

    const count = await Calendar.countDocuments({ owner: req.user._id });
    if (count >= MAX_CALENDARS) {
      throw badRequest(`You can have up to ${MAX_CALENDARS} calendars.`, { hint: 'Delete a calendar you no longer use.' });
    }

    const copy = await Calendar.create({
      name: req.body.name || `${pub.name} (copy)`,
      color: req.body.color || '#A774FF',
      type: 'private',
      owner: req.user._id,
    });
    const tasks = await Task.find({ calendar: pub._id }).lean();
    if (tasks.length) {
      await Task.insertMany(
        tasks.map(({ _id, createdAt, updatedAt, __v, ...t }) => ({
          ...t,
          calendar: copy._id,
          createdBy: req.user._id,
          done: false,
          completedDates: [],
          subtasks: (t.subtasks || []).map((s) => ({ title: s.title, done: false })),
        }))
      );
    }
    res.status(201).json({ calendar: copy.toClient(req.user), copied: tasks.length });
  }
);

export default router;
