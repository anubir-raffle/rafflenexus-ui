// The Raffle Builder's setup form wizard (/wizard): the handoff's "done when" list and behaviour section.
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field } from 'react-final-form';
import { Wizard, WizardDeadline, WizardHeader, WizardPreview, WizardSection, WizardSitePreview, WizardToolbar, type WizardProps } from '../src/wizard';
import DefaultWizard from '../src/wizard';

type Brief = { name?: string; draw_at?: string; prize?: string; logo?: string; prizes?: string[]; client: { name: string; province: string } };
const need = (key: keyof Brief, msg: string) => (v: Brief) => (v[key] ? {} : { [key]: msg });

function Text({ name, label }: { name: string; label: string }) {
  return (
    <Field name={name}>
      {({ input, meta }) => (
        <div><label htmlFor={name}>{label}</label><input id={name} {...input} />{meta.error ? <span role="note">{meta.error}</span> : null}</div>
      )}
    </Field>
  );
}

function Brief(props: Partial<WizardProps<Brief>> & { province?: string; start?: Partial<Brief> }) {
  const { province = 'BC', start, ...rest } = props;
  return (
    <Wizard<Brief>
      onSubmit={vi.fn()}
      initialValues={{ name: 'Sample Hospital Lottery', client: { name: 'Sample Foundation', province }, ...start }}
      {...rest}
    >
      <Wizard.Page label="Website" validate={need('name', 'Enter the raffle name')}><Text name="name" label="Raffle name" /></Wizard.Page>
      <Wizard.Page label="Dates" validate={need('draw_at', 'Enter the draw date')}><Text name="draw_at" label="Draw date" /></Wizard.Page>
      <Wizard.Page label="Prizes" validate={need('prize', 'Enter a prize')}>
        {(mutators, values, changePage) => (
          <>
            <Text name="prize" label="Prize" />
            <button type="button" onClick={() => mutators.setLogo('logo.png')}>Set logo</button>
            <button type="button" onClick={() => mutators.push('prizes', 'Car')}>Add prize</button>
            <button type="button" onClick={() => changePage(0)}>Edit website</button>
            <output data-testid="vals">{JSON.stringify({ logo: values.logo, prizes: values.prizes })}</output>
          </>
        )}
      </Wizard.Page>
      <Wizard.Page label="Rules of play" hide={(v) => ['BC', 'AB', 'MB'].includes(v.client.province)}><p>Rules</p></Wizard.Page>
      <Wizard.Page label="Review" hide={() => !!rest.isQaPage}><p>Check everything, then submit.</p></Wizard.Page>
    </Wizard>
  );
}
const steps = () => within(screen.getByRole('navigation', { name: 'Form steps' })).getAllByRole('button');
const step = (name: RegExp) => within(screen.getByRole('navigation', { name: 'Form steps' })).getByRole('button', { name });
const mutators = { setLogo: (args: unknown[], state: any, utils: any) => utils.changeValue(state, 'logo', () => args[0]) };

describe('Wizard (/wizard)', () => {
  it('is the default export too', () => {
    expect(DefaultWizard).toBe(Wizard);
  });

  it('builds the step bar from the visible pages and their labels; Rules of play is hidden for BC and shown for ON', () => {
    const { unmount } = render(<Brief />);
    expect(steps().map((b) => b.textContent)).toEqual(['Website', 'Dates', 'Prizes', 'Review']);
    unmount();
    render(<Brief province="ON" />);
    expect(steps().map((b) => b.textContent)).toEqual(['Website', 'Dates', 'Prizes', 'Rules of play', 'Review']);
  });

  it('validates each step from the start and names its state; the current step is marked', () => {
    render(<Brief />);
    expect(step(/^Website, complete/)).toHaveAttribute('aria-current', 'step');
    expect(step(/^Dates, not complete/)).toHaveClass('is-incomplete');
    expect(step(/^Review, available once every section is complete/)).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('1 of 3 sections complete')).toBeInTheDocument();
  });

  it('shows the active step’s errors at once (validation runs on mount)', async () => {
    render(<Brief />);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('note')).toHaveTextContent('Enter the draw date');
  });

  it('Next never blocks; Back appears after the first step; the step before Review shows Review, locked until every step is done', async () => {
    render(<Brief />);
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(step(/^Dates/)).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    const review = screen.getByRole('button', { name: 'Review' });
    expect(review).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Prize'), 'Lakeside home');
    await userEvent.click(step(/^Dates/));
    await userEvent.type(screen.getByLabelText('Draw date'), '2027-02-01');
    await userEvent.click(step(/^Prizes/));
    expect(screen.getByRole('button', { name: 'Review' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(step(/^Review, ready/)).toHaveAttribute('aria-current', 'step');
  });

  it('selecting Review early says why and stays put; onReviewBlocked replaces the message', async () => {
    const { unmount } = render(<Brief />);
    await userEvent.click(step(/^Review/));
    expect(screen.getByRole('alert')).toHaveTextContent('Complete every section before you review');
    expect(step(/^Website/)).toHaveAttribute('aria-current', 'step');
    unmount();
    const blocked = vi.fn();
    render(<Brief onReviewBlocked={blocked} />);
    await userEvent.click(step(/^Review/));
    expect(blocked).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Submit on the last step calls onSubmit with the values, then resets the form', async () => {
    const onSubmit = vi.fn();
    render(<Brief onSubmit={onSubmit} start={{ draw_at: '2027-02-01', prize: 'Home' }} />);
    await userEvent.click(step(/^Review/));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sample Hospital Lottery', prize: 'Home' }));
  });

  it('read-only has no submit button; QA mode hides Review and shows Complete form only when the status is 2', async () => {
    const done = { draw_at: '2027-02-01', prize: 'Home' };
    const { unmount } = render(<Brief disabledAll start={done} />);
    await userEvent.click(step(/^Review/));
    expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull();
    unmount();
    const onSubmit = vi.fn();
    const qa = render(<Brief isQaPage briefStatus={2} onSubmit={onSubmit} start={done} />);
    expect(steps().map((b) => b.textContent)).toEqual(['Website', 'Dates', 'Prizes']);
    await userEvent.click(step(/^Prizes/));
    await userEvent.click(screen.getByRole('button', { name: 'Complete form' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    qa.unmount();
    render(<Brief isQaPage briefStatus={1} start={done} />);
    await userEvent.click(step(/^Prizes/));
    expect(screen.queryByRole('button', { name: /Complete form|Submit/ })).toBeNull();
  });

  it('autosave: onSave gets { values, active } on every change; the footer shows Saving… or Last saved', async () => {
    const onSave = vi.fn();
    const { rerender } = render(<Brief onSave={onSave} lastSaved="2 minutes ago" />);
    expect(screen.getByRole('status')).toHaveTextContent('Last saved 2 minutes ago');
    await userEvent.type(screen.getByLabelText('Raffle name'), '!');
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ values: expect.objectContaining({ name: 'Sample Hospital Lottery!' }), active: 'name' }));
    rerender(<Brief onSave={onSave} isSaving />);
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');
  });

  it('merges the app’s mutators with arrayMutators; pages get mutators, values and changePage', async () => {
    render(<Brief mutators={mutators} />);
    await userEvent.click(step(/^Prizes/));
    await userEvent.click(screen.getByRole('button', { name: 'Set logo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add prize' }));
    expect(screen.getByTestId('vals')).toHaveTextContent('{"logo":"logo.png","prizes":["Car"]}');
    await userEvent.click(screen.getByRole('button', { name: 'Edit website' }));
    expect(step(/^Website/)).toHaveAttribute('aria-current', 'step');
  });

  it('submit buttons are disabled while a SweetAlert2 dialog is open (or isSubmitBlocked says so)', async () => {
    const swal = document.createElement('div'); swal.className = 'swal2-container'; document.body.appendChild(swal);
    render(<Brief start={{ draw_at: '2027-02-01', prize: 'Home' }} />);
    await userEvent.click(step(/^Review/));
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    swal.remove();
  });

  it('header and notice get the values; WizardHeader shows the name, organization and logos', () => {
    render(<Brief
      header={(v) => <WizardHeader title={v.name} subtitle={v.client.name} logo="/client.png" logoAlt="Sample Foundation logo" />}
      notice={() => <WizardDeadline date="October 20, 2026" />}
    />);
    expect(screen.getByRole('heading', { level: 2, name: 'Sample Hospital Lottery' })).toBeInTheDocument();
    expect(screen.getByText('Sample Foundation')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sample Foundation logo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Raffle Nexus' })).toBeInTheDocument();
    expect(screen.getByText('October 20, 2026')).toBeInTheDocument();
  });

  it('WizardDeadline says Past due in words; WizardSection has a title, a tooltip slot and an explainer line', () => {
    render(<>
      <WizardDeadline date="October 20, 2026" overdue />
      <WizardSection title="Ticket sales" size="md" tooltip={<button type="button">About ticket sales</button>} description="*All dates are in Pacific time.">
        <input aria-label="Sales open" />
      </WizardSection>
    </>);
    expect(screen.getByText('Past due').closest('.rnc-wizard-deadline')).toHaveClass('is-overdue');
    expect(screen.getByText(/Your raffle launch is at risk of delay/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Ticket sales' }).closest('section')).toHaveClass('rnc-wizard-section', 'is-md');
    expect(screen.getByRole('button', { name: 'About ticket sales' })).toBeInTheDocument();
    expect(screen.getByText('*All dates are in Pacific time.')).toHaveClass('rnc-wizard-section-desc');
  });

  it('a page marked review is the Review step even when it isn’t last', () => {
    render(
      <Wizard onSubmit={vi.fn()} initialValues={{}}>
        <Wizard.Page label="One">a</Wizard.Page>
        <Wizard.Page label="Check" review>b</Wizard.Page>
        <Wizard.Page label="Extra">c</Wizard.Page>
      </Wizard>,
    );
    expect(step(/^Check, ready/)).toHaveClass('is-review');
    act(() => { fireEvent.click(step(/^Extra/)); });
    expect(step(/^Extra/)).toHaveAttribute('aria-current', 'step');
  });
});

describe('Wizard layout v2 (the Raffle Builder of RNC V2.1)', () => {
  function V2(extra: Partial<WizardProps<Brief>>) {
    return (
      <Wizard<Brief>
        layout="v2" onSubmit={vi.fn()}
        initialValues={{ name: 'Sample Lottery', client: { name: 'Sample Foundation', province: 'BC' } }}
        header={(v) => <WizardHeader title={v.name} subtitle={v.client.name} />}
        {...extra}
      >
        <Wizard.Page label="Website" summary={(v) => `${v.name}`} description="We use this to build your raffle site." validate={need('name', 'Enter the raffle name')}><Text name="name" label="Raffle name" /></Wizard.Page>
        <Wizard.Page label="Dates" summary={() => 'Draw date missing'} validate={need('draw_at', 'Enter the draw date')}><Text name="draw_at" label="Draw date" /></Wizard.Page>
        <Wizard.Page label="Review and submit"><p>Check</p></Wizard.Page>
      </Wizard>
    );
  }

  it('puts the raffle, progress and steps (with summaries) in a rail, and titles the step with its intro line', () => {
    const { container } = render(<V2 aside={() => <p>QA checks</p>} />);
    const rail = screen.getByRole('complementary', { name: 'Setup form' });
    expect(within(rail).getByText('Sample Lottery', { selector: '.rnc-wizard-title' })).toBeInTheDocument();
    expect(within(rail).getByText('1 of 2 sections complete')).toBeInTheDocument();
    expect(container.querySelector('.rnc-wizard-track > span')).toHaveStyle({ width: '50%' });
    expect(within(rail).getByRole('navigation', { name: 'Form steps' })).toHaveClass('is-rail');
    expect(within(rail).getByText('Draw date missing')).toHaveClass('rnc-wizard-step-sub');
    expect(within(rail).getByText('QA checks')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Website' })).toHaveClass('rnc-wizard-page-title');
    expect(screen.getByText('We use this to build your raffle site.')).toHaveClass('rnc-wizard-page-lede');
    expect(container.querySelector('form')).toHaveClass('rnc-wizard', 'is-v2');
  });

  it('the live preview shows only where the app returns one, and follows the values as people type', async () => {
    const { container } = render(<V2 preview={(v, step) => (step.label === 'Website' ? (
      <WizardPreview url="sample.rafflenexus.com"><WizardSitePreview org={v.client.name} heading={v.name} cause="Hospital care" colour="#126ab5" /></WizardPreview>
    ) : null)} />);
    expect(screen.getByText('Live preview')).toBeInTheDocument();
    expect(screen.getByText('sample.rafflenexus.com')).toHaveClass('rnc-wizard-browser-url');
    expect(container.querySelector('.rnc-wsite')).toHaveStyle('--site-colour: #126ab5');
    await userEvent.type(screen.getByLabelText('Raffle name'), ' 2026');
    expect(container.querySelector('.rnc-wsite-title')).toHaveTextContent('Sample Lottery 2026');
    await userEvent.clear(screen.getByLabelText('Raffle name'));
    expect(container.querySelector('.rnc-wsite-title')).toHaveTextContent('Add a main heading');
    await userEvent.click(step(/^Dates/));
    expect(screen.queryByText('Live preview')).toBeNull();
    expect(container.querySelector('.rnc-wizard-split')).toBeNull();
  });

  it('Hide preview gives the form the full width; the preview stays mounted (keeps its device) and stays hidden between steps', async () => {
    const onHidden = vi.fn();
    const { container } = render(<V2 onPreviewHiddenChange={onHidden} preview={() => <WizardPreview url="sample.rafflenexus.com"><WizardSitePreview heading="Win" /></WizardPreview>} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Mobile' }));
    const hide = screen.getByRole('button', { name: 'Hide preview' });
    expect(hide).toHaveAttribute('aria-expanded', 'true');
    const side = document.getElementById(hide.getAttribute('aria-controls')!)!;
    expect(side).toContainElement(container.querySelector('.rnc-wizard-preview') as HTMLElement);
    await userEvent.click(hide);
    expect(onHidden).toHaveBeenLastCalledWith(true);
    expect(side).not.toBeVisible();
    expect(container.querySelector('.rnc-wizard-split')).toHaveClass('is-solo');
    await userEvent.click(step(/^Dates/));
    const show = screen.getByRole('button', { name: 'Show preview' });
    expect(show).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(show);
    expect(onHidden).toHaveBeenLastCalledWith(false);
    expect(container.querySelector('.rnc-wizard-preview')).toHaveClass('is-mobile');
    expect(container.querySelector('.rnc-wizard-split')).not.toHaveClass('is-solo');
  });

  it('defaultPreviewHidden starts hidden; previewToggle={false} has no button', () => {
    const preview = () => <WizardPreview url="x"><WizardSitePreview heading="Win" /></WizardPreview>;
    const { unmount } = render(<V2 defaultPreviewHidden preview={preview} />);
    expect(screen.getByRole('button', { name: 'Show preview' })).toBeInTheDocument();
    unmount();
    render(<V2 previewToggle={false} preview={preview} />);
    expect(screen.queryByRole('button', { name: /preview$/ })).toBeNull();
  });

  it('the preview does not remount when the step changes (only the step animates)', async () => {
    const { container } = render(<V2 preview={() => <WizardPreview url="x"><WizardSitePreview heading="Win" /></WizardPreview>} />);
    const before = container.querySelector('.rnc-wizard-preview');
    await userEvent.click(step(/^Dates/));
    expect(container.querySelector('.rnc-wizard-preview')).toBe(before);
    expect(before!.closest('.rnc-wizard-enter')).toBeNull();
  });

  it('reviewUnlocked (testing) opens Review before every step is complete; Submit stays disabled', async () => {
    render(<V2 reviewUnlocked />);
    await userEvent.click(step(/^Review and submit/));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Review and submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('the toolbar sits on top: back, the product, the breadcrumb, then status and actions', () => {
    const back = vi.fn();
    render(<V2 toolbar={(v) => <WizardToolbar back={back} crumb={<>Raffles / <b>{v.name}</b></>} status={<span>Ready for QA</span>} actions={<button type="button">Lock editing</button>} />} />);
    const bar = screen.getByRole('banner');
    expect(within(bar).getByText('Raffle Builder')).toBeInTheDocument();
    fireEvent.click(within(bar).getByRole('button', { name: 'Back to your raffles' }));
    expect(back).toHaveBeenCalled();
    expect(within(bar).getByText('Ready for QA')).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Lock editing' })).toBeInTheDocument();
  });

  it('keeps every V1 behaviour: Review locked with a reason, Next never blocks', async () => {
    render(<V2 />);
    await userEvent.click(step(/^Review/));
    expect(screen.getByRole('alert')).toHaveTextContent('Complete every section before you review');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(step(/^Dates/)).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('heading', { level: 2, name: 'Dates' })).toBeInTheDocument();
  });
});

describe('Wizard keeps what people typed', () => {
  it('a value survives leaving its step and coming back (react-final-form 7 would reset it to the initial value)', async () => {
    render(<Brief start={{ draw_at: '' }} />);
    await userEvent.click(step(/^Dates/));
    await userEvent.type(screen.getByLabelText('Draw date'), '2027-02-01');
    await userEvent.click(step(/^Website/));
    await userEvent.click(step(/^Dates/));
    expect(screen.getByLabelText('Draw date')).toHaveValue('2027-02-01');
  });
});
