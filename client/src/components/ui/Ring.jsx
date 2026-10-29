/**
 * Progress ring like the "Daily balance" dial in the design: a lavender arc
 * that hands over to a sunshine arc, with the value in the middle.
 */
export default function Ring({ value = 0, size = 180, stroke = 16, label, sublabel, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c * (1 - pct / 100);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="ring-g" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--ring-a)" />
            <stop offset="0.6" stopColor="var(--ring-b)" />
            <stop offset="1" stopColor="var(--ring-c)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle
          className="ring__arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-g)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring__center">
        <span className="ring__value">
          {Math.round(pct)}
          <small>%</small>
        </span>
        {label && <span className="ring__label">{label}</span>}
        {sublabel && <span className="ring__sublabel">{sublabel}</span>}
        {children}
      </div>
      <span className="sr-only">{`${Math.round(pct)} percent ${label || ''}`}</span>
    </div>
  );
}
