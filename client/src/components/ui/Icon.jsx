// Small inline icon set (24px grid, 1.8px stroke). Add new icons to PATHS.
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  chevronLeft: 'M15 5l-7 7 7 7',
  chevronRight: 'M9 5l7 7-7 7',
  chevronDown: 'M6 9l6 6 6-6',
  today: 'M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z',
  calendar: 'M7 3v3M17 3v3M4 9h16M5 5.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.5 9h17M3.5 15h17M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.6-3.6-9S9.5 5.6 12 3z',
  settings: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.6 7.6 0 0 1-1.9 1.1l-.3 2h-3.9l-.3-2a7.6 7.6 0 0 1-1.9-1.1l-1.9.7-2-3.4 1.6-1.2a7.4 7.4 0 0 1 0-3l-1.6-1.2 2-3.4 1.9.7a7.6 7.6 0 0 1 1.9-1.1l.3-2h3.9l.3 2a7.6 7.6 0 0 1 1.9 1.1l1.9-.7 2 3.4-1.6 1.2a7.4 7.4 0 0 1 0 3z',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  monitor: 'M4 5h16v11H4zM9 20h6M12 16v4',
  trash: 'M5 7h14M10 11v6M14 11v6M6.5 7l1 12.5h9L17.5 7M9.5 7V4.5h5V7',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2',
  repeat: 'M17 2l3 3-3 3M20 5H8a4 4 0 0 0-4 4v1M7 22l-3-3 3-3M4 19h12a4 4 0 0 0 4-4v-1',
  flag: 'M5 21V4M5 4h12l-2 4 2 4H5',
  tag: 'M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9zM8 8h.01',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  columns: 'M4 4h16v16H4zM9.3 4v16M14.7 4v16',
  day: 'M4 4h16v16H4zM4 9h16',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.7M6.4 6.9A15.5 15.5 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.3-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2',
  shield: 'M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6z',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18.5 14a6.5 6.5 0 0 1 3 6',
  palette: 'M12 21a9 9 0 1 1 9-9c0 2.2-1.8 3.5-3.8 3.5H15a1.8 1.8 0 0 0-1.3 3.1A1.5 1.5 0 0 1 12 21zM7.5 11h.01M10 7h.01M14.5 7h.01M17 11h.01',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
  inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1.5 2.5h5L16 13h5',
  leaf: 'M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l7-7',
};

export default function Icon({ name, size = 20, strokeWidth = 1.8, className = '', title }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}
