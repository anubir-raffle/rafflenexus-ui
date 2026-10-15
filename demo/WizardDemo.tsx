import { useRef, useState } from 'react';
import { Field } from 'react-final-form';
import { Wizard, WizardDeadline, WizardHeader, WizardPreview, WizardSection, WizardSitePreview, WizardToolbar } from '../src/wizard';
import { Button, Icon, StatusPill, TextField } from '../src';

type Brief = { name?: string; sub_domain?: string; heading?: string; subheading?: string; cause?: string; sales_open?: string; sales_close?: string; draw_at?: string; prize?: string; client: { name: string; province: string } };
const need = (pairs: [keyof Brief, string][]) => (v: Brief) => Object.fromEntries(pairs.filter(([k]) => !v[k]).map(([k, m]) => [k, m]));

function Text({ name, label, hint, readOnly }: { name: string; label: string; hint?: string; readOnly?: boolean }) {
  return (
    <Field name={name}>
      {({ input, meta }) => <TextField label={label} hint={hint} error={meta.error && (meta.touched || meta.dirty || input.value === '') ? meta.error : undefined} disabled={readOnly} {...input} />}
    </Field>
  );
}

/** The Raffle Builder's setup form, the way the app calls it: autosave, a hidden step (BC), QA and read-only modes. */
export function WizardDemo() {
  const [mode, setMode] = useState<'normal' | 'qa' | 'readonly'>('normal');
  const [layout, setLayout] = useState<'v1' | 'v2'>('v2');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('just now');
  const [submitted, setSubmitted] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const save = () => { setSaving(true); clearTimeout(timer.current); timer.current = setTimeout(() => { setSaving(false); setSaved('just now'); }, 700); };
  const ro = mode === 'readonly';
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="rnc-row">
        {(['v2', 'v1'] as const).map((l) => (
          <button key={l} type="button" className="rnc-btn rnc-btn-secondary rnc-btn-sm" aria-pressed={layout === l} onClick={() => setLayout(l)}>
            {l === 'v2' ? 'V2 (Raffle Builder)' : 'V1 (card)'}
          </button>
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
        preview={(v, step) => (step.label === 'Website' ? (
          <WizardPreview url={`${v.sub_domain || 'your-raffle'}.rafflenexus.com`}>
            <WizardSitePreview org={v.client.name} heading={v.heading} subheading={v.subheading} cause={v.cause} colour="#126ab5" accent="#0c3f75" />
          </WizardPreview>
        ) : null)}
        toolbar={(v) => (
          <WizardToolbar
            back="#" crumb={<>Raffles / <b>{v.name}</b></>}
            status={<StatusPill tone="review">{mode === 'qa' ? 'In QA' : 'Ready for QA'}</StatusPill>}
            actions={<><Button variant="secondary" size="sm">Download images</Button><Button variant="secondary" size="sm">{ro ? 'Unlock editing' : 'Lock editing'}</Button></>}
          />
        )}
        aside={(v) => (
          <>
            <p style={{ margin: 0, font: '600 13px/1.3 var(--font-sans)', color: 'var(--ink)' }}>QA checks</p>
            {[['Web address chosen', !!v.sub_domain], ['Sales close and draw date set', !!v.sales_close && !!v.draw_at], ['Grand prize named', !!v.prize]].map(([t, ok]) => (
              <span key={String(t)} style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--ink-body)' }}>
                <Icon name={ok ? 'check-circle' : 'x-circle'} size={16} style={{ color: ok ? 'var(--verified)' : 'var(--error)', flex: 'none' }} />{t}
              </span>
            ))}
          </>
        )}
        initialValues={{ name: 'Sample Hospital Lottery', sub_domain: 'samplehospital', heading: 'Win a lakeside home and support hospital care', subheading: 'Every ticket helps buy equipment for Sample Hospital.', cause: 'Your ticket funds new equipment for the emergency department at Sample Hospital.', sales_open: 'September 29, 2026', client: { name: 'Sample Hospital Foundation', province: 'BC' } }}
        onSubmit={(v) => setSubmitted(`onSubmit called for ${v.name}`)}
        onSave={save}
        isSaving={saving}
        lastSaved={saved}
        disabledAll={ro}
        isQaPage={mode === 'qa'}
        briefStatus={mode === 'qa' ? 2 : 1}
        header={(v) => <WizardHeader title={v.name} subtitle={v.client.name} />}
        notice={() => <WizardDeadline date="October 20, 2026" />}
      >
        <Wizard.Page label="Website" summary={(v) => (v.sub_domain ? `${v.sub_domain}.rafflenexus.com` : 'Web address missing')} description="We use this to build your raffle site and help it show up in search." validate={need([['name', 'Enter the raffle name'], ['sub_domain', 'Choose a web address']])}>
          <WizardSection title="Name and address" description="We use this to build the raffle site.">
            <Text name="name" label="Raffle name" readOnly={ro} />
            <Text name="sub_domain" label="Web address" hint="Letters, numbers and hyphens." readOnly={ro} />
          </WizardSection>
          <WizardSection title="Headline and story" description="The top of your raffle site.">
            <Text name="heading" label="Main heading" readOnly={ro} />
            <Text name="subheading" label="Subheading" readOnly={ro} />
            <Text name="cause" label="The cause" readOnly={ro} />
          </WizardSection>
        </Wizard.Page>
        <Wizard.Page label="Dates" summary={(v) => (v.sales_close && v.draw_at ? `Closes ${v.sales_close}` : 'Dates missing')} description="When ticket sales open and close, and when the draws happen." validate={need([['sales_close', 'Enter when sales close'], ['draw_at', 'Enter the draw date']])}>
          <WizardSection title="Ticket sales" description="*All dates are in Pacific time, local to British Columbia.">
            <Text name="sales_open" label="Sales open" readOnly={ro} />
            <Text name="sales_close" label="Sales close" readOnly={ro} />
          </WizardSection>
          <WizardSection title="Main draw" description="It must come after sales close.">
            <Text name="draw_at" label="Draw date" readOnly={ro} />
          </WizardSection>
        </Wizard.Page>
        <Wizard.Page label="Prizes" summary={(v) => v.prize || 'Grand prize missing'} description="Every prize, with a value and an image." validate={need([['prize', 'Enter the grand prize']])}>
          <WizardSection title="Grand prize"><Text name="prize" label="Prize title" readOnly={ro} /></WizardSection>
        </Wizard.Page>
        <Wizard.Page label="Rules of play" hide={(v) => ['BC', 'AB', 'MB'].includes(v.client.province)}>
          <p>Ontario raffles upload their rules here.</p>
        </Wizard.Page>
        <Wizard.Page label="Review and submit" summary={() => 'Check and submit'} hide={() => mode === 'qa'}>
          {(_m, v) => (
            <WizardSection title="Review and submit" description="Check each section. Edit anything from its step, then submit.">
              <p style={{ margin: 0 }}>{v.name}, at {v.sub_domain}.rafflenexus.com. Sales close {v.sales_close}; the draw is {v.draw_at}. Grand prize: {v.prize}.</p>
            </WizardSection>
          )}
        </Wizard.Page>
      </Wizard>
    </div>
  );
}
