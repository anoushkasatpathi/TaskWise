import { IconButton } from './Button.jsx';

/** "‹ • • • ›" control for paged lists. Hidden when there is only one page. */
export default function Pager({ index, count, onPrev, onNext, onGo, label = 'Page', className = '' }) {
  if (count <= 1) return <div className={`pager pager--empty ${className}`} aria-hidden="true" />;
  return (
    <nav className={`pager ${className}`} aria-label={`${label} navigation`}>
      <IconButton icon="chevronLeft" label={`Previous ${label.toLowerCase()}`} size="sm" onClick={onPrev} disabled={index === 0} />
      <span className="pager__dots">
        {count <= 7 ? (
          Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`pager__dot ${i === index ? 'is-active' : ''}`}
              aria-label={`${label} ${i + 1} of ${count}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => onGo?.(i)}
            />
          ))
        ) : (
          <span className="pager__count">
            {index + 1} / {count}
          </span>
        )}
      </span>
      <IconButton icon="chevronRight" label={`Next ${label.toLowerCase()}`} size="sm" onClick={onNext} disabled={index === count - 1} />
    </nav>
  );
}
