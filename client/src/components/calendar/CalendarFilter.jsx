import useElementSize from '../../hooks/useElementSize.js';
import usePages from '../../hooks/usePages.js';
import Toggle from '../ui/Toggle.jsx';
import Pager from '../ui/Pager.jsx';
import SlideSwitcher from '../motion/SlideSwitcher.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useUI } from '../../context/UIContext.jsx';

const ROW_H = 50;

/** Show/hide toggles for every calendar the user can see. Pages if there are many. */
export default function CalendarFilter() {
  const { calendars, hidden, toggleCalendar } = useApp();
  const { notifyError } = useUI();
  const [ref, size] = useElementSize();
  const paging = usePages(calendars, Math.max(ROW_H, size.height - 36), () => ROW_H);

  const onToggle = (id) => toggleCalendar(id).catch((e) => notifyError(e, 'Could not update visibility'));

  return (
    <div className="calfilter" ref={ref}>
      <SlideSwitcher id={paging.index} direction={paging.dir}>
        <ul className="calfilter__list" role="list">
          {paging.page.map((c) => (
            <li key={c.id} className="calfilter__row">
              <span className="calfilter__swatch" style={{ background: c.color }} />
              <span className="calfilter__name truncate">
                {c.name}
                {c.type === 'public' && <span className="tiny"> · shared</span>}
              </span>
              <Toggle checked={!hidden.has(c.id)} onChange={() => onToggle(c.id)} label={`Show ${c.name}`} color={c.color} />
            </li>
          ))}
        </ul>
      </SlideSwitcher>
      <Pager index={paging.index} count={paging.count} onPrev={paging.prev} onNext={paging.next} onGo={paging.goTo} label="Calendars page" />
    </div>
  );
}
