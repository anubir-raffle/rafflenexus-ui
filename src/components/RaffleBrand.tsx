import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../utils';

export interface BrandMark {
  /** Image URL of the logo. */
  src?: string;
  /** Or an inline SVG/React element. */
  svg?: ReactNode;
  /** Alt text (the raffle's or sponsor's name). */
  alt?: string;
}
export interface RaffleBrandProps {
  /** The raffle's own logo. */
  logo: BrandMark;
  /** Optional sponsor, shown at 62% of the logo's height. */
  sponsor?: BrandMark & { label?: 'Sponsored by' | 'Presented by' | string };
  /** Where the logo links. Default "/". */
  href?: string;
  /** Logo height in px. Default 48 (40 on narrow containers). */
  height?: number;
  /** Put the logo on a white plate, for dark or photo headers. */
  plate?: boolean;
  /** Also render the narrow-screen sponsor strip (shown only in containers under 640px). */
  strip?: boolean;
  className?: string;
}

function Mark({ m, alt }: { m: BrandMark; alt: string }) {
  return m.svg ? <>{m.svg}</> : <img src={m.src} alt={alt} />;
}

/** The raffle's own logo on its white-label site, with an optional sponsor. */
export function RaffleBrand({ logo, sponsor, href = '/', height, plate, strip, className }: RaffleBrandProps) {
  const style = height ? ({ ['--rb-h' as string]: `${height}px` } as CSSProperties) : undefined;
  const label = sponsor?.label || 'Sponsored by';
  return (
    <>
      <div className={cx('rnc-rb', plate && 'rnc-rb-plate', className)} style={style}>
        <a className="rnc-rb-logo" href={href} aria-label={`${logo.alt || 'Raffle'}, home`}><Mark m={logo} alt="" /></a>
        {sponsor ? <div className="rnc-rb-sponsor"><span>{label}</span><Mark m={sponsor} alt={sponsor.alt || ''} /></div> : null}
      </div>
      {strip && sponsor ? <div className="rnc-rb-strip"><span>{label}</span><Mark m={sponsor} alt={sponsor.alt || ''} /></div> : null}
    </>
  );
}
