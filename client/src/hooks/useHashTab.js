import { useCallback, useEffect, useRef, useState } from 'react';
import { TABS } from '../lib/constants.js';

const ids = TABS.map((t) => t.id);
const readHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '').split('/')[0];
  return ids.includes(id) ? id : 'today';
};

/**
 * Keeps the active tab in the URL hash (#/calendar), so the browser back
 * button and shared links work. Also reports which way to slide: moving to a
 * tab further right slides forward, moving left slides back.
 */
export default function useHashTab() {
  const [tab, setTab] = useState(readHash);
  const [direction, setDirection] = useState(1);
  const current = useRef(tab);

  const apply = useCallback((next) => {
    const from = ids.indexOf(current.current);
    const to = ids.indexOf(next);
    if (from === to) return;
    setDirection(to > from ? 1 : -1);
    current.current = next;
    setTab(next);
  }, []);

  useEffect(() => {
    const onHash = () => apply(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [apply]);

  const navigate = useCallback((next) => {
    if (readHash() !== next) window.location.hash = `/${next}`;
    else apply(next);
  }, [apply]);

  return { tab, direction, navigate };
}
