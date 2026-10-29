import { useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

/**
 * Pill-shaped segmented control with a sliding highlight.
 * options: [{ value, label, icon? }]
 */
export default function Segmented({ options, value, onChange, label, size = 'md', className = '', iconsOnlyOnPhone = false }) {
  const ref = useRef(null);
  const [indicator, setIndicator] = useState(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const measure = () => {
      const active = root.querySelector('[aria-checked="true"]');
      if (!active) return setIndicator(null);
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [value, options.length]);

  const onKeyDown = (e) => {
    const i = options.findIndex((o) => o.value === value);
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = options[(i + 1) % options.length];
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = options[(i - 1 + options.length) % options.length];
    if (next) {
      e.preventDefault();
      onChange(next.value);
      requestAnimationFrame(() => ref.current?.querySelector('[aria-checked="true"]')?.focus());
    }
  };

  return (
    <div
      ref={ref}
      className={`segmented segmented--${size} ${iconsOnlyOnPhone ? 'segmented--compact' : ''} ${className}`}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {indicator && (
        <span
          className="segmented__indicator"
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
          aria-hidden="true"
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={`segmented__item ${active ? 'is-active' : ''}`}
            onClick={() => onChange(o.value)}
            title={o.label}
          >
            {o.icon && <Icon name={o.icon} size={16} />}
            <span className="segmented__label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
