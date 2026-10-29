import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Icon from '../ui/Icon.jsx';
import { Button } from '../ui/Button.jsx';
import SlideSwitcher from '../motion/SlideSwitcher.jsx';
import { LeadPicker, ReminderModePicker } from '../tasks/ReminderOptions.jsx';
import useReminderSetup, { MODE_TO_CHANNELS } from '../../hooks/useReminderSetup.js';
import { useApp } from '../../context/AppContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { leadLabel } from '../../lib/dates.js';

/**
 * First-login setup: how reminders should arrive and how early.
 * Notification permission is requested only if the chosen option needs it.
 */
export default function Onboarding({ onClose }) {
  const { user, updateSettings } = useApp();
  const { notifyError, notify } = useUI();
  const { prepare } = useReminderSetup();
  const [step, setStep] = useState({ i: 0, dir: 1 });
  const [mode, setMode] = useState('both');
  const [lead, setLead] = useState(15);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const go = (i) => setStep((s) => ({ i, dir: i > s.i ? 1 : -1 }));

  const finish = async (chosenMode = mode) => {
    setBusy(true);
    try {
      await updateSettings({ reminderChannels: MODE_TO_CHANNELS[chosenMode], reminderLeadMinutes: lead, onboarded: true });
      onClose();
      notify({ tone: 'success', title: 'You are all set', message: 'You can change reminders anytime in Settings.' });
    } catch (err) {
      notifyError(err, 'Could not save your choices');
    } finally {
      setBusy(false);
    }
  };

  const skip = () => finish('off');

  const toConfirm = async () => {
    setBusy(true);
    const r = await prepare(mode);
    setResult(r);
    setBusy(false);
    go(2);
  };

  const steps = [
    {
      title: `Welcome, ${user.name.split(' ')[0]}`,
      body: (
        <div className="onb">
          <p className="muted">How would you like TaskWise to remind you about tasks?</p>
          <ReminderModePicker value={mode} onChange={setMode} />
        </div>
      ),
      foot: (
        <>
          <Button variant="ghost" onClick={skip} disabled={busy}>
            Not now
          </Button>
          <span className="spacer" />
          <Button variant="primary" iconRight="arrowRight" onClick={() => go(1)}>
            Next
          </Button>
        </>
      ),
    },
    {
      title: 'How early?',
      body: (
        <div className="onb">
          <p className="muted">How long before a task should the reminder appear?</p>
          <LeadPicker value={lead} onChange={setLead} />
          {(mode === 'browser' || mode === 'both') && (
            <p className="notice">
              <Icon name="info" size={16} />
              <span>Your browser will ask for permission to show notifications next.</span>
            </p>
          )}
        </div>
      ),
      foot: (
        <>
          <Button variant="ghost" onClick={() => go(0)}>
            Back
          </Button>
          <span className="spacer" />
          <Button variant="primary" iconRight="arrowRight" onClick={toConfirm} disabled={busy}>
            Continue
          </Button>
        </>
      ),
    },
    {
      title: 'Ready to go',
      body: (
        <div className="onb">
          <div className="onb__summary">
            <span className="onb__bell">
              <Icon name="bell" size={26} />
            </span>
            <p>
              Reminders <strong>{leadLabel(lead)}</strong> before each task via{' '}
              <strong>{mode === 'both' ? 'browser notifications and in-app alerts' : mode === 'browser' ? 'browser notifications' : 'in-app alerts'}</strong>.
            </p>
          </div>
          {result?.warning && (
            <p className="notice notice--warn">
              <Icon name="alert" size={16} />
              <span>{result.warning}</span>
            </p>
          )}
          {result?.permission === 'granted' && (
            <p className="notice notice--success">
              <Icon name="check" size={16} />
              <span>
                {result.pushActive
                  ? 'Notifications are on, even when TaskWise is closed.'
                  : 'Notifications are on while TaskWise is open in a tab.'}
              </span>
            </p>
          )}
        </div>
      ),
      foot: (
        <>
          <Button variant="ghost" onClick={() => go(1)}>
            Back
          </Button>
          <span className="spacer" />
          <Button variant="primary" icon="check" onClick={() => finish()} disabled={busy}>
            Start planning
          </Button>
        </>
      ),
    },
  ];
  const current = steps[step.i];

  return (
    <Modal open onClose={skip} title={current.title} subtitle={`Step ${step.i + 1} of 3 · Reminders`} footer={current.foot} size="md">
      <SlideSwitcher id={step.i} direction={step.dir}>
        {current.body}
      </SlideSwitcher>
    </Modal>
  );
}
