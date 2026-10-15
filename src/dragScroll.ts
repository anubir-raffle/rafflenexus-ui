import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

export interface ScrollEdges {
  /** There's more to the left (it has been scrolled). */
  back: boolean;
  /** There's more to the right. */
  more: boolean;
}

/**
 * Sideways scrolling for a row or a table that's wider than its space. Touch already swipes it; this adds dragging with a
 * mouse (a drag isn't a click on whatever was under the pointer; it never starts in a field), and reports which edges have
 * more, for fades or shadows. Spread `dragProps` on the scrolling element and pass the same element as `ref`.
 */
export function useDragScroll<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [edges, setEdges] = useState<ScrollEdges>({ back: false, more: false });
  const read = useCallback(() => {
    const t = ref.current; if (!t) return;
    const back = t.scrollLeft > 2; const more = t.scrollLeft + t.clientWidth < t.scrollWidth - 2;
    setEdges((e) => (e.back === back && e.more === more ? e : { back, more }));
  }, [ref]);
  useEffect(() => {
    const t = ref.current; if (!t) return;
    read();
    t.addEventListener('scroll', read, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
    ro?.observe(t); if (t.firstElementChild) ro?.observe(t.firstElementChild);
    return () => { t.removeEventListener('scroll', read); ro?.disconnect(); };
  }, [read, ref]);

  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const dragProps = {
    onPointerDown: (e: ReactPointerEvent<T>) => {
      const t = ref.current;
      if (e.pointerType !== 'mouse' || e.button !== 0 || !t || t.scrollWidth <= t.clientWidth) return;
      if ((e.target as Element).closest?.('input, textarea, select, [contenteditable="true"]')) return;
      drag.current = { x: e.clientX, left: t.scrollLeft, moved: false };
    },
    onPointerMove: (e: ReactPointerEvent<T>) => {
      const d = drag.current; const t = ref.current; if (!d || !t) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 5) { d.moved = true; t.setPointerCapture?.(e.pointerId); t.classList.add('is-dragging'); }
      if (d.moved) t.scrollLeft = d.left - dx;
    },
    onPointerUp: (e: ReactPointerEvent<T>) => {
      const d = drag.current; const t = ref.current; drag.current = null;
      if (!t) return;
      t.classList.remove('is-dragging'); t.releasePointerCapture?.(e.pointerId);
      // A drag isn't a click on what's under the pointer.
      if (d?.moved) t.addEventListener('click', (c) => { c.stopPropagation(); c.preventDefault(); }, { capture: true, once: true });
    },
    onPointerCancel: () => { drag.current = null; ref.current?.classList.remove('is-dragging'); },
  };
  return { edges, dragProps, refresh: read };
}
