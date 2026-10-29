// Task data: a small cache keyed by date range, plus create/update/toggle/delete.
// Each cache entry holds task documents (a repeating task appears once). Because
// the calendar expands tasks *per range*, it is safe for an entry to hold extra
// tasks, so a saved task can simply be upserted into every cached range.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { del, get, patch, post } from '../lib/api.js';
import { useApp } from './AppContext.jsx';

const TaskContext = createContext(null);
const FRESH_MS = 60 * 1000;

export function TaskProvider({ children }) {
  const { status, calendars } = useApp();
  const cache = useRef(new Map()); // key -> { tasks, at }
  const inflight = useRef(new Map());
  const [rev, setRev] = useState(0); // bumps whenever cached data changes
  const [epoch, setEpoch] = useState(0); // bumps to force refetch
  const bump = () => setRev((r) => r + 1);

  // Drop everything on sign-out.
  useEffect(() => {
    if (status !== 'ready') {
      cache.current.clear();
      bump();
    }
  }, [status]);

  // Forget tasks that belong to calendars that no longer exist.
  useEffect(() => {
    const ids = new Set(calendars.map((c) => c.id));
    let changed = false;
    for (const entry of cache.current.values()) {
      const kept = entry.tasks.filter((t) => ids.has(t.calendarId));
      if (kept.length !== entry.tasks.length) {
        entry.tasks = kept;
        changed = true;
      }
    }
    if (changed) bump();
  }, [calendars]);

  // Refresh when the user comes back to the tab, to pick up changes from elsewhere.
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState !== 'visible') return;
      const stale = [...cache.current.values()].some((e) => Date.now() - e.at > FRESH_MS);
      if (stale) setEpoch((e) => e + 1);
    };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, []);

  const fetchRange = useCallback(async (from, to, { force = false } = {}) => {
    const key = `${from}|${to}`;
    const hit = cache.current.get(key);
    if (hit && !force && Date.now() - hit.at < FRESH_MS) return hit.tasks;
    if (inflight.current.has(key)) return inflight.current.get(key);
    const p = get(`/tasks?from=${from}&to=${to}`)
      .then(({ tasks }) => {
        cache.current.set(key, { tasks, at: Date.now() });
        bump();
        return tasks;
      })
      .finally(() => inflight.current.delete(key));
    inflight.current.set(key, p);
    return p;
  }, []);

  const readRange = useCallback((from, to) => cache.current.get(`${from}|${to}`)?.tasks || null, []);

  const upsertLocal = (task) => {
    for (const entry of cache.current.values()) {
      const i = entry.tasks.findIndex((t) => t.id === task.id);
      if (i >= 0) entry.tasks = entry.tasks.map((t) => (t.id === task.id ? task : t));
      else entry.tasks = [...entry.tasks, task];
    }
    bump();
  };
  const removeLocal = (id) => {
    for (const entry of cache.current.values()) entry.tasks = entry.tasks.filter((t) => t.id !== id);
    bump();
  };

  const saveTask = useCallback(async (data, id) => {
    const { task } = id ? await patch(`/tasks/${id}`, data) : await post('/tasks', data);
    upsertLocal(task);
    return task;
  }, []);

  /** Optimistic: the checkbox flips instantly and rolls back if the server refuses. */
  const toggleDone = useCallback(async (task, date, done) => {
    const optimistic =
      task.recurrence === 'none'
        ? { ...task, done }
        : {
            ...task,
            completedDates: done
              ? [...new Set([...task.completedDates, date])]
              : task.completedDates.filter((d) => d !== date),
          };
    upsertLocal(optimistic);
    try {
      const { task: saved } = await post(`/tasks/${task.id}/toggle`, { date, done }, { silent: true });
      upsertLocal(saved);
      return saved;
    } catch (err) {
      upsertLocal(task);
      throw err;
    }
  }, []);

  const toggleSubtask = useCallback(async (task, subtaskId) => {
    const subtasks = task.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s));
    upsertLocal({ ...task, subtasks });
    try {
      const { task: saved } = await patch(
        `/tasks/${task.id}`,
        { subtasks: subtasks.map(({ title, done }) => ({ title, done })) },
        { silent: true }
      );
      upsertLocal(saved);
    } catch (err) {
      upsertLocal(task);
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (task) => {
    await del(`/tasks/${task.id}`);
    removeLocal(task.id);
  }, []);

  const invalidate = useCallback(() => {
    cache.current.clear();
    setEpoch((e) => e + 1);
  }, []);

  const value = useMemo(
    () => ({ rev, epoch, fetchRange, readRange, saveTask, toggleDone, toggleSubtask, deleteTask, invalidate }),
    [rev, epoch, fetchRange, readRange, saveTask, toggleDone, toggleSubtask, deleteTask, invalidate]
  );
  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export const useTasksStore = () => useContext(TaskContext);
