// Creates the public calendar (if missing) and fills it with a few sample
// tasks dated around today. Safe to run more than once: sample tasks are
// only added when the public calendar is empty, unless you pass --force.
//
//   npm run seed            (from /server)
//   npm run seed -- --force (adds the samples again)

import { assertEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { ensurePublicCalendar } from '../models/Calendar.js';
import { Task } from '../models/Task.js';

assertEnv(['MONGO_URI']);

const pad = (n) => String(n).padStart(2, '0');
function dayOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const samples = [
  {
    title: 'Community clean-up drive',
    description: 'Meet at the main gate. Gloves and bags provided. Coordinator: Priya Nair.',
    date: dayOffset(2), time: '08:00', priority: 'medium', category: 'Community', tags: ['outdoors'],
  },
  {
    title: 'Weekly team stand-up',
    description: 'Short updates from every team. Host: Aarav Mehta.',
    date: dayOffset(-3), time: '10:00', priority: 'high', category: 'Work', recurrence: 'weekly',
  },
  {
    title: 'Library book returns due',
    description: 'Return or renew borrowed books at the front desk.',
    date: dayOffset(5), priority: 'low', category: 'Errands',
  },
  {
    title: 'Hackathon kick-off',
    description: 'Opening session and team formation. Mentors: Rohan Das and Ananya Iyer.',
    date: dayOffset(9), time: '17:30', priority: 'high', category: 'Events', tags: ['tech', 'teams'],
    subtasks: [{ title: 'Register your team' }, { title: 'Bring a laptop and charger' }],
  },
  {
    title: 'Monthly town hall',
    description: 'Open Q&A with the organising committee. Moderator: Kabir Sen.',
    date: dayOffset(12), time: '16:00', priority: 'medium', category: 'Community', recurrence: 'monthly',
  },
  {
    title: 'Morning stretch break',
    description: 'Five minutes away from the screen.',
    date: dayOffset(0), time: '11:30', priority: 'low', category: 'Health', recurrence: 'daily',
    recurrenceEnd: dayOffset(20),
  },
];

async function run() {
  await connectDB();
  const pub = await ensurePublicCalendar();
  const existing = await Task.countDocuments({ calendar: pub._id });
  const force = process.argv.includes('--force');

  if (existing && !force) {
    console.log(`[seed] Public calendar already has ${existing} task(s). Use --force to add samples anyway.`);
  } else {
    await Task.insertMany(samples.map((t) => ({ recurrence: 'none', ...t, calendar: pub._id })));
    console.log(`[seed] Added ${samples.length} sample tasks to "${pub.name}".`);
  }
  await disconnectDB();
}

run().catch(async (err) => {
  console.error('[seed] failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
