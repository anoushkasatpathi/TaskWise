// Local-date helpers. Task dates are "YYYY-MM-DD" strings in the user's local
// calendar; these helpers convert between them and Date objects at local midnight.

const pad = (n) => String(n).padStart(2, '0');

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayISO = () => toISO(new Date());

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(d.getDate(), last));
  return x;
}

export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

export function startOfWeek(d, weekStartsOn = 1) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (x.getDay() - weekStartsOn + 7) % 7;
  return addDays(x, -diff);
}

/** The 42 days (6 weeks) shown in a month grid. */
export function monthGrid(anchor, weekStartsOn = 1) {
  const start = startOfWeek(startOfMonth(anchor), weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export const weekDays = (anchor, weekStartsOn = 1) => {
  const start = startOfWeek(anchor, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

// ---- formatting (uses the browser's locale) ----
const fmt = (opts) => new Intl.DateTimeFormat(undefined, opts);
const F = {
  monthYear: fmt({ month: 'long', year: 'numeric' }),
  month: fmt({ month: 'long' }),
  weekdayShort: fmt({ weekday: 'short' }),
  weekdayLong: fmt({ weekday: 'long' }),
  dayMonth: fmt({ day: 'numeric', month: 'short' }),
  full: fmt({ weekday: 'long', day: 'numeric', month: 'long' }),
  medium: fmt({ weekday: 'short', day: 'numeric', month: 'short' }),
};
export const formatMonthYear = (d) => F.monthYear.format(d);
export const formatMonth = (d) => F.month.format(d);
export const formatWeekdayShort = (d) => F.weekdayShort.format(d);
export const formatWeekdayLong = (d) => F.weekdayLong.format(d);
export const formatDayMonth = (d) => F.dayMonth.format(d);
export const formatFull = (d) => F.full.format(d);
export const formatMedium = (d) => F.medium.format(d);

/** "14:30" -> "2:30 PM" (or 24h, depending on locale). */
export function formatTime(hhmm) {
  if (!hhmm) return 'All day';
  const [h, m] = hhmm.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h, m));
}

/** Friendly relative label for a date string: Today, Tomorrow, Yesterday, or "Tue, 4 Nov". */
export function relativeDay(iso) {
  const t = todayISO();
  if (iso === t) return 'Today';
  if (iso === toISO(addDays(new Date(), 1))) return 'Tomorrow';
  if (iso === toISO(addDays(new Date(), -1))) return 'Yesterday';
  return formatMedium(fromISO(iso));
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function leadLabel(minutes) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${minutes / 60} hour${minutes === 60 ? '' : 's'}`;
  return '1 day';
}
