import { Button, IconButton } from '../../components/ui/Button.jsx';
import Pager from '../../components/ui/Pager.jsx';
import SlideSwitcher from '../../components/motion/SlideSwitcher.jsx';
import useElementSize from '../../hooks/useElementSize.js';
import usePages from '../../hooks/usePages.js';
import { useApp } from '../../context/AppContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useTasksStore } from '../../context/TaskContext.jsx';

const ROW_H = 62;

export default function CalendarsSection() {
  const { calendars, deleteCalendar } = useApp();
  const { openModal, confirm, notify, notifyError } = useUI();
  const { invalidate } = useTasksStore();
  const [ref, size] = useElementSize();
  const paging = usePages(calendars, Math.max(ROW_H, size.height - 40), () => ROW_H);

  const remove = async (cal) => {
    const ok = await confirm({
      title: `Delete "${cal.name}"?`,
      message: 'All tasks in this calendar will be deleted too. This cannot be undone.',
      confirmLabel: 'Delete calendar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteCalendar(cal.id);
      invalidate();
      notify({ tone: 'success', title: 'Calendar deleted', message: cal.name });
    } catch (err) {
      notifyError(err, 'Could not delete the calendar');
    }
  };

  return (
    <div className="settings__fill">
      <div className="settings__actions">
        <Button variant="primary" icon="plus" size="sm" onClick={() => openModal('calendar', {})}>
          New calendar
        </Button>
        <Button variant="soft" icon="copy" size="sm" onClick={() => openModal('copyPublic', {})}>
          Copy public calendar
        </Button>
      </div>
      <div className="settings__listbox" ref={ref}>
        <SlideSwitcher id={paging.index} direction={paging.dir}>
          <ul className="cal-rows" role="list">
            {paging.page.map((c) => (
              <li key={c.id} className="cal-row">
                <span className="cal-row__swatch" style={{ background: c.color }} />
                <span className="cal-row__text">
                  <span className="truncate">{c.name}</span>
                  <span className="tiny">
                    {c.type === 'public' ? 'Public · everyone can see it' : c.isDefault ? 'Private · your main calendar' : 'Private · only you'}
                  </span>
                </span>
                <span className="cal-row__actions">
                  {c.canManage && <IconButton icon="edit" label={`Edit ${c.name}`} size="sm" onClick={() => openModal('calendar', { calendar: c })} />}
                  {c.canDelete && <IconButton icon="trash" label={`Delete ${c.name}`} size="sm" onClick={() => remove(c)} />}
                </span>
              </li>
            ))}
          </ul>
        </SlideSwitcher>
        <Pager index={paging.index} count={paging.count} onPrev={paging.prev} onNext={paging.next} onGo={paging.goTo} label="Calendars page" />
      </div>
    </div>
  );
}
