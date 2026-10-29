import { Button } from './Button.jsx';

/** Friendly "nothing here yet" block with a calm illustration built from CSS shapes. */
export default function EmptyState({ title, message, actionLabel, onAction, compact = false }) {
  return (
    <div className={`empty ${compact ? 'empty--compact' : ''}`}>
      <div className="empty__art" aria-hidden="true">
        <span className="empty__sun" />
        <span className="empty__hill empty__hill--back" />
        <span className="empty__hill empty__hill--front" />
      </div>
      <h3 className="empty__title">{title}</h3>
      {message && <p className="empty__message">{message}</p>}
      {actionLabel && (
        <Button variant="primary" icon="plus" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
