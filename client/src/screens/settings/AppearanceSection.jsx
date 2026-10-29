import Segmented from '../../components/ui/Segmented.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { VIEWS } from '../../lib/constants.js';

function Row({ title, sub, children }) {
  return (
    <div className="setting-row">
      <div className="setting-row__text">
        <span>{title}</span>
        <span className="tiny">{sub}</span>
      </div>
      {children}
    </div>
  );
}

export default function AppearanceSection() {
  const { user, updateSettings } = useApp();
  const { notifyError } = useUI();
  const save = (changes) => updateSettings(changes).catch((e) => notifyError(e, 'Could not save'));
  const s = user.settings;

  return (
    <div className="settings__stack">
      <Row title="Theme" sub="Light is calm paper, dark is deep violet glass">
        <Segmented
          label="Theme"
          size="sm"
          value={s.theme}
          onChange={(theme) => save({ theme })}
          options={[
            { value: 'system', label: 'System', icon: 'monitor' },
            { value: 'light', label: 'Light', icon: 'sun' },
            { value: 'dark', label: 'Dark', icon: 'moon' },
          ]}
        />
      </Row>
      <Row title="Week starts on" sub="Used by month and week views">
        <Segmented
          label="Week starts on"
          size="sm"
          value={s.weekStartsOn}
          onChange={(weekStartsOn) => save({ weekStartsOn })}
          options={[
            { value: 1, label: 'Monday' },
            { value: 0, label: 'Sunday' },
          ]}
        />
      </Row>
      <Row title="Default calendar view" sub="What the Calendar tab opens with">
        <Segmented label="Default view" size="sm" value={s.defaultView} onChange={(defaultView) => save({ defaultView })} options={VIEWS} />
      </Row>
      <Row title="Time zone" sub="Detected from this device; reminders use it">
        <span className="chip">{s.timezone}</span>
      </Row>
    </div>
  );
}
