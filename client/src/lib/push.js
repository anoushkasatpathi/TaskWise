// Browser notification + Web Push helpers.
import { post } from './api.js';

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;
export const pushSupported = () =>
  notificationsSupported() && 'serviceWorker' in navigator && 'PushManager' in window;

export const notificationPermission = () => (notificationsSupported() ? Notification.permission : 'unsupported');

let registrationPromise = null;
/** Registers /sw.js once. Resolves to null if service workers are unavailable. */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .catch((err) => {
        console.warn('Service worker registration failed:', err);
        return null;
      });
  }
  return registrationPromise;
}

/** Asks for permission. Only called after the user chooses browser notifications. */
export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Subscribes this browser to Web Push and tells the server. Returns true on success. */
export async function subscribePush(publicKey) {
  if (!publicKey || !pushSupported() || Notification.permission !== 'granted') return false;
  const reg = await registerServiceWorker();
  if (!reg) return false;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const json = sub.toJSON();
  await post('/reminders/push/subscribe', { endpoint: json.endpoint, keys: json.keys }, { silent: true });
  return true;
}

export async function unsubscribePush() {
  const reg = await registerServiceWorker();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await post('/reminders/push/unsubscribe', { endpoint: sub.endpoint }, { silent: true }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export async function hasPushSubscription() {
  if (!pushSupported()) return false;
  const reg = await registerServiceWorker();
  return Boolean(await reg?.pushManager.getSubscription());
}

/** Shows a notification from the page (used when Web Push is not configured). */
export async function showLocalNotification(title, options) {
  if (notificationPermission() !== 'granted') return false;
  const reg = await registerServiceWorker();
  if (reg) {
    await reg.showNotification(title, { icon: '/favicon.svg', badge: '/favicon.svg', ...options });
  } else {
    new Notification(title, { icon: '/favicon.svg', ...options });
  }
  return true;
}
