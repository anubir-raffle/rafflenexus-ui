import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox, Dropdown, ErrorSummary, RadioGroup, Select, Switch, TextArea, TextField } from '../src';

describe('TextField', () => {
  it('ties the label, hint and error to the input', () => {
    render(<TextField label="Email" type="email" hint="We send your tickets here." error="Enter an email address like name@example.com." />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('We send your tickets here. Enter an email address like name@example.com.');
    expect(input.closest('.rnc-field')).toHaveClass('is-invalid');
  });

  it('is valid and undescribed without a hint or error, and marks optional fields', () => {
    render(<TextField label="Phone" optional />);
    const input = screen.getByLabelText('Phone (optional)');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('accepts typing and keeps a caller-supplied id', async () => {
    const onChange = vi.fn();
    render(<TextField label="Full name" id="name" onChange={onChange} />);
    const input = screen.getByLabelText('Full name');
    expect(input).toHaveAttribute('id', 'name');
    await userEvent.type(input, 'Jordan');
    expect(input).toHaveValue('Jordan');
    expect(onChange).toHaveBeenCalledTimes(6);
  });

  it('gives each field its own id', () => {
    render(<><TextField label="First" /><TextField label="Second" /></>);
    expect(screen.getByLabelText('First').id).not.toBe(screen.getByLabelText('Second').id);
  });
});

describe('TextArea', () => {
  it('is a labelled textarea', async () => {
    render(<TextArea label="Message" optional hint="Tell us about your raffle." />);
    const box = screen.getByLabelText('Message (optional)');
    expect(box.tagName).toBe('TEXTAREA');
    await userEvent.type(box, 'Hello');
    expect(box).toHaveValue('Hello');
  });
});

describe('Select', () => {
  it('renders a placeholder and options, and reports the choice', async () => {
    const onChange = vi.fn();
    render(<Select label="Province" placeholder="Choose a province" options={[{ value: 'BC', label: 'British Columbia' }, { value: 'AB', label: 'Alberta' }]} onChange={onChange} />);
    const select = screen.getByLabelText('Province');
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Choose a province', 'British Columbia', 'Alberta']);
    await userEvent.selectOptions(select, 'AB');
    expect(select).toHaveValue('AB');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows an error', () => {
    render(<Select label="Province" error="Choose your province." options={[{ value: 'BC', label: 'BC' }]} />);
    expect(screen.getByLabelText('Province')).toHaveAccessibleDescription('Choose your province.');
  });
});

describe('Checkbox', () => {
  it('toggles when the label is clicked and links its error', async () => {
    render(<Checkbox label="I agree to the rules of play" error="Agree to the rules to continue." />);
    const box = screen.getByRole('checkbox', { name: 'I agree to the rules of play' });
    expect(box).toHaveAccessibleDescription('Agree to the rules to continue.');
    await userEvent.click(screen.getByText('I agree to the rules of play'));
    expect(box).toBeChecked();
  });
});

describe('RadioGroup', () => {
  function Controlled({ onChange }: { onChange: (v: string) => void }) {
    const [value, setValue] = useState('email');
    return <RadioGroup legend="Ticket delivery" name="del" value={value} onChange={(v) => { setValue(v); onChange(v); }}
      options={[{ value: 'email', label: 'eTickets by email' }, { value: 'mail', label: 'Paper tickets by mail' }]} />;
  }

  it('groups radios under a legend and reports changes', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Ticket delivery' });
    expect(within(group).getByRole('radio', { name: 'eTickets by email' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Paper tickets by mail' }));
    expect(onChange).toHaveBeenCalledWith('mail');
    expect(screen.getByRole('radio', { name: 'Paper tickets by mail' })).toBeChecked();
  });
});

describe('Switch', () => {
  function Setting() {
    const [on, setOn] = useState(false);
    return <Switch label="Show the live jackpot on the site" checked={on} onChange={setOn} />;
  }

  it('is a switch that flips with a click or the keyboard', async () => {
    render(<Setting />);
    const sw = screen.getByRole('switch', { name: 'Show the live jackpot on the site' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    sw.focus();
    await userEvent.keyboard(' ');
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('does nothing when disabled', async () => {
    const onChange = vi.fn();
    render(<Switch label="Locked" checked={false} onChange={onChange} disabled />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ErrorSummary', () => {
  it('takes focus, counts the problems and links to each field', async () => {
    render(<><ErrorSummary errors={[{ fieldId: 'email', message: 'Enter your email.' }, { fieldId: 'prov', message: 'Choose your province.' }]} />
      <TextField label="Email" id="email" /><TextField label="Province" id="prov" /></>);
    const summary = screen.getByRole('alert');
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole('heading')).toHaveTextContent('Check 2 things before you continue');
    await userEvent.click(screen.getByRole('link', { name: 'Choose your province.' }));
    expect(screen.getByLabelText('Province')).toHaveFocus();
  });

  it('renders nothing when there are no errors', () => {
    const { container } = render(<ErrorSummary errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Dropdown', () => {
  const setup = () => {
    const csv = vi.fn(), pdf = vi.fn(), later = vi.fn();
    render(<><Dropdown label="Export report" items={[
      { label: 'Download CSV', onSelect: csv, icon: 'receipt' },
      { label: 'Download PDF', onSelect: pdf },
      { label: 'Schedule a weekly export', onSelect: later, disabled: true },
    ]} /><button type="button">Outside</button></>);
    return { csv, pdf, later, trigger: screen.getByRole('button', { name: 'Export report' }) };
  };

  it('opens on click and closes on a second click', async () => {
    const { trigger } = setup();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Download CSV' })).toHaveFocus();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves with the arrow keys, Home and End, and wraps around', async () => {
    const { trigger } = setup();
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Download CSV' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Download PDF' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Schedule a weekly export' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Download CSV' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Schedule a weekly export' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'Download CSV' })).toHaveFocus();
  });

  it('opens on the last item with ArrowUp', async () => {
    const { trigger } = setup();
    trigger.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Schedule a weekly export' })).toHaveFocus();
  });

  it('closes with Escape and returns focus to the button', async () => {
    const { trigger } = setup();
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('runs the chosen action and skips disabled items', async () => {
    const { trigger, pdf, later } = setup();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Download PDF' }));
    expect(pdf).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    const disabled = screen.getByRole('menuitem', { name: 'Schedule a weekly export' });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(disabled);
    expect(later).not.toHaveBeenCalled();
  });

  it('closes when you click outside', async () => {
    const { trigger } = setup();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders link items as links', async () => {
    render(<Dropdown label="Help" items={[{ label: 'Rules of play', href: '/rules' }]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Help' }));
    expect(screen.getByRole('menuitem', { name: 'Rules of play' })).toHaveAttribute('href', '/rules');
  });
});
