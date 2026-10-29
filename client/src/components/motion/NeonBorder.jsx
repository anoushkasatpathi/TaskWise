import './NeonBorder.css';

/**
 * Wraps any element in an animated multi-color neon border.
 * A rotating conic gradient draws the border; a blurred copy behind it
 * makes the glow. Both layers ignore the pointer, so the wrapped element
 * (for example Google's sign-in button) stays fully clickable.
 *
 *   <NeonBorder radius={999} thickness={2}>
 *     <button>...</button>
 *   </NeonBorder>
 *
 * Colors and speed live in NeonBorder.css (--neon-* variables).
 */
export default function NeonBorder({ children, radius = 999, thickness = 2, className = '', speed }) {
  const style = {
    '--neon-radius': typeof radius === 'number' ? `${radius}px` : radius,
    '--neon-thickness': `${thickness}px`,
    ...(speed ? { '--neon-speed': speed } : {}),
  };
  return (
    <div className={`neon ${className}`} style={style}>
      <span className="neon__glow" aria-hidden="true">
        <span className="neon__spin" />
      </span>
      <span className="neon__ring" aria-hidden="true">
        <span className="neon__spin" />
      </span>
      <div className="neon__inner">{children}</div>
    </div>
  );
}
