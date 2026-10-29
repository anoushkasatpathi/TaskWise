import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Field from '../ui/Field.jsx';
import Icon from '../ui/Icon.jsx';
import Segmented from '../ui/Segmented.jsx';
import Toggle from '../ui/Toggle.jsx';
import Pager from '../ui/Pager.jsx';
import { Button, IconButton } from '../ui/Button.jsx';
import SlideSwitcher from '../motion/SlideSwitcher.jsx';
import usePages from '../../hooks/usePages.js';
import { useApp } from '../../context/AppContext.jsx';
import { useTasksStore } from '../../context/TaskContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { CATEGORY_SUGGESTIONS, PRIORITIES, RECURRENCES } from '../../lib/constants.js';
import { formatFull, formatTime, fromISO, todayISO } from '../../lib/dates.js';
import { isOccurrenceDone } from '../../lib/recurrence.js';

const STEPS = [
  { value: 'basics', label: 'Basics' },
  { value: 'details', label: 'Details' },
  { value: 'notes', label: 'Notes & steps' },
];
// Which step shows each field, so a server error can jump to it.
const FIELD_STEP = {
  title: 'basics', date: 'basics', time: 'basics', calendarId: 'basics',
  priority: 'details', category: 'details', recurrence: 'details', recurrenceEnd: 'details', tags: 'details',
  description: 'notes', subtasks: 'notes',
};
// Fewer steps per page on short screens so the dialog never overflows.
const subtasksPerPage = () => (window.innerHeight < 700 ? 3 : 4);

function initialForm(task, defaults, fallbackCalendarId) {
  if (task) {
    return {
      title: task.title,
      description: task.description,
      date: task.date,
      time: task.time,
      calendarId: task.calendarId,
      priority: task.priority,
      category: task.category,
      tags: task.tags.join(', '),
      recurrence: task.recurrence,
      recurrenceEnd: task.recurrenceEnd,
      subtasks: task.subtasks.map((s) => ({ title: s.title, done: s.done })),
    };
  }
  return {
    title: '',
    description: '',
    date: defaults.date || todayISO(),
    time: defaults.time || '',
    calendarId: defaults.calendarId || fallbackCalendarId,
    priority: 'medium',
    category: '',
    tags: '',
    recurrence: 'none',
    recurrenceEnd: '',
    subtasks: [],
  };
}

/** Read-only view for tasks the user cannot edit (public calendar for non-admins). */
function TaskDetails({ task, date, calendar, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const { privateCalendars } = useApp();
  const { saveTask } = useTasksStore();
  const { notify, notifyError } = useUI();
  const target = privateCalendars.find((c) => c.isDefault) || privateCalendars[0];
  const done = isOccurrenceDone(task, date);

  const copyToMine = async () => {
    try {
      const { id, calendarId, completedDates, done: _d, updatedAt, subtasks, ...rest } = task;
      await saveTask({ ...rest, calendarId: target.id, subtasks: subtasks.map((s) => ({ title: s.title, done: false })) });
      notify({ tone: 'success', title: 'Added to your calendar', message: `${task.title} → ${target.name}` });
      onClose();
    } catch (err) {
      notifyError(err, 'Could not copy the task');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={task.title}
      subtitle={`${formatFull(fromISO(date))} · ${formatTime(task.time)}`}
      footer={
        <>
          <span className="tiny spacer">Read-only · {calendar.name}</span>
          {target && (
            <Button variant="primary" icon="copy" onClick={copyToMine}>
              Add to my calendar
            </Button>
          )}
        </>
      }
    >
      <div className="task-details">
        <div className="chips-row">
          <span className="chip">
            <span className="dot" style={{ '--dot': calendar.color }} /> {calendar.name}
          </span>
          <span className={`chip priority priority--${task.priority}`}>{task.priority} priority</span>
          {task.recurrence !== 'none' && (
            <span className="chip">
              <Icon name="repeat" size={13} /> {RECURRENCES.find((r) => r.value === task.recurrence).label}
            </span>
          )}
          {task.category && <span className="chip">{task.category}</span>}
          {done && <span className="badge badge--success">Done</span>}
        </div>
        {task.description ? (
          <div className={`task-details__desc ${expanded ? 'is-expanded' : ''}`}>
            <p>{task.description}</p>
            {task.description.length > 180 && (
              <button type="button" className="linklike" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        ) : (
          <p className="muted">No notes for this task.</p>
        )}
        {task.subtasks.length > 0 && (
          <ul className="subtasks subtasks--readonly" role="list">
            {task.subtasks.slice(0, 5).map((s) => (
              <li key={s.id} className={s.done ? 'is-done' : ''}>
                <Icon name={s.done ? 'check' : 'chevronRight'} size={14} /> {s.title}
              </li>
            ))}
            {task.subtasks.length > 5 && <li className="tiny">+{task.subtasks.length - 5} more steps</li>}
          </ul>
        )}
        {task.tags.length > 0 && (
          <div className="chips-row">
            {task.tags.map((t) => (
              <span key={t} className="chip">
                <Icon name="tag" size={12} /> {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function TaskEditor({ task, date, defaults = {}, onClose }) {
  const { calendarsById, writableCalendars, privateCalendars } = useApp();
  const { saveTask, deleteTask, toggleDone } = useTasksStore();
  const { notify, notifyError, confirm } = useUI();
  const calendar = task ? calendarsById.get(task.calendarId) : null;
  const fallback = (privateCalendars.find((c) => c.isDefault) || writableCalendars[0])?.id || '';

  const [form, setForm] = useState(() => initialForm(task, defaults, fallback));
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState({ id: 'basics', dir: 1 });
  const [saving, setSaving] = useState(false);
  const [newSub, setNewSub] = useState('');
  const titleRef = useRef(null);

  const [doneNow, setDoneNow] = useState(() => (task ? isOccurrenceDone(task, date || task.date) : false));
  const perPage = subtasksPerPage();
  const subPaging = usePages(form.subtasks, perPage, () => 1);
  // After adding a step, show the page it landed on.
  const prevSubCount = useRef(form.subtasks.length);
  useEffect(() => {
    if (form.subtasks.length > prevSubCount.current) subPaging.goTo(subPaging.count - 1);
    prevSubCount.current = form.subtasks.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.subtasks.length, subPaging.count]);
  const writableOptions = useMemo(
    () => writableCalendars.filter((c) => !task || c.type === calendar?.type || c.canEdit),
    [writableCalendars, task, calendar]
  );

  if (task && !calendar) return null;
  if (task && !calendar.canEdit) return <TaskDetails task={task} date={date || task.date} calendar={calendar} onClose={onClose} />;

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const goStep = (id) => setStep((s) => ({ id, dir: STEPS.findIndex((x) => x.value === id) > STEPS.findIndex((x) => x.value === s.id) ? 1 : -1 }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Give the task a title';
    if (!form.date) e.date = 'Pick a date';
    if (!form.calendarId) e.calendarId = 'Choose a calendar';
    if (form.recurrence !== 'none' && form.recurrenceEnd && form.recurrenceEnd < form.date) e.recurrenceEnd = 'Must be on or after the task date';
    return e;
  };

  const submit = async (ev) => {
    ev?.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      goStep(FIELD_STEP[Object.keys(e)[0]]);
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      category: form.category.trim(),
      tags: [...new Set(form.tags.split(',').map((t) => t.trim()).filter(Boolean))].slice(0, 8),
      recurrenceEnd: form.recurrence === 'none' ? '' : form.recurrenceEnd,
    };
    try {
      await saveTask(payload, task?.id);
      notify({ tone: 'success', title: task ? 'Task updated' : 'Task added', message: payload.title });
      onClose();
    } catch (err) {
      if (err.fields) {
        const mapped = {};
        for (const [k, v] of Object.entries(err.fields)) mapped[k.split('.')[0]] = v;
        setErrors(mapped);
        const first = Object.keys(mapped).find((k) => FIELD_STEP[k]);
        if (first) goStep(FIELD_STEP[first]);
      }
      notifyError(err, 'Could not save the task');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete this task?',
      message: task.recurrence !== 'none' ? 'This deletes every repetition of the task.' : `"${task.title}" will be removed.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteTask(task);
      notify({ tone: 'success', title: 'Task deleted', message: task.title });
      onClose();
    } catch (err) {
      notifyError(err, 'Could not delete the task');
    }
  };

  const addSubtask = () => {
    const title = newSub.trim();
    if (!title) return;
    if (form.subtasks.length >= 20) {
      setErrors((e) => ({ ...e, subtasks: 'Use at most 20 steps' }));
      return;
    }
    set('subtasks', [...form.subtasks, { title, done: false }]);
    setNewSub('');
  };

  const panels = {
    basics: (
      <div className="form-grid">
        <Field label="Title" error={errors.title}>
          {(p) => (
            <input
              {...p}
              ref={titleRef}
              data-autofocus
              className="input"
              placeholder="e.g. Review notes with Rohan Das"
              value={form.title}
              maxLength={140}
              onChange={(e) => set('title', e.target.value)}
            />
          )}
        </Field>
        <div className="form-row">
          <Field label="Date" error={errors.date}>
            {(p) => <input {...p} type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />}
          </Field>
          <Field label="Time" hint="Leave empty for all day" error={errors.time}>
            {(p) => <input {...p} type="time" className="input" value={form.time} onChange={(e) => set('time', e.target.value)} />}
          </Field>
        </div>
        <Field label="Calendar" error={errors.calendarId}>
          {(p) => (
            <select {...p} className="select" value={form.calendarId} onChange={(e) => set('calendarId', e.target.value)}>
              {writableOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.type === 'public' ? ' (public)' : ''}
                </option>
              ))}
            </select>
          )}
        </Field>
        {task && (
          <div className="form-inline">
            <span>
              Done{task.recurrence !== 'none' ? ` on ${formatFull(fromISO(date || task.date))}` : ''}
            </span>
            <Toggle
              checked={doneNow}
              label="Mark done"
              onChange={(v) => {
                setDoneNow(v);
                toggleDone(task, date || task.date, v).catch((e) => {
                  setDoneNow(!v);
                  notifyError(e, 'Could not update');
                });
              }}
            />
          </div>
        )}
      </div>
    ),
    details: (
      <div className="form-grid">
        <div className="field">
          <span className="field__label">Priority</span>
          <Segmented
            label="Priority"
            value={form.priority}
            onChange={(v) => set('priority', v)}
            options={PRIORITIES}
          />
        </div>
        <Field label="Category" error={errors.category}>
          {(p) => (
            <>
              <input
                {...p}
                className="input"
                list="category-suggestions"
                placeholder="Work, Study, Health…"
                maxLength={40}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        <div className="form-row">
          <Field label="Repeat" error={errors.recurrence}>
            {(p) => (
              <select {...p} className="select" value={form.recurrence} onChange={(e) => set('recurrence', e.target.value)}>
                {RECURRENCES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Until (optional)" error={errors.recurrenceEnd}>
            {(p) => (
              <input
                {...p}
                type="date"
                className="input"
                disabled={form.recurrence === 'none'}
                min={form.date}
                value={form.recurrence === 'none' ? '' : form.recurrenceEnd}
                onChange={(e) => set('recurrenceEnd', e.target.value)}
              />
            )}
          </Field>
        </div>
        <Field label="Tags" hint="Separate with commas" error={errors.tags}>
          {(p) => (
            <input {...p} className="input" placeholder="focus, team" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
          )}
        </Field>
      </div>
    ),
    notes: (
      <div className="form-grid">
        <Field label="Notes" error={errors.description}>
          {(p) => (
            <textarea
              {...p}
              className="textarea"
              rows={3}
              maxLength={2000}
              placeholder="Anything worth remembering"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          )}
        </Field>
        <div className="field">
          <span className="field__label">Steps</span>
          <div className="subtask-add">
            <input
              className="input"
              placeholder="Add a step and press Enter"
              value={newSub}
              maxLength={120}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSubtask();
                }
              }}
              aria-label="New step"
            />
            <IconButton icon="plus" label="Add step" variant="soft" onClick={addSubtask} />
          </div>
          {errors.subtasks && <p className="field__error">{errors.subtasks}</p>}
          <SlideSwitcher id={subPaging.index} direction={subPaging.dir} className="subtasks-box">
            <ul className="subtasks" role="list">
              {subPaging.page.map((s) => {
                const i = form.subtasks.indexOf(s);
                return (
                  <li key={`${i}-${s.title}`} className={s.done ? 'is-done' : ''}>
                    <button
                      type="button"
                      className={`check check--sm ${s.done ? 'is-done' : ''}`}
                      aria-pressed={s.done}
                      aria-label={`${s.done ? 'Mark not done' : 'Mark done'}: ${s.title}`}
                      onClick={() => set('subtasks', form.subtasks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
                    >
                      <Icon name="check" size={13} strokeWidth={2.4} />
                    </button>
                    <span className="truncate">{s.title}</span>
                    <IconButton
                      icon="x"
                      size="sm"
                      label={`Remove step ${s.title}`}
                      onClick={() => set('subtasks', form.subtasks.filter((_, j) => j !== i))}
                    />
                  </li>
                );
              })}
              {form.subtasks.length === 0 && <li className="tiny subtasks__empty">Break the task into small steps.</li>}
            </ul>
          </SlideSwitcher>
          <Pager index={subPaging.index} count={subPaging.count} onPrev={subPaging.prev} onNext={subPaging.next} onGo={subPaging.goTo} label="Steps page" />
        </div>
      </div>
    ),
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      subtitle={task ? calendar.name : 'Plan something small and kind to yourself.'}
      size="md"
      footer={
        <>
          {task && (
            <Button variant="danger" icon="trash" onClick={remove} className="spacer-right">
              Delete
            </Button>
          )}
          <span className="spacer" />
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon="check" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : task ? 'Save' : 'Add task'}
          </Button>
        </>
      }
    >
      <form className="task-form" onSubmit={submit} noValidate>
        <Segmented
          label="Task sections"
          className="task-form__steps"
          size="sm"
          value={step.id}
          onChange={goStep}
          options={STEPS.map((s) => ({
            ...s,
            label: Object.entries(errors).some(([k, v]) => v && FIELD_STEP[k] === s.value) ? `${s.label} •` : s.label,
          }))}
        />
        <SlideSwitcher id={step.id} direction={step.dir} className="task-form__panel">
          {panels[step.id]}
        </SlideSwitcher>
        {/* lets Enter submit from any text field */}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
