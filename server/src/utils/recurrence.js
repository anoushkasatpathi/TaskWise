// Expands a task into the dates it occurs on.
// Keep this file identical to client/src/lib/recurrence.js so the calendar
// and the reminder scheduler always agree.
//
// Dates are "YYYY-MM-DD" strings. All arithmetic is done in UTC so daylight
// saving changes can never shift a date.

const DAY = 86400000;

export const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export const formatDate = (ms) => new Date(ms).toISOString().slice(0, 10);

export const addDaysStr = (s, n) => formatDate(parseDate(s) + n * DAY);

const daysInMonth = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/**
 * Returns every date in [from, to] (inclusive) on which `task` occurs.
 * Monthly tasks on the 29th-31st fall on the last day of shorter months.
 */
export function occurrencesInRange(task, from, to, limit = 1000) {
  const start = task.date;
  let end = to;
  if (task.recurrence !== 'none' && task.recurrenceEnd && task.recurrenceEnd < end) end = task.recurrenceEnd;
  if (start > end || (task.recurrence === 'none' && start < from)) return [];

  const out = [];
  switch (task.recurrence) {
    case 'daily': {
      let t = Math.max(parseDate(start), parseDate(from));
      const e = parseDate(end);
      for (; t <= e && out.length < limit; t += DAY) out.push(formatDate(t));
      break;
    }
    case 'weekly': {
      const s = parseDate(start);
      const f = parseDate(from);
      let t = s;
      if (f > s) t = s + Math.ceil((f - s) / (7 * DAY)) * 7 * DAY;
      const e = parseDate(end);
      for (; t <= e && out.length < limit; t += 7 * DAY) out.push(formatDate(t));
      break;
    }
    case 'monthly': {
      const [sy, sm, sd] = start.split('-').map(Number);
      const [fy, fm] = from.split('-').map(Number);
      // Begin at whichever month is later: the task's first month or the range's.
      let y = sy;
      let m = sm - 1;
      if (fy * 12 + (fm - 1) > y * 12 + m) {
        y = fy;
        m = fm - 1;
      }
      for (let i = 0; i < 1200 && out.length < limit; i++) {
        const d = Math.min(sd, daysInMonth(y, m));
        const ds = formatDate(Date.UTC(y, m, d));
        if (ds > end) break;
        if (ds >= from && ds >= start) out.push(ds);
        m += 1;
        if (m > 11) {
          m = 0;
          y += 1;
        }
      }
      break;
    }
    default:
      if (start >= from && start <= to) out.push(start);
  }
  return out;
}

export const isOccurrenceDone = (task, date) =>
  task.recurrence === 'none' ? Boolean(task.done) : (task.completedDates || []).includes(date);
