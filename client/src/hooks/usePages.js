import { useEffect, useMemo, useState } from 'react';

/**
 * Splits `items` into pages that fit `available` pixels, so long lists page
 * instead of scrolling. `heightOf(item)` returns each row's height in px
 * (including its gap). Keeps the current page valid when the list shrinks.
 */
export default function usePages(items, available, heightOf, resetKey, keepWithNext = () => false) {
  const pages = useMemo(() => {
    if (!items.length) return [[]];
    if (!available) return [items.slice(0, 1)];
    const out = [];
    let page = [];
    let used = 0;
    items.forEach((item, i) => {
      const h = heightOf(item);
      // Headers ("keep with next") move to the next page rather than end a page alone.
      const needed = keepWithNext(item) && items[i + 1] ? h + heightOf(items[i + 1]) : h;
      if (page.length && used + needed > available) {
        out.push(page);
        page = [];
        used = 0;
      }
      page.push(item);
      used += h;
    });
    if (page.length) out.push(page);
    return out;
    // heightOf is expected to be stable in behaviour; items/available drive recalculation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, available]);

  const [state, setState] = useState({ index: 0, dir: 1 });
  const index = Math.min(state.index, pages.length - 1);

  // Jump back to the first page when the underlying data set changes (e.g. new day).
  useEffect(() => {
    setState({ index: 0, dir: 1 });
  }, [resetKey]);

  const go = (next) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, next));
    if (clamped === index) return false;
    setState({ index: clamped, dir: clamped > index ? 1 : -1 });
    return true;
  };

  return {
    pages,
    page: pages[index] || [],
    index,
    count: pages.length,
    dir: state.dir,
    next: () => go(index + 1),
    prev: () => go(index - 1),
    goTo: go,
  };
}
