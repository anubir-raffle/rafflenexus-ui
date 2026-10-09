import { describe, expect, it, vi } from 'vitest';
import { forwardRef, useState, type ReactNode } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Offcanvas, Sidebar, Table, createColumnHelper, type ColumnDef } from '../src';
import { setReducedMotion } from './setup';

describe('Sidebar', () => {
  const items = [
    { label: 'Dashboard', href: '/', icon: 'chart-line-up' as const, current: true },
    { label: 'Raffles', href: '/raffles', icon: 'ticket' as const, badge: '3' },
    { label: 'Log out', icon: <svg data-testid="custom-icon" />, onClick: vi.fn() },
  ];

  it('is a named navigation landmark with the logo on top and the current page marked', () => {
    render(<Sidebar logo={<img src="/logo.png" alt="Raffle Nexus" />} items={items} />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');
    expect(links[0]).toHaveAccessibleName('Raffle Nexus');
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Raffles, 3' })).not.toHaveAttribute('aria-current');
    expect(nav.querySelectorAll('.rnc-icon')).toHaveLength(2);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders items without href as buttons and calls onClick', async () => {
    render(<Sidebar logo="RNC" items={items} />);
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(items[2].onClick).toHaveBeenCalled();
  });

  it('groups items under section headings', () => {
    render(<Sidebar logo="RNC" sections={[{ items: items.slice(0, 1) }, { title: 'Tools', items: [{ label: 'Settings', href: '/settings', icon: 'shield-check' }] }]} />);
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
  });

  it('keeps labels for screen readers and tooltips when collapsed, and swaps the logo', async () => {
    render(<Sidebar logo="Full logo" logoCollapsed="Mark" items={items} collapsed footer="Signed in" />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('is-collapsed');
    const raffles = screen.getByRole('link', { name: 'Raffles, 3' });
    expect(raffles).not.toHaveAttribute('title'); // the styled tooltip replaces the native one, so it doesn't show twice
    await userEvent.hover(raffles);
    expect(document.querySelector('.rnc-sidebar-tip')).toHaveTextContent('Raffles');
    await userEvent.unhover(raffles);
    expect(document.querySelector('.rnc-sidebar-tip')).toBeNull();
    expect(screen.getByText('Mark')).toBeInTheDocument();
    expect(screen.queryByText('Signed in')).not.toBeInTheDocument();
  });

  it('uses a router link component when given one', () => {
    const RouterLink = forwardRef<HTMLAnchorElement, { href: string; children: ReactNode }>(function RouterLink({ href, children, ...rest }, ref) {
      return <a ref={ref} href={href} data-router="yes" {...rest}>{children}</a>;
    });
    render(<Sidebar logo="RNC" items={items.slice(0, 2)} linkComponent={RouterLink} />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('data-router', 'yes');
  });
});

describe('Offcanvas', () => {
  function Harness({ side = 'right', closeOnBackdrop = true }: { side?: 'left' | 'right' | 'top' | 'bottom'; closeOnBackdrop?: boolean }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>Open filters</button>
        <Offcanvas open={open} onClose={() => setOpen(false)} side={side} title="Filter orders" closeOnBackdrop={closeOnBackdrop}>
          <label htmlFor="q">Search</label><input id="q" />
          <button type="button">Apply</button>
        </Offcanvas>
      </>
    );
  }
  const openIt = async () => {
    setReducedMotion(true); // no exit animation, so closing is immediate in tests
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open filters' });
    await userEvent.click(trigger);
    await act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))); });
    return trigger;
  };

  it('opens as a labelled modal dialog, from the chosen side, with focus inside', async () => {
    await openIt();
    const dialog = screen.getByRole('dialog', { name: 'Filter orders' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveClass('from-right');
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('moves focus inside on the same render it opens (before any animation frame)', async () => {
    setReducedMotion(true);
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open filters' }));
    // No waiting for requestAnimationFrame: a real browser may not run it before the person presses a key.
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps Tab and Shift+Tab inside the panel', async () => {
    await openIt();
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 6; i++) { await userEvent.tab(); expect(dialog.contains(document.activeElement)).toBe(true); }
    for (let i = 0; i < 6; i++) { await userEvent.tab({ shift: true }); expect(dialog.contains(document.activeElement)).toBe(true); }
  });

  it('closes with Escape and returns focus to the opener, unlocking scroll', async () => {
    const trigger = await openIt();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes with the close button and with a click on the dimmed page', async () => {
    await openIt();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open filters' }));
    await userEvent.click(document.querySelector('.rnc-offcanvas-backdrop') as HTMLElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('plays an exit before unmounting when motion is allowed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Harness side="left" />);
    await userEvent.click(screen.getByRole('button', { name: 'Open filters' }));
    expect(screen.getByRole('dialog')).toHaveClass('from-left');
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toHaveClass('is-closing');
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Table', () => {
  type Order = { id: string; name: string; town: string; amount: number };
  const data: Order[] = [
    { id: 'A-1', name: 'Priya Sharma', town: 'Nanaimo', amount: 100 },
    { id: 'A-2', name: 'Liam Chen', town: 'Kelowna', amount: 250 },
    { id: 'A-3', name: 'Ava Martin', town: 'Victoria', amount: 50 },
    { id: 'A-4', name: 'Noah Singh', town: 'Surrey', amount: 450 },
    { id: 'A-5', name: 'Emma Roy', town: 'Kamloops', amount: 20 },
  ];
  const col = createColumnHelper<Order>();
  const columns = [
    col.accessor('id', { header: 'Order', enableSorting: false }),
    col.accessor('name', { header: 'Name' }),
    col.accessor('town', { header: 'Town' }),
    col.accessor('amount', { header: 'Amount', cell: (c) => `$${c.getValue()}`, meta: { numeric: true } }),
  ] as ColumnDef<Order, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  const bodyRows = () => within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row');
  const firstCells = (i: number) => bodyRows().map((r) => within(r).getAllByRole('cell')[i].textContent);

  it('renders columns and data with an accessible caption, and custom cells', () => {
    render(<Table data={data} columns={columns} caption="Orders" />);
    expect(screen.getByRole('table', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Order', 'Name', 'Town', 'Amount']);
    expect(firstCells(3)).toEqual(['$100', '$250', '$50', '$450', '$20']);
    expect(within(bodyRows()[0]).getAllByRole('cell')[3]).toHaveClass('is-num');
  });

  it('sorts text A to Z first and numbers largest first (react-table behaviour), then clears, with aria-sort', async () => {
    render(<Table data={data} columns={columns} caption="Orders" />);
    const name = screen.getByRole('columnheader', { name: 'Name' });
    await userEvent.click(within(name).getByRole('button'));
    expect(name).toHaveAttribute('aria-sort', 'ascending');
    expect(firstCells(1)[0]).toBe('Ava Martin');
    const amount = screen.getByRole('columnheader', { name: 'Amount' });
    expect(amount).toHaveAttribute('aria-sort', 'none');
    await userEvent.click(within(amount).getByRole('button'));
    expect(amount).toHaveAttribute('aria-sort', 'descending');
    expect(name).toHaveAttribute('aria-sort', 'none');
    expect(firstCells(3)).toEqual(['$450', '$250', '$100', '$50', '$20']);
    await userEvent.click(within(amount).getByRole('button'));
    expect(amount).toHaveAttribute('aria-sort', 'ascending');
    expect(firstCells(3)).toEqual(['$20', '$50', '$100', '$250', '$450']);
    await userEvent.click(within(amount).getByRole('button'));
    expect(amount).toHaveAttribute('aria-sort', 'none');
    expect(screen.getByRole('columnheader', { name: 'Order' })).not.toHaveAttribute('aria-sort');
    expect(within(screen.getByRole('columnheader', { name: 'Order' })).queryByRole('button')).toBeNull();
  });

  it('searches every column and shows the empty message', async () => {
    render(<Table data={data} columns={columns} caption="Orders" searchable searchLabel="Search orders" countNoun={['order', 'orders']} emptyMessage="No orders match." />);
    expect(screen.getByText('5 orders')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Search orders'), 'kel');
    expect(firstCells(1)).toEqual(['Liam Chen']);
    expect(screen.getByText('1 order')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Search orders'), 'zzz');
    expect(screen.getByText('No orders match.')).toBeInTheDocument();
  });

  it('pages through the rows', async () => {
    render(<Table data={data} columns={columns} caption="Orders" pageSize={2} />);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(firstCells(0)).toEqual(['A-1', 'A-2']);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
    expect(firstCells(0)).toEqual(['A-5']);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('selects rows, selects the whole page, and reports the selection', async () => {
    const onSel = vi.fn();
    render(<Table data={data} columns={columns} caption="Orders" enableRowSelection getRowId={(o) => o.id} getRowLabel={(o) => `order ${o.id}`} onRowSelectionChange={onSel} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select order A-2' }));
    expect(onSel).toHaveBeenLastCalledWith([data[1]]);
    expect(bodyRows()[1]).toHaveClass('is-selected');
    expect(screen.getByText('5 rows · 1 selected')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }));
    expect(onSel).toHaveBeenLastCalledWith(data);
  });
});
