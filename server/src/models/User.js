import mongoose from 'mongoose';

export const REMINDER_LEADS = [5, 15, 30, 60, 180, 1440]; // minutes
export const REMINDER_CHANNELS = ['browser', 'inapp'];

const settingsSchema = new mongoose.Schema(
  {
    // Empty array = reminders off. Chosen during onboarding.
    reminderChannels: { type: [String], enum: REMINDER_CHANNELS, default: [] },
    reminderLeadMinutes: { type: Number, enum: REMINDER_LEADS, default: 15 },
    theme: { type: String, enum: ['system', 'light', 'dark'], default: 'system' },
    weekStartsOn: { type: Number, enum: [0, 1], default: 1 }, // 0 = Sunday, 1 = Monday
    defaultView: { type: String, enum: ['month', 'week', 'day', 'list'], default: 'month' },
    timezone: { type: String, default: 'UTC' },
    hiddenCalendarIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
    picture: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    onboarded: { type: Boolean, default: false },
    settings: { type: settingsSchema, default: () => ({}) },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

/** Shape sent to the browser. Never includes internal ids beyond what the UI needs. */
userSchema.methods.toClient = function toClient() {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    picture: this.picture,
    role: this.role,
    onboarded: this.onboarded,
    settings: {
      reminderChannels: this.settings.reminderChannels,
      reminderLeadMinutes: this.settings.reminderLeadMinutes,
      theme: this.settings.theme,
      weekStartsOn: this.settings.weekStartsOn,
      defaultView: this.settings.defaultView,
      timezone: this.settings.timezone,
      hiddenCalendarIds: this.settings.hiddenCalendarIds.map(String),
    },
  };
};

export const User = mongoose.model('User', userSchema);
