import type { CSSProperties } from 'react';
import { NODES, type NodeName } from '../generated/nodes';
import { cx } from '../utils';

export interface NodeGraphicProps {
  /** link, triad, link-tall or link-wide. */
  name: NodeName;
  /** Longest side in px. Default 160. */
  size?: number;
  /** Colour (any CSS colour or var(--token)). Default currentColor. */
  color?: string;
  /** 'white' fills the holes, like the original artwork. Default: clear, or white when shadow is on. */
  holes?: 'clear' | 'white';
  shadow?: boolean;
  /** Accessible name. Leave out for decoration (the usual case). */
  label?: string;
  rotate?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * The logo's node shapes as graphic elements: large and cropped at a band's edge, one or two per band,
 * in one token colour. Never as icons or bullets, and never on client raffle sites.
 */
export function NodeGraphic({ name, size = 160, color, holes, shadow, label, rotate, className, style }: NodeGraphicProps) {
  const [viewBox, d] = NODES[name];
  const [, , w, h] = viewBox.split(' ').map(Number);
  const W = w >= h ? size : Math.round((size * w) / h);
  const H = w >= h ? Math.round((size * h) / w) : size;
  const whiteHoles = holes ? holes === 'white' : !!shadow;
  return (
    <svg
      className={cx('rnc-node', shadow && 'rnc-node-shadow', className)} viewBox={viewBox} width={W} height={H}
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false"
      style={{ color, transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
    >
      <path fill="currentColor" fillRule="evenodd" d={d} />
      {whiteHoles ? <path fill="#ffffff" d={d.replace(/^M[^Z]*Z/, '')} /> : null}
    </svg>
  );
}
