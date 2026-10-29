import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  hasPushSubscription, notificationPermission, notificationsSupported, requestPermission, subscribePush, unsubscribePush,
} from '../lib/push.js';

export const MODE_TO_CHANNELS = { browser: ['browser'], inapp: ['inapp'], both: ['browser', 'inapp'], off: [] };
export const channelsToMode = (ch = []) =>
  ch.includes('browser') && ch.includes('inapp') ? 'both' : ch.includes('browser') ? 'browser' : ch.includes('inapp') ? 'inapp' : 'off';

/**
 * Shared by onboarding and Settings. Asks for notification permission only
 * when the chosen mode needs it, and subscribes this browser to Web Push when
 * the server supports it.
 */
export default function useReminderSetup() {
  const { config } = useApp();
  const [permission, setPermission] = useState(notificationPermission());
  const [pushActive, setPushActive] = useState(false);

  useEffect(() => {
    hasPushSubscription().then(setPushActive).catch(() => {});
  }, []);

  /** Returns { permission, pushActive, warning } describing what happened. */
  const prepare = useCallback(
    async (mode) => {
      const needsBrowser = mode === 'browser' || mode === 'both';
      if (!needsBrowser) {
        await unsubscribePush().catch(() => {});
        setPushActive(false);
        return { permission: notificationPermission(), pushActive: false, warning: null };
      }
      if (!notificationsSupported()) {
        return {
          permission: 'unsupported',
          pushActive: false,
          warning: 'This browser does not support notifications. In-app alerts will still work while TaskWise is open.',
        };
      }
      const result = await requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        return {
          permission: result,
          pushActive: false,
          warning:
            result === 'denied'
              ? 'Notifications are blocked for this site. Click the lock icon next to the address, allow Notifications, then reload.'
              : 'Notification permission was not granted. You can allow it later from Settings.',
        };
      }
      let active = false;
      if (config.pushPublicKey) {
        try {
          active = await subscribePush(config.pushPublicKey);
        } catch {
          active = false;
        }
      }
      setPushActive(active);
      return { permission: result, pushActive: active, warning: null };
    },
    [config.pushPublicKey]
  );

  return { permission, pushActive, pushAvailable: Boolean(config.pushPublicKey), prepare, refresh: () => setPermission(notificationPermission()) };
}
