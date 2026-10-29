import { useRef } from 'react';

/**
 * Callbacks may return true to mark the swipe as handled.
 * Horizontal swipe detection for touch / pen. Returns props to spread on an
 * element: <div {...useSwipe({ onLeft: next, onRight: prev })}>.
 * Vertical movement and mouse drags are ignored so clicks and text selection work.
 */
export default function useSwipe({ onLeft, onRight, threshold = 48 }) {
  const start = useRef(null);
  return {
    onPointerDown(e) {
      if (e.pointerType === 'mouse') return;
      start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    },
    onPointerUp(e) {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.4 || Date.now() - s.t > 700) return;
      const handled = dx < 0 ? onLeft?.() : onRight?.();
      // Nested swipe areas (a paged list inside a swipeable calendar): when the inner
      // one handled the gesture, the outer one must not also react.
      if (handled === true) e.stopPropagation();
    },
    onPointerCancel() {
      start.current = null;
    },
  };
}
