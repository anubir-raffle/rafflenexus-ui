// The builder parts: AnimatedList, SortableList, ExpandableRow, UploadTile (main entry) and WizardReview (/wizard).
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnimatedList, ExpandableRow, SortableList, UploadTile } from '../src';
import { WizardReview } from '../src/wizard';
import { setReducedMotion } from './setup';

type Row = { id: string; name: string };
const rows: Row[] = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Bravo' }, { id: 'c', name: 'Charlie' }];

describe('AnimatedList', () => {
  it('marks an added item as entering and keeps a removed one briefly as leaving, out of the accessibility tree', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { rerender, container } = render(<AnimatedList aria-label="Packs" items={rows} getKey={(r) => r.id} renderItem={(r) => <span>{r.name}</span>} />);
    expect(container.querySelectorAll('.is-entering')).toHaveLength(0); // nothing animates on first render
    rerender(<AnimatedList aria-label="Packs" items={[...rows, { id: 'd', name: 'Delta' }]} getKey={(r) => r.id} renderItem={(r) => <span>{r.name}</span>} />);
    expect(screen.getByText('Delta').closest('li')).toHaveClass('is-entering');
    rerender(<AnimatedList aria-label="Packs" items={rows.slice(1)} getKey={(r) => r.id} renderItem={(r, i) => <span>{r.name}{i}</span>} />);
    const leaving = container.querySelector('.is-leaving');
    expect(leaving).toHaveTextContent('Alpha-1');
    expect(leaving).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('list', { name: 'Packs' }).firstElementChild).toBe(leaving); // stays where it was
    act(() => { vi.advanceTimersByTime(300); });
    expect(container.querySelector('.is-leaving')).toBeNull();
    expect(screen.getByText('Bravo0')).toBeInTheDocument();
  });

  it('removes straight away under reduced motion', () => {
    setReducedMotion(true);
    const { rerender, container } = render(<AnimatedList items={rows} getKey={(r) => r.id} renderItem={(r) => r.name} />);
    rerender(<AnimatedList items={rows.slice(1)} getKey={(r) => r.id} renderItem={(r) => r.name} />);
    expect(container.querySelector('.is-leaving')).toBeNull();
    expect(screen.queryByText('Alpha')).toBeNull();
  });
});

describe('SortableList', () => {
  function Harness({ disabled }: { disabled?: boolean }) {
    const [items, setItems] = useState(rows);
    return (
      <SortableList aria-label="Slides" items={items} getKey={(r) => r.id} onReorder={setItems} disabled={disabled} itemLabel={(r) => r.name}
        renderItem={(r, t) => <div>{t.grip}<span data-testid="name">{r.name}</span>{t.moves}</div>} />
    );
  }
  const names = () => screen.getAllByTestId('name').map((n) => n.textContent);

  it('Move earlier and Move later reorder and announce which item moved where', async () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: 'Move Alpha earlier' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Move Alpha later' }));
    expect(names()).toEqual(['Bravo', 'Alpha', 'Charlie']);
    expect(screen.getByRole('status')).toHaveTextContent('Alpha moved to position 2 of 3.');
    await userEvent.click(screen.getByRole('button', { name: 'Move Charlie earlier' }));
    expect(names()).toEqual(['Bravo', 'Charlie', 'Alpha']);
  });

  it('dragging the grip past another row reorders on release; Escape cancels', () => {
    render(<Harness />);
    const items = screen.getAllByRole('listitem');
    items.forEach((li, i) => { li.getBoundingClientRect = () => ({ top: i * 60, bottom: i * 60 + 50, height: 50, left: 0, right: 300, width: 300, x: 0, y: i * 60, toJSON() {} }) as DOMRect; });
    const grip = screen.getByRole('button', { name: 'Drag to reorder Charlie' });
    fireEvent.pointerDown(grip, { button: 0, clientY: 145, pointerId: 1 });
    expect(items[2]).toHaveClass('is-dragging');
    fireEvent.pointerMove(window, { clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(window, { clientY: 20, pointerId: 1 });
    expect(names()).toEqual(['Charlie', 'Alpha', 'Bravo']);
    expect(screen.getByRole('status')).toHaveTextContent('Charlie moved to position 1 of 3.');
    const again = screen.getAllByRole('listitem');
    again.forEach((li, i) => { li.getBoundingClientRect = () => ({ top: i * 60, bottom: i * 60 + 50, height: 50, left: 0, right: 300, width: 300, x: 0, y: i * 60, toJSON() {} }) as DOMRect; });
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Drag to reorder Alpha' }), { button: 0, clientY: 85, pointerId: 2 });
    fireEvent.pointerMove(window, { clientY: 160, pointerId: 2 });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(names()).toEqual(['Charlie', 'Alpha', 'Bravo']);
    expect(screen.getByRole('status')).toHaveTextContent('Move cancelled.');
  });

  it('disabled hides the grip and the move buttons', () => {
    render(<Harness disabled />);
    expect(screen.queryByRole('button', { name: /Drag to reorder/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Move .* later/ })).toBeNull();
  });
});

describe('ExpandableRow', () => {
  it('opens and closes, telling screen readers its state; controlled or not', async () => {
    const onOpenChange = vi.fn();
    render(<ExpandableRow title="Single ticket" meta="$25 · 1 ticket" onOpenChange={onOpenChange} actions={<button type="button">Remove</button>}><label>Price<input /></label></ExpandableRow>);
    const toggle = screen.getByRole('button', { name: /Single ticket/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle.closest('.rnc-xrow')).toHaveClass('is-open');
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('region', { name: 'Single ticket' })).toContainElement(screen.getByLabelText('Price'));
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });
});

describe('UploadTile', () => {
  it('takes a chosen or dropped file and shows Replace and Remove once there is one', async () => {
    const onFile = vi.fn(); const onRemove = vi.fn();
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    const { rerender, container } = render(<UploadTile label="Logo" onFile={onFile} />);
    expect(screen.getByRole('button', { name: 'Choose a file' })).toBeInTheDocument();
    const input = container.querySelector('input[type=file]') as HTMLInputElement;
    await userEvent.upload(input, file);
    await waitFor(() => expect(onFile).toHaveBeenCalledWith(file, expect.stringMatching(/^data:/)));
    const zone = container.querySelector('.rnc-upload-zone')!;
    fireEvent.dragOver(zone, { dataTransfer: { files: [file] } });
    expect(zone).toHaveClass('is-over');
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(zone).not.toHaveClass('is-over');
    await waitFor(() => expect(onFile).toHaveBeenCalledTimes(2));
    rerender(<UploadTile label="Logo" onFile={onFile} onRemove={onRemove} src="data:image/png;base64,AAAA" alt="Your logo" />);
    expect(screen.getByRole('img', { name: 'Your logo' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Replace' })).toBeInTheDocument();
  });

  it('refuses a file that is too large, in words', async () => {
    const onFile = vi.fn();
    const { container } = render(<UploadTile label="Slide" onFile={onFile} maxBytes={1024 * 1024} />);
    await userEvent.upload(container.querySelector('input[type=file]') as HTMLInputElement, new File([new Uint8Array(3 * 1024 * 1024)], 'big.png', { type: 'image/png' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('That file is 3 MB. Use one under 1 MB.');
    expect(onFile).not.toHaveBeenCalled();
  });
});

describe('WizardReview', () => {
  it('a card per section with its state, summary and what is missing; Edit goes to the step', async () => {
    const onEdit = vi.fn();
    render(<WizardReview onEdit={onEdit} sections={[
      { label: 'Website', step: 0, complete: true, summary: 'Sample Lottery, at sample.rafflenexus.com.' },
      { label: 'Dates', step: 2, complete: false, issues: ['Enter the draw date'] },
    ]} />);
    const dates = screen.getByRole('heading', { name: 'Dates, not complete' }).closest('section')!;
    expect(dates).toHaveClass('is-incomplete');
    expect(within(dates).getByText('Enter the draw date')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Website, complete' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit Dates' }));
    expect(onEdit).toHaveBeenCalledWith(2);
  });
});
