// Small supporting collections.
import mongoose from 'mongoose';

/**
 * Admin rights granted by email to someone who has not signed in yet.
 * Consumed (deleted) on that person's first sign-in.
 */
const roleGrantSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
export const RoleGrant = mongoose.model('RoleGrant', roleGrantSchema);

/** A browser's Web Push endpoint for one user. */
const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);
export const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

/**
 * One row per reminder that has been delivered. The unique index is what
 * guarantees a reminder never fires twice, even with several tabs, devices
 * or server instances racing each other: only the first insert wins.
 * Rows expire automatically after 3 days.
 */
const reminderLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  occurrence: { type: String, required: true }, // "YYYY-MM-DDTHH:mm" wall-clock time
  channel: { type: String, enum: ['push', 'browser', 'inapp'], required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 3 },
});
reminderLogSchema.index({ user: 1, task: 1, occurrence: 1, channel: 1 }, { unique: true });
export const ReminderLog = mongoose.model('ReminderLog', reminderLogSchema);
