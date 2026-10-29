import { useState } from 'react';

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

export default function Avatar({ name, src, size = 36 }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {src && !failed ? (
        <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}
