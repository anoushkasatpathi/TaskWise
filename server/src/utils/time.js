// Time-zone helpers built on Intl, so no date library is needed on the server.

/** Returns true if `tz` is a real IANA time zone name. */
export function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const formatters = new Map();
function partsIn(tz, ms) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(tz, f);
  }
  return Object.fromEntries(f.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
}

/** Offset of `tz` from UTC at the instant `ms`, in milliseconds. */
function offsetMs(tz, ms) {
  const p = partsIn(tz, ms);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** Converts a wall-clock date + time in `tz` into a UTC timestamp. */
export function zonedToUtc(date, time, tz) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '09:00').split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = offsetMs(tz, guess);
  let t = guess - first;
  const second = offsetMs(tz, t);
  if (second !== first) t = guess - second; // crossed a DST boundary
  return t;
}

/** Today's date (YYYY-MM-DD) as seen in `tz`. */
export function todayIn(tz, ms = Date.now()) {
  const p = partsIn(tz, ms);
  return `${p.year}-${p.month}-${p.day}`;
}
