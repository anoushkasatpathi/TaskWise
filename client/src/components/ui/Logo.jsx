// TaskWise mark: two rounded bars forming a check, plus the spaced wordmark.
export default function Logo({ compact = false }) {
  return (
    <span className="logo">
      <svg className="logo__mark" viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
        <defs>
          <linearGradient id="tw-logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#B48CFF" />
            <stop offset="1" stopColor="#6E6FD8" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" className="logo__bg" />
        <rect x="12" y="30" width="22" height="11" rx="5.5" transform="rotate(45 23 35.5)" fill="url(#tw-logo-g)" />
        <rect x="22" y="23" width="34" height="11" rx="5.5" transform="rotate(-45 39 28.5)" fill="url(#tw-logo-g)" />
      </svg>
      {!compact && <span className="logo__word">TaskWise</span>}
    </span>
  );
}
