import type { ReactNode } from 'react';
import { cx } from '../utils';

export interface ProofStatProps {
  /** The figure, e.g. 11 or "98%". */
  value: ReactNode;
  /** Optional denominator: renders "11 of 29". */
  of?: ReactNode;
  /** What the figure means. */
  label: ReactNode;
  /** Where it comes from, with a date ("Research count · 5 Oct 2026"). Required by the brand's labelling rule for our own counts. */
  source?: ReactNode;
  className?: string;
}

/** One proof figure with its label and source. One per section. */
export function ProofStat({ value, of, label, source, className }: ProofStatProps) {
  return (
    <div className={cx('rnc-proof', className)}>
      <div className="rnc-big">{value}{of != null ? <em> of {of}</em> : null}</div>
      <p>{label}</p>
      {source ? <small>{source}</small> : null}
    </div>
  );
}
