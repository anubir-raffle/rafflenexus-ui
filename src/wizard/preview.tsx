import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { SegmentedControl } from '../components/Segmented';
import { Icon } from '../components/Icon';
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
  /** Default "Updates as you type". */
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
  url, label = 'Live preview', hint = 'Updates as you type', device, defaultDevice = 'desktop', onDeviceChange, devices = true,
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
export interface WizardSitePrize { title: ReactNode; value?: ReactNode }

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
  /** The client's colours: the hero and the buttons. */
  colour?: string;
  accent?: string;
  /** The first slide: the hero's photo. */
  image?: string;
  /** Every slide; the first one shows, with a progress bar for each. */
  slides?: string[];
  /** The packs in "Choose a pack". */
  packs?: WizardSitePack[];
  /** "Important dates", in order. */
  dates?: WizardSiteDate[];
  prizes?: WizardSitePrize[];
  /** The licence line, e.g. "BC Gaming Event Licence #000000". */
  licence?: ReactNode;
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
  org, logo, logoAlt = '', heading, subheading, cause, colour, accent, image, slides, packs, dates, prizes, licence,
  cta = 'Order tickets', emptyHeading = 'Add a main heading',
}: WizardSitePreviewProps) {
  const device = usePreviewDevice();
  const photos = slides?.length ? slides : image ? [image] : [];
  const style = {
    ...(colour ? { ['--site-colour' as string]: colour } : {}),
    ...(accent ? { ['--site-accent' as string]: accent } : {}),
  };
  const empty = heading == null || heading === '';
  return (
    <div className={cx('rnc-wsite', `is-${device}`)} style={style}>
      <div className="rnc-wsite-hero" style={photos[0] ? { ['--site-photo' as string]: `url("${photos[0]}")` } : undefined}>
        <div className="rnc-wsite-head">
          <span className="rnc-wsite-brand">
            {logo ? <img src={logo} alt={logoAlt} /> : null}
            {org && (!logo || device === 'desktop') ? <span>{org}</span> : null}
          </span>
          {device === 'desktop' ? <span className="rnc-wsite-nav"><span>Prizes</span><span>Rules of play</span><span>Winners</span><span>Manage order</span></span> : null}
          <span className="rnc-wsite-btn is-light">{cta}</span>
        </div>
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
          {licence ? <small className="rnc-wsite-licence"><Icon name="check" size={14} />{licence}</small> : null}
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
          <ul className="rnc-wsite-prizes">{prizes.map((p, i) => <li key={i}><span>{p.title}</span>{p.value ? <b>{p.value}</b> : null}</li>)}</ul>
        </section>
      ) : null}
      {cause ? (
        <section className="rnc-wsite-section is-tint">
          <h4>Where the money goes</h4>
          <div className="rnc-wsite-cause">{cause}</div>
        </section>
      ) : null}
      <div className="rnc-wsite-foot">
        {licence ? <span className="rnc-wsite-licensed"><Icon name="check-circle" size={18} />Licensed raffle<small>{licence}</small></span> : null}
        <small>19+ to play. Know your limit, play within it.</small>
        <small>Powered by Raffle Nexus</small>
      </div>
    </div>
  );
}
