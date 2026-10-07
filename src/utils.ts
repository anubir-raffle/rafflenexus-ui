import { useEffect, useState } from 'react';

export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

export function toNumber(v: number | string): number {
  return typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.]/g, ''));
}

/** Whole dollars with Canadian digit grouping: 2548700 → "2,548,700". */
export function formatWhole(n: number): string {
  return Math.round(n).toLocaleString('en-CA');
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when the visitor has asked for reduced motion. Starts false on the server. */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduce;
}
