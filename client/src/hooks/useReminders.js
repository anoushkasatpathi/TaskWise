// Delivers reminders while TaskWise is open (in-app alerts, and browser
// notifications when Web Push is not available on this device).
// Every delivery is first "claimed" on the server, which only says yes once
// per reminder and channel, so other tabs/devices never show it again.
import { useEffect, useRef, useState } from 'react';
import { get, post } from '../lib/api.js';
import { hasPushSubscription, notificationPermission, showLocalNotification } from '../lib/push.js';
import { useApp } from '../context/AppContext.jsx';
import { useTasksStore } from '../context/TaskContext.jsx';
import { useUI } from '../context/UIContext.jsx';

const POLL_MS = 5 * 60 * 1000;
const CHECK_MS = 15 * 1000;
const GRACE_MS = 10 * 60 * 1000;

export default function useReminders() {
  const { user, status } = useApp();
  const { rev } = useTasksStore();
  const { pushAlert } = useUI();
  const [items, setItems] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushActive, setPushActive] = useState(false);
  const handled = useRef(new Set());

  const channels = user?.settings.reminderChannels || [];
  const active = status === 'ready' && channels.length > 0;

  // Load what is due in the next day; refresh periodically and shortly after edits.
  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    const load = () =>
      get('/reminders/upcoming', { silent: true })
        .then((d) => {
          if (!alive) return;
          setItems(d.items);
          setPushEnabled(d.pushEnabled);
        })
        .catch(() => {});
    const debounce = setTimeout(load, 800);
    const poll = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearTimeout(debounce);
      clearInterval(poll);
    };
  }, [active, rev, user?.settings.reminderLeadMinutes, user?.settings.hiddenCalendarIds]);

  // Is this browser receiving server-sent pushes? If so, the server handles "browser" reminders.
  useEffect(() => {
    if (!active) return;
    hasPushSubscription().then(setPushActive).catch(() => setPushActive(false));
  }, [active, channels.join(',')]);

  useEffect(() => {
    if (!active || !items.length) return undefined;

    const check = async () => {
      const now = Date.now();
      for (const item of items) {
        const due = Date.parse(item.remindAt) <= now && Date.parse(item.startsAt) + GRACE_MS >= now;
        if (!due) continue;

        if (channels.includes('inapp')) {
          const key = `${item.taskId}|${item.occurrence}|inapp`;
          if (!handled.current.has(key)) {
            handled.current.add(key);
            const { claimed } = await post('/reminders/claim', { taskId: item.taskId, occurrence: item.occurrence, channel: 'inapp' }, { silent: true }).catch(() => ({}));
            if (claimed) pushAlert({ key, ...item });
          }
        }

        const serverHandlesIt = pushEnabled && pushActive;
        if (channels.includes('browser') && !serverHandlesIt && notificationPermission() === 'granted') {
          const key = `${item.taskId}|${item.occurrence}|browser`;
          if (!handled.current.has(key)) {
            handled.current.add(key);
            const { claimed } = await post('/reminders/claim', { taskId: item.taskId, occurrence: item.occurrence, channel: 'browser' }, { silent: true }).catch(() => ({}));
            if (claimed) {
              const mins = Math.max(0, Math.round((Date.parse(item.startsAt) - now) / 60000));
              await showLocalNotification(item.title, {
                body: `${mins ? `Starts in ${mins} min` : 'Starting now'} · ${item.calendarName}`,
                tag: key,
                data: { url: '/#/today' },
              }).catch(() => {});
            }
          }
        }
      }
    };

    check();
    const t = setInterval(check, CHECK_MS);
    return () => clearInterval(t);
  }, [active, items, channels.join(','), pushEnabled, pushActive, pushAlert]);

  return { pushEnabled, pushActive };
}
