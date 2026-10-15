import type { ElementType } from 'react';
import { Icon } from './Icon';
import { MARK_WHITE } from '../generated/marks';
import { cx } from '../utils';

/** Each province's licensing wording, as on client raffle sites (template config, BC checked 2026-10-06; the others to confirm). */
export const LICENCE_PROVINCES = {
  BC: { name: 'British Columbia', short: 'BC', regulator: 'Independent Gambling Control Office', regulatorShort: 'IGCO', regulatorUrl: 'https://www.igcobc.ca', licenceLabel: 'BC Gaming Event Licence', registration: '242682' },
  AB: { name: 'Alberta', short: 'Alberta', regulator: 'Alberta Gaming, Liquor and Cannabis', regulatorShort: 'AGLC', regulatorUrl: 'https://aglc.ca', licenceLabel: 'AGLC Raffle Licence', registration: null },
  SK: { name: 'Saskatchewan', short: 'Saskatchewan', regulator: 'Saskatchewan Liquor and Gaming Authority', regulatorShort: 'SLGA', regulatorUrl: 'https://www.slga.com', licenceLabel: 'SLGA Raffle Licence', registration: '838799GS' },
  MB: { name: 'Manitoba', short: 'Manitoba', regulator: 'Liquor, Gaming and Cannabis Authority of Manitoba', regulatorShort: 'LGCA', regulatorUrl: 'https://lgcamb.ca', licenceLabel: 'LGCA Licence', registration: null },
  ON: { name: 'Ontario', short: 'Ontario', regulator: 'Alcohol and Gaming Commission of Ontario', regulatorShort: 'AGCO', regulatorUrl: 'https://www.agco.ca', licenceLabel: 'AGCO Lottery Licence', registration: 'GRSGS00201388' },
} as const;
export type LicenceProvince = keyof typeof LICENCE_PROVINCES;

/** The GLI certificate for the random number generator (shown until it expires). */
const RNG = { lab: 'GLI', url: 'https://access.gaminglabs.com/Certificate/Index?i=290', validUntil: '2027-09-30' };

export interface LicenceBadgeProps {
  province: LicenceProvince;
  /** The licence number, without "#" (one licence). */
  number?: string;
  /** Several licences (one per game): `[{ label: 'Lottery', number: '123456' }]`. Use this or `number`. */
  licences?: { label?: string; number: string }[];
  /** `full` (default): the navy card for the compliance band. `compact`: one line with a small seal, for the pack chooser. */
  variant?: 'full' | 'compact';
  /** The full card's title element. Default h2; use p where a heading would break the outline. */
  heading?: ElementType;
  /** Where "Verified by Raffle Nexus Canada" links. Default https://rafflenexus.com. */
  platformUrl?: string;
  className?: string;
}

/** The RNC licence seal: a 24-point rosette in RNC blue, a perforation ring and a heavy check. Decorative. */
export function LicenceSeal() {
  return (
    <svg className="rnc-licence-seal" viewBox="0 0 72 72" aria-hidden="true" focusable="false">
      <polygon className="rnc-licence-seal-edge" points="36.00,3.00 39.85,6.75 44.54,4.12 47.29,8.75 52.50,7.42 53.96,12.60 59.33,12.67 59.40,18.04 64.58,19.50 63.25,24.71 67.88,27.46 65.25,32.15 69.00,36.00 65.25,39.85 67.88,44.54 63.25,47.29 64.58,52.50 59.40,53.96 59.33,59.33 53.96,59.40 52.50,64.58 47.29,63.25 44.54,67.88 39.85,65.25 36.00,69.00 32.15,65.25 27.46,67.88 24.71,63.25 19.50,64.58 18.04,59.40 12.67,59.33 12.60,53.96 7.42,52.50 8.75,47.29 4.12,44.54 6.75,39.85 3.00,36.00 6.75,32.15 4.12,27.46 8.75,24.71 7.42,19.50 12.60,18.04 12.67,12.67 18.04,12.60 19.50,7.42 24.71,8.75 27.46,4.12 32.15,6.75" />
      <circle className="rnc-licence-seal-face" cx="36" cy="36" r="25" />
      <circle className="rnc-licence-seal-ring" cx="36" cy="36" r="20.5" />
      <path className="rnc-licence-seal-check" d="M26.5 36.5 33 43l13-14" pathLength={1} />
    </svg>
  );
}

/**
 * The raffle's licence, the official way client raffle sites show it (the standard template's `<x-raffle.licence-badge>`):
 * the RNC seal, "Licensed in <province>", the licence number, the regulator and the security facts behind "Licence and
 * security details", and "Verified by Raffle Nexus Canada". Always in RNC colours, never the client's, so it reads as the
 * same trusted mark on every site. The wording comes from the province.
 */
export function LicenceBadge({ province, number, licences, variant = 'full', heading: Title = 'h2', platformUrl = 'https://rafflenexus.com', className }: LicenceBadgeProps) {
  const p = LICENCE_PROVINCES[province];
  const list = licences?.length ? licences : [{ label: undefined, number: number ?? '' }];
  const several = list.length > 1;
  if (variant === 'compact') {
    return (
      <p className={cx('rnc-licence', 'is-compact', className)}>
        <LicenceSeal />
        <span className="rnc-licence-body">
          <strong className="rnc-licence-title">Licensed in {p.short}</strong>
          <span className="rnc-licence-number">
            {several ? `${p.licenceLabel}s: ${list.map((l) => `${l.label ? `${l.label} ` : ''}#${l.number}`).join(' · ')}` : `${p.licenceLabel} #${list[0].number}`}
          </span>
        </span>
      </p>
    );
  }
  const rngValid = new Date() <= new Date(`${RNG.validUntil}T23:59:59`);
  return (
    <div className={cx('rnc-licence', className)}>
      <LicenceSeal />
      <div className="rnc-licence-body">
        <Title className="rnc-licence-title">Licensed in {p.name}</Title>
        {several ? (
          <ul className="rnc-licence-numbers">{list.map((l, i) => <li key={i} className="rnc-licence-number">{l.label ? `${l.label}: ` : ''}{p.licenceLabel} #{l.number}</li>)}</ul>
        ) : <p className="rnc-licence-number">{p.licenceLabel} #{list[0].number}</p>}
        <details className="rnc-licence-more">
          <summary className="rnc-licence-toggle">Licence and security details</summary>
          <div className="rnc-licence-detail">
            <p className="rnc-licence-regulator">Regulated by the <a href={p.regulatorUrl} rel="noopener">{p.regulator}</a> ({p.regulatorShort})</p>
            <ul className="rnc-licence-trust">
              {rngValid ? <li><Icon name="shield-check" size={18} /><span>Draws use a {RNG.lab}-certified random number generator (<a href={RNG.url} rel="noopener">see certificate</a>)</span></li> : null}
              <li><Icon name="lock-simple" size={18} /><span>Card details are handled by a PCI DSS–compliant payment processor</span></li>
              {p.registration ? <li><Icon name="seal-check" size={18} /><span>Raffle Nexus is a registered gaming supplier in {p.name} (#{p.registration})</span></li> : null}
            </ul>
          </div>
        </details>
      </div>
      <p className="rnc-licence-by">
        <a href={platformUrl}><img src={MARK_WHITE} alt="" width={12} height={17} /><span>Verified by Raffle Nexus Canada</span></a>
      </p>
    </div>
  );
}
