import { useRef, useState } from 'react';
import { Field } from 'react-final-form';
import {
  Wizard, WizardDeadline, WizardHeader, WizardPreview, WizardReview, WizardSection, WizardSitePreview, WizardToolbar, type WizardMutators,
} from '../src/wizard';
import { AnimatedList, Button, ExpandableRow, Icon, SortableList, StatusPill, TextField, UploadTile } from '../src';

// A sample brief, the way the Raffle Builder's setup form holds it. Every name and figure is made up.
type Slide = { id: string; src: string; alt: string };
type Pack = { id: string; name: string; tickets: string; price: string };
type Prize = { id: string; title: string; value: string; description: string };
type Early = { id: string; date: string; prize: string };
type Brief = {
  name?: string; sub_domain?: string; heading?: string; subheading?: string; cause?: string; logo?: string; sharing_image?: string; support_email?: string;
  slides: Slide[]; sales_open?: string; sales_close?: string; draw_at?: string; draw_location?: string; early_draws: Early[];
  licence_number?: string; ticket_packs: Pack[]; prizes: Prize[]; client: { name: string; province: string };
};

const tile = (label: string, a: string, b: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="650" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="650" height="500" fill="url(#g)"/><text x="40" y="440" font-family="Arial" font-weight="700" font-size="44" fill="#fff">${label}</text></svg>`)}`;
let seq = 100;
const uid = (p: string) => `${p}-${++seq}`;
const money = (v: string) => { const n = Number(String(v).replace(/[^0-9.]/g, '')); return n ? `$${n.toLocaleString('en-CA')}` : '$0'; };

const START: Brief = {
  name: 'Sample Hospital Lottery', sub_domain: 'samplehospital', heading: 'Win a lakeside home and support hospital care',
  subheading: 'Every ticket helps buy equipment for the hospital.', cause: 'Your ticket funds new equipment for the emergency department.',
  support_email: 'lottery@example.org',
  slides: [
    { id: 's1', src: tile('Grand prize home', '#126ab5', '#0c3f75'), alt: 'The lakeside grand prize home' },
    { id: 's2', src: tile('Early bird: a new car', '#2b7a3d', '#174a24'), alt: 'The early bird car prize' },
    { id: 's3', src: tile('50/50 jackpot', '#8a6410', '#5a400a'), alt: '' },
  ],
  sales_open: 'September 29, 2026', sales_close: 'October 17, 2026', draw_at: '', draw_location: 'Foundation office',
  early_draws: [{ id: 'e1', date: 'October 3, 2026', prize: '$5,000 cash' }],
  licence_number: '000000',
  ticket_packs: [{ id: 'p1', name: 'Single ticket', tickets: '1', price: '25' }, { id: 'p2', name: 'Pack of 3', tickets: '3', price: '60' }],
  prizes: [{ id: 'z1', title: 'Lakeside home', value: '1250000', description: 'A four-bedroom home by the lake, fully furnished.' }],
  client: { name: 'Sample Hospital Foundation', province: 'BC' },
};

const set = (field: string) => (args: unknown[], state: any, utils: any) => utils.changeValue(state, field, () => args[0]); // eslint-disable-line @typescript-eslint/no-explicit-any
const MUTATORS = { setSlides: set('slides'), setPacks: set('ticket_packs'), setPrizes: set('prizes'), setEarlyDraws: set('early_draws'), setLogo: set('logo'), setSharingImage: set('sharing_image') };

const errs = {
  website: (v: Brief) => ({ ...(!v.name && { name: 'Enter the raffle name' }), ...(!v.sub_domain && { sub_domain: 'Choose a web address' }), ...(!v.heading && { heading: 'Write a main heading' }), ...(!v.logo && { logo: 'Add your logo' }) }),
  slides: (v: Brief) => ({ ...(!v.slides.length && { slides: 'Add at least one slide' }), ...(v.slides.some((s) => !s.alt) && { slides_alt: 'Describe every slide (alt text)' }) }),
  dates: (v: Brief) => ({ ...(!v.sales_close && { sales_close: 'Enter when sales close' }), ...(!v.draw_at && { draw_at: 'Enter the draw date' }) }),
  licences: (v: Brief) => ({ ...(!v.licence_number && { licence_number: 'Enter the licence number' }), ...(!v.ticket_packs.length && { ticket_packs: 'Add a ticket pack' }), ...(v.ticket_packs.some((p) => !p.price || !p.tickets) && { pack_fields: 'Give every pack a price and a number of tickets' }) }),
  prizes: (v: Brief) => ({ ...(!v.prizes.length && { prizes: 'Add a prize' }), ...(v.prizes.some((p) => !p.title || !p.value) && { prize_fields: 'Give every prize a title and a value' }) }),
};
const messages = (o: Record<string, string | false | undefined>) => Object.values(o).filter(Boolean) as string[];
const grid = (min: number) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`, gap: 16 });

function Text({ name, label, hint, readOnly, id }: { name: string; label: string; hint?: string; readOnly?: boolean; id?: string }) {
  return (
    <Field name={name}>
      {({ input, meta }) => <TextField id={id} label={label} hint={hint} error={meta.error && (meta.touched || input.value === '') ? meta.error : undefined} disabled={readOnly} {...input} />}
    </Field>
  );
}
/** A field for one item in a list. It edits the item by id through a mutator (like the app's setTicketPacks), so removing or
 *  reordering rows never mixes their values up. Its error shows once someone leaves it empty. */
function ItemText({ id, label, value, onValue, readOnly, required }: { id?: string; label: string; value: string; onValue: (v: string) => void; readOnly?: boolean; required?: string }) {
  const [left, setLeft] = useState(false);
  return <TextField id={id} label={label} value={value} disabled={readOnly} onChange={(e) => onValue(e.target.value)} onBlur={() => setLeft(true)} error={required && left && !value ? required : undefined} />;
}
const patch = <T extends { id: string }>(list: T[], id: string, change: Partial<T>) => list.map((x) => (x.id === id ? { ...x, ...change } : x));
/** Focus a field once it exists (after an item is added and its row opens). */
const focusSoon = (id: string) => setTimeout(() => document.getElementById(id)?.focus(), 60);

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
              <img src={s.src} alt="" style={{ width: 'clamp(72px, 12vw, 120px)', aspectRatio: '13 / 10', objectFit: 'cover', borderRadius: 8, flex: 'none' }} />
              <div className="rnc-sort-body">
                {t.index > -1 ? (
                  <TextField label={`Alt text for slide ${t.index + 1}`} value={s.alt} disabled={ro} error={s.alt ? undefined : 'Describe what the slide shows'}
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

function Packs({ v, m, ro }: { v: Brief; m: WizardMutators; ro: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const add = () => { const id = uid('p'); m.setPacks([...v.ticket_packs, { id, name: '', tickets: '', price: '' }]); setOpen(id); focusSoon(`${id}-name`); };
  return (
    <WizardSection title="Ticket packs" description="What buyers choose from. Open a pack to edit it.">
      <AnimatedList aria-label="Ticket packs" items={v.ticket_packs} getKey={(p) => p.id} renderItem={(p, i) => (
        <ExpandableRow
          title={p.name || 'New pack'} meta={p.price ? `${money(p.price)} · ${p.tickets || 0} ticket${p.tickets === '1' ? '' : 's'}` : 'No price yet'}
          open={open === p.id} onOpenChange={(o) => setOpen(o ? p.id : null)}
          actions={!ro && i > -1 ? <Button variant="ghost" size="sm" iconOnly startIcon="trash" aria-label={`Remove ${p.name || 'this pack'}`} onClick={() => m.setPacks(v.ticket_packs.filter((x) => x.id !== p.id))} /> : null}
        >
          {i > -1 ? (
            <div style={grid(180)}>
              <ItemText id={`${p.id}-name`} label="Pack name" value={p.name} readOnly={ro} required="Name the pack" onValue={(x) => m.setPacks(patch(v.ticket_packs, p.id, { name: x }))} />
              <ItemText label="Tickets in the pack" value={p.tickets} readOnly={ro} required="Enter how many tickets" onValue={(x) => m.setPacks(patch(v.ticket_packs, p.id, { tickets: x }))} />
              <ItemText label="Price ($)" value={p.price} readOnly={ro} required="Enter the price" onValue={(x) => m.setPacks(patch(v.ticket_packs, p.id, { price: x }))} />
            </div>
          ) : null}
        </ExpandableRow>
      )} />
      {!ro ? <div><Button variant="secondary" startIcon="plus" onClick={add}>Add a ticket pack</Button></div> : null}
    </WizardSection>
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
                  <div style={grid(220)}>
                    <ItemText id={`${p.id}-title`} label="Prize title" value={p.title} readOnly={ro} required="Give the prize a title" onValue={(x) => m.setPrizes(patch(v.prizes, p.id, { title: x }))} />
                    <ItemText label="Value ($)" value={p.value} readOnly={ro} required="Enter the prize's value" onValue={(x) => m.setPrizes(patch(v.prizes, p.id, { value: x }))} />
                    <ItemText label="Description" value={p.description} readOnly={ro} onValue={(x) => m.setPrizes(patch(v.prizes, p.id, { description: x }))} />
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
  const add = () => { const id = uid('e'); m.setEarlyDraws([...v.early_draws, { id, date: '', prize: '' }]); focusSoon(`${id}-date`); };
  return (
    <WizardSection title="Early draws" size="md" description="Extra draws before the main one, each with its own prize.">
      <AnimatedList aria-label="Early draws" items={v.early_draws} getKey={(d) => d.id} renderItem={(d, i) => (
        <div className="rnc-sort-row" style={{ alignItems: 'flex-end' }}>
          <span className="rnc-sort-pos" aria-hidden="true" style={{ marginBottom: 10 }}>{i > -1 ? i + 1 : ''}</span>
          <div className="rnc-sort-body" style={{ ...grid(200), gap: 12 }}>
            {i > -1 ? <><ItemText id={`${d.id}-date`} label={`Early draw ${i + 1} date`} value={d.date} readOnly={ro} required="Enter the date" onValue={(x) => m.setEarlyDraws(patch(v.early_draws, d.id, { date: x }))} /><ItemText label="Prize" value={d.prize} readOnly={ro} required="Enter the prize" onValue={(x) => m.setEarlyDraws(patch(v.early_draws, d.id, { prize: x }))} /></> : null}
          </div>
          {!ro && i > -1 ? <Button variant="ghost" size="sm" iconOnly startIcon="trash" aria-label={`Remove early draw ${i + 1}`} onClick={() => m.setEarlyDraws(v.early_draws.filter((x) => x.id !== d.id))} /> : null}
        </div>
      )} />
      {!ro ? <div><Button variant="secondary" startIcon="plus" onClick={add}>Add an early draw</Button></div> : null}
    </WizardSection>
  );
}

/** The Raffle Builder's setup form with every step built out: uploads, a sortable slideshow, ticket packs and prizes to add, open and remove, and a review. */
export function WizardDemo() {
  const [mode, setMode] = useState<'normal' | 'qa' | 'readonly'>('normal');
  const [layout, setLayout] = useState<'v1' | 'v2'>('v2');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const save = () => { setSaving(true); clearTimeout(timer.current); timer.current = setTimeout(() => setSaving(false), 700); };
  const ro = mode === 'readonly';
  const checks = (v: Brief) => [
    ['Web address, heading and logo set', !messages(errs.website(v)).length],
    ['Every slide has alt text', !messages(errs.slides(v)).length],
    ['Sales close and the draw date set', !messages(errs.dates(v)).length],
    ['Every pack has a price and tickets', !messages(errs.licences(v)).length],
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
        preview={(v, step) => (step.label === 'Website' ? (
          <WizardPreview url={`${v.sub_domain || 'your-raffle'}.rafflenexus.com`}>
            <WizardSitePreview org={v.client.name} heading={v.heading} subheading={v.subheading} cause={v.cause} colour="#126ab5" accent="#0c3f75" image={v.slides[0]?.src} />
          </WizardPreview>
        ) : null)}
      >
        <Wizard.Page label="Website" summary={(v) => (v.sub_domain ? `${v.sub_domain}.rafflenexus.com` : 'Web address missing')} description="We use this to build your raffle site and help it show up in search." validate={errs.website}>
          {(m, v) => (
            <>
              <WizardSection title="Name and address">
                <Text name="name" label="Raffle name" readOnly={ro} />
                <Text name="sub_domain" label="Web address" hint="Letters, numbers and hyphens." readOnly={ro} />
              </WizardSection>
              <WizardSection title="Headline and story" description="The top of your raffle site.">
                <Text name="heading" label="Main heading" readOnly={ro} />
                <Text name="subheading" label="Subheading" readOnly={ro} />
                <Text name="cause" label="The cause" readOnly={ro} />
              </WizardSection>
              <WizardSection title="Branding" description="Drop a file on a tile, or choose one.">
                <div style={grid(220)}>
                  <UploadTile label="Logo" hint="PNG or SVG, on a clear background." src={v.logo} alt="Your logo" disabled={ro} error={v.logo ? undefined : 'Add your logo'}
                    onFile={(_f, url) => m.setLogo(url)} onRemove={() => m.setLogo(undefined)} />
                  <UploadTile label="Sharing image" hint="Shown when the site is shared, 1200 × 630." src={v.sharing_image} alt="Sharing image" disabled={ro}
                    onFile={(_f, url) => m.setSharingImage(url)} onRemove={() => m.setSharingImage(undefined)} />
                </div>
              </WizardSection>
              <WizardSection title="Support contact" description="Shown on your site so buyers can reach you.">
                <Text name="support_email" label="Support email" readOnly={ro} />
              </WizardSection>
            </>
          )}
        </Wizard.Page>
        <Wizard.Page label="Slideshow" summary={(v) => `${v.slides.length} slide${v.slides.length === 1 ? '' : 's'}`} description="These slides rotate on your raffle site." validate={errs.slides}>
          {(m, v) => <Slides v={v} m={m} ro={ro} />}
        </Wizard.Page>
        <Wizard.Page label="Dates" summary={(v) => (v.draw_at ? `Draw ${v.draw_at}` : 'Draw date missing')} description="When ticket sales open and close, and when the draws happen." validate={errs.dates}>
          {(m, v) => (
            <>
              <WizardSection title="Ticket sales" description="*All dates are in Pacific time, local to British Columbia.">
                <div style={grid(220)}>
                  <Text name="sales_open" label="Sales open" readOnly={ro} />
                  <Text name="sales_close" label="Sales close" readOnly={ro} />
                </div>
              </WizardSection>
              <WizardSection title="Main draw" description="It must come after sales close.">
                <div style={grid(220)}>
                  <Text name="draw_at" label="Draw date" readOnly={ro} />
                  <Text name="draw_location" label="Draw location" readOnly={ro} />
                </div>
              </WizardSection>
              <EarlyDraws v={v} m={m} ro={ro} />
            </>
          )}
        </Wizard.Page>
        <Wizard.Page label="Licences and tickets" summary={(v) => `1 licence, ${v.ticket_packs.length} pack${v.ticket_packs.length === 1 ? '' : 's'}`} description="Your gaming licence and the ticket packs it covers." validate={errs.licences}>
          {(m, v) => (
            <>
              <WizardSection title="Licence"><Text name="licence_number" label="Licence number" hint="From your provincial regulator." readOnly={ro} /></WizardSection>
              <Packs v={v} m={m} ro={ro} />
            </>
          )}
        </Wizard.Page>
        <Wizard.Page label="Prizes" summary={(v) => `${v.prizes.length} prize${v.prizes.length === 1 ? '' : 's'}`} description="Every prize, with a value and a description." validate={errs.prizes}>
          {(m, v) => <Prizes v={v} m={m} ro={ro} />}
        </Wizard.Page>
        <Wizard.Page label="Rules of play" hide={(v) => ['BC', 'AB', 'MB'].includes(v.client.province)}>
          <p>Ontario raffles upload their rules here.</p>
        </Wizard.Page>
        <Wizard.Page<Brief> label="Review and submit" summary={() => 'Check and submit'} description="Check each section. Edit anything from its step, then submit." hide={() => mode === 'qa'}>
          {(_m, v, changePage) => (
            <WizardReview onEdit={changePage} sections={[
              { label: 'Website', step: 0, complete: !messages(errs.website(v)).length, summary: `${v.name}, at ${v.sub_domain}.rafflenexus.com.`, issues: messages(errs.website(v)) },
              { label: 'Slideshow', step: 1, complete: !messages(errs.slides(v)).length, summary: `${v.slides.length} slides.`, issues: messages(errs.slides(v)) },
              { label: 'Dates', step: 2, complete: !messages(errs.dates(v)).length, summary: `Sales ${v.sales_open} to ${v.sales_close}. Draw ${v.draw_at || 'not set'}.`, issues: messages(errs.dates(v)) },
              { label: 'Licences and tickets', step: 3, complete: !messages(errs.licences(v)).length, summary: v.ticket_packs.map((p) => `${p.name || 'New pack'} ${money(p.price)}`).join(' · '), issues: messages(errs.licences(v)) },
              { label: 'Prizes', step: 4, complete: !messages(errs.prizes(v)).length, summary: v.prizes.map((p) => p.title || 'New prize').join(', '), issues: messages(errs.prizes(v)) },
            ]} />
          )}
        </Wizard.Page>
      </Wizard>
    </div>
  );
}
