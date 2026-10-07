import type { ReactNode } from 'react';
import { Button } from './Button';
import { ProofStat, type ProofStatProps } from './ProofStat';
import { JackpotTile, type JackpotTileProps } from './JackpotTile';
import { cx } from '../utils';

export interface HeroAction { label: string; href?: string; onClick?: () => void }
export interface LeaderHeroProps {
  /** Default "Canada's raffle leader." Keep a named program or live figure close by. */
  headline?: ReactNode;
  sub: ReactNode;
  primary?: HeroAction;
  secondary?: HeroAction;
  /** The proof on the right: a ProofStat and/or live JackpotTiles. */
  proof?: ProofStatProps;
  tiles?: JackpotTileProps[];
  className?: string;
}

function Action({ a, variant }: { a: HeroAction; variant: 'stage' | 'stage-ghost' }) {
  return a.href ? <Button variant={variant} href={a.href} onClick={a.onClick}>{a.label}</Button> : <Button variant={variant} onClick={a.onClick}>{a.label}</Button>;
}

/** The claim on the left, the proof on the right, on a stage band. */
export function LeaderHero({ headline = "Canada's raffle leader.", sub, primary = { label: 'Talk to our lottery team' }, secondary, proof, tiles = [], className }: LeaderHeroProps) {
  return (
    <section className={cx('rnc-hero', 'rnc-stage', className)}>
      <div className="rnc-hero-copy">
        <h1 className="rnc-h">{headline}</h1>
        <p className="rnc-hero-sub">{sub}</p>
        <div className="rnc-row">
          <Action a={primary} variant="stage" />
          {secondary ? <Action a={secondary} variant="stage-ghost" /> : null}
        </div>
      </div>
      <div className="rnc-hero-side">
        {proof ? <ProofStat {...proof} /> : null}
        {tiles.map((t, i) => <JackpotTile key={i} {...t} />)}
      </div>
    </section>
  );
}
