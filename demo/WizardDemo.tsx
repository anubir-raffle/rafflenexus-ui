import { useRef, useState } from 'react';
import { Field } from 'react-final-form';
import { Wizard, WizardDeadline, WizardHeader, WizardSection } from '../src/wizard';
import { TextField } from '../src';

type Brief = { name?: string; sub_domain?: string; sales_open?: string; sales_close?: string; draw_at?: string; prize?: string; client: { name: string; province: string } };
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('just now');
  const [submitted, setSubmitted] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const save = () => { setSaving(true); clearTimeout(timer.current); timer.current = setTimeout(() => { setSaving(false); setSaved('just now'); }, 700); };
  const ro = mode === 'readonly';
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="rnc-row">
        {(['normal', 'qa', 'readonly'] as const).map((m) => (
          <button key={m} type="button" className="rnc-btn rnc-btn-secondary rnc-btn-sm" aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m === 'normal' ? 'Normal' : m === 'qa' ? 'QA mode (status 2)' : 'Read-only'}
          </button>
        ))}
        <span className="rnc-field-hint">{submitted}</span>
      </div>
      <Wizard<Brief>
        key={mode}
        initialValues={{ name: 'Sample Hospital Lottery', sub_domain: 'samplehospital', sales_open: 'September 29, 2026', client: { name: 'Sample Hospital Foundation', province: 'BC' } }}
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
        <Wizard.Page label="Website" validate={need([['name', 'Enter the raffle name'], ['sub_domain', 'Choose a web address']])}>
          <WizardSection title="Name and address" description="We use this to build the raffle site.">
            <Text name="name" label="Raffle name" readOnly={ro} />
            <Text name="sub_domain" label="Web address" hint="Letters, numbers and hyphens." readOnly={ro} />
          </WizardSection>
        </Wizard.Page>
        <Wizard.Page label="Dates" validate={need([['sales_close', 'Enter when sales close'], ['draw_at', 'Enter the draw date']])}>
          <WizardSection title="Ticket sales" description="*All dates are in Pacific time, local to British Columbia.">
            <Text name="sales_open" label="Sales open" readOnly={ro} />
            <Text name="sales_close" label="Sales close" readOnly={ro} />
          </WizardSection>
          <WizardSection title="Main draw" description="It must come after sales close.">
            <Text name="draw_at" label="Draw date" readOnly={ro} />
          </WizardSection>
        </Wizard.Page>
        <Wizard.Page label="Prizes" validate={need([['prize', 'Enter the grand prize']])}>
          <WizardSection title="Grand prize"><Text name="prize" label="Prize title" readOnly={ro} /></WizardSection>
        </Wizard.Page>
        <Wizard.Page label="Rules of play" hide={(v) => ['BC', 'AB', 'MB'].includes(v.client.province)}>
          <p>Ontario raffles upload their rules here.</p>
        </Wizard.Page>
        <Wizard.Page label="Review" hide={() => mode === 'qa'}>
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
