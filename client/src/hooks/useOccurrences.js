import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useTasksStore } from '../context/TaskContext.jsx';
import { expand } from '../lib/occurrences.js';

/**
 * Loads tasks for [from, to] and returns them expanded into occurrences.
 * `onlyCalendarIds` restricts to specific calendars (used by the Public tab);
 * otherwise hidden calendars are filtered out.
 */
export default function useOccurrences(from, to, { onlyCalendarIds = null } = {}) {
  const { calendarsById, hidden } = useApp();
  const { fetchRange, readRange, rev, epoch } = useTasksStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let alive = true;
    setError(null);
    setLoading(true);
    // Cached ranges younger than a minute are reused; older ones refetch.
    fetchRange(from, to)
      .catch((err) => alive && setError(err))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [from, to, epoch, retry, fetchRange]);

  const tasks = readRange(from, to);
  const onlyKey = onlyCalendarIds ? onlyCalendarIds.join(',') : '';

  const occurrences = useMemo(() => {
    if (!tasks) return [];
    if (onlyCalendarIds) {
      const allow = new Set(onlyCalendarIds);
      return expand(tasks.filter((t) => allow.has(t.calendarId)), from, to, calendarsById);
    }
    return expand(tasks, from, to, calendarsById, hidden);
    // rev changes whenever cached tasks are edited in place
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, rev, from, to, calendarsById, hidden, onlyKey]);

  const reload = useCallback(() => setRetry((r) => r + 1), []);

  return { occurrences, loading: loading && !tasks, refreshing: loading, error: tasks ? null : error, reload, ready: Boolean(tasks) };
}
