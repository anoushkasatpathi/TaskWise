import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Field from '../ui/Field.jsx';
import Icon from '../ui/Icon.jsx';
import { Button } from '../ui/Button.jsx';
import { CALENDAR_COLORS } from '../../lib/constants.js';
import { useApp } from '../../context/AppContext.jsx';
import { useUI } from '../../context/UIContext.jsx';

export function ColorPicker({ value, onChange }) {
  return (
    <div className="swatches" role="radiogroup" aria-label="Calendar color">
      {CALENDAR_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={value === c.value}
          aria-label={c.name}
          title={c.name}
          className="swatch"
          style={{ '--sw': c.value }}
          onClick={() => onChange(c.value)}
        >
          {value === c.value && <Icon name="check" size={16} strokeWidth={2.6} />}
        </button>
      ))}
    </div>
  );
}

/** Create a private calendar, or rename / recolor an existing one. */
export default function CalendarEditor({ calendar, onClose }) {
  const { createCalendar, updateCalendar } = useApp();
  const { notify, notifyError } = useUI();
  const [name, setName] = useState(calendar?.name || '');
  const [color, setColor] = useState(calendar?.color || CALENDAR_COLORS[1].value);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError('Give the calendar a name');
      return;
    }
    setSaving(true);
    try {
      if (calendar) await updateCalendar(calendar.id, { name: name.trim(), color });
      else await createCalendar({ name: name.trim(), color });
      notify({ tone: 'success', title: calendar ? 'Calendar updated' : 'Calendar created', message: name.trim() });
      onClose();
    } catch (err) {
      setError(err.fields?.name || '');
      notifyError(err, 'Could not save the calendar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title={calendar ? 'Edit calendar' : 'New calendar'}
      subtitle={calendar?.type === 'public' ? 'Everyone sees this name and color.' : 'Only you can see it.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {calendar ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form className="form-grid" onSubmit={submit} noValidate>
        <Field label="Name" error={error}>
          {(p) => (
            <input
              {...p}
              data-autofocus
              className="input"
              placeholder="e.g. Study plan"
              maxLength={60}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
            />
          )}
        </Field>
        <div className="field">
          <span className="field__label">Color</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="cal-preview" style={{ '--cal': color }}>
          <span className="chip-task">
            <span className="chip-task__title">{name.trim() || 'Calendar'} · preview</span>
          </span>
        </div>
      </form>
    </Modal>
  );
}
