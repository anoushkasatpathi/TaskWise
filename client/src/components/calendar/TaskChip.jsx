import { formatTime } from '../../lib/dates.js';

export const CHIP_HEIGHT = 24; // px incl. gap

/** Compact colored task pill used inside month and week cells. */
export default function TaskChip({ occ, onOpen, showTime = true }) {
  const { task, calendar } = occ;
  return (
    <button
      type="button"
      className={`chip-task ${occ.done ? 'is-done' : ''}`}
      style={{ '--cal': calendar.color }}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(occ);
      }}
      title={`${task.title}${task.time ? ` · ${formatTime(task.time)}` : ''}`}
    >
      {showTime && task.time && <span className="chip-task__time">{formatTime(task.time)}</span>}
      <span className="chip-task__title">{task.title}</span>
    </button>
  );
}
