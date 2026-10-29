// End-to-end API tests against a real MongoDB.
// Run with:  TEST_MONGO_URI=mongodb://127.0.0.1:27017/taskwise_test npm test
// The database named in TEST_MONGO_URI is wiped at the start of the run.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const uri = process.env.TEST_MONGO_URI;
process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-123';
process.env.ADMIN_EMAILS = 'aarav.mehta@example.com';

const { env } = await import('../src/config/env.js');
env.jwtSecret = process.env.JWT_SECRET;
env.adminEmails = ['aarav.mehta@example.com'];

const { createApp } = await import('../src/app.js');
const { findOrCreateUser } = await import('../src/services/authService.js');
const { ensurePublicCalendar } = await import('../src/models/Calendar.js');
const { claimReminder, upcomingOccurrences } = await import('../src/services/reminderService.js');
const { occurrencesInRange } = await import('../src/utils/recurrence.js');
const { zonedToUtc } = await import('../src/utils/time.js');

let server;
let base;
const users = {};

const cookieFor = (user) => `tw_session=${jwt.sign({ sub: user._id.toString() }, env.jwtSecret, { expiresIn: '1h' })}`;

async function call(who, method, url, body, { header = true } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(header ? { 'X-TaskWise': '1' } : {}),
      ...(who ? { Cookie: cookieFor(users[who]) } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

before(async () => {
  if (!uri) throw new Error('Set TEST_MONGO_URI to run the API tests.');
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await mongoose.model('Calendar').syncIndexes();
  await mongoose.model('ReminderLog').syncIndexes();
  await ensurePublicCalendar();
  users.admin = (await findOrCreateUser({ sub: 'g-1', email: 'aarav.mehta@example.com', name: 'Aarav Mehta' })).user;
  users.priya = (await findOrCreateUser({ sub: 'g-2', email: 'priya.nair@example.com', name: 'Priya Nair' })).user;
  users.rohan = (await findOrCreateUser({ sub: 'g-3', email: 'rohan.das@example.com', name: 'Rohan Das' })).user;
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
});

test('recurrence expansion', () => {
  assert.deepEqual(occurrencesInRange({ date: '2026-01-31', recurrence: 'monthly' }, '2026-01-01', '2026-04-30'), [
    '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30',
  ]);
  assert.deepEqual(occurrencesInRange({ date: '2026-03-02', recurrence: 'weekly' }, '2026-03-10', '2026-03-24'), [
    '2026-03-16', '2026-03-23',
  ]);
  assert.equal(occurrencesInRange({ date: '2026-03-01', recurrence: 'daily', recurrenceEnd: '2026-03-05' }, '2026-03-01', '2026-03-31').length, 5);
  assert.deepEqual(occurrencesInRange({ date: '2026-02-10', recurrence: 'none' }, '2026-03-01', '2026-03-31'), []);
});

test('time zone conversion', () => {
  assert.equal(new Date(zonedToUtc('2026-07-01', '09:00', 'Asia/Kolkata')).toISOString(), '2026-07-01T03:30:00.000Z');
  assert.equal(new Date(zonedToUtc('2026-07-01', '09:00', 'America/New_York')).toISOString(), '2026-07-01T13:00:00.000Z');
  assert.equal(new Date(zonedToUtc('2026-01-15', '09:00', 'America/New_York')).toISOString(), '2026-01-15T14:00:00.000Z');
});

test('signup creates a default calendar and applies ADMIN_EMAILS', async () => {
  assert.equal(users.admin.role, 'admin');
  assert.equal(users.priya.role, 'user');
  const { status, body } = await call('priya', 'GET', '/calendars');
  assert.equal(status, 200);
  assert.equal(body.calendars.length, 2);
  const mine = body.calendars.find((c) => c.type === 'private');
  assert.ok(mine.isDefault && mine.canEdit && !mine.canDelete);
  const pub = body.calendars.find((c) => c.type === 'public');
  assert.equal(pub.canEdit, false);
});

test('requests without a session or app header are rejected', async () => {
  assert.equal((await call(null, 'GET', '/calendars')).status, 401);
  assert.equal((await call('priya', 'POST', '/calendars', { name: 'X' }, { header: false })).status, 403);
  const bad = await fetch(base + '/calendars', { headers: { Cookie: 'tw_session=garbage' } });
  assert.equal(bad.status, 401);
});

test('private calendars are invisible to other users', async () => {
  const created = await call('priya', 'POST', '/calendars', { name: 'Garden', color: '#5FC9B0' });
  assert.equal(created.status, 201);
  const id = created.body.calendar.id;
  const task = await call('priya', 'POST', '/tasks', { calendarId: id, title: 'Water plants', date: '2026-11-02', time: '07:30' });
  assert.equal(task.status, 201);

  assert.equal((await call('rohan', 'PATCH', `/calendars/${id}`, { name: 'Mine now' })).status, 404);
  assert.equal((await call('rohan', 'DELETE', `/calendars/${id}`)).status, 404);
  assert.equal((await call('rohan', 'GET', `/tasks/${task.body.task.id}`)).status, 404);
  assert.equal((await call('rohan', 'PATCH', `/tasks/${task.body.task.id}`, { title: 'x' })).status, 404);
  assert.equal((await call('rohan', 'POST', '/tasks', { calendarId: id, title: 'Sneaky', date: '2026-11-02' })).status, 404);
  const list = await call('rohan', 'GET', `/tasks?from=2026-11-01&to=2026-11-30&calendarIds=${id}`);
  assert.equal(list.body.tasks.length, 0);

  const renamed = await call('priya', 'PATCH', `/calendars/${id}`, { name: 'Balcony garden', color: '#F27BA8' });
  assert.equal(renamed.body.calendar.name, 'Balcony garden');
  assert.equal((await call('priya', 'DELETE', `/calendars/${id}`)).status, 200);
  assert.equal((await call('priya', 'GET', `/tasks/${task.body.task.id}`)).status, 404);
});

test('default calendar cannot be deleted', async () => {
  const { body } = await call('priya', 'GET', '/calendars');
  const def = body.calendars.find((c) => c.isDefault);
  const res = await call('priya', 'DELETE', `/calendars/${def.id}`);
  assert.equal(res.status, 400);
  assert.ok(res.body.error.hint);
});

test('only admins can edit the public calendar; anyone can copy it', async () => {
  const { body } = await call('priya', 'GET', '/calendars');
  const pub = body.calendars.find((c) => c.type === 'public');

  const denied = await call('priya', 'POST', '/tasks', { calendarId: pub.id, title: 'Nope', date: '2026-11-03' });
  assert.equal(denied.status, 403);

  const ok = await call('admin', 'POST', '/tasks', {
    calendarId: pub.id, title: 'Town hall', date: '2026-11-03', time: '16:00', recurrence: 'weekly',
    subtasks: [{ title: 'Prepare slides' }],
  });
  assert.equal(ok.status, 201);
  await call('admin', 'POST', `/tasks/${ok.body.task.id}/toggle`, { date: '2026-11-03', done: true });

  assert.equal((await call('priya', 'PATCH', `/tasks/${ok.body.task.id}`, { title: 'x' })).status, 403);
  assert.equal((await call('priya', 'DELETE', `/tasks/${ok.body.task.id}`)).status, 403);
  assert.equal((await call('priya', 'PATCH', `/calendars/${pub.id}`, { name: 'Hacked' })).status, 403);

  const seen = await call('priya', 'GET', `/tasks?from=2026-11-01&to=2026-11-30&calendarIds=${pub.id}`);
  assert.equal(seen.body.tasks.length, 1);

  const copy = await call('priya', 'POST', '/calendars/public/copy', {});
  assert.equal(copy.status, 201);
  assert.equal(copy.body.copied, 1);
  const copied = await call('priya', 'GET', `/tasks?from=2026-11-01&to=2026-11-30&calendarIds=${copy.body.calendar.id}`);
  assert.equal(copied.body.tasks.length, 1);
  assert.deepEqual(copied.body.tasks[0].completedDates, []);
  assert.equal(copied.body.tasks[0].subtasks[0].done, false);
  const own = await call('priya', 'POST', '/tasks', { calendarId: copy.body.calendar.id, title: 'My addition', date: '2026-11-04' });
  assert.equal(own.status, 201);
});

test('task validation returns readable errors', async () => {
  const { body } = await call('priya', 'GET', '/calendars');
  const def = body.calendars.find((c) => c.isDefault);
  const res = await call('priya', 'POST', '/tasks', { calendarId: def.id, title: '', date: 'tomorrow' });
  assert.equal(res.status, 400);
  assert.ok(res.body.error.message.startsWith('Please check'));
  assert.ok(res.body.error.fields.title || res.body.error.fields.date);
  const end = await call('priya', 'POST', '/tasks', { calendarId: def.id, title: 'x', date: '2026-05-10', recurrence: 'daily', recurrenceEnd: '2026-05-01' });
  assert.equal(end.status, 400);
});

test('recurring completion is per occurrence', async () => {
  const { body } = await call('priya', 'GET', '/calendars');
  const def = body.calendars.find((c) => c.isDefault);
  const t = await call('priya', 'POST', '/tasks', { calendarId: def.id, title: 'Journal', date: '2026-11-01', recurrence: 'daily' });
  const id = t.body.task.id;
  await call('priya', 'POST', `/tasks/${id}/toggle`, { date: '2026-11-02', done: true });
  const after = await call('priya', 'POST', `/tasks/${id}/toggle`, { date: '2026-11-05', done: true });
  assert.deepEqual(after.body.task.completedDates, ['2026-11-02', '2026-11-05']);
  const undone = await call('priya', 'POST', `/tasks/${id}/toggle`, { date: '2026-11-02', done: false });
  assert.deepEqual(undone.body.task.completedDates, ['2026-11-05']);
});

test('admin promotion by email, including people who have not signed in', async () => {
  assert.equal((await call('priya', 'POST', '/admin/promote', { email: 'rohan.das@example.com' })).status, 403);
  const now = await call('admin', 'POST', '/admin/promote', { email: 'Rohan.Das@example.com' });
  assert.equal(now.body.status, 'promoted');
  const me = await call('rohan', 'GET', '/auth/me');
  assert.equal(me.body.user.role, 'admin');

  const later = await call('admin', 'POST', '/admin/promote', { email: 'meera.joshi@example.com' });
  assert.equal(later.body.status, 'pending');
  const { user } = await findOrCreateUser({ sub: 'g-4', email: 'meera.joshi@example.com', name: 'Meera Joshi' });
  assert.equal(user.role, 'admin');

  assert.equal((await call('admin', 'POST', '/admin/demote', { email: 'aarav.mehta@example.com' })).status, 400);
  assert.equal((await call('rohan', 'POST', '/admin/demote', { email: 'aarav.mehta@example.com' })).status, 400);
  const demoted = await call('admin', 'POST', '/admin/demote', { email: 'rohan.das@example.com' });
  assert.equal(demoted.status, 200);
  assert.equal((await call('rohan', 'GET', '/admin/admins')).status, 403);
  assert.equal((await call('priya', 'POST', '/admin/promote', { email: 'not-an-email' })).status, 403);
  const invalid = await call('admin', 'POST', '/admin/promote', { email: 'not-an-email' });
  assert.equal(invalid.status, 400);
});

test('settings validation and hidden calendars', async () => {
  const bad = await call('priya', 'PATCH', '/me/settings', { reminderLeadMinutes: 7 });
  assert.equal(bad.status, 400);
  const tz = await call('priya', 'PATCH', '/me/settings', { timezone: 'Mars/Olympus' });
  assert.equal(tz.status, 400);
  const ok = await call('priya', 'PATCH', '/me/settings', {
    reminderChannels: ['inapp', 'browser'], reminderLeadMinutes: 30, timezone: 'Asia/Kolkata', onboarded: true,
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.onboarded, true);
  // Someone else's calendar id is silently dropped from the hidden list.
  const rohanCals = await call('rohan', 'GET', '/calendars');
  const foreign = rohanCals.body.calendars.find((c) => c.type === 'private').id;
  const hidden = await call('priya', 'PATCH', '/me/settings', { hiddenCalendarIds: [foreign] });
  assert.deepEqual(hidden.body.user.settings.hiddenCalendarIds, []);
});

test('reminders are computed and can only be claimed once', async () => {
  const { body } = await call('rohan', 'GET', '/calendars');
  const def = body.calendars.find((c) => c.isDefault);
  await call('rohan', 'PATCH', '/me/settings', { timezone: 'UTC', reminderLeadMinutes: 15, reminderChannels: ['inapp'] });
  const soon = new Date(Date.now() + 10 * 60000);
  const date = soon.toISOString().slice(0, 10);
  const time = soon.toISOString().slice(11, 16);
  const t = await call('rohan', 'POST', '/tasks', { calendarId: def.id, title: 'Call Kabir Sen', date, time });

  const up = await call('rohan', 'GET', '/reminders/upcoming');
  const item = up.body.items.find((i) => i.taskId === t.body.task.id);
  assert.ok(item, 'upcoming reminder should be listed');
  assert.ok(Date.parse(item.remindAt) <= Date.now(), 'reminder should already be due (10 min away, 15 min lead)');

  const first = await call('rohan', 'POST', '/reminders/claim', { taskId: item.taskId, occurrence: item.occurrence, channel: 'inapp' });
  const second = await call('rohan', 'POST', '/reminders/claim', { taskId: item.taskId, occurrence: item.occurrence, channel: 'inapp' });
  assert.equal(first.body.claimed, true);
  assert.equal(second.body.claimed, false);
  const otherChannel = await call('rohan', 'POST', '/reminders/claim', { taskId: item.taskId, occurrence: item.occurrence, channel: 'browser' });
  assert.equal(otherChannel.body.claimed, true);

  // Another user cannot claim (or even learn about) Rohan's task.
  const foreign = await call('priya', 'POST', '/reminders/claim', { taskId: item.taskId, occurrence: item.occurrence, channel: 'inapp' });
  assert.equal(foreign.status, 404);

  // Concurrent claims: exactly one wins.
  const results = await Promise.all(Array.from({ length: 8 }, () => claimReminder(users.rohan._id, item.taskId, '2030-01-01T09:00', 'push')));
  assert.equal(results.filter(Boolean).length, 1);

  // Done tasks are not reminded.
  await call('rohan', 'POST', `/tasks/${item.taskId}/toggle`, { done: true });
  const fresh = await mongoose.model('User').findById(users.rohan._id);
  const after = await upcomingOccurrences(fresh);
  assert.ok(!after.find((i) => i.taskId === item.taskId));
});

test('unknown API routes and bad ids return JSON errors', async () => {
  assert.equal((await call('priya', 'GET', '/nope')).status, 404);
  assert.equal((await call('priya', 'GET', '/tasks/123')).status, 404);
  const range = await call('priya', 'GET', '/tasks?from=2020-01-01&to=2026-01-01');
  assert.equal(range.status, 400);
});
