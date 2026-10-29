import { useState } from 'react';
import Icon from '../../components/ui/Icon.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LeadPicker, ReminderModePicker } from '../../components/tasks/ReminderOptions.jsx';
import useReminderSetup, { MODE_TO_CHANNELS, channelsToMode } from '../../hooks/useReminderSetup.js';
import { useApp } from '../../context/AppContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { post } from '../../lib/api.js';
import { showLocalNotification } from '../../lib/push.js';

export default function RemindersSection() {
  const { user, updateSettings } = useApp();
  const { notify, notifyError } = useUI();
  const { permission, pushActive, pushAvailable, prepare } = useReminderSetup();
  const [warning, setWarning] = useState(null);
  const mode = channelsToMode(user.settings.reminderChannels);
  const wantsBrowser = mode === 'browser' || mode === 'both';

  const changeMode = async (next) => {
    try {
      const result = await prepare(next);
      setWarning(result.warning);
      await updateSettings({ reminderChannels: MODE_TO_CHANNELS[next] });
    } catch (err) {
      notifyError(err, 'Could not save reminder settings');
    }
  };

  const changeLead = (m) => updateSettings({ reminderLeadMinutes: m }).catch((e) => notifyError(e, 'Could not save'));

  const sendTest = async () => {
    try {
      if (pushActive) await post('/reminders/push/test');
      else if (!(await showLocalNotification('TaskWise test', { body: 'Notifications are working.' }))) {
        throw Object.assign(new Error('Notifications are not allowed yet.'), {
          hint: 'Allow notifications for this site in your browser, then try again.',
        });
      }
      notify({ tone: 'success', title: 'Test sent', message: 'You should see a notification now.' });
    } catch (err) {
      notifyError(err, 'Test notification failed');
    }
  };

  let status = null;
  if (wantsBrowser) {
    if (permission === 'denied') {
      status = (
        <p className="notice notice--error">
          <Icon name="alert" size={16} />
          <span>
            <strong>Notifications are blocked.</strong> Click the lock icon beside the address bar, set Notifications
            to Allow, then reload TaskWise.
          </span>
        </p>
      );
    } else if (permission === 'unsupported') {
      status = (
        <p className="notice notice--warn">
          <Icon name="alert" size={16} />
          <span>This browser cannot show notifications. In-app alerts still work.</span>
        </p>
      );
    } else if (permission !== 'granted') {
      status = (
        <p className="notice notice--warn">
          <Icon name="info" size={16} />
          <span>
            <strong>Permission needed.</strong>{' '}
            <button type="button" className="linklike" onClick={() => changeMode(mode)}>
              Allow notifications
            </button>
          </span>
        </p>
      );
    } else {
      status = (
        <p className="notice notice--success">
          <Icon name="check" size={16} />
          <span>
            {pushActive
              ? 'Background delivery is on: reminders arrive even when TaskWise is closed.'
              : pushAvailable
                ? 'Notifications allowed. Reminders arrive while TaskWise is open in a tab.'
                : 'Notifications allowed. This server sends reminders while TaskWise is open in a tab.'}
          </span>
        </p>
      );
    }
  }

  return (
    <div className="settings__stack">
      <div className="settings__group">
        <p className="eyebrow">How to remind you</p>
        <ReminderModePicker value={mode} onChange={changeMode} includeOff />
      </div>
      <div className="settings__group">
        <p className="eyebrow">How early</p>
        <LeadPicker value={user.settings.reminderLeadMinutes} onChange={changeLead} />
        <p className="tiny">Tasks without a time remind you relative to 9:00 AM on their day.</p>
      </div>
      {warning && !status && (
        <p className="notice notice--warn">
          <Icon name="alert" size={16} />
          <span>{warning}</span>
        </p>
      )}
      {status}
      {wantsBrowser && permission === 'granted' && (
        <Button variant="soft" size="sm" icon="bell" onClick={sendTest} className="settings__test">
          Send a test notification
        </Button>
      )}
    </div>
  );
}
