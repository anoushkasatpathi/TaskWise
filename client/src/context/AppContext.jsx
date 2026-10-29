// Session, user settings and calendars.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, del, get, patch, post, setUnauthorizedHandler } from '../lib/api.js';
import { unsubscribePush } from '../lib/push.js';

const AppContext = createContext(null);

const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

function applyTheme(pref) {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  try {
    localStorage.setItem('tw-theme', pref);
  } catch {
    /* storage may be blocked; the theme still applies for this visit */
  }
}

export function AppProvider({ children }) {
  const [status, setStatus] = useState('loading'); // loading | signedOut | ready | error
  const [bootError, setBootError] = useState(null);
  const [config, setConfig] = useState({ googleClientId: '', pushPublicKey: null });
  const [user, setUser] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [themePref, setThemePref] = useState(() => {
    try {
      return localStorage.getItem('tw-theme') || 'system';
    } catch {
      return 'system';
    }
  });

  const loadCalendars = useCallback(async () => {
    const data = await get('/calendars');
    setCalendars(data.calendars);
    return data.calendars;
  }, []);

  /** Called after Google sign-in succeeds or when an existing session is found. */
  const startSession = useCallback(
    async (u) => {
      setUser(u);
      setThemePref(u.settings.theme);
      await loadCalendars();
      setStatus('ready');
      // Keep the server's time zone in sync so reminders fire at the right local time.
      const tz = browserTimeZone();
      if (u.settings.timezone !== tz) {
        patch('/me/settings', { timezone: tz }, { silent: true })
          .then((d) => setUser(d.user))
          .catch(() => {});
      }
    },
    [loadCalendars]
  );

  const boot = useCallback(async () => {
    setStatus('loading');
    setBootError(null);
    try {
      const cfg = await get('/auth/config');
      setConfig(cfg);
      try {
        const { user: u } = await get('/auth/me');
        await startSession(u);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) setStatus('signedOut');
        else throw err;
      }
    } catch (err) {
      setBootError(err);
      setStatus('error');
    }
  }, [startSession]);

  useEffect(() => {
    boot();
  }, [boot]);

  // Any 401 from the API (expired cookie) sends the user back to sign-in.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('signedOut');
    });
  }, []);

  // Theme follows the saved preference, and the OS when set to "system".
  useEffect(() => {
    applyTheme(themePref);
    if (themePref !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themePref]);

  const signIn = useCallback(
    async (credential) => {
      const { user: u } = await post('/auth/google', { credential });
      await startSession(u);
      return u;
    },
    [startSession]
  );

  const signOut = useCallback(async () => {
    await unsubscribePush().catch(() => {});
    await post('/auth/logout').catch(() => {});
    setUser(null);
    setCalendars([]);
    setStatus('signedOut');
  }, []);

  /** Optimistically updates settings; rolls back and rethrows if the server refuses. */
  const updateSettings = useCallback(
    async (changes) => {
      const before = user;
      const { onboarded, ...settings } = changes;
      setUser((u) => ({ ...u, ...(onboarded !== undefined ? { onboarded } : {}), settings: { ...u.settings, ...settings } }));
      if (settings.theme) setThemePref(settings.theme);
      try {
        const data = await patch('/me/settings', changes);
        setUser(data.user);
        return data.user;
      } catch (err) {
        setUser(before);
        if (settings.theme) setThemePref(before.settings.theme);
        throw err;
      }
    },
    [user]
  );

  const hidden = useMemo(() => new Set(user?.settings.hiddenCalendarIds || []), [user]);

  const toggleCalendar = useCallback(
    (id) => {
      const next = new Set(hidden);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return updateSettings({ hiddenCalendarIds: [...next] });
    },
    [hidden, updateSettings]
  );

  const createCalendar = useCallback(async (body) => {
    const { calendar } = await post('/calendars', body);
    setCalendars((list) => [...list, calendar]);
    return calendar;
  }, []);

  const updateCalendar = useCallback(async (id, body) => {
    const { calendar } = await patch(`/calendars/${id}`, body);
    setCalendars((list) => list.map((c) => (c.id === id ? calendar : c)));
    return calendar;
  }, []);

  const deleteCalendar = useCallback(async (id) => {
    await del(`/calendars/${id}`);
    setCalendars((list) => list.filter((c) => c.id !== id));
  }, []);

  const copyPublicCalendar = useCallback(async (body = {}) => {
    const data = await post('/calendars/public/copy', body);
    setCalendars((list) => [...list, data.calendar]);
    return data;
  }, []);

  const calendarsById = useMemo(() => new Map(calendars.map((c) => [c.id, c])), [calendars]);
  const publicCalendar = useMemo(() => calendars.find((c) => c.type === 'public') || null, [calendars]);
  const privateCalendars = useMemo(() => calendars.filter((c) => c.type === 'private'), [calendars]);
  const writableCalendars = useMemo(() => calendars.filter((c) => c.canEdit), [calendars]);

  const value = useMemo(
    () => ({
      status, bootError, boot, config, user, setUser, signIn, signOut, updateSettings,
      themePref, setThemePref,
      calendars, calendarsById, publicCalendar, privateCalendars, writableCalendars, hidden,
      loadCalendars, toggleCalendar, createCalendar, updateCalendar, deleteCalendar, copyPublicCalendar,
      isAdmin: user?.role === 'admin',
    }),
    [status, bootError, boot, config, user, signIn, signOut, updateSettings, themePref, calendars, calendarsById,
      publicCalendar, privateCalendars, writableCalendars, hidden, loadCalendars, toggleCalendar, createCalendar,
      updateCalendar, deleteCalendar, copyPublicCalendar]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
