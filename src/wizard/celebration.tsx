import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../components/Button';

export interface WizardCelebrationProps {
  /** Shows the celebration. */
  open: boolean;
  /** Done, Escape or a click outside the card. Focus goes back to where it was. */
  onClose: () => void;
  /** Default "Your raffle is ready to build". */
  title?: ReactNode;
  /** Default: what happens next, in two short sentences. */
  text?: ReactNode;
  /** Default "Done". */
  actionLabel?: string;
}

// Brand colours only: action blue, reward gold, verified green, stage accent.
const COLOURS = ['var(--brand)', 'var(--reward-fill)', 'var(--verified-fill)', 'var(--stage-accent)', 'var(--action)'];
// Fixed, spread-out values (not random), so every burst looks the same and tests stay stable.
const PIECES = Array.from({ length: 36 }, (_, i) => {
  const spread = ((i * 37) % 100) / 100; // 0..1, shuffled
  return {
    '--x': `${Math.round((spread * 2 - 1) * 46)}vw`,
    '--up': `${-18 - ((i * 53) % 22)}vh`,
    '--r': `${((i * 97) % 720) - 360}deg`,
    '--d': `${((i * 29) % 30) / 100}s`,
    '--c': COLOURS[i % COLOURS.length],
    '--w': `${6 + (i % 3) * 3}px`,
  } as CSSProperties;
});

/**
 * The moment after Submit: confetti in the brand's colours bursts from the middle, a card springs in with a check that draws
 * itself, and says what happens next (Miguel, 2026-10-16: "celebrate their achievement"). A modal dialog: focus moves to Done,
 * Escape closes it. Under reduced motion it simply fades in, with no confetti.
 */
export function WizardCelebration({
  open, onClose, title = 'Your raffle is ready to build',
  text = 'You finished every section. Our team builds your site next. We’ll email you when it’s ready to review.', actionLabel = 'Done',
}: WizardCelebrationProps) {
  const id = useId();
  const card = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const back = document.activeElement as HTMLElement | null;
    card.current?.querySelector<HTMLElement>('button')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      // Keep Tab inside the card: its only control is Done.
      if (e.key === 'Tab') { e.preventDefault(); card.current?.querySelector<HTMLElement>('button')?.focus(); }
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); back?.focus?.({ preventScroll: true }); };
  }, [open]);

  if (!open) return null;
  return (
    <div className="rnc-celebrate" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rnc-celebrate-confetti" aria-hidden="true">
        {PIECES.map((style, i) => <i key={i} style={style} />)}
      </div>
      <div className="rnc-celebrate-card" ref={card} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`}>
        <svg className="rnc-celebrate-seal" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
          <circle className="rnc-celebrate-ring" cx="48" cy="48" r="44" />
          <circle className="rnc-celebrate-face" cx="48" cy="48" r="36" />
          <path className="rnc-celebrate-check" d="M31 49 l11 11 l23 -25" pathLength={1} />
        </svg>
        <h2 className="rnc-celebrate-title" id={`${id}-t`}>{title}</h2>
        <p className="rnc-celebrate-text" id={`${id}-d`}>{text}</p>
        <Button onClick={onClose}>{actionLabel}</Button>
      </div>
    </div>
  );
}
