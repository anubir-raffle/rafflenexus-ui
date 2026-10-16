import { useRef, useState } from 'react';
import { Field } from 'react-final-form';
import moment, { type Moment } from 'moment';
import {
  Wizard, WizardDeadline, WizardHeader, WizardPreview, WizardReview, WizardSection, WizardSitePreview, WizardToolbar,
  type PreviewDevice, type WizardMutators, type WizardSiteDate, type WizardSiteSponsor,
} from '../src/wizard';
import {
  AnimatedList, BrandColours, Button, SegmentedControl, DomainField, ExpandableRow, Icon, RichText, RichTextArea, Select, SortableList, StatusPill, Switch, TextArea, TextField, UploadTile,
  domainUrl, richTextLength, richTextToPlain, type BrandColourSet, type DomainType, type LicenceProvince,
} from '../src';
import { DatePicker } from '../src/inputs';

// A sample brief, the way the Raffle Builder's setup form holds it. Every name and figure is made up.
type Slide = { id: string; src: string; alt: string };
type Pack = { id: string; name: string; tickets: string; price: string };
/** A licence and the ticket packs it covers (the app's ticket_pack_groups). */
type Licence = {
  id: string; licence_number: string; ticket_packs: Pack[];
  /**
   * Optional: the most tickets the licence lets the raffle sell, or unlimited; '' when not set (Miguel, 2026-10-16: "allow option
   * for unlimited tickets", "set maximum and unlimited should be optional").
   */
  ticket_limit: '' | 'max' | 'unlimited'; tickets_available: string;
};
/** A prize's sponsor (optional): a logo, a name and a line about them. */
type PrizeSponsor = { name: string; logo?: string; description: string };
type Prize = { id: string; title: string; value: string; description: string; image?: string; sponsor: PrizeSponsor };
/** A raffle sponsor: a logo only on the site (Miguel, 2026-10-16), with alt text for people who can't see it. `tier` is a Tier id. */
type Sponsor = { id: string; logo: string; alt: string; tier: string };
type Tier = { id: string; name: string };
/** A photo or a video for the cause, shown beside the cause text on the site. */
type CauseMedia = { kind: 'image' | 'video'; src: string; name: string };
/** The organization's social accounts: the part after the address (the app's support_socials). */
type Presenting = { name: string; logo?: string; label: string };
type Socials = { facebook?: string; instagram?: string; twitter?: string; youtube?: string; linkedin?: string };
type Early = { id: string; date: string; prize: string };
type Brief = {
  name?: string; sub_domain?: string; sub_domain_type: DomainType; heading?: string; subheading?: string; cause?: string; logo?: string; sharing_image?: string; support_email?: string;
  slides: Slide[]; sales_open?: string; sales_close?: string; draw_at?: string; draw_location?: string; early_draws: Early[];
  ticket_pack_groups: Licence[]; prizes: Prize[]; client: { name: string; province: string };
  cause_media?: CauseMedia; support_socials: Socials;
  /** Sponsors, plain or in tiers. */
  sponsors: Sponsor[]; sponsors_tiered: boolean; sponsor_tiers: Tier[];
  /** An optional presenting sponsor beside the raffle's logo: its own logo, its name (the alt text) and the wording before it. */
  presenting: Presenting;
  /** The organization's own rules of play (a PDF). Without it, the standard rules for the province are used. */
  rules?: { name: string; src: string };
  /** The site's colours, picked from the logo (the app's leading_color is the primary). */
  colours: BrandColourSet;
};

const tile = (label: string, a: string, b: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="650" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="650" height="500" fill="url(#g)"/><text x="40" y="440" font-family="Arial" font-weight="700" font-size="44" fill="#fff">${label}</text></svg>`)}`;
/** A made-up sponsor logo: the name set in a box. */
const badge = (name: string, colour: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120"><rect x="4" y="4" width="312" height="112" rx="14" fill="none" stroke="${colour}" stroke-width="6"/><text x="160" y="70" text-anchor="middle" font-family="Arial" font-weight="700" font-size="26" fill="${colour}">${name}</text></svg>`)}`;
/** A made-up logo: a cross in a circle beside the raffle's name. */
const LOGO = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200"><circle cx="100" cy="100" r="84" fill="#0c3f75"/><path d="M84 52h32v32h32v32h-32v32H84v-32H52V84h32z" fill="#ffffff"/><text x="210" y="92" font-family="Arial" font-weight="700" font-size="54" fill="#0c3f75">Sample Hospital</text><text x="212" y="148" font-family="Arial" font-weight="400" font-size="40" fill="#126ab5">Lottery</text></svg>')}`;
/** A made-up picture at any size, for the share image and the cause photo. */
const art = (label: string, w: number, h: number, a: string, b: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><text x="${Math.round(w * 0.06)}" y="${Math.round(h * 0.86)}" font-family="Arial" font-weight="700" font-size="${Math.round(h * 0.09)}" fill="#fff">${label}</text></svg>`)}`;
let seq = 100;
const uid = (p: string) => `${p}-${++seq}`;
const money = (v: string) => { const n = Number(String(v).replace(/[^0-9.]/g, '')); return n ? `$${n.toLocaleString('en-CA')}` : '$0'; };
/** Dates are stored the app's way ("YYYY-MM-DD HH:mm:ss") and shown in words. */
const when = (v?: string) => (v ? moment(v).format('MMM D, YYYY, h:mm A') : '');
const day = (v?: string) => (v ? moment(v) : null);

// Character limits, from the app's validation where it has one (name 5 to 80, cause 30 to 1500).
/**
 * Character limits sized to where the text lands on the site, so nothing breaks the layout (Miguel, 2026-10-16: "too many
 * characters would make the layout weird"). Measured on the preview at 1280 and 390 wide.
 */
const LIMIT = {
  name: 60, //         the browser tab and search results cut longer titles
  heading: 60, //      the hero heading: three lines on a desktop, four on a phone
  subheading: 100, //  two or three lines under the heading
  cause: 800, //       stays beside the cause photo instead of running far below it
  alt: 125, //         what screen readers read out comfortably in one go
  sponsor: 60, //      a sponsor's name (a logo's alt text, the prize and presenting sponsor)
  location: 40, //     the last stop on the dates timeline
  licence: 20, //      as printed on the licence
  pack: 24, //         the small line in a pack card, two or three cards across
  prize: 50, //        one line beside the prize's value
  prizeText: 600, //   the prizes page, beside the prize's picture
  sponsorText: 120, // "one or two lines" with the prize
  tier: 30, //         the heading over a tier's logos
  wording: 24, //      small text in the header, before the presenting sponsor's logo
  earlyPrize: 30, //   a stop on the dates timeline, three or four across
  social: 60, //       an account name or address
};

const START: Brief = {
  name: 'Sample Hospital Lottery', sub_domain: 'samplehospital', sub_domain_type: 'rn', heading: 'Win a lakeside home and support hospital care',
  subheading: 'Every ticket helps buy equipment for the hospital.',
  cause: '<p>Your ticket funds <strong>new equipment</strong> for the emergency department.</p><ul><li>Two new ultrasound machines</li><li>A quieter, faster triage area</li></ul>',
  support_email: 'lottery@example.org',
  logo: LOGO,
  sharing_image: art('Win a lakeside home', 1200, 630, '#126ab5', '#0c3f75'),
  cause_media: { kind: 'image', src: art('The emergency department', 1600, 1200, '#2f7fa8', '#13324f'), name: 'emergency-department.jpg' },
  slides: [
    { id: 's1', src: tile('Grand prize home', '#126ab5', '#0c3f75'), alt: 'The lakeside grand prize home' },
    { id: 's2', src: tile('Early bird: a new car', '#2b7a3d', '#174a24'), alt: 'The early bird car prize' },
    { id: 's3', src: tile('50/50 jackpot', '#8a6410', '#5a400a'), alt: 'The 50/50 jackpot' },
  ],
  sales_open: '2026-11-02 09:00:00', sales_close: '2026-12-18 23:59:00', draw_at: '2026-12-19 12:00:00', draw_location: 'Foundation office',
  early_draws: [{ id: 'e1', date: '2026-11-20 12:00:00', prize: '$5,000 cash' }],
  ticket_pack_groups: [{
    id: 'g1', licence_number: '000000', ticket_limit: 'max', tickets_available: '100000',
    ticket_packs: [{ id: 'p1', name: 'Single ticket', tickets: '1', price: '25' }, { id: 'p2', name: 'Pack of 3', tickets: '3', price: '60' }],
  }],
  prizes: [
    { id: 'z1', title: 'Lakeside home', value: '1250000', description: '<p>A four-bedroom home by the lake, <em>fully furnished</em>.</p>', image: art('Lakeside home', 1200, 900, '#126ab5', '#0c3f75'),
      sponsor: { name: 'Sample Builders', logo: badge('SAMPLE BUILDERS', '#3b4656'), description: 'Built and furnished by Sample Builders.' } },
    { id: 'z2', title: 'Electric SUV', value: '65000', description: '<p>A new all-electric SUV with three years of charging.</p>', image: art('Electric SUV', 1200, 900, '#2b7a3d', '#174a24'),
      sponsor: { name: 'Sample Motors', logo: badge('SAMPLE MOTORS', '#7e0c20'), description: 'Courtesy of Sample Motors.' } },
    { id: 'z3', title: '$10,000 cash', value: '10000', description: '<p>Paid by cheque within 30 days of the draw.</p>', sponsor: { name: '', description: '' } },
  ],
  support_socials: { facebook: 'samplehospital', instagram: 'samplehospital', twitter: 'samplehospital', youtube: '@samplehospital', linkedin: 'company/samplehospital' },
  sponsors: [
    { id: 'sp1', logo: badge('SAMPLE CREDIT UNION', '#13324f'), alt: 'Sample Credit Union', tier: 't1' },
    { id: 'sp2', logo: badge('SAMPLE MOTORS', '#7e0c20'), alt: 'Sample Motors', tier: 't2' },
    { id: 'sp3', logo: badge('SAMPLE GROCERS', '#2b7a3d'), alt: 'Sample Grocers', tier: 't2' },
    { id: 'sp4', logo: badge('SAMPLE PRINT CO.', '#5a400a'), alt: 'Sample Print Co.', tier: 't3' },
  ],
  sponsors_tiered: true,
  sponsor_tiers: [{ id: 't1', name: 'Gold sponsors' }, { id: 't2', name: 'Silver sponsors' }, { id: 't3', name: 'Bronze sponsors' }],
  presenting: { name: 'Sample Credit Union', logo: badge('SAMPLE CREDIT UNION', '#13324f'), label: 'Presented by' },
  client: { name: 'Sample Hospital Foundation', province: 'BC' },
  colours: { primary: '#0c3f75', secondary: '#13324f', accent: '#126ab5' },
};

const set = (field: string) => (args: unknown[], state: any, utils: any) => utils.changeValue(state, field, () => args[0]); // eslint-disable-line @typescript-eslint/no-explicit-any
const MUTATORS = {
  setSlides: set('slides'), setLicences: set('ticket_pack_groups'), setPrizes: set('prizes'), setEarlyDraws: set('early_draws'),
  setLogo: set('logo'), setSharingImage: set('sharing_image'), setSubDomainType: set('sub_domain_type'), setColours: set('colours'),
  setCauseMedia: set('cause_media'), setSponsors: set('sponsors'), setTiers: set('sponsor_tiers'), setTiered: set('sponsors_tiered'), setRules: set('rules'), setPresenting: set('presenting'),
};

// The app's rules for the web address: a Raffle Nexus name, or a whole domain.
const RN_NAME = /^[a-zA-Z0-9-_]+$/;
const OWN_DOMAIN = /^(?:[a-zA-Z0-9-_]+\.)?[a-zA-Z0-9-_]+\.[a-zA-Z]{2,}$/;
const addressError = (v: Brief) => {
  if (!v.sub_domain) return 'Choose a web address';
  if (v.sub_domain_type === 'rn' && !RN_NAME.test(v.sub_domain)) return 'Use only letters, numbers, hyphens and underscores in the address';
  if (v.sub_domain_type === 'own' && !OWN_DOMAIN.test(v.sub_domain)) return 'Enter a domain like lottery.example.org';
  return undefined;
};
// What a brief has to get right before it can be built. The same rules show under each field (once it's touched or left empty),
// mark the step complete or not, and fill the QA checks and the Review step.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LICENCE_NO = /^[A-Za-z0-9-]{4,20}$/;
const amount = (v: string) => Number(String(v).replace(/[^0-9.]/g, ''));
const past = (v?: string) => !!v && moment(v).isBefore(moment(), 'minute');
const after = (a?: string, b?: string) => !!a && !!b && !moment(a).isAfter(moment(b));
/** One rule set per field, used by the page (its step state) and by the field itself (its message). */
const rules = {
  name: (v?: string) => (!v ? 'Enter the raffle name' : v.trim().length < 5 ? 'Use at least 5 characters for the raffle name' : undefined),
  support_email: (v?: string) => (!v ? 'Enter a support email' : !EMAIL.test(v.trim()) ? 'Enter an email like name@example.org' : undefined),
  sales_open: (v?: string) => (!v ? 'Enter when sales open' : past(v) ? 'Pick a time from now on: sales can’t open in the past' : undefined),
  sales_close: (v?: string, b?: Brief) => (!v ? 'Enter when sales close' : past(v) ? 'Pick a time from now on' : after(v, b?.sales_open) ? 'Sales must close after they open' : undefined),
  draw_at: (v?: string, b?: Brief) => (!v ? 'Enter the draw date' : past(v) ? 'Pick a time from now on' : after(v, b?.sales_close) ? 'The draw must come after sales close' : undefined),
  draw_location: (v?: string) => (!v?.trim() ? 'Enter where the draw happens' : undefined),
  licence: (v: string) => (!v ? 'Enter the licence number' : !LICENCE_NO.test(v) ? 'Use 4 to 20 letters, numbers or hyphens, as on the licence' : undefined),
  price: (v: string) => (!v ? 'Enter the price' : !(amount(v) > 0) ? 'Enter a price above $0' : undefined),
  tickets: (v: string) => (!v ? 'Enter how many tickets' : !/^\d+$/.test(v) || Number(v) < 1 ? 'Enter a whole number, 1 or more' : undefined),
  value: (v: string) => (!v ? "Enter the prize's value" : !(amount(v) > 0) ? 'Enter a value above $0' : undefined),
  // Optional: only a maximum that's been typed in is checked.
  ticketsAvailable: (l: Licence) => {
    if (l.ticket_limit !== 'max' || !l.tickets_available) return undefined;
    const most = Math.max(0, ...l.ticket_packs.map((p) => Number(p.tickets) || 0));
    return !/^\d+$/.test(l.tickets_available) || Number(l.tickets_available) < 1 ? 'Enter a whole number, 1 or more'
        : Number(l.tickets_available) < most ? `Enter at least ${most.toLocaleString('en-CA')}: your biggest pack has that many tickets` : undefined;
  },
  earlyDate: (v: string, b: Brief) => (!v ? 'Enter the date'
    : past(v) ? 'Pick a time from now on'
      : (b.sales_open && !moment(v).isAfter(moment(b.sales_open))) || (b.sales_close && !moment(v).isBefore(moment(b.sales_close))) ? 'Early draws happen while sales are open' : undefined),
};
// The social networks the app stores (support_socials), with the address each handle goes after.
const SOCIALS: { key: keyof Socials; label: string; host: string; also?: string }[] = [
  { key: 'facebook', label: 'Facebook page', host: 'facebook.com/' },
  { key: 'instagram', label: 'Instagram', host: 'instagram.com/' },
  { key: 'twitter', label: 'X (Twitter)', host: 'x.com/', also: 'twitter.com/' },
  { key: 'youtube', label: 'YouTube channel', host: 'youtube.com/' },
  { key: 'linkedin', label: 'LinkedIn company page', host: 'linkedin.com/' },
];
// The app allows no special characters here; a handle is letters, numbers and . _ - / @ (YouTube's "@name", LinkedIn's "company/name").
const HANDLE = /^[A-Za-z0-9._\-/@]+$/;
/** People paste whole addresses: keep only the part after the network's address. */
const toHandle = (raw: string, s: (typeof SOCIALS)[number]) => {
  let x = raw.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  for (const host of [s.host, s.also].filter(Boolean) as string[]) if (x.toLowerCase().startsWith(host)) x = x.slice(host.length);
  return x.replace(/\/+$/, '');
};
const socialError = (v?: string) => (v && !HANDLE.test(v) ? 'Use just the account name, like the part after the address' : undefined);
const prizeSponsorError = (p: Prize) => ((p.sponsor.logo || p.sponsor.description.trim()) && !p.sponsor.name.trim() ? 'Name the prize sponsor' : undefined);
const errs = {
  website: (v: Brief) => ({
    ...(rules.name(v.name) && { name: rules.name(v.name) }),
    ...(addressError(v) && { sub_domain: addressError(v) }),
    ...(!v.heading?.trim() && { heading: 'Write a main heading' }),
    ...(!richTextLength(v.cause) ? { cause: 'Say what the raffle supports' } : richTextLength(v.cause) < 30 && { cause: 'Write at least 30 characters about the cause' }),
    ...(!v.logo && { logo: 'Add your logo' }),
    ...(rules.support_email(v.support_email) && { support_email: rules.support_email(v.support_email) }),
    ...(SOCIALS.some((x) => socialError(v.support_socials[x.key])) && { socials: 'Fix the social account names' }),
  }),
  sponsors: (v: Brief) => ({
    ...(v.sponsors.some((x) => !x.alt.trim()) && { sponsor_alt: 'Describe every sponsor logo (alt text): usually the sponsor’s name' }),
    ...(v.sponsors_tiered && v.sponsor_tiers.some((t) => !t.name.trim()) && { tier_names: 'Name every tier' }),
    ...(v.sponsors_tiered && v.sponsors.some((x) => !v.sponsor_tiers.some((t) => t.id === x.tier)) && { tier_pick: 'Put every sponsor in a tier' }),
    ...(v.presenting.logo && !v.presenting.name.trim() && { presenting_name: 'Name the presenting sponsor' }),
    ...(v.presenting.logo && !v.presenting.label.trim() && { presenting_label: 'Add the presenting sponsor’s wording, like Presented by' }),
  }),
  slides: (v: Brief) => ({ ...(!v.slides.length && { slides: 'Add at least one slide' }), ...(v.slides.some((s) => !s.alt.trim()) && { slides_alt: 'Describe every slide (alt text)' }) }),
  dates: (v: Brief) => ({
    ...(rules.sales_open(v.sales_open) && { sales_open: rules.sales_open(v.sales_open) }),
    ...(rules.sales_close(v.sales_close, v) && { sales_close: rules.sales_close(v.sales_close, v) }),
    ...(rules.draw_at(v.draw_at, v) && { draw_at: rules.draw_at(v.draw_at, v) }),
    ...(rules.draw_location(v.draw_location) && { draw_location: rules.draw_location(v.draw_location) }),
    ...(v.early_draws.some((d) => rules.earlyDate(d.date, v) || !d.prize.trim()) && { early: 'Give every early draw a prize and a time while sales are open' }),
  }),
  licences: (v: Brief) => {
    const g = v.ticket_pack_groups;
    const packs = g.flatMap((l) => l.ticket_packs);
    const repeats = g.some((l) => new Set(l.ticket_packs.map((p) => p.tickets).filter(Boolean)).size < l.ticket_packs.filter((p) => p.tickets).length);
    const numbers = g.map((l) => l.licence_number).filter(Boolean);
    return {
      ...(!g.length && { licences: 'Add a licence' }),
      ...(g.some((l) => rules.licence(l.licence_number)) && { licence_number: 'Enter every licence number, as on the licence' }),
      ...(new Set(numbers).size < numbers.length && { licence_twice: 'The same licence number is entered twice' }),
      ...(g.some((l) => !l.ticket_packs.length) && { packs: 'Give every licence at least one ticket pack' }),
      ...(g.some((l) => rules.ticketsAvailable(l)) && { tickets_available: 'Check each licence’s maximum tickets' }),
      ...(packs.some((p) => !p.name.trim() || rules.price(p.price) || rules.tickets(p.tickets)) && { pack_fields: 'Give every pack a name, a price above $0 and a whole number of tickets' }),
      ...(repeats && { repeats: 'Two packs in one licence have the same number of tickets' }),
    };
  },
  prizes: (v: Brief) => ({
    ...(!v.prizes.length && { prizes: 'Add a prize' }),
    ...(v.prizes.some((p) => !p.title.trim() || rules.value(p.value)) && { prize_fields: 'Give every prize a title and a value above $0' }),
    ...(v.prizes.some(prizeSponsorError) && { prize_sponsor: 'Name every prize sponsor you added' }),
  }),
};
const messages = (o: Record<string, string | false | undefined>) => Object.values(o).filter(Boolean) as string[];
const grid = (min: number) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`, gap: 16, alignItems: 'start' });
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Text({ name, label, hint, readOnly, id, maxLength, type, inputMode }: { name: string; label: string; hint?: string; readOnly?: boolean; id?: string; maxLength?: number; type?: string; inputMode?: 'email' | 'numeric' | 'text' }) {
  return (
    <Field name={name}>
      {({ input, meta }) => <TextField id={id} label={label} hint={hint} maxLength={maxLength} type={type} inputMode={inputMode} error={meta.error && (meta.touched || input.value === '') ? meta.error : undefined} review={readOnly} {...input} />}
    </Field>
  );
}
/** A field for one item in a list. It edits the item by id through a mutator (like the app's setTicketPacks), so removing or
 *  reordering rows never mixes their values up. Its error shows once someone leaves it empty. */
function ItemText({ id, label, hint, value, onValue, readOnly, required, check, maxLength, inputMode }: { id?: string; label: string; hint?: string; value: string; onValue: (v: string) => void; readOnly?: boolean; required?: string; check?: (v: string) => string | undefined; maxLength?: number; inputMode?: 'numeric' | 'decimal' | 'text' }) {
  const [left, setLeft] = useState(false);
  const problem = check ? check(value) : required && !value.trim() ? required : undefined;
  return <TextField id={id} label={label} hint={hint} value={value} review={readOnly} maxLength={maxLength} inputMode={inputMode} onChange={(e) => onValue(e.target.value)} onBlur={() => setLeft(true)} error={left ? problem : undefined} />;
}
const patch = <T extends { id: string }>(list: T[], id: string, change: Partial<T>) => list.map((x) => (x.id === id ? { ...x, ...change } : x));
/** Focus a field once it exists (after an item is added and its row opens). */
const focusSoon = (id: string) => setTimeout(() => document.getElementById(id)?.focus(), 60);

/** A date picker for react-final-form (the app's /inputs DatePicker), with its error once the field is touched. */
function DateField({ name, label, readOnly, helperText, disableDates }: { name: string; label: string; readOnly?: boolean; helperText?: string; disableDates?: (d: Moment) => boolean }) {
  return (
    <Field name={name}>
      {({ input, meta }) => <DatePicker input={input} meta={meta.touched ? meta : null} label={label} helperText={helperText} disabled={readOnly} disablePast disableDates={disableDates} />}
    </Field>
  );
}

function Slides({ v, m, ro }: { v: Brief; m: WizardMutators; ro: boolean }) {
  return (
    <>
      <WizardSection title="Slides" description="They rotate on your raffle site in this order. Drag a slide by its grip, or use the arrows. Each needs alt text: what it shows, for people who can't see it.">
        <SortableList
          aria-label="Slides" items={v.slides} getKey={(s) => s.id} disabled={ro} itemLabel={(_s, i) => `Slide ${i + 1}`}
          onReorder={(next) => m.setSlides(next)}
          renderItem={(s, t) => (
            <div className="rnc-sort-row">
              {t.grip}
              <span className="rnc-sort-pos" aria-hidden="true">{t.index + 1}</span>
              <ImageSwap kind="slide" src={s.src} name={`slide ${t.index + 1}`} minWidth={650} minHeight={500} disabled={ro || t.index < 0}
                onFile={(url) => m.setSlides(patch(v.slides, s.id, { src: url }))} />
              <div className="rnc-sort-body">
                {t.index > -1 ? (
                  <TextField label={`Alt text for slide ${t.index + 1}`} value={s.alt} review={ro} maxLength={LIMIT.alt} error={s.alt ? undefined : 'Describe what the slide shows'}
                    onChange={(e) => m.setSlides(patch(v.slides, s.id, { alt: e.target.value }))} />
                ) : null}
              </div>
              {t.moves}
              {!ro && t.index > -1 ? <Button variant="ghost" size="sm" iconOnly startIcon="trash" aria-label={`Remove slide ${t.index + 1}`} onClick={() => m.setSlides(v.slides.filter((x) => x.id !== s.id))} /> : null}
            </div>
          )}
        />
      </WizardSection>
      {!ro ? (
        <WizardSection title="Add a slide" size="md">
          <UploadTile label="New slide" hint="1300 × 1000 works best. At least 650 × 500. PNG or JPG." minWidth={650} minHeight={500}
            onFile={(_f, url) => m.setSlides([...v.slides, { id: uid('s'), src: url, alt: '' }])} />
        </WizardSection>
      ) : null}
    </>
  );
}

/** One licence's ticket packs: open a pack to edit it, add or remove packs. */
function Packs({ licence, setPacks, ro }: { licence: Licence; setPacks: (packs: Pack[]) => void; ro: boolean }) {
  const [isOpen, toggle] = useOpenRows();
  const packs = licence.ticket_packs;
  const add = () => { const id = uid('p'); setPacks([...packs, { id, name: '', tickets: '', price: '' }]); toggle(id, true); focusSoon(`${id}-name`); };
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p className="rnc-field-label" style={{ margin: 0 }}>Ticket packs for this licence</p>
      <AnimatedList aria-label={`Ticket packs for licence ${licence.licence_number || 'without a number'}`} items={packs} getKey={(p) => p.id} renderItem={(p, i) => (
        <ExpandableRow
          title={p.name || 'New pack'} meta={p.price ? `${money(p.price)} · ${plural(Number(p.tickets) || 0, 'ticket')}` : 'No price yet'}
          open={isOpen(p.id)} onOpenChange={(o) => toggle(p.id, o)}
          actions={!ro && i > -1 ? <Button variant="ghost" size="sm" iconOnly startIcon="trash" aria-label={`Remove ${p.name || 'this pack'}`} onClick={() => setPacks(packs.filter((x) => x.id !== p.id))} /> : null}
        >
          {i > -1 ? (
            <div style={grid(170)}>
              <ItemText id={`${p.id}-name`} label="Pack name" value={p.name} readOnly={ro} maxLength={LIMIT.pack} required="Name the pack" onValue={(x) => setPacks(patch(packs, p.id, { name: x }))} />
              <ItemText label="Tickets in the pack" value={p.tickets} readOnly={ro} inputMode="numeric" check={(x) => rules.tickets(x) ?? (packs.some((o) => o.id !== p.id && o.tickets && o.tickets === x) ? 'Another pack in this licence has this many tickets' : undefined)} onValue={(x) => setPacks(patch(packs, p.id, { tickets: x.replace(/\D/g, '') }))} />
              <ItemText label="Price ($)" value={p.price} readOnly={ro} inputMode="decimal" check={rules.price} onValue={(x) => setPacks(patch(packs, p.id, { price: x.replace(/[^0-9.]/g, '') }))} />
            </div>
          ) : null}
        </ExpandableRow>
      )} />
      {!ro ? <div><Button variant="secondary" size="sm" startIcon="plus" onClick={add}>Add a ticket pack</Button></div> : null}
    </div>
  );
}

/** Every licence the raffle sells under, each with its own ticket packs. Add a licence; remove one while there's more than one. */
function Licences({ v, m, ro }: { v: Brief; m: WizardMutators; ro: boolean }) {
  const list = v.ticket_pack_groups;
  const add = () => { const id = uid('g'); m.setLicences([...list, { id, licence_number: '', ticket_packs: [], ticket_limit: '', tickets_available: '' }]); focusSoon(`${id}-number`); };
  return (
    <>
      <AnimatedList aria-label="Licences" className="demo-licences" items={list} getKey={(g) => g.id} renderItem={(g, i) => (
        <WizardSection title={i > -1 ? `Licence ${i + 1}` : 'Licence'} description={i === 0 ? 'Your gaming licence from the provincial regulator, and the ticket packs it covers.' : undefined}>
          {i > -1 ? (
            <>
              <div style={grid(240)}>
                <ItemText id={`${g.id}-number`} label="Licence number" hint="As it appears on your licence." value={g.licence_number} readOnly={ro} maxLength={LIMIT.licence}
                  check={(x) => rules.licence(x) ?? (list.some((o) => o.id !== g.id && o.licence_number === x) ? "This licence number is already entered" : undefined)} onValue={(x) => m.setLicences(patch(list, g.id, { licence_number: x }))} />
                {/* A maximum, or unlimited (Miguel, 2026-10-16: "allow option for unlimited tickets", "allow option for max tickets"). */}
                <div style={{ display: 'grid', gap: 10, alignContent: 'start', minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                    <span className="rnc-field-label" id={`${g.id}-cap`}>Tickets for sale <em style={{ fontStyle: 'normal', fontWeight: 400, color: 'var(--ink-muted)' }}>(optional)</em></span>
                    {g.ticket_limit && !ro ? <Button variant="link" size="sm" aria-label={`Clear tickets for sale for licence ${i + 1}`} onClick={() => m.setLicences(patch(list, g.id, { ticket_limit: '', tickets_available: '' }))}>Clear</Button> : null}
                  </span>
                  <SegmentedControl aria-labelledby={`${g.id}-cap`} name={`${g.id}-cap`} disabled={ro} value={g.ticket_limit}
                    options={[{ value: 'max', label: 'Set a maximum' }, { value: 'unlimited', label: 'Unlimited' }]}
                    onChange={(x) => m.setLicences(patch(list, g.id, { ticket_limit: x as Licence['ticket_limit'] }))} />
                  {g.ticket_limit === 'unlimited' ? (
                    <p className="rnc-field-hint" style={{ margin: 0 }}>Sell as many tickets as people buy.</p>
                  ) : g.ticket_limit === 'max' ? (
                    <ItemText label="Maximum tickets (optional)" hint="The most this licence lets you sell." value={g.tickets_available} readOnly={ro} inputMode="numeric"
                      check={() => rules.ticketsAvailable(g)} onValue={(x) => m.setLicences(patch(list, g.id, { tickets_available: x.replace(/[^0-9]/g, '') }))} />
                  ) : null}
                </div>
              </div>
              <Packs licence={g} ro={ro} setPacks={(packs) => m.setLicences(patch(list, g.id, { ticket_packs: packs }))} />
              {!ro && list.length > 1 ? (
                <div><Button variant="danger-ghost" size="sm" startIcon="trash" onClick={() => m.setLicences(list.filter((x) => x.id !== g.id))}>Remove licence {i + 1}</Button></div>
              ) : null}
            </>
          ) : null}
        </WizardSection>
      )} />
      {!ro ? <div style={{ marginTop: 20 }}><Button variant="secondary" startIcon="plus" onClick={add}>Add a licence</Button></div> : null}
    </>
  );
}

function Prizes({ v, m, ro }: { v: Brief; m: WizardMutators; ro: boolean }) {
  const [isOpen, toggle] = useOpenRows();
  const add = () => { const id = uid('z'); m.setPrizes([...v.prizes, { id, title: '', value: '', description: '', sponsor: { name: '', description: '' } }]); toggle(id, true); focusSoon(`${id}-title`); };
  const setSponsor = (p: Prize, change: Partial<PrizeSponsor>) => m.setPrizes(patch(v.prizes, p.id, { sponsor: { ...p.sponsor, ...change } }));
  return (
    <WizardSection title="Prizes for the main draw" description="Drag to set the order they're drawn in. Open a prize to edit it.">
      <SortableList aria-label="Prizes" items={v.prizes} getKey={(p) => p.id} disabled={ro} itemLabel={(p, i) => p.title || `Prize ${i + 1}`} onReorder={(next) => m.setPrizes(next)}
        renderItem={(p, t) => (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ paddingTop: 6 }}>{t.grip}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ExpandableRow
                title={p.title || 'New prize'} meta={p.value ? money(p.value) : 'No value yet'} open={isOpen(p.id)} onOpenChange={(o) => toggle(p.id, o)}
                actions={!ro && t.index > -1 ? <>{t.moves}<Button variant="ghost" size="sm" iconOnly startIcon="trash" aria-label={`Remove ${p.title || 'this prize'}`} onClick={() => m.setPrizes(v.prizes.filter((x) => x.id !== p.id))} /></> : null}
              >
                {t.index > -1 ? (
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div style={grid(220)}>
                      <ItemText id={`${p.id}-title`} label="Prize title" value={p.title} readOnly={ro} maxLength={LIMIT.prize} required="Give the prize a title" onValue={(x) => m.setPrizes(patch(v.prizes, p.id, { title: x }))} />
                      <ItemText label="Value ($)" value={p.value} readOnly={ro} inputMode="decimal" check={rules.value} onValue={(x) => m.setPrizes(patch(v.prizes, p.id, { value: x.replace(/[^0-9.]/g, '') }))} />
                    </div>
                    <UploadTile label="Prize photo (optional)" hint="Shown on the prize's card. 1200 × 900 works best. At least 600 × 450." minWidth={600} minHeight={450}
                      src={p.image} alt={p.title || 'The prize'} disabled={ro} onFile={(_f, url) => m.setPrizes(patch(v.prizes, p.id, { image: url }))} onRemove={() => m.setPrizes(patch(v.prizes, p.id, { image: undefined }))} />
                    <RichTextArea label="Description" hint="What winners get. Shown on the prizes page." value={p.description} review={ro} maxLength={LIMIT.prizeText} minHeight={140}
                      onChange={(html) => m.setPrizes(patch(v.prizes, p.id, { description: html }))} />
                    {/* Optional: the prize's own sponsor, shown as "Sponsored by" on the prize (Miguel, 2026-10-16). */}
                    <fieldset style={{ display: 'grid', gap: 16, margin: 0, padding: 0, border: 0 }}>
                      <legend className="rnc-field-label" style={{ marginBottom: 12 }}>Prize sponsor (optional)</legend>
                      {/* Name and description on one side, the logo on the other, so neither column leaves a gap. */}
                      <div style={grid(220)}>
                        <div style={{ display: 'grid', gap: 16, alignContent: 'start', minWidth: 0 }}>
                          <ItemText label="Sponsor name" value={p.sponsor.name} readOnly={ro} maxLength={LIMIT.sponsor} check={() => prizeSponsorError(p)} onValue={(x) => setSponsor(p, { name: x })} />
                          <TextArea label="About the sponsor" hint="One or two lines, shown with the prize." value={p.sponsor.description} readOnly={ro} maxLength={LIMIT.sponsorText}
                            onChange={(e) => setSponsor(p, { description: e.target.value })} />
                        </div>
                        <UploadTile label="Sponsor logo" hint="At least 400 px wide. PNG or SVG on a clear background." src={p.sponsor.logo} alt={`${p.sponsor.name || 'Sponsor'} logo`} disabled={ro}
                          onFile={(_f, url) => setSponsor(p, { logo: url })} onRemove={() => setSponsor(p, { logo: undefined })} />
                      </div>
                    </fieldset>
                  </div>
                ) : null}
              </ExpandableRow>
            </div>
          </div>
        )}
      />
      {!ro ? <div><Button variant="secondary" startIcon="plus" onClick={add}>Add a prize to this draw</Button></div> : null}
    </WizardSection>
  );
}

/**
 * Which expandable rows are open. Each opens and closes on its own: opening one doesn't fold another away above it, which would
 * move the row people just clicked (Miguel, 2026-10-16: "the prize click to expand jumps too much").
 */
function useOpenRows() {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string, on: boolean) => setOpen((o) => { const n = new Set(o); if (on) n.add(id); else n.delete(id); return n; });
  return [(id: string) => open.has(id), toggle] as const;
}

/**
 * A row's picture (a sponsor logo or a slide). Click it (or Enter / Space) to pick a new image; "Replace" fades in over it on
 * hover and focus (Miguel, 2026-10-16). The row keeps everything else. A slide is checked against its minimum size.
 */
function ImageSwap({ src, name, kind = 'logo', minWidth, minHeight, disabled, onFile }: {
  src: string; name: string; kind?: 'logo' | 'slide'; minWidth?: number; minHeight?: number; disabled?: boolean; onFile: (url: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState('');
  const take = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result);
      if (!minWidth && !minHeight) { setProblem(''); onFile(url); return; }
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        if ((minWidth && w < minWidth) || (minHeight && h < minHeight)) { setProblem(`That image is ${w} × ${h}. Use one at least ${minWidth ?? 0} × ${minHeight ?? 0}.`); return; }
        setProblem(''); onFile(url);
      };
      img.src = url;
    };
    r.readAsDataURL(file);
  };
  const cls = `demo-swap is-${kind}`;
  if (disabled) return <span className={`${cls} is-static`}><img src={src} alt="" /></span>;
  return (
    <span className="demo-swap-wrap">
      <button type="button" className={cls} aria-label={`Replace ${name}`} onClick={() => input.current?.click()}>
        <img src={src} alt="" />
        <span className="demo-swap-label" aria-hidden="true"><Icon name="upload-simple" size={16} />Replace</span>
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
      <span className="demo-swap-error" role="alert">{problem}</span>
    </span>
  );
}

/**
 * The raffle's sponsors: logos only, with alt text; in tiers or one list; one of them may be shown beside the raffle's logo.
 * In tiers, each tier is its own group (Miguel, 2026-10-16: "organize that more intuitively"): its name, its logos in order, and its
 * own upload. A logo changes tier from its row. The stored list follows the tiers' order, so the site shows what the form shows.
 */
function Sponsors({ v, m, ro }: { v: Brief; m: WizardMutators; ro: boolean }) {
  const tiers = v.sponsor_tiers;
  const tierName = (t: Tier, i: number) => t.name.trim() || `Tier ${i + 1}`;
  const byTier = (list: Sponsor[], order: Tier[] = tiers) => [...order.flatMap((t) => list.filter((x) => x.tier === t.id)), ...list.filter((x) => !order.some((t) => t.id === x.tier))];
  const add = (url: string, tier = '') => m.setSponsors(byTier([...v.sponsors, { id: uid('sp'), logo: url, alt: '', tier }]));
  const moveTo = (x: Sponsor, tier: string) => m.setSponsors(byTier([...v.sponsors.filter((o) => o.id !== x.id), { ...x, tier }]));
  const reorderIn = (tier: string, next: Sponsor[]) => m.setSponsors(byTier([...v.sponsors.filter((x) => x.tier !== tier), ...next]));
  const setTiered = (on: boolean) => {
    m.setTiered(on);
    if (!on) return;
    let order = tiers;
    if (!order.length) { order = [{ id: uid('t'), name: '' }]; m.setTiers(order); }
    m.setSponsors(byTier(v.sponsors.map((x) => (order.some((t) => t.id === x.tier) ? x : { ...x, tier: order[0].id })), order));
  };
  const addTier = () => { const id = uid('t'); m.setTiers([...tiers, { id, name: '' }]); focusSoon(`${id}-name`); };
  // A removed tier's logos join the tier above it (or the next one, for the first tier).
  const removeTier = (t: Tier, i: number) => {
    const rest = tiers.filter((x) => x.id !== t.id); const into = rest[Math.max(0, i - 1)];
    m.setTiers(rest); m.setSponsors(byTier(v.sponsors.map((x) => (x.tier === t.id ? { ...x, tier: into.id } : x)), rest));
  };

  // Without tiers the logos sit two to a row (Miguel, 2026-10-16); dragging needs one column, so there the arrows reorder them.
  const logos = (list: Sponsor[], label: string, onReorder: (next: Sponsor[]) => void, columns = false) => (
    <SortableList aria-label={label} items={list} className={columns ? 'demo-logo-grid' : undefined} getKey={(x) => x.id} disabled={ro} itemLabel={(x, i) => x.alt || `Logo ${i + 1}`} onReorder={onReorder}
      renderItem={(x, t) => (
        // Two lines, so the row isn't cramped beside the preview: the logo and the row's buttons, then the fields at full width.
        <div className="rnc-sort-row" style={{ flexWrap: 'wrap', rowGap: 12 }}>
          {columns ? null : t.grip}
          <ImageSwap src={x.logo} name={`the ${x.alt || `logo ${t.index + 1}`} logo`} disabled={ro || t.index < 0} onFile={(url) => m.setSponsors(patch(v.sponsors, x.id, { logo: url }))} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            {t.moves}
            {!ro && t.index > -1 ? <Button variant="ghost" size="sm" iconOnly startIcon="trash" aria-label={`Remove ${x.alt || `logo ${t.index + 1}`}`} onClick={() => m.setSponsors(v.sponsors.filter((o) => o.id !== x.id))} /> : null}
          </span>
          {t.index > -1 ? (
            <div className="rnc-sort-body" style={{ order: 10, flex: '1 1 100%' }}>
              <div style={grid(200)}>
                <TextField label={`Alt text for logo ${t.index + 1}`} value={x.alt} review={ro} maxLength={LIMIT.sponsor} error={x.alt ? undefined : 'Describe the logo (the sponsor’s name)'}
                  onChange={(e) => m.setSponsors(patch(v.sponsors, x.id, { alt: e.target.value }))} />
                {v.sponsors_tiered && tiers.length > 1 ? (
                  <Select label="Tier" value={x.tier} disabled={ro} options={tiers.map((tt, n) => ({ value: tt.id, label: tierName(tt, n) }))} onChange={(e) => moveTo(x, e.target.value)} />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    />
  );
  const upload = (label: string, tier?: string) => (ro ? null : <UploadTile label={label} hint="At least 400 px wide. PNG or SVG on a clear background." onFile={(_f, url) => add(url, tier)} />);

  return (
    <>
      <WizardSection title="Sponsor logos" description="Shown on your raffle site under “Thank you to our sponsors”. Logos only, in the order here. Give each logo alt text: usually the sponsor’s name.">
        <Switch label="Group sponsors into tiers" checked={v.sponsors_tiered} disabled={ro} onChange={setTiered} />
        {v.sponsors_tiered ? (
          <>
            <p className="rnc-field-hint" style={{ margin: 0 }}>Biggest tier first. The site shows bigger logos for higher tiers.</p>
            <SortableList aria-label="Sponsor tiers" items={tiers} getKey={(t) => t.id} disabled={ro} itemLabel={(t, i) => tierName(t, i)}
              onReorder={(next) => { m.setTiers(next); m.setSponsors(byTier(v.sponsors, next)); }}
              renderItem={(t, tt) => {
                const list = v.sponsors.filter((x) => x.tier === t.id);
                const name = tierName(t, Math.max(0, tt.index));
                return (
                  <section aria-label={name} style={{ display: 'grid', gap: 16, padding: 'clamp(12px, 2vw, 18px)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--ground)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {tt.grip}
                      <strong style={{ flex: 1, minWidth: 0, font: '600 15px/1.3 var(--font-sans)', color: 'var(--ink)' }}>
                        {name}<span style={{ fontWeight: 400, color: 'var(--ink-muted)' }}> · {plural(list.length, 'logo')}</span>
                      </strong>
                      {tt.moves}
                      {!ro && tt.index > -1 && tiers.length > 1 ? (
                        <Button variant="ghost" size="sm" iconOnly startIcon="trash" aria-label={`Remove the ${name} tier (its logos move to ${tierName(tiers[tt.index === 0 ? 1 : tt.index - 1], tt.index === 0 ? 1 : tt.index - 1)})`}
                          onClick={() => removeTier(t, tt.index)} />
                      ) : null}
                    </div>
                    {tt.index > -1 ? (
                      <>
                        <ItemText id={`${t.id}-name`} label="Tier name" value={t.name} readOnly={ro} maxLength={LIMIT.tier} required="Name the tier" onValue={(x) => m.setTiers(patch(tiers, t.id, { name: x }))} />
                        {list.length ? logos(list, `${name} logos`, (next) => reorderIn(t.id, next)) : <p className="rnc-field-hint" style={{ margin: 0 }}>No logos in this tier yet.</p>}
                        {upload(`Add a logo to ${name}`, t.id)}
                      </>
                    ) : null}
                  </section>
                );
              }}
            />
            {!ro ? <div><Button variant="secondary" size="sm" startIcon="plus" onClick={addTier}>Add a tier</Button></div> : null}
          </>
        ) : (
          <>
            {v.sponsors.length ? logos(v.sponsors, 'Sponsor logos', (next) => m.setSponsors(next), true) : null}
            {upload('Add a sponsor logo')}
          </>
        )}
      </WizardSection>
      {/* Its own logo and wording, not one of the logos above (Miguel, 2026-10-16: "they should be able to upload a logo and change the text"). */}
      <WizardSection title="Presenting sponsor" size="md" description="Optional. Shown beside your logo at the top of every page, after your own wording.">
        <div style={grid(220)}>
          <div style={{ display: 'grid', gap: 16, alignContent: 'start', minWidth: 0 }}>
            <TextField label="Wording" hint="Shown before the logo. For example Presented by or Brought to you by." value={v.presenting.label} review={ro} maxLength={LIMIT.wording}
              error={v.presenting.logo && !v.presenting.label.trim() ? 'Add the wording, like Presented by' : undefined}
              onChange={(e) => m.setPresenting({ ...v.presenting, label: e.target.value })} />
            <TextField label="Sponsor name" hint="Read out in place of the logo for people who can’t see it." value={v.presenting.name} review={ro} maxLength={LIMIT.sponsor}
              error={v.presenting.logo && !v.presenting.name.trim() ? 'Name the presenting sponsor' : undefined}
              onChange={(e) => m.setPresenting({ ...v.presenting, name: e.target.value })} />
          </div>
          <UploadTile label="Presenting sponsor logo" hint="At least 400 px wide. PNG or SVG on a clear background." src={v.presenting.logo} alt={`${v.presenting.name || 'Presenting sponsor'} logo`} disabled={ro}
            onFile={(_f, url) => m.setPresenting({ ...v.presenting, logo: url })} onRemove={() => m.setPresenting({ ...v.presenting, logo: undefined })} />
        </div>
      </WizardSection>
    </>
  );
}

function EarlyDraws({ v, m, ro }: { v: Brief; m: WizardMutators; ro: boolean }) {
  const add = () => { const id = uid('e'); m.setEarlyDraws([...v.early_draws, { id, date: '', prize: '' }]); };
  const outside = (d: Moment) => (!!v.sales_open && d.isBefore(moment(v.sales_open), 'day')) || (!!v.sales_close && d.isAfter(moment(v.sales_close), 'day'));
  return (
    <WizardSection title="Early draws" size="md" description="Extra draws while sales are open, each with its own prize.">
      <AnimatedList aria-label="Early draws" items={v.early_draws} getKey={(d) => d.id} renderItem={(d, i) => (
        <div className="rnc-sort-row" style={{ alignItems: 'flex-start' }}>
          <span className="rnc-sort-pos" aria-hidden="true" style={{ marginTop: 36 }}>{i > -1 ? i + 1 : ''}</span>
          <div className="rnc-sort-body" style={{ ...grid(220), gap: 12 }}>
            {i > -1 ? (
              <>
                <DatePicker label={`Early draw ${i + 1}`} disabled={ro} disablePast disableDates={outside}
                  meta={d.date && rules.earlyDate(d.date, v) ? { error: rules.earlyDate(d.date, v), touched: true } : null}
                  input={{ name: `early-${d.id}`, value: d.date, onChange: (x: string | null) => m.setEarlyDraws(patch(v.early_draws, d.id, { date: x ?? '' })) }} />
                <ItemText label="Prize" value={d.prize} readOnly={ro} maxLength={LIMIT.earlyPrize} required="Enter the prize" onValue={(x) => m.setEarlyDraws(patch(v.early_draws, d.id, { prize: x }))} />
              </>
            ) : null}
          </div>
          {!ro && i > -1 ? <Button variant="ghost" size="sm" iconOnly startIcon="trash" aria-label={`Remove early draw ${i + 1}`} style={{ marginTop: 32 }} onClick={() => m.setEarlyDraws(v.early_draws.filter((x) => x.id !== d.id))} /> : null}
        </div>
      )} />
      {!ro ? <div><Button variant="secondary" startIcon="plus" onClick={add}>Add an early draw</Button></div> : null}
    </WizardSection>
  );
}

const address = (v: Brief) => (v.sub_domain ? domainUrl(v.sub_domain_type, v.sub_domain).replace('https://', '') : '');

/** Everything the raffle site shows, from the brief so far. */
function SitePreview({ v, device, onDevice }: { v: Brief; device: PreviewDevice; onDevice: (d: PreviewDevice) => void }) {
  const first = v.ticket_pack_groups[0];
  const dates = [
    v.sales_open ? { at: v.sales_open, what: 'Sales open' } : null,
    ...v.early_draws.filter((d) => d.date).map((d, i) => ({ at: d.date, what: `Early draw ${i + 1}${d.prize ? `: ${d.prize}` : ''}` })),
    v.sales_close ? { at: v.sales_close, what: 'Sales close' } : null,
    v.draw_at ? { at: v.draw_at, what: `Main draw${v.draw_location ? `, ${v.draw_location}` : ''}` } : null,
  ].filter(Boolean).sort((a, b) => moment(a!.at).valueOf() - moment(b!.at).valueOf()).map((d): WizardSiteDate => ({ when: when(d!.at), what: d!.what }));
  const numbers = v.ticket_pack_groups.map((g) => g.licence_number).filter(Boolean);
  const logo = (x: Sponsor): WizardSiteSponsor => ({ name: x.alt, logo: x.logo });
  return (
    <WizardPreview url={address(v) || 'your-raffle.rafflenexus.com'} device={device} onDeviceChange={onDevice}>
      <WizardSitePreview
        org={v.client.name} logo={v.logo} logoAlt={`${v.client.name} logo`} heading={v.heading} subheading={v.subheading}
        cause={richTextLength(v.cause) ? <RichText html={v.cause} /> : undefined} colour={v.colours.primary} secondary={v.colours.secondary} accent={v.colours.accent}
        slides={v.slides.map((s) => s.src)}
        packs={(first?.ticket_packs ?? []).filter((p) => p.price).map((p) => ({ label: plural(Number(p.tickets) || 0, 'ticket'), note: p.name, price: money(p.price) }))}
        dates={dates}
        prizes={v.prizes.filter((p) => p.title).map((p) => ({ title: p.title, value: p.value ? money(p.value) : undefined, image: p.image, sponsor: p.sponsor.name || p.sponsor.logo ? { name: p.sponsor.name, logo: p.sponsor.logo } : undefined }))}
        causeMedia={v.cause_media ? { kind: v.cause_media.kind, src: v.cause_media.src } : undefined}
        sponsor={v.presenting.logo ? { name: v.presenting.name, logo: v.presenting.logo, label: v.presenting.label.trim() || 'Presented by' } : undefined}
        sponsors={v.sponsors_tiered ? { tiers: v.sponsor_tiers.map((t) => ({ name: t.name, sponsors: v.sponsors.filter((x) => x.tier === t.id).map(logo) })) } : v.sponsors.map(logo)}
        socials={SOCIALS.filter((x) => v.support_socials[x.key]).map((x) => ({ label: x.label.split(' ')[0], href: `https://${x.host}${v.support_socials[x.key]}` }))}
        licence={numbers.length ? `${v.client.province} Gaming Event Licence #${numbers.join(', #')}` : undefined}
        badge={numbers.length ? { province: v.client.province as LicenceProvince, licences: numbers.map((n) => ({ number: n })) } : undefined}
      />
    </WizardPreview>
  );
}

/** The Raffle Builder's setup form with every step built out: uploads, a sortable slideshow, licences with their ticket packs, prizes to add, open and remove, and a review. */
export function WizardDemo() {
  const [mode, setMode] = useState<'normal' | 'qa' | 'readonly'>('normal');
  // Testing only: open Review and submit before every step is complete (Miguel, 2026-10-16).
  const [earlyReview, setEarlyReview] = useState(false);
  const [layout, setLayout] = useState<'v1' | 'v2'>('v2');
  // Phones start on the phone preview
  const [device, setDevice] = useState<PreviewDevice>(() => (typeof window !== 'undefined' && window.innerWidth < 720 ? 'mobile' : 'desktop'));
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const save = () => { setSaving(true); clearTimeout(timer.current); timer.current = setTimeout(() => setSaving(false), 700); };
  const ro = mode === 'readonly';
  const checks = (v: Brief) => [
    ['Web address, heading, cause and logo set', !messages(errs.website(v)).length],
    ['Every slide has alt text', !messages(errs.slides(v)).length],
    ['Sales close and the draw date set', !messages(errs.dates(v)).length],
    ['Every licence has a number and priced packs', !messages(errs.licences(v)).length],
    ['Every prize has a title and a value', !messages(errs.prizes(v)).length],
    ['Every sponsor logo has alt text', !messages(errs.sponsors(v)).length],
  ] as const;
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="rnc-row">
        {(['v2', 'v1'] as const).map((l) => (
          <button key={l} type="button" className="rnc-btn rnc-btn-secondary rnc-btn-sm" aria-pressed={layout === l} onClick={() => setLayout(l)}>{l === 'v2' ? 'V2 (Raffle Builder)' : 'V1 (card)'}</button>
        ))}
        <span style={{ width: 12 }} />
        {(['normal', 'qa', 'readonly'] as const).map((m) => (
          <button key={m} type="button" className="rnc-btn rnc-btn-secondary rnc-btn-sm" aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m === 'normal' ? 'Normal' : m === 'qa' ? 'QA mode (status 2)' : 'Read-only'}
          </button>
        ))}
        <span style={{ width: 12 }} />
        <button type="button" className="rnc-btn rnc-btn-secondary rnc-btn-sm" aria-pressed={earlyReview} onClick={() => setEarlyReview((x) => !x)}>Open Review early (testing)</button>
        <span className="rnc-field-hint">{submitted}</span>
      </div>
      <Wizard<Brief>
        key={mode + layout}
        layout={layout}
        initialValues={START}
        mutators={MUTATORS}
        onSubmit={(v) => setSubmitted(`onSubmit called for ${v.name}`)}
        onSave={save}
        isSaving={saving}
        lastSaved="just now"
        disabledAll={ro}
        isQaPage={mode === 'qa'}
        reviewUnlocked={earlyReview}
        celebrate
        briefStatus={mode === 'qa' ? 2 : 1}
        toolbar={(v) => (
          <WizardToolbar back="#" crumb={<>Raffles / <b>{v.name}</b></>}
            status={<StatusPill tone="review">{mode === 'qa' ? 'In QA' : 'Ready for QA'}</StatusPill>}
            actions={<><Button variant="secondary" size="sm">Download images</Button><Button variant="secondary" size="sm">{ro ? 'Unlock editing' : 'Lock editing'}</Button></>} />
        )}
        header={(v) => <WizardHeader title={v.name} subtitle={v.client.name} logo={v.logo} logoAlt={`${v.client.name} logo`} />}
        notice={() => <WizardDeadline date="October 20, 2026" />}
        aside={(v) => (
          <>
            <p style={{ margin: 0, font: '600 13px/1.3 var(--font-sans)', color: 'var(--ink)' }}>QA checks</p>
            {checks(v).map(([t, ok]) => (
              <span key={t} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: 'var(--ink-body)' }}>
                <Icon name={ok ? 'check-circle' : 'x-circle'} size={16} style={{ color: ok ? 'var(--verified)' : 'var(--error)', flex: 'none', marginTop: 2 }} />{t}
              </span>
            ))}
          </>
        )}
        preview={(v, step) => (/^(Review|Rules)/.test(step.label) ? null : <SitePreview v={v} device={device} onDevice={setDevice} />)}
      >
        <Wizard.Page label="Website" summary={(v) => address(v) || 'Web address missing'} description="We use this to build your raffle site and help it show up in search." validate={errs.website}>
          {(m, v) => (
            <>
              <WizardSection title="Name and address">
                <Text name="name" label="Raffle name" maxLength={LIMIT.name} readOnly={ro} />
                <Field name="sub_domain">
                  {({ input, meta }) => (
                    <DomainField label="Web address" type={v.sub_domain_type} onTypeChange={(t) => m.setSubDomainType(t)}
                      value={input.value ?? ''} onChange={input.onChange} onBlur={input.onBlur} review={ro}
                      error={meta.error && (meta.touched || !input.value) ? meta.error : undefined} />
                  )}
                </Field>
              </WizardSection>
              <WizardSection title="Headline and story" description="The top of your raffle site.">
                <Text name="heading" label="Main heading" maxLength={LIMIT.heading} readOnly={ro} />
                <Text name="subheading" label="Subheading" maxLength={LIMIT.subheading} readOnly={ro} />
                <Field name="cause">
                  {({ input, meta }) => (
                    <RichTextArea label="The cause" hint="What the raffle supports, in a few short paragraphs or a list. At least 30 characters." maxLength={LIMIT.cause}
                      value={input.value} onChange={input.onChange} onBlur={input.onBlur} review={ro} minHeight={200}
                      error={meta.error && (meta.touched || !richTextLength(input.value)) ? meta.error : undefined} />
                  )}
                </Field>
                {/* Optional: shown beside the cause text on the site (Miguel, 2026-10-16). */}
                <UploadTile label="Cause photo or video (optional)" hint="Shown beside the cause. A photo at 1600 × 1200 (at least 800 × 600) or a short video in MP4 or WebM up to 50 MB."
                  accept="image/*,video/mp4,video/webm" minWidth={800} minHeight={600} maxBytes={50 * 1024 * 1024} src={v.cause_media?.src} kind={v.cause_media?.kind} preview="lg" alt="The cause photo" disabled={ro}
                  onFile={(f, url) => m.setCauseMedia({ kind: f.type.startsWith('video/') ? 'video' : 'image', src: url, name: f.name })} onRemove={() => m.setCauseMedia(undefined)} />
              </WizardSection>
              <WizardSection title="Branding" description="Your logo, the image shown when the site is shared, and the site's colours.">
                <div style={{ ...grid(200), alignItems: 'stretch' }}>
                  <UploadTile label="Logo" hint="At least 600 px wide. PNG or SVG on a clear background." src={v.logo} alt="Your logo" disabled={ro} error={v.logo ? undefined : 'Add your logo'}
                    onFile={(_f, url) => m.setLogo(url)} onRemove={() => m.setLogo(undefined)} />
                  <UploadTile label="Social share image" hint="Shown when the site is shared. 1200 × 630 works best. At least 600 × 315." minWidth={600} minHeight={315} src={v.sharing_image} alt="Social share image" disabled={ro}
                    onFile={(_f, url) => m.setSharingImage(url)} onRemove={() => m.setSharingImage(undefined)} />
                </div>
                <BrandColours value={v.colours} onChange={(c) => m.setColours(c)} logo={v.logo} review={ro}
                  hint="We pick these from your logo when you add it. Select a swatch or type a hex value to change one." />
              </WizardSection>
              <WizardSection title="Support contact" description="Shown on your site so buyers can reach you.">
                <Text name="support_email" label="Support email" type="email" inputMode="email" readOnly={ro} />
              </WizardSection>
              <WizardSection title="Social media (optional)" description="Linked in your site's footer. Enter the account name, or paste the whole address.">
                {/* One account per row (Miguel, 2026-10-16: "display as a list"). */}
                <div style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
                  {SOCIALS.map((x) => (
                    <Field key={x.key} name={`support_socials.${x.key}`} parse={(raw: string) => toHandle(raw ?? '', x)} validate={socialError}>
                      {({ input, meta }) => <TextField label={x.label} hint={`${x.host}your-account`} review={ro} maxLength={LIMIT.social} {...input} value={input.value ?? ''}
                        error={meta.error && meta.touched ? meta.error : undefined} />}
                    </Field>
                  ))}
                </div>
              </WizardSection>
            </>
          )}
        </Wizard.Page>
        <Wizard.Page label="Slideshow" summary={(v) => plural(v.slides.length, 'slide')} description="These slides rotate on your raffle site." validate={errs.slides}>
          {(m, v) => <Slides v={v} m={m} ro={ro} />}
        </Wizard.Page>
        <Wizard.Page label="Dates" summary={(v) => (v.draw_at ? `Draw ${moment(v.draw_at).format('MMM D')}` : 'Draw date missing')} description="When ticket sales open and close, and when the draws happen." validate={errs.dates}>
          {(m, v) => (
            <>
              <WizardSection title="Ticket sales" description="All dates and times are in Pacific time, local to British Columbia.">
                <div style={grid(240)}>
                  <DateField name="sales_open" label="Sales open" readOnly={ro} disableDates={(d) => !!v.sales_close && d.isAfter(day(v.sales_close)!, 'day')} />
                  <DateField name="sales_close" label="Sales close" readOnly={ro} helperText="For a midnight deadline, set 11:59 PM on the day."
                    disableDates={(d) => !!v.sales_open && d.isBefore(day(v.sales_open)!, 'day')} />
                </div>
              </WizardSection>
              <WizardSection title="Main draw" description="It must come after sales close.">
                <div style={grid(240)}>
                  <DateField name="draw_at" label="Draw date and time" readOnly={ro} disableDates={(d) => !!v.sales_close && d.isBefore(day(v.sales_close)!, 'day')} />
                  <Text name="draw_location" label="Draw location" maxLength={LIMIT.location} readOnly={ro} />
                </div>
              </WizardSection>
              <EarlyDraws v={v} m={m} ro={ro} />
            </>
          )}
        </Wizard.Page>
        <Wizard.Page label="Licences and tickets" summary={(v) => `${plural(v.ticket_pack_groups.length, 'licence')}, ${plural(v.ticket_pack_groups.reduce((n, g) => n + g.ticket_packs.length, 0), 'pack')}`} description="Each gaming licence the raffle sells under, and the ticket packs it covers." validate={errs.licences}>
          {(m, v) => <Licences v={v} m={m} ro={ro} />}
        </Wizard.Page>
        <Wizard.Page label="Prizes" summary={(v) => plural(v.prizes.length, 'prize')} description="Every prize, with a value and a description." validate={errs.prizes}>
          {(m, v) => <Prizes v={v} m={m} ro={ro} />}
        </Wizard.Page>
        <Wizard.Page label="Sponsors" summary={(v) => (v.sponsors.length ? `${plural(v.sponsors.length, 'sponsor')}${v.sponsors_tiered ? ` in ${plural(v.sponsor_tiers.length, 'tier')}` : ''}` : 'None')} description="The businesses supporting your raffle, shown as logos on your site." validate={errs.sponsors}>
          {(m, v) => <Sponsors v={v} m={m} ro={ro} />}
        </Wizard.Page>
        {/* Every province: the standard rules are used unless the organization uploads its own (Miguel, 2026-10-16). */}
        <Wizard.Page label="Rules of play" summary={(v) => (v.rules ? 'Your own rules' : 'Standard rules')} description="The rules your raffle runs by, linked from every page of your site.">
          {(m, v) => (
            <WizardSection title="Rules of play" description={`We use our standard rules of play for ${v.client.province} raffles unless you upload your own.`}>
              <p style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center', color: 'var(--ink-body)' }}>
                <Icon name="check-circle" size={18} style={{ color: 'var(--verified)' }} />
                {v.rules ? `Using your own rules: ${v.rules.name}` : `Using the standard rules of play for ${v.client.province}.`}
              </p>
              <UploadTile label="Your own rules (optional)" hint="A PDF, up to 10 MB. Remove it to go back to the standard rules." accept="application/pdf" maxBytes={10 * 1024 * 1024}
                kind="file" src={v.rules?.src} fileName={v.rules?.name} disabled={ro}
                onFile={(f, url) => m.setRules({ name: f.name, src: url })} onRemove={() => m.setRules(undefined)} />
            </WizardSection>
          )}
        </Wizard.Page>
        <Wizard.Page<Brief> label="Review and submit" summary={() => 'Check and submit'} description="Check each section. Edit anything from its step, then submit." hide={() => mode === 'qa'}>
          {(_m, v, changePage) => (
            <WizardReview onEdit={changePage} sections={[
              { label: 'Website', step: 0, complete: !messages(errs.website(v)).length, summary: `${v.name}, at ${address(v) || 'no address yet'}. ${richTextToPlain(v.cause).split('\n')[0]}`, issues: messages(errs.website(v)) },
              { label: 'Slideshow', step: 1, complete: !messages(errs.slides(v)).length, summary: `${plural(v.slides.length, 'slide')}.`, issues: messages(errs.slides(v)) },
              { label: 'Dates', step: 2, complete: !messages(errs.dates(v)).length, summary: `Sales ${when(v.sales_open) || 'not set'} to ${when(v.sales_close) || 'not set'}. Draw ${when(v.draw_at) || 'not set'}.`, issues: messages(errs.dates(v)) },
              { label: 'Licences and tickets', step: 3, complete: !messages(errs.licences(v)).length, summary: v.ticket_pack_groups.map((g) => `#${g.licence_number || '(no number)'}: ${g.ticket_packs.map((p) => `${p.name || 'New pack'} ${money(p.price)}`).join(', ') || 'no packs'} ${g.ticket_limit === 'unlimited' ? ' (unlimited tickets)' : g.ticket_limit === 'max' && g.tickets_available ? ` (up to ${Number(g.tickets_available).toLocaleString('en-CA')} tickets)` : ''}`).join('. '), issues: messages(errs.licences(v)) },
              { label: 'Prizes', step: 4, complete: !messages(errs.prizes(v)).length, summary: v.prizes.map((p) => p.title || 'New prize').join(', '), issues: messages(errs.prizes(v)) },
              { label: 'Sponsors', step: 5, complete: !messages(errs.sponsors(v)).length, summary: `${v.sponsors.length ? `${plural(v.sponsors.length, 'sponsor logo')}${v.sponsors_tiered ? `, in ${plural(v.sponsor_tiers.length, 'tier')}` : ''}.` : 'No sponsor logos.'}${v.presenting.logo ? ` ${v.presenting.label.trim() || 'Presented by'} ${v.presenting.name || 'a sponsor'}.` : ''}`, issues: messages(errs.sponsors(v)) },
              { label: 'Rules of play', step: 6, complete: true, summary: v.rules ? `Your own rules (${v.rules.name}).` : `The standard rules for ${v.client.province}.`, issues: [] },
            ]} />
          )}
        </Wizard.Page>
      </Wizard>
    </div>
  );
}
