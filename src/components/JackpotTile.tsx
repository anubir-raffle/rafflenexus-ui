import type { ReactNode } from 'react';
import { JackpotFigure } from './JackpotFigure';
import { cx } from '../utils';

export interface JackpotTileProps {
  /** The program's name. Client names need the client's permission before public use. */
  program: ReactNode;
  /** The live jackpot, whole dollars. */
  amount: number | string;
  /** Count up from this figure once on load. */
  from?: number | string;
  /** Province code or name, shown after "Live ·". */
  province?: string;
  /** Default true. False shows "Closed". */
  live?: boolean;
  /** Source line, e.g. "As shown on the lottery's site, 6 Oct 2026". */
  caption?: ReactNode;
  className?: string;
}

/** A live jackpot as proof: program, figure and source. */
export function JackpotTile({ program, amount, from, province, live = true, caption, className }: JackpotTileProps) {
  return (
    <div className={cx('rnc-jackpot', className)}>
      <div className="rnc-jackpot-top">
        <span className="rnc-live">{live ? <i /> : null}{`${live ? 'Live' : 'Closed'}${province ? ` · ${province}` : ''}`}</span>
      </div>
      <b>{program}</b>
      <span className="rnc-amt"><JackpotFigure amount={amount} from={from} /></span>
      {caption ? <span className="rnc-cap">{caption}</span> : null}
    </div>
  );
}
