import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, FlagshipRoster, JackpotFigure, JackpotTile, Odometer, ProofStat, TicketButton, VerifiedBadge, tokens, ICON_NAMES } from '../src';
import { setReducedMotion } from './setup';

describe('Button', () => {
  it('is a button by default and a link with href', () => {
    render(<><Button>Talk to our lottery team</Button><Button href="/contact" variant="secondary">Book a call</Button></>);
    expect(screen.getByRole('button', { name: 'Talk to our lottery team' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Talk to our lottery team' })).toHaveClass('rnc-btn-primary');
    expect(screen.getByRole('link', { name: 'Book a call' })).toHaveAttribute('href', '/contact');
  });
});

describe('JackpotFigure', () => {
  it('reads as the whole amount and pulls the commas in', () => {
    const { container } = render(<JackpotFigure amount={2548700} growth="Up $1,240 since yesterday" />);
    expect(screen.getByRole('img', { name: '$2,548,700' })).toBeInTheDocument();
    expect(container.querySelectorAll('.rnc-jp-sep')).toHaveLength(2);
    expect(screen.getByText('Up $1,240 since yesterday')).toBeInTheDocument();
  });

  it('counts up from yesterday to today, once', async () => {
    vi.useFakeTimers();
    const { container } = render(<JackpotFigure amount={10640} from={9320} />);
    expect(container.querySelector('.rnc-jp-num')).toHaveTextContent('9,320');
    await act(async () => { vi.advanceTimersByTime(2500); });
    expect(container.querySelector('.rnc-jp-num')).toHaveTextContent('10,640');
  });

  it('shows the final figure straight away under reduced motion', () => {
    setReducedMotion(true);
    const { container } = render(<JackpotFigure amount={10640} from={9320} />);
    expect(container.querySelector('.rnc-jp-num')).toHaveTextContent('10,640');
  });
});

describe('JackpotTile', () => {
  it('shows live or closed with the province', () => {
    render(<><JackpotTile program="Sample 50/50" amount={500} province="BC" /><JackpotTile program="Old draw" amount={1} live={false} /></>);
    expect(screen.getByText('Live · BC')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });
});

describe('Odometer', () => {
  it('exposes the real value and settles on it', async () => {
    vi.useFakeTimers();
    render(<Odometer value={684270} prefix="$" />);
    const odo = screen.getByRole('img', { name: '$684,270' });
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(odo).toHaveTextContent('$684,270');
  });

  it('does not animate under reduced motion or with trigger="none"', () => {
    setReducedMotion(true);
    const { container, rerender } = render(<Odometer value="0428713" />);
    expect(container.querySelector('.rnc-odo')).toBeNull();
    setReducedMotion(false);
    rerender(<Odometer value="0428713" trigger="none" />);
    expect(container.querySelector('.rnc-odo')).toBeNull();
    expect(screen.getByRole('img', { name: '0428713' })).toHaveTextContent('0428713');
  });
});

describe('TicketButton', () => {
  it('names the action and the stub, and renders a link or a button', () => {
    render(<><TicketButton label="Order tickets" stub="from $10" href="/buy" /><TicketButton label="Buy tickets" /></>);
    expect(screen.getByRole('link', { name: 'Order tickets, from $10' })).toHaveAttribute('href', '/buy');
    expect(screen.getByRole('button', { name: 'Buy tickets' })).toBeInTheDocument();
  });

  it('punches on click and still calls onClick', async () => {
    const onClick = vi.fn();
    render(<TicketButton label="Buy tickets" onClick={onClick} />);
    const b = screen.getByRole('button', { name: 'Buy tickets' });
    await userEvent.click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(b).toHaveClass('punched');
    expect(b.querySelectorAll('.tb-bit')).toHaveLength(8);
  });

  it('skips the punch under reduced motion', async () => {
    setReducedMotion(true);
    render(<TicketButton label="Buy tickets" />);
    const b = screen.getByRole('button', { name: 'Buy tickets' });
    await userEvent.click(b);
    expect(b).not.toHaveClass('punched');
  });

  it('takes the client colours', () => {
    render(<TicketButton label="Buy tickets" colors={{ bg: '#5a3fc0', stub: '#2b1d5c' }} />);
    const b = screen.getByRole('button', { name: 'Buy tickets' });
    expect(b.style.getPropertyValue('--tb-bg')).toBe('#5a3fc0');
    expect(b.style.getPropertyValue('--tb-stub')).toBe('#2b1d5c');
  });
});

describe('Proof and trust', () => {
  it('ProofStat shows the figure, denominator and source', () => {
    render(<ProofStat value={11} of={29} label="Flagship lotteries" source="Research count · 5 Oct 2026" />);
    expect(screen.getByText('of 29', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Research count · 5 Oct 2026')).toBeInTheDocument();
  });

  it('VerifiedBadge names the regulator and licence', () => {
    render(<VerifiedBadge regulator="IGCO" licence="171012" />);
    expect(screen.getByRole('note')).toHaveTextContent('IGCO licence #171012 · GLI-certified RNG');
  });

  it('FlagshipRoster spells out provinces and handles empty ones', () => {
    render(<FlagshipRoster groups={[{ province: 'BC', items: ['Sample Lottery'] }, { province: 'SK', items: [] }]} />);
    expect(screen.getByRole('heading', { name: 'British Columbia' })).toBeInTheDocument();
    expect(screen.getByText('None yet')).toBeInTheDocument();
  });
});

describe('Tokens', () => {
  it('has the brand colours and fonts', () => {
    for (const k of ['action', 'ink', 'stage', 'error', 'focus'] as const) expect(tokens.color[k]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tokens.font.display).toMatch(/^Newsreader/);
    expect(ICON_NAMES).toContain('ticket');
  });
});
