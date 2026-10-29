// Turns task documents (where a repeating task is stored once) into the list
// of concrete occurrences the calendar draws.
import { occurrencesInRange, isOccurrenceDone } from './recurrence.js';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

/**
 * @returns {Array<{key, task, date, time, done, calendar}>} sorted by date,
 * then all-day first, then time, then priority.
 */
export function expand(tasks, from, to, calendarsById, hidden = new Set()) {
  const out = [];
  for (const task of tasks) {
    if (hidden.has(task.calendarId)) continue;
    const calendar = calendarsById.get(task.calendarId);
    if (!calendar) continue;
    for (const date of occurrencesInRange(task, from, to)) {
      out.push({
        key: `${task.id}|${date}`,
        task,
        date,
        time: task.time,
        done: isOccurrenceDone(task, date),
        calendar,
      });
    }
  }
  return out.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.time || '').localeCompare(b.time || '') ||
      PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority] ||
      a.task.title.localeCompare(b.task.title)
  );
}

export function groupByDate(occurrences) {
  const map = new Map();
  for (const o of occurrences) {
    if (!map.has(o.date)) map.set(o.date, []);
    map.get(o.date).push(o);
  }
  return map;
}
