import Modal from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone, resolve, onClose }) {
  const finish = (value) => {
    resolve?.(value);
    onClose();
  };
  return (
    <Modal
      open
      size="sm"
      onClose={() => finish(false)}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={() => finish(false)}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => finish(true)} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="muted">{message}</p>}
    </Modal>
  );
}
