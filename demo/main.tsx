import { StrictMode, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/fonts-dev.css';
import '../styles/tokens.css';
import '../styles/components.css';
import './demo.css';
import {
  Button, Icon, ICON_NAMES, VerifiedBadge, LedgerLine, ProofStat, JackpotFigure, JackpotTile, FlagshipRoster,
  PoweredBy, LeaderHero, RaffleBrand, NodeGraphic, NODE_NAMES, Odometer, TicketButton, tokens,
} from '../src';

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

      <Section title="Buttons">
        <div className="rnc-row">
          <Button>Talk to our lottery team</Button>
          <Button variant="secondary" href="#">Book a call</Button>
        </div>
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
