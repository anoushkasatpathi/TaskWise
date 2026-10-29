import mongoose from 'mongoose';

export const CALENDAR_COLORS = [
  '#8E93D9', // periwinkle
  '#A774FF', // violet
  '#3D7BFF', // electric blue
  '#5FC9B0', // teal
  '#F2C94C', // sunshine
  '#F27BA8', // rose
  '#F2994A', // apricot
  '#7C8495', // slate
];

const calendarSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    color: { type: String, default: CALENDAR_COLORS[0], match: /^#[0-9a-fA-F]{6}$/ },
    type: { type: String, enum: ['private', 'public'], default: 'private' },
    // Private calendars always have an owner; the single public calendar has none.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    // The calendar created at signup. It cannot be deleted.
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Guarantees there is never more than one public calendar.
calendarSchema.index(
  { type: 1 },
  { unique: true, partialFilterExpression: { type: 'public' } }
);

calendarSchema.methods.toClient = function toClient(user) {
  const isPublic = this.type === 'public';
  const canEdit = isPublic ? user.role === 'admin' : String(this.owner) === String(user._id);
  return {
    id: this._id.toString(),
    name: this.name,
    color: this.color,
    type: this.type,
    isDefault: this.isDefault,
    canEdit,
    canManage: canEdit, // rename / recolor
    canDelete: !isPublic && !this.isDefault && canEdit,
  };
};

export const Calendar = mongoose.model('Calendar', calendarSchema);

/** Creates the public calendar the first time the server boots. Safe to call repeatedly. */
export async function ensurePublicCalendar() {
  return Calendar.findOneAndUpdate(
    { type: 'public' },
    { $setOnInsert: { name: 'Public calendar', color: '#3D7BFF', type: 'public', owner: null } },
    { upsert: true, new: true }
  );
}
