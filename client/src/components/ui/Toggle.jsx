/** Accessible on/off switch styled like the design's yellow toggles. */
export default function Toggle({ checked, onChange, label, color, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`toggle ${checked ? 'is-on' : ''}`}
      style={color ? { '--toggle-on': color } : undefined}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__knob" />
    </button>
  );
}
