import Icon from '../ui/Icon.jsx';
import { formatTime, relativeDay } from '../../lib/dates.js';

/** Height (px) each row occupies including its gap. Used to page lists. */
export const TASK_ROW_HEIGHT = 64;

export function CheckButton({ occ, onToggle }) {
  const readOnly = !occ.calendar.canEdit;
  return (
    <button
      type="button"
      className={`check ${occ.done ? 'is-done' : ''}`}
      style={{ '--check-color': occ.calendar.color }}
      aria-pressed={occ.done}
      aria-label={readOnly ? `${occ.task.title} (read-only)` : `${occ.done ? 'Mark not done' : 'Mark done'}: ${occ.task.title}`}
      title={readOnly ? 'Only admins can complete public tasks' : undefined}
      disabled={readOnly}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(occ);
      }}
    >
      <Icon name="check" size={15} strokeWidth={2.4} />
    </button>
  );
}

/**
 * Timeline row: time on the left, completion circle, title and details,
 * like the "Today" list in the design.
 */
export default function TaskRow({ occ, onOpen, onToggle, showDate = false, showTime = true }) {
  const { task, calendar } = occ;
  const subDone = task.subtasks.filter((s) => s.done).length;
  const meta = [
    showDate ? relativeDay(occ.date) : null,
    task.category || null,
    task.subtasks.length ? `${subDone}/${task.subtasks.length} steps` : null,
    calendar.name,
  ].filter(Boolean);

  return (
    <div className={`task-row ${occ.done ? 'is-done' : ''}`} style={{ '--cal': calendar.color }}>
      {showTime && <span className="task-row__time">{task.time ? formatTime(task.time) : 'All day'}</span>}
      <CheckButton occ={occ} onToggle={onToggle} />
      <button type="button" className="task-row__main" onClick={() => onOpen(occ)}>
        <span className="task-row__title truncate">{task.title}</span>
        <span className="task-row__meta truncate">
          <span className={`priority priority--${task.priority}`} aria-label={`${task.priority} priority`} />
          {task.recurrence !== 'none' && <Icon name="repeat" size={12} />}
          {meta.join(' · ')}
        </span>
      </button>
      <Icon name="chevronRight" size={16} className="task-row__chev" />
    </div>
  );
}
