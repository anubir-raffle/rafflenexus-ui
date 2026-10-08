import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field, Form } from 'react-final-form';
import toast from 'react-hot-toast';
import {
  BriefToolTip, DatePicker, DebouncingValidatingField, DropdownInput, FinalFormError, InputMasked, MaskedInput, TextArea, TextInput,
} from '../src/inputs';

vi.mock('react-hot-toast', () => { const toast = { success: vi.fn(), error: vi.fn() }; return { default: toast, toast }; });

const writeText = vi.fn(() => Promise.resolve());
beforeEach(() => {
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  // A desktop browser: MUI X renders the desktop pickers for a fine pointer (jsdom reports none).
  const base = window.matchMedia;
  window.matchMedia = ((q: string) => (q.includes('pointer: fine') ? { ...base(q), matches: true } : base(q))) as typeof window.matchMedia;
});

// A react-final-form form that reports its values, the way the brief form renders fields.
type Values = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
function TestForm({ initialValues = {}, children, onValues }: { initialValues?: Values; children: React.ReactNode; onValues?: (v: Values) => void }) {
  return (
    <Form onSubmit={() => {}} initialValues={initialValues} subscription={{ values: true }}
      render={({ values }) => { onValues?.(values); return <form>{children}</form>; }} />
  );
}

const PROVINCES = [{ label: 'British Columbia', value: 'BC' }, { label: 'Alberta', value: 'AB' }, { label: 'Ontario', value: 'ON' }];

describe('TextInput', () => {
  it('works at the brief-form call site: {...input} spread, meta, tooltip, error once touched', async () => {
    let values: Values = {};
    render(
      <TestForm onValues={(v) => { values = v; }}>
        <Field name="support_email" validate={(v) => (v && v.includes('@') ? undefined : 'Enter an email address.')}>
          {({ input, meta }) => (
            <TextInput {...input} meta={meta} label="Support Email" tooltip="This email will be displayed to users for support inquiries."
              error={meta.error && meta.touched} disabledAll={false} />
          )}
        </Field>
      </TestForm>,
    );
    const field = screen.getByLabelText('Support Email');
    expect(field).not.toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(field, 'help');
    expect(values.support_email).toBe('help');
    expect(screen.queryByText('Enter an email address.')).toBeNull(); // not touched yet
    await userEvent.tab();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Enter an email address.');
    expect(screen.getByRole('button', { name: 'About Support Email' })).toBeInTheDocument();
  });

  it('shows the tooltip from the info button', async () => {
    render(<TextInput label="Support Email" tooltip="Shown to ticket buyers." onChange={() => {}} />);
    await userEvent.hover(screen.getByRole('button', { name: 'About Support Email' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Shown to ticket buyers.');
  });

  it('passes the rest of its props to the MUI TextField and forwards its ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextInput ref={ref} label="Notes" onChange={() => {}} inputProps={{ 'data-testid': 'raw' }} name="notes" />);
    expect(screen.getByTestId('raw')).toBe(ref.current);
    expect(ref.current).toHaveAttribute('name', 'notes');
  });

  it('honours InputProps from the call site', () => {
    render(<TextInput label="Amount" onChange={() => {}} InputProps={{ startAdornment: <span>CA$</span> }} />);
    expect(screen.getByText('CA$')).toBeInTheDocument();
  });

  it('prefers the value prop, then input.value, then empty', () => {
    const { rerender } = render(<TextInput label="Name" value="From prop" input={{ value: 'From input', onChange: () => {} }} onChange={() => {}} />);
    expect(screen.getByLabelText('Name')).toHaveValue('From prop');
    rerender(<TextInput label="Name" input={{ value: 'From input', onChange: () => {} }} onChange={() => {}} />);
    expect(screen.getByLabelText('Name')).toHaveValue('From input');
  });

  it('defaults the label to "Input Label" and shows helper text over the error', () => {
    render(<TextInput helperText="Shown on your site." meta={{ touched: true, error: 'Required' }} onChange={() => {}} />);
    expect(screen.getByLabelText('Input Label')).toHaveAccessibleDescription('Shown on your site.');
  });

  it('toggles password visibility', async () => {
    render(<TextInput label="Password" type="password" showPasswordToggle onChange={() => {}} />);
    const field = screen.getByLabelText('Password');
    expect(field).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(field).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(field).toHaveAttribute('type', 'password');
  });

  it('has no toggle on a password without showPasswordToggle', () => {
    render(<TextInput label="Password" type="password" onChange={() => {}} />);
    expect(screen.queryByRole('button', { name: /password/ })).toBeNull();
  });

  it('number: honours min and max and rounds to `decimal` places', () => {
    const onChange = vi.fn();
    render(<TextInput label="Ticket price" type="number" min={1} max={500} decimal={2} onChange={onChange} />);
    const field = screen.getByLabelText('Ticket price');
    expect(field).toHaveAttribute('type', 'number');
    expect(field).toHaveAttribute('min', '1');
    expect(field).toHaveAttribute('max', '500');
    fireEvent.change(field, { target: { value: '12.5' } });
    expect(onChange).toHaveBeenLastCalledWith('12.50');
  });

  it('disabled: locked, and a click copies nothing', async () => {
    render(<TextInput label="Licence" value="171012" disabled onChange={() => {}} />);
    expect(screen.getByLabelText('Licence')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Licence').closest('.rnc-mui-field')!.lastElementChild!);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('disabledAll: locked, and a click copies the value with a "Copied!" toast', async () => {
    render(<TextInput label="Support Email" value="help@example.org" disabledAll onChange={() => {}} />);
    const field = screen.getByLabelText('Support Email');
    expect(field).toBeDisabled();
    expect(field.closest('.rnc-mui-field')).toHaveClass('is-review');
    fireEvent.click(field.closest('.rnc-mui-field')!.lastElementChild!);
    expect(writeText).toHaveBeenCalledWith('help@example.org');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Copied!'));
  });

  it('disabledAll: falls back to execCommand without the Clipboard API', () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const exec = vi.fn(() => true);
    document.execCommand = exec as unknown as typeof document.execCommand;
    render(<TextInput label="Support Email" value="help@example.org" disabledAll onChange={() => {}} />);
    fireEvent.click(screen.getByLabelText('Support Email').closest('.rnc-mui-field')!.lastElementChild!);
    expect(exec).toHaveBeenCalledWith('copy');
    expect(toast.success).toHaveBeenCalledWith('Copied!');
  });

  it('type="dropdown": picks an option and stores its value; clearing stores null', async () => {
    let values: Values = {};
    render(
      <TestForm onValues={(v) => { values = v; }}>
        <Field name="province">
          {({ input, meta }) => <TextInput {...input} input={input} meta={meta} type="dropdown" label="Province" options={PROVINCES} tooltip="Where the raffle is licensed." />}
        </Field>
      </TestForm>,
    );
    const combo = screen.getByRole('combobox', { name: 'Province' });
    await userEvent.click(combo);
    await userEvent.click(await screen.findByRole('option', { name: 'Alberta' }));
    expect(values.province).toBe('AB');
    expect(combo).toHaveValue('Alberta');
    expect(screen.getByRole('button', { name: 'About Province' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(values.province ?? null).toBeNull();
  });

  it('type="dropdown" in review mode copies the option label', async () => {
    render(<TextInput type="dropdown" label="Province" options={PROVINCES} value="ON" input={{ value: 'ON', onChange: () => {} }} disabledAll />);
    const combo = screen.getByRole('combobox', { name: 'Province' });
    expect(combo).toBeDisabled();
    fireEvent.click(combo.closest('.rnc-mui-field')!.lastElementChild!);
    expect(writeText).toHaveBeenCalledWith('Ontario');
  });
});

describe('DropdownInput', () => {
  it('works on its own with input and meta, and shows the error once touched', async () => {
    const onChange = vi.fn();
    render(<DropdownInput label="Province" options={PROVINCES} value="BC" input={{ value: 'BC', onChange }} meta={{ touched: true, error: 'Choose a province.' }} helperText="Choose a province." />);
    const combo = screen.getByRole('combobox', { name: 'Province' });
    expect(combo).toHaveValue('British Columbia');
    expect(combo).toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(combo);
    await userEvent.click(await screen.findByRole('option', { name: 'Ontario' }));
    expect(onChange).toHaveBeenCalledWith('ON');
  });

  it('keeps the same id across renders', () => {
    const { rerender } = render(<DropdownInput label="Province" options={PROVINCES} input={{ onChange: () => {} }} />);
    const id = screen.getByRole('combobox').id;
    rerender(<DropdownInput label="Province" options={PROVINCES} input={{ onChange: () => {} }} value="AB" />);
    expect(screen.getByRole('combobox').id).toBe(id);
  });
});

describe('InputMasked', () => {
  it('shows the prefix, strips spaces and stores the value without the prefix', async () => {
    let values: Values = {};
    render(
      <TestForm onValues={(v) => { values = v; }}>
        <Field name="support_website">
          {({ input, meta }) => <InputMasked {...input} input={input} meta={meta} error={meta.error && meta.touched} label="Organization URL" maxLength={200} pre="https://" disabledAll={false} />}
        </Field>
      </TestForm>,
    );
    expect(screen.getByText('https://')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Organization URL'), 'example .org');
    expect(values.support_website).toBe('example.org');
  });

  it('defaults the label to "Label" and shows meta.error', () => {
    render(<InputMasked input={{ value: '', onChange: () => {} }} meta={{ error: 'Enter a percentage.' }} post="%" />);
    expect(screen.getByLabelText('Label')).toHaveAccessibleDescription('Enter a percentage.');
  });

  it('with a suffix, stops at maxLength', () => {
    const onChange = vi.fn();
    render(<InputMasked label="Share" input={{ value: '12', onChange }} post="%" maxLength={3} />);
    fireEvent.change(screen.getByLabelText('Share'), { target: { value: '123' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Share'), { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('review mode copies prefix + value + suffix', () => {
    render(<InputMasked label="Facebook Page" input={{ value: 'samplecause', onChange: () => {} }} pre="https://facebook.com/" disabledAll />);
    fireEvent.click(screen.getByLabelText('Facebook Page').closest('.rnc-mui-field')!.lastElementChild!);
    expect(writeText).toHaveBeenCalledWith('https://facebook.com/samplecause');
  });
});

describe('MaskedInput', () => {
  it('renders through TextInput with the mask showing', () => {
    render(<MaskedInput input={{ name: 'support_phone', value: '', onChange: () => {} }} meta={{}} label="Support Phone" tooltip="Shown to buyers."
      maskOptions={{ mask: '(___) ___-____', placeholder: '(123) 456-7890' } as any} />); // eslint-disable-line @typescript-eslint/no-explicit-any
    const field = screen.getByLabelText('Support Phone');
    expect(field).toHaveAttribute('name', 'support_phone');
    expect(screen.getByRole('button', { name: 'About Support Phone' })).toBeInTheDocument();
  });
});

describe('DatePicker', () => {
  it('date only: shows the display format and copies SQL format when disabled', () => {
    render(<DatePicker dateOnly label="Draw date" input={{ value: '2027-02-01 00:00:00', onChange: () => {} }} disabled />);
    const field = screen.getByLabelText('Draw date');
    expect(field).toHaveValue('February 01, 2027');
    fireEvent.click(field.closest('.rnc-mui-field')!.lastElementChild!);
    expect(writeText).toHaveBeenCalledWith('2027-02-01');
  });

  it('date and time: copies "YYYY-MM-DD HH:mm:ss"; enabled fields copy nothing', () => {
    const { rerender } = render(<DatePicker label="Sales close" input={{ value: '2027-01-31 23:59:00', onChange: () => {} }} disabled />);
    expect(screen.getByLabelText('Sales close')).toHaveValue('Jan 31, 2027 11:59 PM');
    fireEvent.click(screen.getByLabelText('Sales close').closest('.rnc-mui-field')!.lastElementChild!);
    expect(writeText).toHaveBeenCalledWith('2027-01-31 23:59:00');
    writeText.mockClear();
    rerender(<DatePicker label="Sales close" input={{ value: '2027-01-31 23:59:00', onChange: () => {} }} />);
    fireEvent.click(screen.getByLabelText('Sales close').closest('.rnc-mui-field')!.lastElementChild!);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('date and time: a pasted SQL date-time is stored and the field is touched', () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(<DatePicker label="Sales open" input={{ value: '', onChange, onBlur }} />);
    fireEvent.paste(screen.getByLabelText('Sales open'), { clipboardData: { getData: () => '2026-11-01 09:00:00' } });
    expect(onChange).toHaveBeenCalledWith('2026-11-01 09:00:00');
    expect(onBlur).toHaveBeenCalled();
  });

  it('shows meta.error under the field unless hideHelperText', () => {
    const { rerender } = render(<DatePicker label="Sales open" input={{ value: '', onChange: () => {} }} meta={{ error: 'Pick a start date.' }} />);
    expect(screen.getByLabelText('Sales open')).toHaveAccessibleDescription('Pick a start date.');
    rerender(<DatePicker label="Sales open" input={{ value: '', onChange: () => {} }} meta={{ error: 'Pick a start date.' }} hideHelperText helperText="Pacific time." />);
    expect(screen.getByLabelText('Sales open')).toHaveAccessibleDescription('Pacific time.');
  });

  it('small: hides the label but keeps it for screen readers', () => {
    render(<DatePicker small label="From" input={{ value: '', onChange: () => {} }} />);
    expect(screen.queryByText('From', { selector: 'label' })).toBeNull();
    expect(screen.getByLabelText('From')).toBeInTheDocument();
  });

  it('a picked day is stored as "YYYY-MM-DD 00:00:00"', async () => {
    const onChange = vi.fn();
    render(<DatePicker dateOnly label="Draw date" input={{ value: '2027-02-01 00:00:00', onChange }} />);
    await userEvent.click(screen.getByRole('button', { name: /choose date/i }));
    await userEvent.click(await screen.findByRole('gridcell', { name: '15' }));
    expect(onChange).toHaveBeenCalledWith('2027-02-15 00:00:00');
  });
});

describe('TextArea', () => {
  it('is a labelled, growing multi-line field that reports its value', async () => {
    const onChange = vi.fn();
    render(<TextArea label="Prize description" onChange={onChange} />);
    const box = screen.getByLabelText('Prize description');
    expect(box.tagName).toBe('TEXTAREA');
    await userEvent.type(box, 'Hi');
    expect(onChange).toHaveBeenLastCalledWith('i');
  });
});

describe('FinalFormError', () => {
  it('shows the error, or only once touched with notTouched', () => {
    const { rerender, container } = render(<FinalFormError meta={{ error: 'Required' }} />);
    expect(screen.getByText('Required')).toHaveClass('error', 'd-block', 'rnc-field-error');
    rerender(<FinalFormError meta={{ error: 'Required', touched: false }} notTouched inline />);
    expect(container).toBeEmptyDOMElement();
    rerender(<FinalFormError meta={{ error: 'Required', touched: true }} notTouched inline />);
    expect(screen.getByText('Required')).toHaveClass('inline');
  });
});

describe('BriefToolTip', () => {
  it('opens rich content from its info button', async () => {
    render(<BriefToolTip><p>Example of where the support contact info appears.</p></BriefToolTip>);
    await userEvent.hover(screen.getByRole('button', { name: 'More information' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Example of where the support contact info appears.');
  });
});

describe('DebouncingValidatingField', () => {
  it('validates once, after typing stops', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const validate = vi.fn((_value: unknown) => undefined); // eslint-disable-line @typescript-eslint/no-unused-vars
    render(
      <TestForm>
        <DebouncingValidatingField name="subdomain" debounce={300} validate={validate}>
          {({ input }: { input: any }) => <input aria-label="Subdomain" {...input} />}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </DebouncingValidatingField>
      </TestForm>,
    );
    validate.mockClear();
    const field = screen.getByLabelText('Subdomain');
    fireEvent.change(field, { target: { value: 'a' } });
    fireEvent.change(field, { target: { value: 'ab' } });
    fireEvent.change(field, { target: { value: 'abc' } });
    expect(validate).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(350); });
    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate.mock.calls[0][0]).toBe('abc');
  });
});
