import CalendarView from '../components/calendar/CalendarView.jsx';
import CalendarFilter from '../components/calendar/CalendarFilter.jsx';
import { Button, IconButton } from '../components/ui/Button.jsx';
import useMediaQuery from '../hooks/useMediaQuery.js';
import useTaskActions from '../hooks/useTaskActions.js';
import { useUI } from '../context/UIContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import './CalendarScreen.css';

export default function CalendarScreen() {
  const desktop = useMediaQuery('(min-width: 1100px)');
  const { openModal } = useUI();
  const { hidden, calendars } = useApp();
  const { newTask } = useTaskActions();
  const shownCount = calendars.filter((c) => !hidden.has(c.id)).length;

  return (
    <div className={`screen calscreen ${desktop ? 'calscreen--split' : ''}`}>
      {desktop && (
        <aside className="card calscreen__side" aria-label="Calendars">
          <div className="calscreen__sidehead">
            <p className="eyebrow">Calendars</p>
            <p className="calscreen__count">
              <strong>{shownCount}</strong> of {calendars.length} shown
            </p>
          </div>
          <CalendarFilter />
          <div className="calscreen__sideactions">
            <Button variant="primary" icon="plus" block onClick={() => newTask()}>
              New task
            </Button>
            <Button variant="soft" icon="calendar" block onClick={() => openModal('calendar', {})}>
              New calendar
            </Button>
          </div>
        </aside>
      )}
      <div className="card calscreen__main">
        <CalendarView
          extraActions={
            !desktop && (
              <IconButton
                icon="eye"
                variant="soft"
                label="Show or hide calendars"
                onClick={() => openModal('calendars', {})}
              />
            )
          }
        />
      </div>
    </div>
  );
}
