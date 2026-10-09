import { StrictMode, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/fonts-dev.css';
import '../styles/tokens.css';
import '../styles/components.css';
import './demo.css';
import { InputsDemo } from './InputsDemo';
import { AlertsDemo } from './AlertsDemo';
import { AvatarsDemo, ButtonsDemo, RaffleBuilderDemo } from './Handoff2Demo';
import {
  Button, Icon, ICON_NAMES, VerifiedBadge, LedgerLine, ProofStat, JackpotFigure, JackpotTile, FlagshipRoster,
  PoweredBy, LeaderHero, RaffleBrand, NodeGraphic, NODE_NAMES, Odometer, TicketButton, tokens,
  TextField, TextArea, Select, Checkbox, RadioGroup, Switch, ErrorSummary, Dropdown,
  Sidebar, Offcanvas, Table, createColumnHelper, type ColumnDef, type SidebarSection,
} from '../src';

// Sample orders (made-up names and figures)
type Order = { id: string; name: string; town: string; channel: string; amount: number; status: string };
const ORDERS: Order[] = [
  ['A-104233', 'Priya Sharma', 'Nanaimo', 'Online', 100, 'Paid'], ['A-104234', 'Liam Chen', 'Kelowna', 'Phone', 250, 'Paid'],
  ['A-104235', 'Ava Martin', 'Victoria', 'Mail', 50, 'Processing'], ['A-104236', 'Noah Singh', 'Surrey', 'Online', 450, 'Paid'],
  ['A-104237', 'Emma Roy', 'Kamloops', 'In person', 20, 'Paid'], ['A-104238', 'Lucas Tremblay', 'Burnaby', 'Online', 100, 'Refunded'],
  ['A-104239', 'Mia Wilson', 'Prince George', 'Phone', 800, 'Paid'], ['A-104240', 'Ethan Brown', 'Richmond', 'Online', 250, 'Paid'],
].map(([id, name, town, channel, amount, status]) => ({ id, name, town, channel, amount, status }) as Order);
const oc = createColumnHelper<Order>();
const ORDER_COLUMNS = [
  oc.accessor('id', { header: 'Order', enableSorting: false }),
  oc.accessor('name', { header: 'Name' }),
  oc.accessor('town', { header: 'Town' }),
  oc.accessor('channel', { header: 'Channel' }),
  oc.accessor('amount', { header: 'Amount', cell: (c) => `$${c.getValue().toLocaleString('en-CA')}`, meta: { numeric: true } }),
  oc.accessor('status', { header: 'Status' }),
] as ColumnDef<Order, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
const NAV: SidebarSection[] = [
  { items: [
    { label: 'Dashboard', href: '#', icon: 'chart-line-up', current: true }, { label: 'Raffles', href: '#', icon: 'ticket', badge: '3' },
    { label: 'Orders', href: '#', icon: 'receipt' }, { label: 'Draws', href: '#', icon: 'trophy' }, { label: 'Customers', href: '#', icon: 'users-three' },
  ] },
  { title: 'Tools', items: [{ label: 'Point of sale', href: '#', icon: 'cash-register' }, { label: 'Help', href: '#', icon: 'headset' }] },
];
const Logo = () => <svg width="150" height="32" viewBox="0 0 150 32" role="img" aria-label="Sample logo"><rect width="32" height="32" rx="8" fill="var(--action)" /><text x="42" y="22" fontFamily="DM Sans, Arial" fontWeight="700" fontSize="17" fill="var(--ink)">Sample admin</text></svg>;
const Mark = () => <svg width="32" height="32" viewBox="0 0 32 32" role="img" aria-label="Sample logo"><rect width="32" height="32" rx="8" fill="var(--action)" /></svg>;

function LayoutDemo() {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<'left' | 'right' | 'bottom'>('left');
  const [picked, setPicked] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="rnc-row">
        <Switch label="Collapse the sidebar" checked={collapsed} onChange={setCollapsed} />
        <Button onClick={() => { setSide('left'); setOpen(true); }}>Open the menu (offcanvas)</Button>
        <Button variant="secondary" onClick={() => { setSide('right'); setOpen(true); }}>Filters from the right</Button>
      </div>
      <div className="demo-layout">
        <div className="demo-layout-side">
          <Sidebar logo={<Logo />} logoCollapsed={<Mark />} sections={NAV} collapsed={collapsed} footer={<span className="rnc-field-hint">Signed in as Jordan Lee</span>} />
        </div>
        <div className="demo-layout-main">
          <Table data={ORDERS} columns={ORDER_COLUMNS} caption="Orders (sample)" searchable searchLabel="Search orders" searchPlaceholder="Name, town or order number"
            pageSize={5} enableRowSelection getRowId={(o) => o.id} getRowLabel={(o) => `order ${o.id}`} countNoun={['order', 'orders']}
            onRowSelectionChange={(rows) => setPicked(rows.length)} emptyMessage="No orders match your search." />
          <p className="rnc-field-hint" style={{ marginTop: 8 }}>{picked} selected (reported through onRowSelectionChange)</p>
        </div>
      </div>
      <Offcanvas open={open} onClose={() => setOpen(false)} side={side} title={side === 'left' ? 'Menu' : 'Filter orders'} flush={side === 'left'}>
        {side === 'left'
          ? <Sidebar logo={<Logo />} sections={NAV} className="demo-oc-sidebar" />
          : <div style={{ display: 'grid', gap: 16 }}><Select label="Channel" placeholder="Any channel" options={[{ value: 'online', label: 'Online' }, { value: 'phone', label: 'Phone' }, { value: 'mail', label: 'Mail' }]} /><Button onClick={() => setOpen(false)}>Apply</Button></div>}
      </Offcanvas>
    </div>
  );
}

function FormDemo() {
  const [email, setEmail] = useState('jordan@');
  const [prov, setProv] = useState('');
  const [delivery, setDelivery] = useState('email');
  const [live, setLive] = useState(true);
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState('');
  const errors = [
    ...(/^\S+@\S+\.\S+$/.test(email) ? [] : [{ fieldId: 'demo-email', message: 'Enter an email address like name@example.com.' }]),
    ...(prov ? [] : [{ fieldId: 'demo-prov', message: 'Choose your province.' }]),
  ];
  const err = (id: string) => (tried ? errors.find((e) => e.fieldId === id)?.message : undefined);
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); setTried(true); setDone(errors.length ? '' : 'Saved (sample).'); }} style={{ display: 'grid', gap: 18, maxWidth: 520 }}>
      {tried && errors.length ? <ErrorSummary errors={errors} /> : null}
      <TextField label="Full name" autoComplete="name" defaultValue="Jordan Lee" />
      <TextField id="demo-email" label="Email" type="email" autoComplete="email" hint="We send your tickets here." value={email} onChange={(e) => setEmail(e.target.value)} error={err('demo-email')} />
      <Select id="demo-prov" label="Province" placeholder="Choose a province" value={prov} onChange={(e) => setProv(e.target.value)} error={err('demo-prov')}
        options={[{ value: 'BC', label: 'British Columbia' }, { value: 'AB', label: 'Alberta' }, { value: 'SK', label: 'Saskatchewan' }, { value: 'MB', label: 'Manitoba' }, { value: 'ON', label: 'Ontario' }]} />
      <TextArea label="Message" optional placeholder="Tell us about your raffle or lottery." />
      <RadioGroup legend="Ticket delivery" name="delivery" value={delivery} onChange={setDelivery}
        options={[{ value: 'email', label: 'eTickets by email', hint: 'Arrive in a minute or two.' }, { value: 'mail', label: 'Paper tickets by mail', hint: 'Allow 5 to 10 business days.' }]} />
      <Checkbox label="Email me the draw results" defaultChecked />
      <Switch label="Show the live jackpot on the site" checked={live} onChange={setLive} />
      <div className="rnc-row"><Button type="submit">Save</Button>{done ? <span className="rnc-field-hint" role="status">{done}</span> : null}</div>
    </form>
  );
}

// Every name and figure here is a sample. Real client names need each client's permission.
function Section({ title, note, children, stage }: { title: string; note?: ReactNode; children: ReactNode; stage?: boolean }) {
  return (
    <section className={stage ? 'demo-sec rnc-stage' : 'demo-sec'}>
      <h2 className="rnc-h3">{title}</h2>
      {note ? <p className="demo-note">{note}</p> : null}
      <div className="demo-body">{children}</div>
    </section>
  );
}

function App() {
  const [replay, setReplay] = useState(0);
  return (
    <main className="demo">
      <header className="demo-head">
        <h1 className="rnc-h rnc-display">Raffle Nexus design system</h1>
        <p className="rnc-lede">React components and tokens for “Canada’s raffle leader”: Flagship Navy, Newsreader headlines, DM Sans text and DM Mono figures. Every name and figure on this page is a sample.</p>
      </header>

      <LeaderHero
        sub="The platform behind charity lotteries in five provinces: online, phone, mail and in-person sales in one ticket pool."
        secondary={{ label: 'See the lotteries on our platform', href: '#roster' }}
        proof={{ value: '[__]', of: '[__]', label: 'Flagship lotteries in BC, AB, SK, MB and ON', source: 'Research count · [date]' }}
        tiles={[{ program: 'Sample Hospital Lottery', amount: 2548700, from: 2531200, province: 'BC', caption: 'As shown on the lottery’s site · sample' }]}
      />

      <Section title="Buttons" note="One Button for every action: variants by job, three sizes, icons, icon-only, and a loading state that keeps its width. Press Upload.">
        <ButtonsDemo />
      </Section>
      <Section title="Buttons on a stage band" stage>
        <div className="rnc-row">
          <Button variant="stage">Talk to our lottery team</Button>
          <Button variant="stage-ghost">Find a raffle</Button>
        </div>
      </Section>

      <Section title="TicketButton" note="The buy action. Hover tilts the stub; click punches a hole. Pass the client’s colours on their raffle site.">
        <div className="rnc-row">
          <TicketButton label="Order tickets" stub="from $10" href="#" onClick={(e) => e.preventDefault()} />
          <TicketButton label="Buy tickets" size="big" />
          <TicketButton label="Buy tickets" stub="$270" size="big" colors={{ bg: '#5a3fc0', stub: '#2b1d5c' }} />
        </div>
        <div style={{ maxWidth: 380, marginTop: 16 }}><TicketButton label="Buy tickets" stub="$20" size="big" fullWidth /></div>
      </Section>

      <Section title="JackpotFigure and JackpotTile" note="Real figures only. The tile counts up once from yesterday’s figure; under reduced motion it just shows the number.">
        <div className="demo-grid">
          <div style={{ fontSize: 64, color: 'var(--reward)' }} key={`jf-${replay}`}><JackpotFigure amount={684270} from={671790} growth="Up $12,480 since yesterday" /></div>
          <JackpotTile key={`jt-${replay}`} program="Sample 50/50" amount={10640} from={9320} province="BC" caption="As shown · sample" />
        </div>
      </Section>

      <Section title="Odometer" note="For Raffle Insider and client raffle sites only: rolling digits for real numbers.">
        <div className="demo-grid">
          <div style={{ font: '600 56px/1 var(--font-mono)', color: 'var(--ink)' }}><Odometer value={684270} prefix="$" replayKey={replay} /></div>
          <div style={{ font: '600 40px/1 var(--font-mono)', color: 'var(--action)' }}><Odometer value="0428713" replayKey={replay} stagger={140} /></div>
        </div>
        <p><Button variant="secondary" onClick={() => setReplay((n) => n + 1)}>Replay the animations</Button></p>
      </Section>

      <Section title="Proof">
        <div className="demo-grid">
          <ProofStat value="[__]" of="[__]" label="Flagship lotteries on the platform" source="Research count · [date]" />
          <VerifiedBadge regulator="IGCO" licence="[000000]" />
        </div>
        <LedgerLine items={[{ label: 'Tickets sold', value: '48,210' }, { label: 'Phone and mail', value: '31%' }, { label: 'Draws', value: '6' }, { label: 'Reconciled', value: 'Yes', done: true }]} />
      </Section>

      <Section title="FlagshipRoster" note="A tinted row per province, no counts. Pass the programs each client has approved for public use.">
        <div id="roster"><FlagshipRoster groups={[
          { province: 'BC', items: ['Sample Children’s Lottery', 'Sample Hospital Lottery', 'Sample Prize Home'] },
          { province: 'AB', items: ['Sample Foundation 50/50'] },
          { province: 'SK', items: [] },
        ]} note="Sample names." /></div>
      </Section>

      <Section title="RaffleBrand and PoweredBy" note="On a client’s raffle site: their logo (with an optional sponsor), and the only sign of us, Powered by Raffle Nexus.">
        <div className="demo-grid">
          <RaffleBrand logo={{ svg: <SampleLogo />, alt: 'Sample Home Lottery' }} sponsor={{ svg: <SampleSponsor />, alt: 'Sample Credit Union', label: 'Presented by' }} />
          <div className="rnc-row"><PoweredBy /></div>
        </div>
      </Section>

      <Section title="NodeGraphic" note="The logo’s node shapes as graphics: large, cropped at a band’s edge, one token colour. Never as icons or bullets.">
        <div className="rnc-row" style={{ gap: 32, color: 'var(--brand)' }}>
          {NODE_NAMES.map((n) => <NodeGraphic key={n} name={n} size={120} />)}
          <NodeGraphic name="triad" size={120} shadow color="var(--action)" />
        </div>
      </Section>

      <Section title="Form elements" note="Labels always visible, hints and errors tied to each field, an error summary on submit. Press Save to see the errors.">
        <FormDemo />
      </Section>

      <Section title="Dropdown" note="A button that opens a short menu of actions or links. Arrow keys move, Escape closes.">
        <div className="rnc-row">
          <Dropdown label="Export report" items={[{ label: 'Download CSV', icon: 'receipt', onSelect: () => {} }, { label: 'Download PDF', icon: 'printer', onSelect: () => {} }, { label: 'Email to my team', icon: 'envelope-simple', onSelect: () => {} }, { label: 'Schedule a weekly export', icon: 'clock', disabled: true }]} />
          <Dropdown label="Help" variant="primary" items={[{ label: 'Rules of play', href: '#' }, { label: 'Contact us', href: '#' }]} />
        </div>
      </Section>

      <Section title="Raffle Builder inputs (@rafflenexuscanada/design-system/inputs)" note="MUI fields for react-final-form with the app's own props: TextInput (text, number, password, dropdown), InputMasked, MaskedInput, DatePicker, TextArea and BriefToolTip. Leave a required field empty to see its error; switch on review mode and click a field to copy it.">
        <InputsDemo />
      </Section>

      <Section title="AlertBox (@rafflenexuscanada/design-system/alerts)" note="The Raffle Builder's SweetAlert helper with the same API (SweetAlert.confirm, .delete, .success, .error, .info, .loading), in the design system's look.">
        <AlertsDemo />
      </Section>

      <Section title="Raffle Builder frame: Sidebar and ReactTableComponent (@rafflenexuscanada/design-system/tables)" note="The sidebar with its collapse button, main action, what's new footer, an external link and a badge (a dot when collapsed; hover or Tab to an icon for its name). Beside it, the scroll table: react-table v6 columns, loads more at 60% scrolled, a row highlighted with getTrProps.">
        <RaffleBuilderDemo />
      </Section>

      <Section title="Avatar" note="Photo, else initials on a colour fixed to the name, else a person icon. Sizes, shapes, a name beside or under it, and a group.">
        <AvatarsDemo />
      </Section>

      <Section title="Sidebar, Offcanvas and Table" note="An admin layout: the sidebar (collapsible), a table with sorting, search, row selection and pages, and an offcanvas from the left (the phone menu) or the right (filters).">
        <LayoutDemo />
      </Section>

      <Section title="Icons" note="Phosphor, regular weight. Always beside a word.">
        <ul className="demo-icons">{ICON_NAMES.map((n) => <li key={n}><Icon name={n} />{n}</li>)}</ul>
      </Section>

      <Section title="Colour tokens">
        <ul className="demo-swatches">{Object.entries(tokens.color).map(([k, v]) => <li key={k}><i style={{ background: v }} /><b>{k}</b><code>{v}</code></li>)}</ul>
      </Section>
    </main>
  );
}

function SampleLogo() {
  return (
    <svg viewBox="0 0 214 52" width="214" height="52" aria-hidden="true">
      <rect x="1" y="3" width="46" height="46" rx="11" fill="#0b5e7a" />
      <path d="M11 27 24 15l13 12" fill="none" stroke="#f2c94c" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 25v13h17V25" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinejoin="round" />
      <text x="58" y="25" fontFamily="DM Sans, Arial" fontWeight="700" fontSize="21" fill="#0b5e7a">Dream Home</text>
      <text x="58" y="44" fontFamily="DM Sans, Arial" fontWeight="500" fontSize="12.5" fill="#0b5e7a" opacity=".78">Sample lottery</text>
    </svg>
  );
}
function SampleSponsor() {
  return (
    <svg viewBox="0 0 220 36" width="220" height="36" aria-hidden="true">
      <circle cx="14" cy="18" r="11" fill="none" stroke="#1f2a37" strokeWidth="3.2" />
      <circle cx="26" cy="18" r="11" fill="none" stroke="#1f2a37" strokeWidth="3.2" opacity=".5" />
      <text x="45" y="24.5" fontFamily="DM Sans, Arial" fontWeight="700" fontSize="17" fill="#1f2a37">Sample Credit Union</text>
    </svg>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
