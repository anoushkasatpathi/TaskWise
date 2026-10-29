// Web Push: sends reminders to a browser's service worker, so they arrive
// even when the TaskWise tab is closed. Disabled unless VAPID keys are set.
import webpush from 'web-push';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { PushSubscription } from '../models/misc.js';
import { upcomingOccurrences, claimReminder } from './reminderService.js';

const TICK_MS = 30 * 1000;
let timer = null;

if (env.pushEnabled) {
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
}

function formatWhen(occ) {
  const minutes = Math.round((Date.parse(occ.startsAt) - Date.now()) / 60000);
  if (minutes <= 0) return 'Starting now';
  if (minutes < 60) return `Starts in ${minutes} min`;
  if (minutes < 1440) return `Starts in ${Math.round(minutes / 60)} h`;
  return 'Starts tomorrow';
}

/** Sends one payload to every browser the user has subscribed; prunes dead subscriptions. */
export async function sendToUser(userId, payload) {
  const subs = await PushSubscription.find({ user: userId });
  let delivered = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
          JSON.stringify(payload),
          { TTL: 600 }
        );
        delivered += 1;
      } catch (err) {
        // 404/410 mean the browser unsubscribed or the endpoint expired.
        if (err.statusCode === 404 || err.statusCode === 410) await sub.deleteOne();
        else console.warn('[push] send failed:', err.statusCode || err.message);
      }
    })
  );
  return delivered;
}

/**
 * Finds reminders that are due for users who chose browser notifications and
 * have at least one subscribed browser, then sends each one exactly once.
 * The claim happens before sending, so a failed delivery is not retried:
 * we prefer "at most once" over risking duplicates.
 */
export async function checkDueReminders() {
  const now = Date.now();
  const userIds = await PushSubscription.distinct('user');
  if (!userIds.length) return;
  const users = await User.find({ _id: { $in: userIds }, 'settings.reminderChannels': 'browser' });
  for (const user of users) {
    try {
      const due = (await upcomingOccurrences(user, { hours: 1, now })).filter((o) => Date.parse(o.remindAt) <= now);
      for (const occ of due) {
        // The unique log entry is the "fire once" guarantee.
        if (!(await claimReminder(user._id, occ.taskId, occ.occurrence, 'push'))) continue;
        await sendToUser(user._id, {
          title: occ.title,
          body: `${formatWhen(occ)} · ${occ.calendarName}`,
          tag: `${occ.taskId}:${occ.occurrence}`,
          url: '/#/tasks',
        });
      }
    } catch (err) {
      console.warn('[push] reminder check failed for a user:', err.message);
    }
  }
}

export function startPushScheduler() {
  if (!env.pushEnabled || timer) return;
  console.log('[push] reminder scheduler running');
  timer = setInterval(() => checkDueReminders().catch((e) => console.warn('[push] tick failed:', e.message)), TICK_MS);
  timer.unref();
  checkDueReminders().catch(() => {});
}

export function stopPushScheduler() {
  clearInterval(timer);
  timer = null;
}
