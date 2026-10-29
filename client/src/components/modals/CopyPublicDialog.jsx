import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Field from '../ui/Field.jsx';
import { Button } from '../ui/Button.jsx';
import { ColorPicker } from './CalendarEditor.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useTasksStore } from '../../context/TaskContext.jsx';

/** Duplicates every public task into a new private calendar the user owns. */
export default function CopyPublicDialog({ onClose, onDone }) {
  const { publicCalendar, copyPublicCalendar } = useApp();
  const { invalidate } = useTasksStore();
  const { notify, notifyError } = useUI();
  const [name, setName] = useState(`${publicCalendar?.name || 'Public calendar'} (copy)`);
  const [color, setColor] = useState('#A774FF');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError('Give the new calendar a name');
      return;
    }
    setBusy(true);
    try {
      const { copied } = await copyPublicCalendar({ name: name.trim(), color });
      invalidate();
      notify({
        tone: 'success',
        title: 'Public calendar copied',
        message: `${copied} task${copied === 1 ? '' : 's'} copied into "${name.trim()}". Add your own tasks to it anytime.`,
      });
      onDone?.();
      onClose();
    } catch (err) {
      notifyError(err, 'Could not copy the calendar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title="Copy public calendar"
      subtitle="You get a private copy of every public task. Changes to the public calendar later will not affect it."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" icon="copy" onClick={submit} disabled={busy}>
            {busy ? 'Copying…' : 'Copy'}
          </Button>
        </>
      }
    >
      <form className="form-grid" onSubmit={submit} noValidate>
        <Field label="Name of your copy" error={error}>
          {(p) => (
            <input {...p} data-autofocus className="input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
          )}
        </Field>
        <div className="field">
          <span className="field__label">Color</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </form>
    </Modal>
  );
}
