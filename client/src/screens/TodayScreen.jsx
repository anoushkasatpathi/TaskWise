import { useMemo, useState } from 'react';
import Ring from '../components/ui/Ring.jsx';
import Icon from '../components/ui/Icon.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import { Button } from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import TaskList from '../components/tasks/TaskList.jsx';
import MorphLoader from '../components/motion/MorphLoader.jsx';
import SlideSwitcher from '../components/motion/SlideSwitcher.jsx';
import useOccurrences from '../hooks/useOccurrences.js';
import useTaskActions from '../hooks/useTaskActions.js';
import useMediaQuery from '../hooks/useMediaQuery.js';
import { useApp } from '../context/AppContext.jsx';
import { addDays, formatTime, formatWeekdayShort, greeting, leadLabel, relativeDay, toISO, todayISO, weekDays } from '../lib/dates.js';
import './TodayScreen.css';

function headline(total, done) {
  if (!total) return 'A calm, open day';
  if (done === total) return 'All done. Lovely work';
  if (done / total >= 0.6) return "You're doing well";
  if (done > 0) return 'Nicely underway';
  return 'Ready when you are';
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function HeroCard({ user, todayItems, stats }) {
  const done = todayItems.filter((o) => o.done).length;
  const pct = todayItems.length ? (done / todayItems.length) * 100 : 0;
  return (
    <section className="card today-hero" aria-labelledby="today-hello">
      <div className="today-hero__text">
        <p className="today-hero__greet">
          {greeting()}, {user.name.split(' ')[0]}
        </p>
        <h1 id="today-hello" className="today-hero__title">
          {headline(todayItems.length, done)}
        </h1>
        <span className="today-hero__sun" aria-hidden="true" />
        <p className="today-hero__sub muted">Small steps, brighter days.</p>
      </div>
      <div className="today-hero__ring">
        <Ring value={pct} size={168} stroke={15} label="Today's progress" sublabel={`${done} of ${todayItems.length} done`} />
      </div>
      <dl className="today-stats">
        {stats.map((s) => (
          <div key={s.label} className="today-stats__item">
            <Icon name={s.icon} size={22} />
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function NextUpCard({ next, onOpen, onNew }) {
  return (
    <section className="card next-card" aria-label="Next up">
      <div className="next-card__text">
        <p className="eyebrow">{next ? 'Next up' : 'Take a breath'}</p>
        <h2 className="next-card__title">{next ? next.task.title : 'Plan one small thing'}</h2>
        <p className="next-card__sub">
          {next ? `${relativeDay(next.date)} · ${formatTime(next.task.time)} · ${next.calendar.name}` : 'Your next tasks will appear here.'}
        </p>
        <Button variant="primary" iconRight="arrowRight" onClick={next ? () => onOpen(next) : onNew}>
          {next ? 'Open task' : 'Add a task'}
        </Button>
      </div>
      <div className="next-card__art" aria-hidden="true">
        <span className="next-card__sun" />
        <span className="next-card__hill next-card__hill--a" />
        <span className="next-card__hill next-card__hill--b" />
      </div>
    </section>
  );
}

function TodayCard({ items, onOpen, onToggle, onNew }) {
  return (
    <section className="card today-list" aria-labelledby="today-list-title">
      <header className="panel-head">
        <h2 id="today-list-title">Today</h2>
        <Button variant="ghost" size="sm" icon="plus" onClick={() => onNew({ date: todayISO() })}>
          Add
        </Button>
      </header>
      <TaskList
        occurrences={items}
        onOpen={onOpen}
        onToggle={onToggle}
        resetKey={todayISO()}
        empty={
          <EmptyState
            compact
            title="Your day is wide open"
            message="Add a task, or enjoy the calm."
            actionLabel="Add a task"
            onAction={() => onNew({ date: todayISO() })}
          />
        }
      />
    </section>
  );
}

function WeekCard({ days, byDay }) {
  const today = todayISO();
  const max = Math.max(1, ...days.map((d) => byDay.get(toISO(d))?.total || 0));
  const doneDays = days.filter((d) => {
    const s = byDay.get(toISO(d));
    return s && s.total > 0 && s.done === s.total;
  }).length;
  return (
    <section className="card week-card" aria-labelledby="week-card-title">
      <header className="panel-head">
        <h2 id="week-card-title">This week</h2>
        <span className="tiny">{doneDays} clear day{doneDays === 1 ? '' : 's'}</span>
      </header>
      <div className="week-card__checks">
        {days.map((d) => {
          const iso = toISO(d);
          const s = byDay.get(iso) || { total: 0, done: 0 };
          const clear = s.total > 0 && s.done === s.total;
          return (
            <div key={iso} className={`week-card__day ${iso === today ? 'is-today' : ''}`}>
              <span className="week-card__label">{formatWeekdayShort(d)}</span>
              <span className={`week-card__check ${clear ? 'is-clear' : ''}`} aria-label={clear ? 'All done' : `${s.done} of ${s.total} done`}>
                {clear && <Icon name="check" size={14} strokeWidth={2.4} />}
              </span>
            </div>
          );
        })}
      </div>
      <div className="week-card__bars" role="img" aria-label="Tasks planned and completed each day this week">
        {days.map((d) => {
          const iso = toISO(d);
          const s = byDay.get(iso) || { total: 0, done: 0 };
          return (
            <div key={iso} className={`week-card__bar ${iso === today ? 'is-today' : ''}`}>
              <span className="week-card__track" style={{ height: `${(s.total / max) * 100}%` }}>
                <span className="week-card__fill" style={{ height: s.total ? `${(s.done / s.total) * 100}%` : 0 }} />
              </span>
              <span className="week-card__barlabel">{formatWeekdayShort(d).slice(0, 2)}</span>
            </div>
          );
        })}
      </div>
      <p className="week-card__quote display">
        <em>&ldquo;Progress feels lighter in good company.&rdquo;</em>
      </p>
    </section>
  );
}

function ReminderCard({ user, next, onSettings }) {
  const channels = user.settings.reminderChannels;
  const label = !channels.length
    ? 'Reminders are off'
    : channels.length === 2
      ? 'Browser + in-app'
      : channels[0] === 'browser'
        ? 'Browser notifications'
        : 'In-app alerts';
  const minutesAway = next?.task.time && next.date === todayISO()
    ? Math.max(0, (Number(next.task.time.slice(0, 2)) * 60 + Number(next.task.time.slice(3))) - (new Date().getHours() * 60 + new Date().getMinutes()))
    : null;
  const progress = minutesAway === null ? 0 : Math.max(0.04, 1 - minutesAway / 240);
  return (
    <section className="card card--inverse reminder-card" aria-label="Reminders">
      <div className="reminder-card__top">
        <div>
          <p className="eyebrow reminder-card__eyebrow">Reminders</p>
          <h2 className="reminder-card__title">{label}</h2>
          <p className="reminder-card__sub">
            {channels.length ? `${leadLabel(user.settings.reminderLeadMinutes)} before each task` : 'Turn them on in Settings'}
          </p>
        </div>
        <span className="reminder-card__orb" aria-hidden="true" />
      </div>
      <div className="reminder-card__progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="reminder-card__foot">
        <span className="tiny reminder-card__meta">
          {minutesAway !== null ? `Next task in ${minutesAway < 60 ? `${minutesAway} min` : `${Math.floor(minutesAway / 60)} h ${minutesAway % 60} min`}` : 'No timed tasks left today'}
        </span>
        <button type="button" className="reminder-card__play" onClick={onSettings} aria-label="Reminder settings">
          <Icon name="bell" size={20} />
        </button>
      </div>
    </section>
  );
}

export default function TodayScreen({ onNavigate }) {
  const { user } = useApp();
  const ws = user.settings.weekStartsOn;
  const today = todayISO();
  const days = weekDays(new Date(), ws);
  const from = toISO(days[0]) < today ? toISO(days[0]) : today;
  const to = toISO(addDays(new Date(), 14));
  const { occurrences, loading, error, reload } = useOccurrences(from, to);
  const { openTask, toggle, newTask } = useTaskActions();
  const desktop = useMediaQuery('(min-width: 1100px)');
  const tablet = useMediaQuery('(min-width: 720px)');
  const [panel, setPanel] = useState({ id: 'today', dir: 1 });

  const derived = useMemo(() => {
    const todayItems = occurrences.filter((o) => o.date === today);
    const weekSet = new Set(days.map(toISO));
    const byDay = new Map();
    let doneWeek = 0;
    let carry = 0;
    for (const o of occurrences) {
      if (!weekSet.has(o.date)) continue;
      const s = byDay.get(o.date) || { total: 0, done: 0 };
      s.total += 1;
      if (o.done) {
        s.done += 1;
        doneWeek += 1;
      } else if (o.date < today) carry += 1;
      byDay.set(o.date, s);
    }
    const upcoming = occurrences.filter((o) => o.date > today && !o.done);
    const now = nowHHMM();
    const next =
      todayItems.find((o) => !o.done && o.task.time && o.task.time >= now) ||
      todayItems.find((o) => !o.done && !o.task.time) ||
      upcoming[0] ||
      null;
    return { todayItems, byDay, doneWeek, carry, upcoming, next };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occurrences, today]);

  if (error) {
    return (
      <div className="screen screen--center">
        <EmptyState title="We could not load your day" message={`${error.message} ${error.hint || ''}`} />
        <Button variant="soft" onClick={reload}>
          Try again
        </Button>
      </div>
    );
  }
  if (loading) return <MorphLoader label="Loading your day" />;

  const stats = [
    { label: 'Today', value: derived.todayItems.length, icon: 'today' },
    { label: 'Upcoming', value: derived.upcoming.length, icon: 'calendar' },
    { label: 'Carry over', value: derived.carry, icon: 'repeat' },
    { label: 'Done this week', value: derived.doneWeek, icon: 'check' },
  ];

  const hero = <HeroCard user={user} todayItems={derived.todayItems} stats={stats} />;
  const nextCard = <NextUpCard next={derived.next} onOpen={openTask} onNew={() => newTask()} />;
  const todayCard = <TodayCard items={derived.todayItems} onOpen={openTask} onToggle={toggle} onNew={newTask} />;
  const weekCard = <WeekCard days={days} byDay={derived.byDay} />;
  const reminderCard = <ReminderCard user={user} next={derived.next} onSettings={() => onNavigate('settings')} />;

  if (desktop) {
    return (
      <div className="screen today today--desktop">
        <div className="today__a">{hero}</div>
        <div className="today__b">{nextCard}</div>
        <div className="today__c">{todayCard}</div>
        <div className="today__d">{weekCard}</div>
        <div className="today__e">{reminderCard}</div>
      </div>
    );
  }

  // Tablets and phones: a compact header plus swipeable panels.
  const panels = tablet
    ? [
        { value: 'today', label: 'Today', node: todayCard },
        { value: 'week', label: 'This week', node: weekCard },
        { value: 'next', label: 'Next up', node: <div className="today__stack">{nextCard}{reminderCard}</div> },
      ]
    : [
        { value: 'today', label: 'Today', node: todayCard },
        { value: 'week', label: 'Week', node: weekCard },
        { value: 'next', label: 'Next', node: <div className="today__stack">{nextCard}{reminderCard}</div> },
      ];
  const order = panels.map((p) => p.value);
  const choose = (v) => setPanel({ id: v, dir: order.indexOf(v) > order.indexOf(panel.id) ? 1 : -1 });

  return (
    <div className={`screen today ${tablet ? 'today--tablet' : 'today--phone'}`}>
      <div className="today__hero">{tablet ? hero : <CompactHero user={user} items={derived.todayItems} />}</div>
      <div className="today__panels">
        <Segmented label="Today sections" options={panels} value={panel.id} onChange={choose} />
        <SlideSwitcher id={panel.id} direction={panel.dir} className="today__panel">
          {panels.find((p) => p.value === panel.id).node}
        </SlideSwitcher>
      </div>
    </div>
  );
}

function CompactHero({ user, items }) {
  const done = items.filter((o) => o.done).length;
  return (
    <section className="card compact-hero">
      <Ring value={items.length ? (done / items.length) * 100 : 0} size={96} stroke={10} />
      <div className="compact-hero__text">
        <p className="today-hero__greet">
          {greeting()}, {user.name.split(' ')[0]}
        </p>
        <h1 className="compact-hero__title">{headline(items.length, done)}</h1>
        <p className="tiny">
          {done} of {items.length} done today
        </p>
      </div>
    </section>
  );
}
