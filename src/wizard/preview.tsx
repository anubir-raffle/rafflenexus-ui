import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { SegmentedControl } from '../components/Segmented';
import { Icon } from '../components/Icon';
import { readableOn } from '../components/BrandColours';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { LicenceBadge, type LicenceProvince } from '../components/LicenceBadge';
import { cx } from '../utils';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export type PreviewDevice = 'desktop' | 'mobile';
const DeviceContext = createContext<PreviewDevice>('desktop');
/** The device the surrounding WizardPreview shows ('desktop' outside one). Use it in your own preview markup. */
export const usePreviewDevice = () => useContext(DeviceContext);

export interface WizardPreviewProps {
  /** The address shown in the browser bar, e.g. "samplehospital.rafflenexus.com". */
  url?: ReactNode;
  /** Default "Live preview". */
  label?: ReactNode;
  /** Default "Updates as you type. Your live site may look a little different." (it's a close guide, not an exact copy). */
  hint?: ReactNode;
  /** Controlled device; leave it out and the preview keeps its own, starting at `defaultDevice` (default desktop). */
  device?: PreviewDevice;
  defaultDevice?: PreviewDevice;
  onDeviceChange?: (device: PreviewDevice) => void;
  /** Offer the Desktop / Mobile switch. Default true. */
  devices?: boolean;
  /** The widths the site is laid out at before it's scaled to fit. Defaults 1280 and 390. */
  desktopWidth?: number;
  mobileWidth?: number;
  /** What the site looks like: `<WizardSitePreview … />`, or your own markup or an iframe. It's laid out at the device's width. */
  children?: ReactNode;
}

/**
 * The V2 live preview: the raffle site laid out at a real desktop width (1280) or phone width (390) and scaled to fit,
 * in a browser or phone frame, with a Desktop / Mobile switch. Return it from the Wizard's `preview`.
 */
export function WizardPreview({
  url, label = 'Live preview', hint = 'Updates as you type. Your live site may look a little different.', device, defaultDevice = 'desktop', onDeviceChange, devices = true,
  desktopWidth = 1280, mobileWidth = 390, children,
}: WizardPreviewProps) {
  const [own, setOwn] = useState<PreviewDevice>(defaultDevice);
  const shown = device ?? own;
  const set = (d: PreviewDevice) => { if (device === undefined) setOwn(d); onDeviceChange?.(d); };
  const width = shown === 'mobile' ? mobileWidth : desktopWidth;
  const frame = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; height: number } | null>(null);

  useIsoLayoutEffect(() => {
    const f = frame.current; const p = page.current;
    if (!f || !p) return;
    const measure = () => {
      const scale = Math.min(1, f.clientWidth / width);
      setFit({ scale, height: Math.ceil(p.scrollHeight * scale) });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(f); ro.observe(p);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div className={cx('rnc-wizard-preview', `is-${shown}`)}>
      <div className="rnc-wizard-preview-head">
        <p className="rnc-wizard-preview-label">{label}{hint ? <span>{hint}</span> : null}</p>
        {devices ? (
          <SegmentedControl<PreviewDevice> className="rnc-wizard-preview-devices" aria-label="Preview size" value={shown} onChange={set}
            options={[
              { value: 'desktop', label: <><Icon name="monitor" size={16} />Desktop</> },
              { value: 'mobile', label: <><Icon name="device-mobile" size={16} />Mobile</> },
            ]} />
        ) : null}
      </div>
      <div className="rnc-wizard-browser" role="img" aria-label={`Preview of the raffle site on ${shown === 'mobile' ? 'a phone' : 'a computer'}`}>
        <div className="rnc-wizard-browser-bar" aria-hidden="true">{shown === 'desktop' ? <><i /><i /><i /></> : null}{url ? <span className="rnc-wizard-browser-url">{url}</span> : null}</div>
        <div className="rnc-wizard-browser-view" ref={frame}>
          <div className="rnc-wizard-browser-fit" style={{ height: fit ? fit.height : undefined }}>
            <div className="rnc-wizard-browser-page" ref={page} aria-hidden="true"
              style={{ width, transform: fit ? `scale(${fit.scale})` : undefined }}>
              <DeviceContext.Provider value={shown}>{children}</DeviceContext.Provider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface WizardSitePack { label: ReactNode; price: ReactNode; note?: ReactNode }
export interface WizardSiteDate { when: ReactNode; what: ReactNode }
/** A sponsor: a name, and a logo (an image URL) when there is one. */
export interface WizardSiteSponsor { name: ReactNode; logo?: string }
/** A prize. `sponsor` shows "Sponsored by" with the sponsor's logo (or name) on the prize. */
/** One prize card: its photo (a gift icon on the site colour without one), value, title and optional sponsor. */
export interface WizardSitePrize { title: ReactNode; value?: ReactNode; image?: string; sponsor?: WizardSiteSponsor }
/** One social account, linked in the footer: the network's name and the full address. */
export interface WizardSiteSocial { label: ReactNode; href: string }

/** A photo or a video for the cause section of the site preview. */
export interface WizardCauseMedia {
  kind: 'image' | 'video';
  /** A URL: a data URL or object URL from an upload, or a hosted file. */
  src: string;
  /** Alt text for a photo, or the video's accessible name. */
  alt?: string;
}

export interface WizardSitePreviewProps {
  /** The organization: beside the logo, and small above the heading. */
  org?: ReactNode;
  /** The client's logo (an image URL), in the header. */
  logo?: string;
  logoAlt?: string;
  heading?: ReactNode;
  subheading?: ReactNode;
  /** "Where the money goes": text, or `<RichText html={…} />`. */
  cause?: ReactNode;
  /**
   * A photo or video for the cause, shown in a column beside the cause text (on the phone preview, under it).
   * Videos show with controls, muted, and don't play on their own.
   */
  causeMedia?: WizardCauseMedia;
  /** The client's colours (hex): the header and hero, buttons and links, the footer and panels. Text on each is white or dark, whichever reads. */
  colour?: string;
  accent?: string;
  secondary?: string;
  /** The first slide: the hero's photo. */
  image?: string;
  /** Every slide; the first one shows, whole, with a progress bar for each. */
  slides?: string[];
  /** The client's own hero background, faint behind the hero. Slides never go there (cropped to fill, their text would be cut off). */
  background?: string;
  /** The packs in "Choose a pack". */
  packs?: WizardSitePack[];
  /** "Important dates", in order. */
  dates?: WizardSiteDate[];
  prizes?: WizardSitePrize[];
  /** The licence line, e.g. "BC Gaming Event Licence #000000". */
  licence?: ReactNode;
  /**
   * The licence badge. With `province`, the official LicenceBadge client sites show: the full navy card above the footer and
   * the compact line in Choose a pack (wording from the province). The older `{ regulator, licence }` shape shows a VerifiedBadge.
   */
  badge?: { province: LicenceProvince; number?: string; licences?: { label?: string; number: string }[] } | { regulator: string; licence: string; rng?: boolean };
  /**
   * The presenting sponsor, beside the client's logo in the header: "Presented by" (or `label`) and the sponsor's logo or name.
   */
  sponsor?: WizardSiteSponsor & { label?: ReactNode };
  /**
   * The raffle's sponsors, under "Thank you to our sponsors", as logos only (Miguel, 2026-10-16): one row, or `{ tiers }` for a
   * row per tier with the tier's name ("Gold sponsors"), the first tier largest (the template's sponsors shape).
   * Sponsors without a logo are left out.
   */
  sponsors?: WizardSiteSponsor[] | { tiers: { name: ReactNode; sponsors: WizardSiteSponsor[] }[] };
  /** The organization's social accounts, linked in the footer. */
  socials?: WizardSiteSocial[];
  /** Default "Order tickets". */
  cta?: ReactNode;
  /** Shown while the heading is empty. Default "Add a main heading". */
  emptyHeading?: ReactNode;
}

/**
 * The raffle site, the way the standard template lays it out: header, hero on the client's colour with the slideshow,
 * Choose a pack, Important dates, prizes, Where the money goes and the footer. Inside a WizardPreview it lays out for the
 * chosen device; nothing in it is clickable.
 */
export function WizardSitePreview({
  org, logo, logoAlt = '', heading, subheading, cause, causeMedia, colour, accent, secondary, image, slides, background, packs, dates, prizes, licence, badge,
  sponsor, sponsors, socials,
  cta = 'Order tickets', emptyHeading = 'Add a main heading',
}: WizardSitePreviewProps) {
  const device = usePreviewDevice();
  const photos = slides?.length ? slides : image ? [image] : [];
  const style = {
    ...(colour ? { ['--site-colour' as string]: colour, ['--site-on-colour' as string]: readableOn(colour) } : {}),
    ...(accent ? { ['--site-accent' as string]: accent, ['--site-on-accent' as string]: readableOn(accent) } : {}),
    ...(secondary || colour ? { ['--site-secondary' as string]: secondary || colour, ['--site-on-secondary' as string]: readableOn((secondary || colour)!) } : {}),
  };
  const empty = heading == null || heading === '';
  // Sponsors as rows: one unnamed row for a plain list, or one per tier (empty tiers left out).
  const logos = (list: WizardSiteSponsor[]) => list.filter((s) => s.logo);
  const tiers = !sponsors ? [] : Array.isArray(sponsors)
    ? (logos(sponsors).length ? [{ name: undefined as ReactNode, sponsors: logos(sponsors) }] : [])
    : sponsors.tiers.map((t) => ({ ...t, sponsors: logos(t.sponsors) })).filter((t) => t.sponsors.length);
  const presenter = sponsor ? (
    <span className="rnc-wsite-presenter">
      <small>{sponsor.label ?? 'Presented by'}</small>
      {sponsor.logo ? <img src={sponsor.logo} alt="" /> : <b>{sponsor.name}</b>}
    </span>
  ) : null;
  return (
    <div className={cx('rnc-wsite', `is-${device}`)} style={style}>
      <div className="rnc-wsite-hero" style={background ? { ['--site-photo' as string]: `url("${background}")` } : undefined}>
        <div className="rnc-wsite-head">
          <span className="rnc-wsite-brand">
            {logo ? <img src={logo} alt={logoAlt} /> : null}
            {org && (!logo || device === 'desktop') ? <span>{org}</span> : null}
            {sponsor && device === 'desktop' ? presenter : null}
          </span>
          {device === 'desktop' ? (
            <>
              <span className="rnc-wsite-nav"><span>Prizes</span><span>Rules of play</span><span>Winners</span><span>Manage order</span></span>
              <span className="rnc-wsite-btn is-light">{cta}</span>
            </>
          ) : (
            // A phone: the logo and a menu button, as phone sites do; Order tickets is right below in the hero (Miguel, 2026-10-16).
            <span className="rnc-wsite-menu"><Icon name="list" size={22} /></span>
          )}
        </div>
        {sponsor && device === 'mobile' ? <div className="rnc-wsite-presenter-bar">{presenter}</div> : null}
        <div className="rnc-wsite-heroin">
          <div className="rnc-wsite-copy">
            {org ? <small>{org}</small> : null}
            <p className={cx('rnc-wsite-title', empty && 'is-empty')}>{empty ? emptyHeading : heading}</p>
            {subheading ? <p className="rnc-wsite-sub">{subheading}</p> : null}
            <span className="rnc-wsite-actions"><span className="rnc-wsite-btn">{cta}</span><span className="rnc-wsite-link">See the prizes</span></span>
          </div>
          {photos[0] ? (
            <div className="rnc-wsite-slide">
              <img src={photos[0]} alt="" />
              {photos.length > 1 ? <span className="rnc-wsite-bars">{photos.map((p, i) => <i key={`${p.slice(-12)}-${i}`} className={i === 0 ? 'is-on' : undefined} />)}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
      {packs?.length ? (
        <div className="rnc-wsite-packs">
          <b>Choose a pack</b>
          <div className="rnc-wsite-packlist">
            {packs.map((p, i) => <span key={i} className="rnc-wsite-pack"><span>{p.label}{p.note ? <small>{p.note}</small> : null}</span><b>{p.price}</b></span>)}
          </div>
          {badge && 'province' in badge ? <LicenceBadge className="rnc-wsite-licence" variant="compact" province={badge.province} number={badge.number} licences={badge.licences} />
            : licence ? <small className="rnc-wsite-licence"><Icon name="check" size={14} />{licence}</small> : null}
        </div>
      ) : null}
      {dates?.length ? (
        <section className="rnc-wsite-section">
          <h4>Important dates</h4>
          <ol className="rnc-wsite-dates">{dates.map((d, i) => <li key={i}><b>{d.when}</b><span>{d.what}</span></li>)}</ol>
        </section>
      ) : null}
      {prizes?.length ? (
        <section className="rnc-wsite-section">
          <h4>Prizes</h4>
          <ul className="rnc-wsite-prizes">
            {prizes.map((p, i) => (
              <li key={i} className="rnc-wsite-prize">
                <span className="rnc-wsite-prize-media">{p.image ? <img src={p.image} alt="" /> : <Icon name="gift" size={36} />}</span>
                <span className="rnc-wsite-prize-main">{p.value ? <b>{p.value}</b> : null}<span className="rnc-wsite-prize-title">{p.title}</span></span>
                {p.sponsor ? (
                  <span className="rnc-wsite-prize-sponsor">
                    <small>Sponsored by</small>
                    {p.sponsor.logo ? <img src={p.sponsor.logo} alt="" /> : null}
                    <span>{p.sponsor.name}</span>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {cause || causeMedia ? (
        <section className="rnc-wsite-section is-tint">
          <h4>Where the money goes</h4>
          <div className={cx('rnc-wsite-causeg', causeMedia && 'has-media')}>
            {cause ? <div className="rnc-wsite-cause">{cause}</div> : null}
            {causeMedia ? (
              <figure className="rnc-wsite-cause-media">
                {causeMedia.kind === 'video'
                  ? <video src={causeMedia.src} controls muted playsInline preload="metadata" aria-label={causeMedia.alt || 'Video about the cause'} />
                  : <img src={causeMedia.src} alt={causeMedia.alt ?? ''} />}
              </figure>
            ) : null}
          </div>
        </section>
      ) : null}
      {tiers.length ? (
        <section className="rnc-wsite-section rnc-wsite-thanks">
          <h4>Thank you to our sponsors</h4>
          {tiers.map((tier, t) => (
            <div key={t} className="rnc-wsite-tier">
              {tier.name ? <h5>{tier.name}</h5> : null}
              {/* Sizes by order, as on the site: the first tier large, the second medium, the rest small (one plain row: medium). */}
              <ul className={cx('rnc-wsite-sponsors', `is-${tier.name == null ? 'md' : (['lg', 'md'][t] ?? 'sm')}`)}>
                {tier.sponsors.map((s, i) => <li key={i}><img src={s.logo} alt="" /></li>)}
              </ul>
            </div>
          ))}
        </section>
      ) : null}
      <div className="rnc-wsite-trust">
        {badge && 'province' in badge ? <LicenceBadge province={badge.province} number={badge.number} licences={badge.licences} heading="p" />
          : badge ? <VerifiedBadge regulator={badge.regulator} licence={badge.licence} rng={badge.rng} />
          : licence ? <span className="rnc-wsite-licensed"><Icon name="check-circle" size={18} />Licensed raffle<small>{licence}</small></span> : null}
        <small><b>19+ to play.</b> Know your limit, play within it.</small>
      </div>
      <div className="rnc-wsite-foot">
        {org ? <span>{org}</span> : null}
        {socials?.length ? <span className="rnc-wsite-socials">{socials.map((s, i) => <span key={i}>{s.label}</span>)}</span> : null}
        <small>Powered by Raffle Nexus</small>
      </div>
    </div>
  );
}
