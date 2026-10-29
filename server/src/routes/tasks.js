import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { validate, validId } from '../middleware/validate.js';
import { Calendar } from '../models/Calendar.js';
import { Task, PRIORITIES, RECURRENCES } from '../models/Task.js';
import { loadCalendar, readableCalendarsQuery } from '../services/access.js';
import { badRequest, notFound } from '../utils/errors.js';
import { parseDate } from '../utils/recurrence.js';

const router = Router();

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-05-14');
const timeStr = z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Use a time like 09:30');

const taskFields = {
  calendarId: z.string().refine(mongoose.isValidObjectId, 'Choose a calendar'),
  title: z.string().trim().min(1, 'Give the task a title').max(140, 'Keep the title under 140 characters'),
  description: z.string().max(2000, 'Keep notes under 2000 characters'),
  date: dateStr,
  time: timeStr,
  priority: z.enum(PRIORITIES),
  category: z.string().trim().max(40, 'Keep the category short'),
  tags: z.array(z.string().trim().min(1).max(24)).max(8, 'Use at most 8 tags'),
  recurrence: z.enum(RECURRENCES),
  recurrenceEnd: z.union([dateStr, z.literal('')]),
  done: z.boolean(),
  subtasks: z
    .array(z.object({ title: z.string().trim().min(1).max(120), done: z.boolean().default(false) }))
    .max(20, 'Use at most 20 subtasks'),
};

const createSchema = z.object(taskFields).partial().required({ calendarId: true, title: true, date: true });
const updateSchema = z.object(taskFields).partial().strict();

function checkRecurrenceEnd(body) {
  if (body.recurrenceEnd && body.date && body.recurrenceEnd < body.date) {
    throw badRequest('The repeat end date is before the task date.', {
      hint: 'Pick an end date on or after the task date.',
      fields: { recurrenceEnd: 'Must be on or after the task date' },
    });
  }
}

/** Loads a task and the calendar it belongs to, enforcing read or write access. */
async function loadTask(user, id, { write = false } = {}) {
  const task = await Task.findById(id);
  if (!task) throw notFound('That task no longer exists.');
  const calendar = await loadCalendar(user, task.calendar, { write }).catch((err) => {
    throw err.status === 404 ? notFound('That task no longer exists.') : err;
  });
  return { task, calendar };
}

/**
 * GET /api/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD[&calendarIds=a,b]
 * Returns every task that can occur in the range. Recurring tasks are sent
 * once; the client expands them into individual dates.
 */
router.get(
  '/',
  validate(z.object({ from: dateStr, to: dateStr, calendarIds: z.string().optional() }), 'query'),
  async (req, res) => {
    const { from, to, calendarIds } = req.validQuery;
    if (to < from) throw badRequest('"to" must be on or after "from".');
    if ((parseDate(to) - parseDate(from)) / 86400000 > 400) {
      throw badRequest('That date range is too large.', { hint: 'Ask for at most about a year at a time.' });
    }

    const filter = readableCalendarsQuery(req.user);
    if (calendarIds) {
      const ids = calendarIds.split(',').filter(mongoose.isValidObjectId);
      filter._id = { $in: ids };
    }
    const calendars = await Calendar.find(filter).select('_id');

    const tasks = await Task.find({
      calendar: { $in: calendars.map((c) => c._id) },
      date: { $lte: to },
      $or: [
        { recurrence: 'none', date: { $gte: from } },
        { recurrence: { $ne: 'none' }, $or: [{ recurrenceEnd: '' }, { recurrenceEnd: { $gte: from } }] },
      ],
    })
      .sort({ date: 1, time: 1 })
      .limit(3000);

    res.json({ tasks: tasks.map((t) => t.toClient()) });
  }
);

router.get('/:id', validId(), async (req, res) => {
  const { task } = await loadTask(req.user, req.params.id);
  res.json({ task: task.toClient() });
});

router.post('/', validate(createSchema), async (req, res) => {
  const { calendarId, ...fields } = req.body;
  checkRecurrenceEnd(fields);
  const calendar = await loadCalendar(req.user, calendarId, { write: true });
  const task = await Task.create({ ...fields, calendar: calendar._id, createdBy: req.user._id });
  res.status(201).json({ task: task.toClient() });
});

router.patch('/:id', validId(), validate(updateSchema), async (req, res) => {
  const { task } = await loadTask(req.user, req.params.id, { write: true });
  const { calendarId, ...fields } = req.body;

  // Moving a task requires write access to the destination too.
  if (calendarId && calendarId !== String(task.calendar)) {
    const target = await loadCalendar(req.user, calendarId, { write: true });
    task.calendar = target._id;
  }
  checkRecurrenceEnd({ date: fields.date ?? task.date, recurrenceEnd: fields.recurrenceEnd ?? task.recurrenceEnd });

  // Changing how a task repeats invalidates per-occurrence completion.
  if (fields.recurrence && fields.recurrence !== task.recurrence) {
    task.completedDates = [];
    task.done = false;
  }
  Object.assign(task, fields);
  await task.save();
  res.json({ task: task.toClient() });
});

/**
 * Marks one occurrence complete / incomplete. For one-off tasks the date is
 * ignored and `done` flips; for repeating tasks only that date changes.
 */
router.post(
  '/:id/toggle',
  validId(),
  validate(z.object({ date: dateStr.optional(), done: z.boolean() })),
  async (req, res) => {
    const { task } = await loadTask(req.user, req.params.id, { write: true });
    if (task.recurrence === 'none') {
      task.done = req.body.done;
    } else {
      const date = req.body.date;
      if (!date) throw badRequest('Missing the date of the occurrence to complete.');
      const set = new Set(task.completedDates);
      if (req.body.done) set.add(date);
      else set.delete(date);
      task.completedDates = [...set].sort().slice(-1000);
    }
    await task.save();
    res.json({ task: task.toClient() });
  }
);

router.delete('/:id', validId(), async (req, res) => {
  const { task } = await loadTask(req.user, req.params.id, { write: true });
  await task.deleteOne();
  res.json({ ok: true });
});

export default router;
