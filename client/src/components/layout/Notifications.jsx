import Icon from '../ui/Icon.jsx';
import { Button, IconButton } from '../ui/Button.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useTasksStore } from '../../context/TaskContext.jsx';
import { formatTime, relativeDay } from '../../lib/dates.js';
import { get } from '../../lib/api.js';

const TONE_ICON = { success: 'check', error: 'alert', info: 'info' };

function minutesUntil(iso) {
  const m = Math.round((Date.parse(iso) - Date.now()) / 60000);
  if (m <= 0) return 'Starting now';
  if (m < 60) return `Starts in ${m} min`;
  if (m < 1440) return `Starts in ${Math.round(m / 60)} h`;
  return 'Starts tomorrow';
}

/** Toasts plus in-app reminder alerts, stacked in one live region. */
export default function Notifications() {
  const { toasts, dismiss, alerts, dismissAlert, notifyError, notify } = useUI();
  const { calendarsById } = useApp();
  const { toggleDone } = useTasksStore();

  const markDone = async (alert) => {
    dismissAlert(alert.key);
    try {
      const { task } = await get(`/tasks/${alert.taskId}`, { silent: true });
      if (!calendarsById.get(task.calendarId)?.canEdit) {
        notify({ tone: 'info', title: 'This task is read-only', message: 'Only admins can complete public tasks.' });
        return;
      }
      await toggleDone(task, alert.date, true);
      notify({ tone: 'success', title: 'Marked as done', message: task.title });
    } catch (err) {
      notifyError(err, 'Could not complete the task');
    }
  };

  return (
    <div className="toasts" role="region" aria-label="Notifications" aria-live="polite">
      {alerts.map((a) => (
        <div key={a.key} className="reminder-alert card--inverse" role="alertdialog" aria-label={`Reminder: ${a.title}`}>
          <div className="reminder-alert__top">
            <span className="reminder-alert__bell">
              <Icon name="bell" size={20} />
            </span>
            <div className="truncate">
              <p className="eyebrow" style={{ color: 'inherit', opacity: 0.7 }}>Reminder</p>
              <p className="reminder-alert__title truncate">{a.title}</p>
              <p className="reminder-alert__meta">
                {minutesUntil(a.startsAt)} · {relativeDay(a.date)}, {formatTime(a.time)} · {a.calendarName}
              </p>
            </div>
          </div>
          <div className="reminder-alert__actions">
            <Button variant="ghost" size="sm" onClick={() => dismissAlert(a.key)}>
              Dismiss
            </Button>
            <Button variant="primary" size="sm" icon="check" onClick={() => markDone(a)}>
              Mark done
            </Button>
          </div>
        </div>
      ))}
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
          <span className="toast__icon">
            <Icon name={TONE_ICON[t.tone]} size={16} />
          </span>
          <div>
            {t.title && <p className="toast__title">{t.title}</p>}
            {t.message && <p className="toast__msg">{t.message}</p>}
            {t.hint && <p className="toast__hint">{t.hint}</p>}
            {t.action && (
              <Button
                size="sm"
                variant="soft"
                className="toast__action"
                onClick={() => {
                  dismiss(t.id);
                  t.action.onClick();
                }}
              >
                {t.action.label}
              </Button>
            )}
          </div>
          <IconButton icon="x" label="Dismiss" size="sm" onClick={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
