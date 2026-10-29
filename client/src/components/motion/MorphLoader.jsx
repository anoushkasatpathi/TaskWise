import './MorphLoader.css';

/**
 * Pure-CSS loading shape that keeps morphing between a circle, a rounded
 * square and a soft blob while shifting through the theme colors.
 *
 *   <MorphLoader />                    medium, centered
 *   <MorphLoader size="sm" inline />   small, for toolbars
 *   <MorphLoader size="lg" label="Loading your calendar" />
 *
 * Tweak timing and colors in MorphLoader.css (the --morph-* variables).
 */
export default function MorphLoader({ size = 'md', label = 'Loading', inline = false, overlay = false, visible = true }) {
  const shape = (
    <span className={`morph morph--${size}`} aria-hidden="true">
      <span className="morph__shape" />
    </span>
  );
  if (inline) {
    return (
      <span className={`morph-inline ${visible ? 'is-visible' : ''}`} role="status" aria-live="polite">
        {shape}
        <span className="sr-only">{visible ? label : ''}</span>
      </span>
    );
  }
  return (
    <div className={`morph-wrap ${overlay ? 'morph-wrap--overlay' : ''}`} role="status" aria-live="polite">
      {shape}
      {label && <span className="morph-wrap__label">{label}</span>}
    </div>
  );
}

/** Large, slow, decorative version used as artwork (e.g. on the sign-in screen). */
export function MorphBlob({ className = '' }) {
  return (
    <span className={`morph-blob ${className}`} aria-hidden="true">
      <span className="morph-blob__core" />
      <span className="morph-blob__shine" />
    </span>
  );
}
