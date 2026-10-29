import { useId } from 'react';

/** Label + control + inline error. Pass the control as a render function to get the id. */
export default function Field({ label, error, hint, className = '', children }) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      )}
      {children({ id, 'aria-invalid': Boolean(error) || undefined, 'aria-describedby': error ? errId : undefined })}
      {error ? (
        <p className="field__error" id={errId} role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="field__hint">{hint}</p>
      )}
    </div>
  );
}
