import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cx, formatWhole, prefersReducedMotion, toNumber } from '../utils';

export interface JackpotFigureProps {
  /** Today's jackpot in whole dollars. Real figures only, from the platform. */
  amount: number | string;
  /** Yesterday's figure. When given, the number counts up from it once on load (skipped under reduced motion). */
  from?: number | string;
  /** Optional growth line, e.g. "Up $1,240 since yesterday". Only when the platform supplies yesterday's figure. */
  growth?: ReactNode;
  /** @deprecated Ignored. Jackpots have no rule under them since 2 Nov 2026. */
  perforation?: boolean;
  className?: string;
}

function Digits({ n }: { n: number }) {
  const parts = formatWhole(n).split(',');
  return <>{parts.map((p, i) => <Fragment key={i}>{i > 0 ? <span className="rnc-jp-sep">,</span> : null}{p}</Fragment>)}</>;
}

/**
 * Every jackpot uses this: a raised "$" and the digits in --font-figure (DM Sans), never faded, with no rule under
 * them. Size it with font-size on a parent; colour it with color and --jp-cur.
 */
export function JackpotFigure({ amount, from, growth, className }: JackpotFigureProps) {
  const to = toNumber(amount);
  const start = from != null ? toNumber(from) : null;
  const [shown, setShown] = useState(to);
  const num = useRef<HTMLSpanElement>(null);

  // DM Sans has no tabular figures, so while it counts the number keeps today's width: nothing around it moves.
  // Measured with today's figure on screen, before the count starts.
  useLayoutEffect(() => {
    const el = num.current;
    if (!el || start == null) return;
    el.style.minWidth = '';
    el.style.minWidth = `${el.getBoundingClientRect().width}px`;
  }, [to, start]);

  useEffect(() => {
    if (start == null || prefersReducedMotion()) { setShown(to); return; }
    let raf = 0;
    let t0: number | null = null;
    setShown(start);
    const step = (t: number) => {
      if (t0 == null) t0 = t;
      const k = Math.min(1, (t - t0) / 1400);
      setShown(start + (to - start) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    const timer = setTimeout(() => { raf = requestAnimationFrame(step); }, 350);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [to, start]);

  return (
    <span className={cx('rnc-jp', className)}>
      <span className="rnc-jp-fig" role="img" aria-label={`$${formatWhole(to)}`}>
        <span className="rnc-jp-cur" aria-hidden="true">$</span>
        <span className="rnc-jp-num" ref={num} aria-hidden="true" style={start != null ? { display: 'inline-block' } : undefined}><Digits n={shown} /></span>
      </span>
      {growth ? <span className="rnc-jp-grow">{growth}</span> : null}
    </span>
  );
}
