import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { cx, formatWhole, prefersReducedMotion } from '../utils';

export interface OdometerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** A real figure: a jackpot, ticket number or drawn number. Numbers get Canadian digit grouping. */
  value: number | string;
  /** Text before the digits, e.g. "$". */
  prefix?: string;
  /** Extra full turns each digit makes before landing. Default 1. */
  spins?: number;
  /** Milliseconds between digits. Default 90. */
  stagger?: number;
  /** Milliseconds for the first digit. Default 1100. */
  duration?: number;
  delay?: number;
  /** When to roll: on mount (default), when half of it scrolls into view, or never (static). */
  trigger?: 'mount' | 'visible' | 'none';
  /** Change this to roll again with the same value. */
  replayKey?: unknown;
  onDone?: () => void;
}

type Phase = 'static' | 'ready' | 'rolling';

/**
 * Digits roll into place, for real numbers only. Raffle Insider and client raffle sites, not the organizations side.
 * Screen readers get the real value; under reduced motion the figure simply appears.
 */
export function Odometer({ value, prefix = '', spins = 1, stagger = 90, duration = 1100, delay = 0, trigger = 'mount', replayKey, onDone, className, ...rest }: OdometerProps) {
  const text = prefix + (typeof value === 'number' ? formatWhole(value) : String(value));
  const [phase, setPhase] = useState<Phase>('static');
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (trigger === 'none' || prefersReducedMotion()) { setPhase('static'); return; }
    let raf1 = 0, raf2 = 0, timer: ReturnType<typeof setTimeout> | undefined, io: IntersectionObserver | undefined;
    const digits = text.replace(/\D/g, '').length;
    const run = () => {
      setPhase('ready');
      raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setPhase('rolling')); });
      timer = setTimeout(() => { setPhase('static'); done.current?.(); }, duration + Math.max(0, digits - 1) * stagger + delay + 120);
    };
    if (trigger === 'visible' && typeof IntersectionObserver !== 'undefined' && ref.current) {
      io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { io?.disconnect(); run(); } }, { threshold: 0.5 });
      io.observe(ref.current);
    } else run();
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); if (timer) clearTimeout(timer); io?.disconnect(); };
  }, [text, trigger, duration, stagger, delay, replayKey]);

  let k = 0;
  return (
    <span ref={ref} className={cx('rnc-odometer', className)} role="img" aria-label={text} {...rest}>
      {phase === 'static' ? text : (
        <span className="rnc-odo" aria-hidden="true">
          {Array.from(text).map((ch, i) => {
            if (!/\d/.test(ch)) return <span key={i} className="rnc-odo-s">{ch}</span>;
            const idx = k++;
            const target = spins * 10 + Number(ch);
            const t = duration + idx * stagger;
            return (
              <span key={i} className="rnc-odo-d">
                <span className="rnc-odo-col" style={phase === 'rolling' ? { transform: `translateY(-${target}em)`, transition: `transform ${t}ms cubic-bezier(.2, .9, .25, 1.08) ${delay}ms` } : undefined}>
                  {Array.from({ length: (spins + 1) * 10 }, (_, n) => <span key={n}>{n % 10}</span>)}
                </span>
              </span>
            );
          })}
        </span>
      )}
    </span>
  );
}
