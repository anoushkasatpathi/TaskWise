import Ring from '../ui/Ring.jsx';
import { Button } from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import TaskList from '../tasks/TaskList.jsx';
import { formatMonth, formatWeekdayLong, fromISO, todayISO } from '../../lib/dates.js';

/** One day: a summary card with a progress ring next to a paged timeline. */
export default function DayView({ date, items, onOpenTask, onToggle, onNewTask, canCreate, phone }) {
  const d = fromISO(date);
  const done = items.filter((o) => o.done).length;
  const pct = items.length ? (done / items.length) * 100 : 0;
  const isToday = date === todayISO();

  return (
    <div className="dayview">
      {!phone && (
        <aside className="dayview__summary">
          <p className="eyebrow">{isToday ? 'Today' : formatWeekdayLong(d)}</p>
          <p className="dayview__date display">
            {d.getDate()} <em>{formatMonth(d)}</em>
          </p>
          <Ring value={pct} size={150} stroke={13} label={`${done} of ${items.length} done`} />
          {canCreate && (
            <Button variant="primary" icon="plus" onClick={() => onNewTask({ date })}>
              Add to this day
            </Button>
          )}
        </aside>
      )}
      <div className="dayview__list">
        <TaskList
          occurrences={items}
          onOpen={onOpenTask}
          onToggle={onToggle}
          resetKey={date}
          label="Page"
          empty={
            <EmptyState
              compact
              title={isToday ? 'Nothing planned today' : 'A free day'}
              message="Enjoy the space, or plan something small."
              actionLabel={canCreate ? 'Add a task' : undefined}
              onAction={() => onNewTask({ date })}
            />
          }
        />
      </div>
    </div>
  );
}
