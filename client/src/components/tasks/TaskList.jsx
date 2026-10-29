import useElementSize from '../../hooks/useElementSize.js';
import usePages from '../../hooks/usePages.js';
import useSwipe from '../../hooks/useSwipe.js';
import SlideSwitcher from '../motion/SlideSwitcher.jsx';
import Pager from '../ui/Pager.jsx';
import TaskRow, { TASK_ROW_HEIGHT } from './TaskRow.jsx';
import { relativeDay } from '../../lib/dates.js';

const HEADER_HEIGHT = 34;

/**
 * A list of occurrences that pages to fit its box (never scrolls).
 * With `groupByDay`, date headers are inserted and counted in the paging.
 */
export default function TaskList({ occurrences, onOpen, onToggle, groupByDay = false, showTime = true, empty, resetKey, label = 'Page' }) {
  const [boxRef, size] = useElementSize();

  const rows = [];
  let lastDate = null;
  for (const occ of occurrences) {
    if (groupByDay && occ.date !== lastDate) {
      rows.push({ kind: 'header', key: `h-${occ.date}`, date: occ.date });
      lastDate = occ.date;
    }
    rows.push({ kind: 'task', key: occ.key, occ });
  }

  // Reserve room for the pager below the list (and a repeated date header).
  const available = Math.max(0, size.height - 40 - (groupByDay ? HEADER_HEIGHT : 0));
  const paging = usePages(
    rows,
    available,
    (r) => (r.kind === 'header' ? HEADER_HEIGHT : TASK_ROW_HEIGHT),
    resetKey,
    (r) => r.kind === 'header'
  );
  const swipe = useSwipe({ onLeft: paging.next, onRight: paging.prev });

  const page = paging.page;

  return (
    <div className="task-list" ref={boxRef}>
      {occurrences.length === 0 ? (
        empty
      ) : (
        <>
          <SlideSwitcher id={paging.index} direction={paging.dir} className="task-list__pages" {...swipe}>
            <ul className="task-list__page" role="list">
              {page.map((r, i) => {
                // Repeat the date header if a page begins mid-group.
                const header =
                  groupByDay && i === 0 && r.kind === 'task' ? (
                    <li key={`ch-${r.occ.date}`} className="task-list__header is-continued">
                      {relativeDay(r.occ.date)} <span className="tiny">continued</span>
                    </li>
                  ) : null;
                return r.kind === 'header' ? (
                  <li key={r.key} className="task-list__header">
                    {relativeDay(r.date)}
                  </li>
                ) : (
                  [
                    header,
                    <li key={r.key}>
                      <TaskRow occ={r.occ} onOpen={onOpen} onToggle={onToggle} showTime={showTime} />
                    </li>,
                  ]
                );
              })}
            </ul>
          </SlideSwitcher>
          <Pager
            index={paging.index}
            count={paging.count}
            onPrev={paging.prev}
            onNext={paging.next}
            onGo={paging.goTo}
            label={label}
          />
        </>
      )}
    </div>
  );
}
