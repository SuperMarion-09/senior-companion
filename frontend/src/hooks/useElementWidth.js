import { useEffect, useRef, useState } from 'react';

/**
 * Measures an element's width and keeps it up to date when the layout
 * changes, so SVG charts can be drawn at their real size (text never stretches).
 *
 *   const [ref, width] = useElementWidth();
 *   <div ref={ref}>{width > 0 && <svg width={width} … />}</div>
 */
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    setWidth(element.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
