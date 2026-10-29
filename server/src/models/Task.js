import mongoose from 'mongoose';

export const PRIORITIES = ['low', 'medium', 'high'];
export const RECURRENCES = ['none', 'daily', 'weekly', 'monthly'];

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    done: { type: Boolean, default: false },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    calendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: '', maxlength: 2000 },
    // Dates/times are stored as local "wall clock" strings (YYYY-MM-DD / HH:mm).
    // A task at 09:00 means 09:00 wherever the user is, like a paper planner.
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    time: { type: String, default: '', match: /^$|^([01]\d|2[0-3]):[0-5]\d$/ },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    category: { type: String, default: '', trim: true, maxlength: 40 },
    tags: { type: [String], default: [] },
    recurrence: { type: String, enum: RECURRENCES, default: 'none' },
    recurrenceEnd: { type: String, default: '', match: /^$|^\d{4}-\d{2}-\d{2}$/ },
    // One-off tasks use `done`; recurring tasks track each finished occurrence date.
    done: { type: Boolean, default: false },
    completedDates: { type: [String], default: [] },
    subtasks: { type: [subtaskSchema], default: [] },
  },
  { timestamps: true }
);

taskSchema.index({ calendar: 1, date: 1 });
taskSchema.index({ calendar: 1, recurrence: 1 });

taskSchema.methods.toClient = function toClient() {
  return {
    id: this._id.toString(),
    calendarId: this.calendar.toString(),
    title: this.title,
    description: this.description,
    date: this.date,
    time: this.time,
    priority: this.priority,
    category: this.category,
    tags: this.tags,
    recurrence: this.recurrence,
    recurrenceEnd: this.recurrenceEnd,
    done: this.done,
    completedDates: this.completedDates,
    subtasks: this.subtasks.map((s) => ({ id: s._id.toString(), title: s.title, done: s.done })),
    updatedAt: this.updatedAt,
  };
};

export const Task = mongoose.model('Task', taskSchema);
