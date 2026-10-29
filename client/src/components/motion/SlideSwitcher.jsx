import { useEffect, useRef, useState } from 'react';
import './SlideSwitcher.css';

/**
 * Animates between "screens" instead of scrolling. Give it an `id` for the
 * current content; when the id changes the old content slides/fades out while
 * the new content slides in.
 *
 *   <SlideSwitcher id={tab} direction={1}>       // 1 = forward, -1 = back
 *     <Screen />
 *   </SlideSwitcher>
 *
 * mode: 'slide' (horizontal), 'rise' (vertical), or 'fade'.
 * The outgoing layer is `inert` + aria-hidden, so it can never hold focus or
 * be read by screen readers while it animates away.
 * Timing lives in SlideSwitcher.css (--sw-duration, --sw-ease, --sw-distance).
 */
export default function SlideSwitcher({ id, direction = 1, mode = 'slide', className = '', children, ...rest }) {
  const [shownId, setShownId] = useState(id);
  const [exiting, setExiting] = useState([]); // [{ id, node, dir }]
  const [animate, setAnimate] = useState(false);
  const [dir, setDir] = useState(direction);
  const lastNode = useRef(children);

  // Detect an id change during render (React's "adjust state on prop change" pattern),
  // so the outgoing content is captured before it is replaced.
  if (id !== shownId) {
    const leaving = { id: shownId, node: lastNode.current, dir: direction };
    setShownId(id);
    setDir(direction);
    setAnimate(true);
    setExiting((list) => [...list.filter((l) => l.id !== id && l.id !== shownId), leaving]);
  }

  useEffect(() => {
    lastNode.current = children;
  });

  // Safety net in case animationend never fires (e.g. tab in background).
  useEffect(() => {
    if (!exiting.length) return undefined;
    const t = setTimeout(() => setExiting([]), 700);
    return () => clearTimeout(t);
  }, [exiting]);

  const removeLayer = (layerId) => setExiting((list) => list.filter((l) => l.id !== layerId));
  const sense = (d) => (d < 0 ? 'back' : 'fwd');

  return (
    <div className={`sw sw--${mode} ${className}`} {...rest}>
      {exiting.map((layer) => (
        <div
          key={layer.id}
          className={`sw__layer sw__layer--out sw--${sense(layer.dir)}`}
          aria-hidden="true"
          inert
          onAnimationEnd={(e) => e.target === e.currentTarget && removeLayer(layer.id)}
        >
          {layer.node}
        </div>
      ))}
      <div key={shownId} className={`sw__layer ${animate ? `sw__layer--in sw--${sense(dir)}` : ''}`}>
        {children}
      </div>
    </div>
  );
}
