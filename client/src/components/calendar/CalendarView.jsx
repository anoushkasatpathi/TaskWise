import { useMemo, useState } from 'react';
import SlideSwitcher from '../motion/SlideSwitcher.jsx';
import MorphLoader from '../motion/MorphLoader.jsx';
import Segmented from '../ui/Segmented.jsx';
import { Button, IconButton } from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import MonthView from './MonthView.jsx';
import WeekView from './WeekView.jsx';
import DayView from './DayView.jsx';
import TaskList from '../tasks/TaskList.jsx';
import useOccurrences from '../../hooks/useOccurrences.js';
import useTaskActions from '../../hooks/useTaskActions.js';
import useSwipe from '../../hooks/useSwipe.js';
import { useIsPhone } from '../../hooks/useMediaQuery.js';
import { useApp } from '../../context/AppContext.jsx';
import { groupByDate } from '../../lib/occurrences.js';
import { VIEWS } from '../../lib/constants.js';
import {
  addDays, addMonths, formatDayMonth, formatMonth, fromISO, monthGrid, startOfWeek, toISO, todayISO, weekDays,
} from '../../lib/dates.js';

const LIST_DAYS = 60;
const VIEW_ICONS = { month: 'grid', week: 'columns', day: 'day', list: 'list' };
const viewIndex = (v) => VIEWS.findIndex((x) => x.value === v);

/** Date range to load for a view. Month/week/day share the month grid so moving within a month is instant. */
function rangeFor(view, anchor, ws) {
  if (view === 'list') return [toISO(anchor), toISO(addDays(anchor, LIST_DAYS - 1))];
  const grid = monthGrid(anchor, ws);
  return [toISO(grid[0]), toISO(grid[41])];
}

function periodKey(view, anchor, ws) {
  if (view === 'month') return `${anchor.getFullYear()}-${anchor.getMonth()}`;
  if (view === 'week') return toISO(startOfWeek(anchor, ws));
  return toISO(anchor);
}

function Title({ view, anchor, ws }) {
  if (view === 'month') {
    return (
      <>
        <em>{formatMonth(anchor)}</em> <span className="calview__year">{anchor.getFullYear()}</span>
      </>
    );
  }
  if (view === 'week') {
    const days = weekDays(anchor, ws);
    return (
      <>
        <em>{formatDayMonth(days[0])}</em> <span className="calview__year">– {formatDayMonth(days[6])}</span>
      </>
    );
  }
  if (view === 'day') {
    return (
      <>
        <em>{formatDayMonth(anchor)}</em> <span className="calview__year">{anchor.getFullYear()}</span>
      </>
    );
  }
  return (
    <>
      <em>Upcoming</em> <span className="calview__year">from {formatDayMonth(anchor)}</span>
    </>
  );
}

/**
 * The calendar: header with period navigation and a view switcher, and the
 * active view underneath. Every change of period or view animates.
 *
 * onlyCalendarIds: restrict to some calendars (the Public tab passes the public one).
 * extraActions: buttons rendered at the end of the header (e.g. calendar toggles on phones).
 */
export default function CalendarView({ onlyCalendarIds = null, canCreate = true, extraActions = null, createDefaults = {}, emptyHint }) {
  const { user } = useApp();
  const ws = user.settings.weekStartsOn;
  const phone = useIsPhone();
  const [view, setView] = useState(user.settings.defaultView || 'month');
  const [anchorISO, setAnchorISO] = useState(todayISO());
  const [motion, setMotion] = useState({ dir: 1, mode: 'slide' });
  const anchor = fromISO(anchorISO);

  const [from, to] = rangeFor(view, anchor, ws);
  const { occurrences, loading, error, reload } = useOccurrences(from, to, { onlyCalendarIds });
  const byDate = useMemo(() => groupByDate(occurrences), [occurrences]);
  const { openTask, openDay, toggle, newTask } = useTaskActions();

  const shift = (dir) => {
    const next =
      view === 'month' ? addMonths(anchor, dir) : view === 'week' ? addDays(anchor, 7 * dir) : view === 'day' ? addDays(anchor, dir) : addDays(anchor, LIST_DAYS * dir);
    setMotion({ dir, mode: 'slide' });
    setAnchorISO(toISO(next));
  };
  const goToday = () => {
    const t = todayISO();
    if (t === anchorISO) return;
    setMotion({ dir: t > anchorISO ? 1 : -1, mode: 'slide' });
    setAnchorISO(t);
  };
  const changeView = (v) => {
    setMotion({ dir: viewIndex(v) > viewIndex(view) ? 1 : -1, mode: 'fade' });
    setView(v);
  };
  const openDayFromGrid = (iso) => {
    openDay(iso, { onlyCalendarIds, canCreate, createDefaults });
  };
  const swipe = useSwipe({ onLeft: () => shift(1), onRight: () => shift(-1) });
  const create = (extra = {}) => newTask({ ...createDefaults, ...extra });

  let body;
  if (error) {
    body = (
      <div className="calview__state">
        <EmptyState compact title="Could not load tasks" message={`${error.message} ${error.hint || ''}`} />
        <Button variant="soft" onClick={reload}>
          Try again
        </Button>
      </div>
    );
  } else if (loading) {
    body = <MorphLoader label="Loading your calendar" />;
  } else if (view === 'month') {
    body = <MonthView anchor={anchor} weekStartsOn={ws} byDate={byDate} onOpenTask={openTask} onOpenDay={openDayFromGrid} />;
  } else if (view === 'week') {
    body = <WeekView anchor={anchor} weekStartsOn={ws} byDate={byDate} onOpenTask={openTask} onOpenDay={openDayFromGrid} phone={phone} />;
  } else if (view === 'day') {
    body = (
      <DayView
        date={anchorISO}
        items={byDate.get(anchorISO) || []}
        onOpenTask={openTask}
        onToggle={toggle}
        onNewTask={create}
        canCreate={canCreate}
        phone={phone}
      />
    );
  } else {
    body = (
      <TaskList
        occurrences={occurrences.filter((o) => !o.done || o.date >= todayISO())}
        onOpen={openTask}
        onToggle={toggle}
        groupByDay
        resetKey={anchorISO}
        empty={
          <EmptyState
            title="Nothing coming up"
            message={emptyHint || `No tasks in the next ${LIST_DAYS} days.`}
            actionLabel={canCreate ? 'Add a task' : undefined}
            onAction={() => create()}
          />
        }
      />
    );
  }

  return (
    <section className="calview">
      <header className="calview__head">
        <h2 className="calview__title display">
          <Title view={view} anchor={anchor} ws={ws} />
        </h2>
        <div className="calview__nav">
          <IconButton icon="chevronLeft" label="Previous" variant="soft" onClick={() => shift(-1)} />
          <Button variant="soft" size="sm" onClick={goToday} className="calview__today">
            Today
          </Button>
          <IconButton icon="chevronRight" label="Next" variant="soft" onClick={() => shift(1)} />
        </div>
        <div className="calview__tools">
          <Segmented
            label="Calendar view"
            size="sm"
            value={view}
            onChange={changeView}
            options={VIEWS.map((v) => ({ ...v, icon: VIEW_ICONS[v.value] }))}
            iconsOnlyOnPhone
          />
          {extraActions}
        </div>
      </header>
      <SlideSwitcher
        id={`${view}:${periodKey(view, anchor, ws)}:${loading ? 'l' : error ? 'e' : 'r'}`}
        direction={motion.dir}
        mode={loading ? 'fade' : motion.mode}
        className="calview__body"
        {...swipe}
      >
        {body}
      </SlideSwitcher>
    </section>
  );
}
