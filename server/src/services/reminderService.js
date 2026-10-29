// Works out which reminders are due for a user and records deliveries so
// that each reminder fires at most once per channel.
import { Calendar } from '../models/Calendar.js';
import { Task } from '../models/Task.js';
import { ReminderLog } from '../models/misc.js';
import { readableCalendarsQuery } from './access.js';
import { occurrencesInRange, isOccurrenceDone, addDaysStr } from '../utils/recurrence.js';
import { zonedToUtc, todayIn, isValidTimeZone } from '../utils/time.js';

// A reminder may still be delivered this long after its task's start time
// (covers a sleeping laptop or a server that was briefly asleep).
export const GRACE_MS = 10 * 60 * 1000;
// Tasks without a time are treated as starting at this hour.
export const ALL_DAY_TIME = '09:00';

/**
 * Returns upcoming occurrences for a user within the next `hours`, each with
 * the exact UTC instant the task starts and the instant its reminder is due.
 */
export async function upcomingOccurrences(user, { hours = 26, now = Date.now() } = {}) {
  const tz = isValidTimeZone(user.settings.timezone) ? user.settings.timezone : 'UTC';
  const lead = user.settings.reminderLeadMinutes * 60 * 1000;
  const hidden = new Set(user.settings.hiddenCalendarIds.map(String));

  const calendars = (await Calendar.find(readableCalendarsQuery(user))).filter((c) => !hidden.has(String(c._id)));
  if (!calendars.length) return [];
  const byId = new Map(calendars.map((c) => [String(c._id), c]));

  // Look one day back (grace window) and enough days forward to cover the lead time.
  const from = addDaysStr(todayIn(tz, now), -1);
  const to = addDaysStr(todayIn(tz, now), Math.ceil((hours * 3600000 + lead) / 86400000) + 1);

  const tasks = await Task.find({
    calendar: { $in: calendars.map((c) => c._id) },
    date: { $lte: to },
    $or: [{ recurrence: 'none', date: { $gte: from } }, { recurrence: { $ne: 'none' } }],
  }).limit(5000);

  const out = [];
  for (const task of tasks) {
    for (const date of occurrencesInRange(task, from, to)) {
      if (isOccurrenceDone(task, date)) continue;
      const time = task.time || ALL_DAY_TIME;
      const startsAt = zonedToUtc(date, time, tz);
      const remindAt = startsAt - lead;
      if (startsAt + GRACE_MS < now || remindAt > now + hours * 3600000) continue;
      const cal = byId.get(String(task.calendar));
      out.push({
        taskId: task._id.toString(),
        title: task.title,
        calendarId: String(task.calendar),
        calendarName: cal?.name || '',
        color: cal?.color || '#8E93D9',
        priority: task.priority,
        date,
        time: task.time,
        occurrence: `${date}T${time}`,
        startsAt: new Date(startsAt).toISOString(),
        remindAt: new Date(remindAt).toISOString(),
      });
    }
  }
  return out.sort((a, b) => a.remindAt.localeCompare(b.remindAt));
}

/**
 * Atomically claims a reminder for delivery. Returns true for the first
 * caller only; every later attempt (other tab, device or server) gets false.
 */
export async function claimReminder(userId, taskId, occurrence, channel) {
  try {
    await ReminderLog.create({ user: userId, task: taskId, occurrence, channel });
    return true;
  } catch (err) {
    if (err?.code === 11000) return false;
    throw err;
  }
}
