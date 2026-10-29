// Central place for "who may see / change which calendar" so every route
// applies exactly the same rules.
import { Calendar } from '../models/Calendar.js';
import { forbidden, notFound } from '../utils/errors.js';

/** Calendars this user may read: their own private ones plus the public one. */
export function readableCalendarsQuery(user) {
  return { $or: [{ type: 'public' }, { type: 'private', owner: user._id }] };
}

export function canRead(user, calendar) {
  return calendar.type === 'public' || String(calendar.owner) === String(user._id);
}

export function canWrite(user, calendar) {
  return calendar.type === 'public' ? user.role === 'admin' : String(calendar.owner) === String(user._id);
}

/**
 * Loads a calendar and enforces access. Private calendars of other users
 * answer 404 (not 403) so their existence is not revealed.
 */
export async function loadCalendar(user, id, { write = false } = {}) {
  const calendar = await Calendar.findById(id);
  if (!calendar || !canRead(user, calendar)) throw notFound('That calendar does not exist.');
  if (write && !canWrite(user, calendar)) {
    throw forbidden(
      calendar.type === 'public'
        ? 'Only admins can change the public calendar.'
        : 'You cannot change this calendar.',
      { hint: calendar.type === 'public' ? 'Copy the public calendar to get your own editable version.' : '' }
    );
  }
  return calendar;
}
