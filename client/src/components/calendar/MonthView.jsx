import useElementSize from '../../hooks/useElementSize.js';
import { formatFull, formatWeekdayShort, monthGrid, sameMonth, toISO, todayISO } from '../../lib/dates.js';
import TaskChip, { CHIP_HEIGHT } from './TaskChip.jsx';

const DAY_LABEL_SPACE = 30; // day number row inside a cell

/**
 * 6-week month grid. Each cell shows as many tasks as physically fit and a
 * "+N more" button that opens the day panel; nothing ever scrolls.
 * On narrow screens cells switch to colored dots.
 */
export default function MonthView({ anchor, weekStartsOn, byDate, onOpenTask, onOpenDay }) {
  const days = monthGrid(anchor, weekStartsOn);
  const [gridRef, size] = useElementSize();
  const today = todayISO();

  const cellH = size.height ? (size.height - 5 * 6) / 6 : 0; // 6 rows, 6px gaps
  const cellW = size.width ? (size.width - 6 * 6) / 7 : 0;
  const dotMode = cellW > 0 && cellW < 92;
  const capacity = Math.max(0, Math.floor((cellH - DAY_LABEL_SPACE) / CHIP_HEIGHT));

  return (
    <div className="month">
      <div className="month__weekdays" aria-hidden="true">
        {days.slice(0, 7).map((d) => (
          <span key={d.getDay()}>{formatWeekdayShort(d)}</span>
        ))}
      </div>
      <div className={`month__grid ${dotMode ? 'is-dots' : ''}`} ref={gridRef} role="grid" aria-label="Month">
        {days.map((d) => {
          const iso = toISO(d);
          const items = byDate.get(iso) || [];
          const outside = !sameMonth(d, anchor);
          const fits = items.length <= capacity ? items.length : Math.max(0, capacity - 1);
          const shown = dotMode ? items.slice(0, 4) : items.slice(0, fits);
          const more = items.length - shown.length;
          const open = items.filter((o) => !o.done).length;
          return (
            <div
              key={iso}
              role="gridcell"
              className={`month__cell ${outside ? 'is-outside' : ''} ${iso === today ? 'is-today' : ''}`}
              onClick={() => onOpenDay(iso)}
            >
              <button
                type="button"
                className="month__day"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDay(iso);
                }}
                aria-label={`${formatFull(d)}, ${items.length ? `${items.length} task${items.length > 1 ? 's' : ''}, ${open} open` : 'no tasks'}`}
              >
                {d.getDate()}
              </button>
              {dotMode ? (
                <span className="month__dots" aria-hidden="true">
                  {shown.map((o) => (
                    <span key={o.key} className={`month__dot ${o.done ? 'is-done' : ''}`} style={{ '--cal': o.calendar.color }} />
                  ))}
                  {more > 0 && <span className="month__dots-more">+{more}</span>}
                </span>
              ) : (
                <div className="month__chips">
                  {shown.map((o) => (
                    <TaskChip key={o.key} occ={o} onOpen={onOpenTask} showTime={cellW > 130} />
                  ))}
                  {more > 0 && (
                    <button
                      type="button"
                      className="month__more"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDay(iso);
                      }}
                    >
                      +{more} more
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
