// The third Raffle Builder handoff: StatusPill, FilterChip / FilterChipGroup, StepTimeline / StepTimelineLabels.
import { describe, expect, it, vi } from 'vitest';
import { useRef, useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterChip, FilterChipGroup, StatusPill, StepTimeline, StepTimelineLabels, stepStates } from '../src';

describe('StatusPill', () => {
  it('shows the label in its tone, with the figure in the mono face', () => {
    const { container } = render(<StatusPill tone="progress" value="44%">In progress</StatusPill>);
    const pill = container.querySelector('.rnc-status')!;
    expect(pill).toHaveClass('rnc-status', 'is-progress');
    expect(pill).not.toHaveClass('is-sm');
    expect(pill.querySelector('.rnc-status-value')).toHaveTextContent('44%');
    expect(pill).toHaveTextContent('In progress 44%');
  });

  it('defaults to neutral and takes the small size', () => {
    const { container } = render(<StatusPill size="sm">Not started</StatusPill>);
    expect(container.querySelector('.rnc-status')).toHaveClass('is-neutral', 'is-sm');
    expect(container.querySelector('.rnc-status-value')).toBeNull();
  });

  it('hides an icon or dot from screen readers, so only the word is read', () => {
    const { container } = render(<>
      <StatusPill tone="success" icon="check-circle">Completed</StatusPill>
      <StatusPill tone="review" dot>Ready for QA</StatusPill>
      <StatusPill tone="error" icon={<svg data-testid="own" />}>Build failed</StatusPill>
    </>);
    expect(container.querySelector('.is-success svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.is-review .rnc-status-dot')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('own').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('passes native attributes through', () => {
    render(<StatusPill tone="review" title="Waiting on licence approval" data-testid="p" className="mine">Waiting on licence approval</StatusPill>);
    expect(screen.getByTestId('p')).toHaveAttribute('title', 'Waiting on licence approval');
    expect(screen.getByTestId('p')).toHaveClass('mine', 'rnc-status');
  });
});

function Chips({ start = ['Hide archived', 'Status|In progress', 'Province|British Columbia'], clearAll = true }: { start?: string[]; clearAll?: boolean }) {
  const [on, setOn] = useState(start);
  const search = useRef<HTMLInputElement>(null);
  return (
    <>
      <label htmlFor="q">Search</label><input id="q" ref={search} />
      <FilterChipGroup onClearAll={clearAll ? () => setOn([]) : undefined} returnFocusRef={search}>
        {on.map((f) => { const [label, value] = f.split('|'); return <FilterChip key={f} label={label} value={value} onRemove={() => setOn((xs) => xs.filter((x) => x !== f))} />; })}
      </FilterChipGroup>
    </>
  );
}

describe('FilterChip', () => {
  it('names its × after the filter, and calls onRemove', async () => {
    const remove = vi.fn();
    render(<FilterChip label="Status" value="In progress" onRemove={remove} />);
    const x = screen.getByRole('button', { name: 'Remove filter: Status: In progress' });
    await userEvent.click(x);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.rnc-chip-value')).toHaveTextContent('In progress');
  });

  it('is a fixed grey chip with no × when it has no onRemove', () => {
    const { container } = render(<FilterChip label="Your clients only" />);
    expect(container.querySelector('.rnc-chip')).toHaveClass('is-disabled');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('takes its own remove label', () => {
    render(<FilterChip label={<b>Owner</b>} value="Anubir" removeLabel="Remove the owner filter" onRemove={() => {}} />);
    expect(screen.getByRole('button', { name: 'Remove the owner filter' })).toBeInTheDocument();
  });
});

describe('FilterChipGroup', () => {
  it('is a named group with Clear all at the end', () => {
    render(<Chips />);
    const group = screen.getByRole('group', { name: 'Active filters' });
    expect(within(group).getAllByRole('button', { name: /^Remove filter/ })).toHaveLength(3);
    expect(within(group).getAllByRole("button").slice(-1)[0]).toHaveTextContent('Clear all');
  });

  it('moves focus to the next chip after a removal, and says what happened', async () => {
    render(<Chips />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: Status: In progress' }));
    expect(screen.queryByRole('button', { name: 'Remove filter: Status: In progress' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Remove filter: Province: British Columbia' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Removed Status: In progress.');
  });

  it('moves focus to the previous chip when the last one in the row goes', async () => {
    render(<Chips />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: Province: British Columbia' }));
    expect(screen.getByRole('button', { name: 'Remove filter: Status: In progress' })).toHaveFocus();
  });

  it('returns focus to the search field when the last chip is removed, and renders nothing', async () => {
    render(<Chips start={['Hide archived']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: Hide archived' }));
    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.getByLabelText('Search')).toHaveFocus();
  });

  it('clears everything and returns focus', async () => {
    render(<Chips />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.getByLabelText('Search')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('All filters cleared.');
  });

  it('leaves out Clear all without onClearAll', () => {
    render(<Chips clearAll={false} />);
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
  });
});

describe('StepTimeline', () => {
  const STEPS = [
    { label: 'Created', date: new Date(2026, 4, 18) },
    { label: 'Started', date: 'Aug 4, 2026', state: 'late' as const },
    { label: 'Submitted' },
    { label: 'Completed' },
  ];

  it('works out the states: a date is done, the first gap is next, the rest pending', () => {
    expect(stepStates([{ label: 'a', date: 'x' }, { label: 'b' }, { label: 'c' }])).toEqual(['done', 'next', 'pending']);
    expect(stepStates([{ label: 'a', date: 'x' }, { label: 'b', date: 'y', state: 'late' }, { label: 'c', state: 'pending' }])).toEqual(['done', 'late', 'pending']);
  });

  it('is an ordered list with one item per step, each state as a class', () => {
    const { container } = render(<StepTimeline steps={STEPS} aria-label="Setup form timeline" />);
    const list = screen.getByRole('list', { name: 'Setup form timeline' });
    expect(list).toHaveStyle({ '--steps-n': '4' });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((li) => li.className)).toEqual(['rnc-step is-done', 'rnc-step is-late', 'rnc-step is-next', 'rnc-step is-pending']);
    expect(container.querySelectorAll('.rnc-step-line')).toHaveLength(3);
    expect(container.querySelectorAll('.rnc-step-line.is-reached')).toHaveLength(1);
  });

  it('formats dates, shows Up next and Not set, and says "late" to screen readers', () => {
    render(<StepTimeline steps={STEPS} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('CreatedMay 18, 2026');
    expect(items[1]).toHaveTextContent('StartedAug 4, 2026, late');
    expect(items[2]).toHaveTextContent('SubmittedUp next');
    expect(items[3]).toHaveTextContent('CompletedNot set');
  });

  it('keeps step names for screen readers only when showLabels is false', () => {
    const { container } = render(<StepTimeline steps={STEPS} showLabels={false} />);
    expect(container.querySelector('.rnc-step-label')).toBeNull();
    expect(container.querySelector('.rnc-step .rnc-sr-only')).toHaveTextContent('Created:');
  });

  it('takes its own date format and words', () => {
    render(<StepTimeline steps={STEPS} formatDate={(d) => `${d.getMonth() + 1}/${d.getDate()}`} nextText="Waiting" emptyText="—" />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('5/18');
    expect(items[2]).toHaveTextContent('Waiting');
    expect(items[3]).toHaveTextContent('—');
  });

  it('shows a dash for a step marked reached without a date', () => {
    render(<StepTimeline steps={[{ label: 'Created', state: 'done' }, { label: 'Started' }]} />);
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Created—done');
  });
});

describe('StepTimelineLabels', () => {
  it('shows the names on the same tracks, hidden from screen readers in favour of one column name', () => {
    const { container } = render(<table><thead><tr><th><StepTimelineLabels labels={['Created', 'Started', 'Submitted', 'Completed']} /></th></tr></thead></table>);
    const labels = container.querySelector('.rnc-steps-labels')!;
    expect(labels).toHaveAttribute('aria-hidden', 'true');
    expect(labels).toHaveStyle({ '--steps-n': '4' });
    expect(labels.children).toHaveLength(4);
    expect(screen.getByRole('columnheader', { name: 'Timeline' })).toBeInTheDocument();
  });
});
