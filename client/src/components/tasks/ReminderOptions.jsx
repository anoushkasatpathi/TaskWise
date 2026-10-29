import Icon from '../ui/Icon.jsx';
import { REMINDER_LEADS } from '../../lib/constants.js';
import { leadLabel } from '../../lib/dates.js';

const MODES = [
  { value: 'browser', icon: 'bell', title: 'Browser notifications', desc: 'A system notification, even in another tab.' },
  { value: 'inapp', icon: 'sparkle', title: 'In-app alerts', desc: 'A gentle card inside TaskWise.' },
  { value: 'both', icon: 'check', title: 'Both', desc: 'The most reliable way not to miss things.' },
];

/** Radio cards for choosing how reminders arrive. */
export function ReminderModePicker({ value, onChange, includeOff = false }) {
  const modes = includeOff
    ? [...MODES, { value: 'off', icon: 'eyeOff', title: 'Off', desc: 'No reminders.' }]
    : MODES;
  return (
    <div className="option-grid" role="radiogroup" aria-label="How to remind you">
      {modes.map((m) => (
        <button
          key={m.value}
          type="button"
          role="radio"
          aria-checked={value === m.value}
          className="option"
          onClick={() => onChange(m.value)}
        >
          <span className="option__icon">
            <Icon name={m.icon} size={20} />
          </span>
          <span>
            <span className="option__title">{m.title}</span>
            <br />
            <span className="option__desc">{m.desc}</span>
          </span>
          <span className="option__radio" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

/** Chips for 5 min ... 1 day. */
export function LeadPicker({ value, onChange }) {
  return (
    <div className="chips-row" role="radiogroup" aria-label="How long before the task">
      {REMINDER_LEADS.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          className="chip chip--choice"
          onClick={() => onChange(m)}
        >
          {leadLabel(m)}
        </button>
      ))}
    </div>
  );
}
