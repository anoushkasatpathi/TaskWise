import { useMemo, useState } from 'react';
import CalendarView from '../components/calendar/CalendarView.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Button } from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import SlideSwitcher from '../components/motion/SlideSwitcher.jsx';
import useOccurrences from '../hooks/useOccurrences.js';
import useMediaQuery from '../hooks/useMediaQuery.js';
import useTaskActions from '../hooks/useTaskActions.js';
import { useApp } from '../context/AppContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { addDays, formatDayMonth, toISO, todayISO } from '../lib/dates.js';
import './PublicScreen.css';

function Overview({ pub }) {
  const { isAdmin } = useApp();
  const { openModal } = useUI();
  const { newTask } = useTaskActions();
  const from = todayISO();
  const to = toISO(addDays(new Date(), 29));
  const { occurrences } = useOccurrences(from, to, { onlyCalendarIds: [pub.id] });

  const stats = useMemo(() => {
    const week = toISO(addDays(new Date(), 6));
    const ids = new Set(occurrences.map((o) => o.task.id));
    return {
      next30: occurrences.length,
      thisWeek: occurrences.filter((o) => o.date <= week).length,
      repeating: [...ids].filter((id) => occurrences.find((o) => o.task.id === id).task.recurrence !== 'none').length,
      events: ids.size,
      next: occurrences.find((o) => !o.done) || null,
    };
  }, [occurrences]);

  return (
    <section className="card pub-overview" aria-labelledby="pub-title">
      <div className="pub-overview__top">
        <span className="pub-overview__icon" style={{ '--cal': pub.color }}>
          <Icon name="globe" size={22} />
        </span>
        <span className="eyebrow">Shared with everyone</span>
      </div>
      <h1 id="pub-title" className="pub-overview__title">
        {pub.name}
      </h1>
      <p className="pub-overview__desc muted">
        Events everyone can see. {isAdmin ? 'As an admin you can add, edit and remove them.' : 'Only admins can change them.'}
      </p>

      <div className="pub-overview__status">
        <span className="badge badge--success">
          <span className="dot" style={{ '--dot': 'var(--success)' }} /> Active
        </span>
        <span className="tiny">
          {stats.next ? `Next: ${stats.next.task.title} · ${formatDayMonth(new Date(`${stats.next.date}T00:00`))}` : 'Nothing scheduled yet'}
        </span>
      </div>

      <div className="pub-overview__tiles">
        <div className="pub-tile pub-tile--wide">
          <p className="eyebrow">Next 30 days</p>
          <p className="pub-tile__big">{stats.next30}</p>
          <div className="pub-tile__spark" aria-hidden="true">
            {Array.from({ length: 30 }, (_, i) => {
              const d = toISO(addDays(new Date(), i));
              const n = occurrences.filter((o) => o.date === d).length;
              return <span key={d} style={{ height: `${12 + Math.min(n, 4) * 18}%` }} className={n ? 'has' : ''} />;
            })}
          </div>
        </div>
        <div className="pub-tile">
          <Icon name="calendar" size={20} />
          <p className="pub-tile__num">{stats.thisWeek}</p>
          <p className="pub-tile__label">This week</p>
        </div>
        <div className="pub-tile">
          <Icon name="repeat" size={20} />
          <p className="pub-tile__num">{stats.repeating}</p>
          <p className="pub-tile__label">Repeating</p>
        </div>
      </div>

      <div className="pub-overview__copy">
        <div>
          <p className="pub-overview__copytitle">Make it yours</p>
          <p className="tiny">Copy every public task into a new private calendar you can edit freely.</p>
        </div>
        <Button variant="accent" icon="copy" onClick={() => openModal('copyPublic', {})}>
          Copy public calendar
        </Button>
      </div>

      {isAdmin && (
        <Button variant="outline" icon="plus" onClick={() => newTask({ calendarId: pub.id })}>
          Add public task
        </Button>
      )}
    </section>
  );
}

export default function PublicScreen() {
  const { publicCalendar, isAdmin } = useApp();
  const desktop = useMediaQuery('(min-width: 1100px)');
  const [panel, setPanel] = useState({ id: 'overview', dir: 1 });

  if (!publicCalendar) {
    return (
      <div className="screen screen--center">
        <EmptyState title="No public calendar yet" message="It is created automatically when the server starts. Try refreshing." />
      </div>
    );
  }

  const calendar = (
    <div className="card pub-cal">
      <CalendarView
        onlyCalendarIds={[publicCalendar.id]}
        canCreate={isAdmin}
        createDefaults={{ calendarId: publicCalendar.id }}
        emptyHint={isAdmin ? 'Add the first public event for everyone.' : 'Admins have not added anything here yet.'}
      />
    </div>
  );

  if (desktop) {
    return (
      <div className="screen pubscreen pubscreen--split">
        <Overview pub={publicCalendar} />
        {calendar}
      </div>
    );
  }

  const choose = (v) => setPanel({ id: v, dir: v === 'calendar' ? 1 : -1 });
  return (
    <div className="screen pubscreen">
      <Segmented
        label="Public calendar sections"
        value={panel.id}
        onChange={choose}
        options={[
          { value: 'overview', label: 'Overview', icon: 'globe' },
          { value: 'calendar', label: 'Calendar', icon: 'calendar' },
        ]}
      />
      <SlideSwitcher id={panel.id} direction={panel.dir} className="pubscreen__panel">
        {panel.id === 'overview' ? <Overview pub={publicCalendar} /> : calendar}
      </SlideSwitcher>
    </div>
  );
}
