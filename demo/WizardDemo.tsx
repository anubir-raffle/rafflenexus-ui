import { useRef, useState } from 'react';
import { Field } from 'react-final-form';
import moment, { type Moment } from 'moment';
import {
  Wizard, WizardDeadline, WizardHeader, WizardPreview, WizardReview, WizardSection, WizardSitePreview, WizardToolbar,
  type PreviewDevice, type WizardMutators, type WizardSiteDate,
} from '../src/wizard';
import {
  AnimatedList, BrandColours, Button, DomainField, ExpandableRow, Icon, RichText, RichTextArea, SortableList, StatusPill, TextField, UploadTile,
  domainUrl, richTextLength, richTextToPlain, type BrandColourSet, type DomainType, type LicenceProvince,
} from '../src';
import { DatePicker } from '../src/inputs';

// A sample brief, the way the Raffle Builder's setup form holds it. Every name and figure is made up.
type Slide = { id: string; src: string; alt: string };
type Pack = { id: string; name: string; tickets: string; price: string };
/** A licence and the ticket packs it covers (the app's ticket_pack_groups). */
type Licence = { id: string; licence_number: string; ticket_packs: Pack[] };
type Prize = { id: string; title: string; value: string; description: string };
type Early = { id: string; date: string; prize: string };
type Brief = {
  name?: string; sub_domain?: string; sub_domain_type: DomainType; heading?: string; subheading?: string; cause?: string; logo?: string; sharing_image?: string; support_email?: string;
  slides: Slide[]; sales_open?: string; sales_close?: string; draw_at?: string; draw_location?: string; early_draws: Early[];
  ticket_pack_groups: Licence[]; prizes: Prize[]; client: { name: string; province: string };
  /** The site's colours, picked from the logo (the app's leading_color is the primary). */
  colours: BrandColourSet;
};

const tile = (label: string, a: string, b: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="650" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="650" height="500" fill="url(#g)"/><text x="40" y="440" font-family="Arial" font-weight="700" font-size="44" fill="#fff">${label}</text></svg>`)}`;
let seq = 100;
const uid = (p: string) => `${p}-${++seq}`;
const money = (v: string) => { const n = Number(String(v).replace(/[^0-9.]/g, '')); return n ? `$${n.toLocaleString('en-CA')}` : '$0'; };
/** Dates are stored the app's way ("YYYY-MM-DD HH:mm:ss") and shown in words. */
const when = (v?: string) => (v ? moment(v).format('MMM D, YYYY, h:mm A') : '');
const day = (v?: string) => (v ? moment(v) : null);

// Character limits, from the app's validation where it has one (name 5 to 80, cause 30 to 1500).
const LIMIT = { name: 80, heading: 90, subheading: 160, cause: 1500, alt: 150, location: 80, licence: 20, pack: 40, prize: 80, prizeText: 1000, earlyPrize: 80 };

const START: Brief = {
  name: 'Sample Hospital Lottery', sub_domain: 'samplehospital', sub_domain_type: 'rn', heading: 'Win a lakeside home and support hospital care',
  subheading: 'Every ticket helps buy equipment for the hospital.',
  cause: '<p>Your ticket funds <strong>new equipment</strong> for the emergency department.</p><ul><li>Two new ultrasound machines</li><li>A quieter, faster triage area</li></ul>',
  support_email: 'lottery@example.org',
  slides: [
    { id: 's1', src: tile('Grand prize home', '#126ab5', '#0c3f75'), alt: 'The lakeside grand prize home' },
    { id: 's2', src: tile('Early bird: a new car', '#2b7a3d', '#174a24'), alt: 'The early bird car prize' },
    { id: 's3', src: tile('50/50 jackpot', '#8a6410', '#5a400a'), alt: '' },
  ],
  sales_open: '2026-11-02 09:00:00', sales_close: '2026-12-18 23:59:00', draw_at: '', draw_location: 'Foundation office',
  early_draws: [{ id: 'e1', date: '2026-11-20 12:00:00', prize: '$5,000 cash' }],
  ticket_pack_groups: [{
    id: 'g1', licence_number: '000000',
    ticket_packs: [{ id: 'p1', name: 'Single ticket', tickets: '1', price: '25' }, { id: 'p2', name: 'Pack of 3', tickets: '3', price: '60' }],
  }],
  prizes: [{ id: 'z1', title: 'Lakeside home', value: '1250000', description: '<p>A four-bedroom home by the lake, <em>fully furnished</em>.</p>' }],
  client: { name: 'Sample Hospital Foundation', province: 'BC' },
  colours: { primary: '#0c3f75', secondary: '#13324f', accent: '#126ab5' },
};

const set = (field: string) => (args: unknown[], state: any, utils: any) => utils.changeValue(state, field, () => args[0]); // eslint-disable-line @typescript-eslint/no-explicit-any
const MUTATORS = {
  setSlides: set('slides'), setLicences: set('ticket_pack_groups'), setPrizes: set('prizes'), setEarlyDraws: set('early_draws'),
  setLogo: set('logo'), setSharingImage: set('sharing_image'), setSubDomainType: set('sub_domain_type'), setColours: set('colours'),
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
  earlyDate: (v: string, b: Brief) => (!v ? 'Enter the date'
    : past(v) ? 'Pick a time from now on'
      : (b.sales_open && !moment(v).isAfter(moment(b.sales_open))) || (b.sales_close && !moment(v).isBefore(moment(b.sales_close))) ? 'Early draws happen while sales are open' : undefined),
};
const errs = {
  website: (v: Brief) => ({
    ...(rules.name(v.name) && { name: rules.name(v.name) }),
    ...(addressError(v) && { sub_domain: addressError(v) }),
    ...(!v.heading?.trim() && { heading: 'Write a main heading' }),
    ...(!richTextLength(v.cause) ? { cause: 'Say what the raffle supports' } : richTextLength(v.cause) < 30 && { cause: 'Write at least 30 characters about the cause' }),
    ...(!v.logo && { logo: 'Add your logo' }),
    ...(rules.support_email(v.support_email) && { support_email: rules.support_email(v.support_email) }),
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
      ...(packs.some((p) => !p.name.trim() || rules.price(p.price) || rules.tickets(p.tickets)) && { pack_fields: 'Give every pack a name, a price above $0 and a whole number of tickets' }),
      ...(repeats && { repeats: 'Two packs in one licence have the same number of tickets' }),
    };
  },
  prizes: (v: Brief) => ({ ...(!v.prizes.length && { prizes: 'Add a prize' }), ...(v.prizes.some((p) => !p.title.trim() || rules.value(p.value)) && { prize_fields: 'Give every prize a title and a value above $0' }) }),
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
              <img src={s.src} alt="" style={{ width: 'clamp(64px, 12vw, 120px)', aspectRatio: '13 / 10', objectFit: 'cover', borderRadius: 8, flex: 'none' }} />
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
          <UploadTile label="New slide" hint="PNG or JPG, at least 650 × 500." minWidth={650} minHeight={500}
            onFile={(_f, url) => m.setSlides([...v.slides, { id: uid('s'), src: url, alt: '' }])} />
        </WizardSection>
      ) : null}
    </>
  );
}

/** One licence's ticket packs: open a pack to edit it, add or remove packs. */
function Packs({ licence, setPacks, ro }: { licence: Licence; setPacks: (packs: Pack[]) => void; ro: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const packs = licence.ticket_packs;
  const add = () => { const id = uid('p'); setPacks([...packs, { id, name: '', tickets: '', price: '' }]); setOpen(id); focusSoon(`${id}-name`); };
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p className="rnc-field-label" style={{ margin: 0 }}>Ticket packs for this licence</p>
      <AnimatedList aria-label={`Ticket packs for licence ${licence.licence_number || 'without a number'}`} items={packs} getKey={(p) => p.id} renderItem={(p, i) => (
        <ExpandableRow
          title={p.name || 'New pack'} meta={p.price ? `${money(p.price)} · ${plural(Number(p.tickets) || 0, 'ticket')}` : 'No price yet'}
          open={open === p.id} onOpenChange={(o) => setOpen(o ? p.id : null)}
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
  const add = () => { const id = uid('g'); m.setLicences([...list, { id, licence_number: '', ticket_packs: [] }]); focusSoon(`${id}-number`); };
  return (
    <>
      <AnimatedList aria-label="Licences" className="demo-licences" items={list} getKey={(g) => g.id} renderItem={(g, i) => (
        <WizardSection title={i > -1 ? `Licence ${i + 1}` : 'Licence'} description={i === 0 ? 'Your gaming licence from the provincial regulator, and the ticket packs it covers.' : undefined}>
          {i > -1 ? (
            <>
              <div style={grid(240)}>
                <ItemText id={`${g.id}-number`} label="Licence number" hint="As it appears on your licence." value={g.licence_number} readOnly={ro} maxLength={LIMIT.licence}
                  check={(x) => rules.licence(x) ?? (list.some((o) => o.id !== g.id && o.licence_number === x) ? "This licence number is already entered" : undefined)} onValue={(x) => m.setLicences(patch(list, g.id, { licence_number: x }))} />
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
  const [open, setOpen] = useState<string | null>(null);
  const add = () => { const id = uid('z'); m.setPrizes([...v.prizes, { id, title: '', value: '', description: '' }]); setOpen(id); focusSoon(`${id}-title`); };
  return (
    <WizardSection title="Prizes for the main draw" description="Drag to set the order they're drawn in. Open a prize to edit it.">
      <SortableList aria-label="Prizes" items={v.prizes} getKey={(p) => p.id} disabled={ro} itemLabel={(p, i) => p.title || `Prize ${i + 1}`} onReorder={(next) => m.setPrizes(next)}
        renderItem={(p, t) => (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ paddingTop: 6 }}>{t.grip}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ExpandableRow
                title={p.title || 'New prize'} meta={p.value ? money(p.value) : 'No value yet'} open={open === p.id} onOpenChange={(o) => setOpen(o ? p.id : null)}
                actions={!ro && t.index > -1 ? <>{t.moves}<Button variant="ghost" size="sm" iconOnly startIcon="trash" aria-label={`Remove ${p.title || 'this prize'}`} onClick={() => m.setPrizes(v.prizes.filter((x) => x.id !== p.id))} /></> : null}
              >
                {t.index > -1 ? (
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div style={grid(220)}>
                      <ItemText id={`${p.id}-title`} label="Prize title" value={p.title} readOnly={ro} maxLength={LIMIT.prize} required="Give the prize a title" onValue={(x) => m.setPrizes(patch(v.prizes, p.id, { title: x }))} />
                      <ItemText label="Value ($)" value={p.value} readOnly={ro} inputMode="decimal" check={rules.value} onValue={(x) => m.setPrizes(patch(v.prizes, p.id, { value: x.replace(/[^0-9.]/g, '') }))} />
                    </div>
                    <RichTextArea label="Description" hint="What winners get. Shown on the prizes page." value={p.description} review={ro} maxLength={LIMIT.prizeText} minHeight={140}
                      onChange={(html) => m.setPrizes(patch(v.prizes, p.id, { description: html }))} />
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
  return (
    <WizardPreview url={address(v) || 'your-raffle.rafflenexus.com'} device={device} onDeviceChange={onDevice}>
      <WizardSitePreview
        org={v.client.name} logo={v.logo} logoAlt={`${v.client.name} logo`} heading={v.heading} subheading={v.subheading}
        cause={richTextLength(v.cause) ? <RichText html={v.cause} /> : undefined} colour={v.colours.primary} secondary={v.colours.secondary} accent={v.colours.accent}
        slides={v.slides.map((s) => s.src)}
        packs={(first?.ticket_packs ?? []).filter((p) => p.price).map((p) => ({ label: plural(Number(p.tickets) || 0, 'ticket'), note: p.name, price: money(p.price) }))}
        dates={dates}
        prizes={v.prizes.filter((p) => p.title).map((p) => ({ title: p.title, value: p.value ? money(p.value) : undefined }))}
        licence={numbers.length ? `${v.client.province} Gaming Event Licence #${numbers.join(', #')}` : undefined}
        badge={numbers.length ? { province: v.client.province as LicenceProvince, licences: numbers.map((n) => ({ number: n })) } : undefined}
      />
    </WizardPreview>
  );
}

/** The Raffle Builder's setup form with every step built out: uploads, a sortable slideshow, licences with their ticket packs, prizes to add, open and remove, and a review. */
export function WizardDemo() {
  const [mode, setMode] = useState<'normal' | 'qa' | 'readonly'>('normal');
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
                <Text name="name" label="Raffle name" hint="5 to 80 characters." maxLength={LIMIT.name} readOnly={ro} />
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
              </WizardSection>
              <WizardSection title="Branding" description="Your logo, the image shown when the site is shared, and the site's colours.">
                <div style={{ ...grid(200), alignItems: 'stretch' }}>
                  <UploadTile label="Logo" hint="PNG or SVG, on a clear background." src={v.logo} alt="Your logo" disabled={ro} error={v.logo ? undefined : 'Add your logo'}
                    onFile={(_f, url) => m.setLogo(url)} onRemove={() => m.setLogo(undefined)} />
                  <UploadTile label="Sharing image" hint="Shown when the site is shared, 1200 × 630." src={v.sharing_image} alt="Sharing image" disabled={ro}
                    onFile={(_f, url) => m.setSharingImage(url)} onRemove={() => m.setSharingImage(undefined)} />
                </div>
                <BrandColours value={v.colours} onChange={(c) => m.setColours(c)} logo={v.logo} review={ro}
                  hint="We pick these from your logo when you add it. Select a swatch or type a hex value to change one." />
              </WizardSection>
              <WizardSection title="Support contact" description="Shown on your site so buyers can reach you.">
                <Text name="support_email" label="Support email" type="email" inputMode="email" readOnly={ro} />
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
        <Wizard.Page label="Rules of play" hide={(v) => ['BC', 'AB', 'MB'].includes(v.client.province)}>
          <p>Ontario raffles upload their rules here.</p>
        </Wizard.Page>
        <Wizard.Page<Brief> label="Review and submit" summary={() => 'Check and submit'} description="Check each section. Edit anything from its step, then submit." hide={() => mode === 'qa'}>
          {(_m, v, changePage) => (
            <WizardReview onEdit={changePage} sections={[
              { label: 'Website', step: 0, complete: !messages(errs.website(v)).length, summary: `${v.name}, at ${address(v) || 'no address yet'}. ${richTextToPlain(v.cause).split('\n')[0]}`, issues: messages(errs.website(v)) },
              { label: 'Slideshow', step: 1, complete: !messages(errs.slides(v)).length, summary: `${plural(v.slides.length, 'slide')}.`, issues: messages(errs.slides(v)) },
              { label: 'Dates', step: 2, complete: !messages(errs.dates(v)).length, summary: `Sales ${when(v.sales_open) || 'not set'} to ${when(v.sales_close) || 'not set'}. Draw ${when(v.draw_at) || 'not set'}.`, issues: messages(errs.dates(v)) },
              { label: 'Licences and tickets', step: 3, complete: !messages(errs.licences(v)).length, summary: v.ticket_pack_groups.map((g) => `#${g.licence_number || '(no number)'}: ${g.ticket_packs.map((p) => `${p.name || 'New pack'} ${money(p.price)}`).join(', ') || 'no packs'}`).join('. '), issues: messages(errs.licences(v)) },
              { label: 'Prizes', step: 4, complete: !messages(errs.prizes(v)).length, summary: v.prizes.map((p) => p.title || 'New prize').join(', '), issues: messages(errs.prizes(v)) },
            ]} />
          )}
        </Wizard.Page>
      </Wizard>
    </div>
  );
}
