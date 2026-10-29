import useElementSize from '../../hooks/useElementSize.js';
import { formatWeekdayShort, toISO, todayISO, weekDays } from '../../lib/dates.js';
import TaskChip, { CHIP_HEIGHT } from './TaskChip.jsx';

const WEEK_CHIP_HEIGHT = 30;

/**
 * Seven day columns (desktop/tablet) or seven day rows (phone).
 * Columns show as many tasks as fit, then "+N more" opens the day panel.
 */
export default function WeekView({ anchor, weekStartsOn, byDate, onOpenTask, onOpenDay, phone }) {
  const days = weekDays(anchor, weekStartsOn);
  const [ref, size] = useElementSize();
  const today = todayISO();

  if (phone) {
    // Each row: day label + as many chips as fit across.
    const rowCap = Math.max(1, Math.floor((size.width - 70) / 110));
    return (
      <div className="week week--rows" ref={ref}>
        {days.map((d) => {
          const iso = toISO(d);
          const items = byDate.get(iso) || [];
          const shown = items.length <= rowCap ? items : items.slice(0, rowCap - 1 || 1);
          const more = items.length - shown.length;
          return (
            <div key={iso} className={`week__row ${iso === today ? 'is-today' : ''}`} onClick={() => onOpenDay(iso)}>
              <button
                type="button"
                className="week__rowday"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDay(iso);
                }}
                aria-label={`${formatWeekdayShort(d)} ${d.getDate()}, ${items.length} tasks`}
              >
                <span>{formatWeekdayShort(d)}</span>
                <strong>{d.getDate()}</strong>
              </button>
              <div className="week__rowchips">
                {items.length === 0 && <span className="tiny">Free</span>}
                {shown.map((o) => (
                  <TaskChip key={o.key} occ={o} onOpen={onOpenTask} showTime={false} />
                ))}
                {more > 0 && <span className="month__more">+{more}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const capacity = Math.max(1, Math.floor((size.height - 70) / WEEK_CHIP_HEIGHT));
  return (
    <div className="week week--cols" ref={ref}>
      {days.map((d) => {
        const iso = toISO(d);
        const items = byDate.get(iso) || [];
        const fits = items.length <= capacity ? items.length : capacity - 1;
        const shown = items.slice(0, fits);
        const more = items.length - shown.length;
        return (
          <div key={iso} className={`week__col ${iso === today ? 'is-today' : ''}`} onClick={() => onOpenDay(iso)}>
            <button
              type="button"
              className="week__head"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDay(iso);
              }}
              aria-label={`${formatWeekdayShort(d)} ${d.getDate()}, ${items.length} tasks`}
            >
              <span className="eyebrow">{formatWeekdayShort(d)}</span>
              <span className="week__num">{d.getDate()}</span>
            </button>
            <div className="week__chips" style={{ '--chip-h': `${WEEK_CHIP_HEIGHT - 6}px` }}>
              {shown.map((o) => (
                <TaskChip key={o.key} occ={o} onOpen={onOpenTask} />
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
          </div>
        );
      })}
    </div>
  );
}

export { CHIP_HEIGHT };
