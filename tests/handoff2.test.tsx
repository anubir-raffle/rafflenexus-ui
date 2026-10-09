// The second Raffle Builder handoff: Button, Avatar, Sidebar additions, ReactTableComponent (/tables) and Switch (/inputs).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef, forwardRef, useState, type ReactNode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Avatar, AvatarGroup, Button, Sidebar, avatarColour, avatarInitials, type SidebarItem } from '../src';
import { ReactTableComponent, type ReactTableColumn } from '../src/tables';
import DefaultTable from '../src/tables';
import { Switch } from '../src/inputs';
import { setReducedMotion } from './setup';

const RouterLink = forwardRef<HTMLAnchorElement, { href?: string; to?: string; children?: ReactNode }>(function RouterLink({ to, children, href, ...rest }, ref) {
  return <a ref={ref} href={href} data-to={to} data-router="yes" {...rest}>{children}</a>;
});

describe('Button', () => {
  it('is a native button of type "button" by default, so it never submits a form by accident', async () => {
    const submit = vi.fn((e) => e.preventDefault());
    render(<form onSubmit={submit}><Button>Save changes</Button></form>);
    const b = screen.getByRole('button', { name: 'Save changes' });
    expect(b).toHaveAttribute('type', 'button');
    expect(b).toHaveClass('rnc-btn', 'rnc-btn-primary');
    await userEvent.click(b);
    expect(submit).not.toHaveBeenCalled();
  });

  it('keeps the old props working: variant, href and native attributes', () => {
    render(<><Button variant="stage-ghost" title="Old" data-testid="old">See the lotteries</Button><Button href="/talk" variant="secondary">Talk to us</Button></>);
    expect(screen.getByTestId('old')).toHaveClass('rnc-btn-stage-ghost');
    expect(screen.getByTestId('old')).toHaveAttribute('title', 'Old');
    expect(screen.getByRole('link', { name: 'Talk to us' })).toHaveAttribute('href', '/talk');
  });

  it('takes every variant, size, full width and icons by name or element', () => {
    render(<>
      {(['primary', 'secondary', 'ghost', 'link', 'danger', 'danger-ghost'] as const).map((v) => <Button key={v} variant={v}>{v}</Button>)}
      <Button size="sm" startIcon="plus" endIcon={<svg data-testid="own-icon" />} fullWidth>New setup form</Button>
    </>);
    expect(screen.getByRole('button', { name: 'danger-ghost' })).toHaveClass('rnc-btn-danger-ghost');
    const b = screen.getByRole('button', { name: 'New setup form' });
    expect(b).toHaveClass('rnc-btn-sm', 'rnc-btn-full');
    expect(b.querySelectorAll('.rnc-btn-ico')).toHaveLength(2);
    expect(b.querySelector('.rnc-icon')).toBeInTheDocument();
    expect(screen.getByTestId('own-icon')).toBeInTheDocument();
  });

  it('while loading: spinner in the icon slot, loadingText, clicks ignored, focus kept, width held by both labels', async () => {
    const click = vi.fn();
    const { rerender } = render(<Button loading={false} loadingText="Uploading…" startIcon="upload-simple" onClick={click}>Upload</Button>);
    const b = screen.getByRole('button', { name: 'Upload' });
    expect(b.querySelectorAll('.rnc-btn-layer')).toHaveLength(2); // both labels share one cell from the start
    b.focus();
    rerender(<Button loading loadingText="Uploading…" startIcon="upload-simple" onClick={click}>Upload</Button>);
    expect(b).toHaveAttribute('aria-busy', 'true');
    expect(b).toHaveAttribute('aria-disabled', 'true');
    expect(b).not.toBeDisabled();
    expect(b).toHaveFocus();
    expect(b).toHaveAccessibleName('Uploading…');
    expect(b.querySelector('.rnc-btn-layer:not([aria-hidden]) .rnc-btn-spinner')).toBeInTheDocument();
    expect(b.querySelector('.rnc-btn-layer:not([aria-hidden]) .rnc-icon')).toBeNull();
    await userEvent.click(b);
    expect(click).not.toHaveBeenCalled();
  });

  it('a loading submit button does not submit the form twice', async () => {
    const submit = vi.fn((e) => e.preventDefault());
    render(<form onSubmit={submit}><Button type="submit" loading disabled>Save</Button></form>);
    const b = screen.getByRole('button', { name: 'Save' });
    expect(b).not.toBeDisabled(); // loading wins over disabled, so focus stays
    await userEvent.click(b);
    expect(submit).not.toHaveBeenCalled();
  });

  it('iconOnly needs an aria-label, and warns in development without one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Button iconOnly startIcon="x" aria-label="Close" />);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('rnc-btn-icon');
    expect(warn).not.toHaveBeenCalled();
    render(<Button iconOnly startIcon="copy" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('aria-label'));
    warn.mockRestore();
  });

  it('a disabled link loses its href and blocks the click; `as` renders your router link with href and to', async () => {
    const click = vi.fn();
    render(<><Button href="/changelog" disabled onClick={click}>Changelog</Button><Button as={RouterLink} href="/briefs">Briefs</Button></>);
    const off = screen.getByRole('link', { name: 'Changelog' });
    expect(off).not.toHaveAttribute('href');
    expect(off).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(off);
    expect(click).not.toHaveBeenCalled();
    const routed = screen.getByRole('link', { name: 'Briefs' });
    expect(routed).toHaveAttribute('data-router', 'yes');
    expect(routed).toHaveAttribute('data-to', '/briefs');
  });

  it('forwards the ref to the element', () => {
    const ref = createRef<HTMLElement>();
    render(<Button ref={ref}>Save</Button>);
    expect(ref.current?.tagName).toBe('BUTTON');
  });
});

describe('Avatar', () => {
  it('initials are the first letters of the first and last words; the colour is fixed to the name', () => {
    expect(avatarInitials('Priya Sharma')).toBe('PS');
    expect(avatarInitials('  amrit  kaur  gill ')).toBe('AG');
    expect(avatarInitials('Cher')).toBe('C');
    expect(avatarInitials('')).toBe('');
    expect(avatarColour('Priya Sharma')).toBe(avatarColour('Priya Sharma'));
    expect(avatarColour('Priya Sharma')).toBeLessThan(6);
  });

  it('shows the photo, and falls back to initials when it fails to load', () => {
    render(<Avatar alt="Remy Sharp" src="/remy.jpg" />);
    const img = screen.getByRole('img', { name: 'Remy Sharp' });
    expect(img.tagName).toBe('IMG');
    fireEvent.error(img);
    const pic = screen.getByRole('img', { name: 'Remy Sharp' });
    expect(pic.tagName).toBe('SPAN');
    expect(pic).toHaveTextContent('RS');
    expect(pic.className).toMatch(/\bc[0-5]\b/);
  });

  it('does not crash with no props, and shows a person icon hidden from screen readers', () => {
    const { container } = render(<Avatar />);
    const pic = container.querySelector('.rnc-avatar-pic')!;
    expect(pic).toHaveClass('is-blank');
    expect(pic).toHaveAttribute('aria-hidden', 'true');
    expect(pic.querySelector('.rnc-icon')).toBeInTheDocument();
  });

  it('with a visible name, the picture is hidden from screen readers so the name is read once', () => {
    const { container } = render(<Avatar src="/a.jpg" alt="Ava Martin" name="Ava Martin" subtitle="ava@example.org" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.getByText('Ava Martin')).toHaveAttribute('title', 'Ava Martin');
    expect(screen.getByText('ava@example.org')).toHaveClass('rnc-avatar-sub');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('sizes by token or pixels, shapes, layouts and custom children', () => {
    const { container } = render(<>
      <Avatar alt="Noah Singh" size="xl" variant="rounded" />
      <Avatar alt="Noah Singh" size={180} layout="column" name="Noah Singh" />
      <Avatar alt="Help desk"><svg data-testid="custom" /></Avatar>
    </>);
    const roots = container.querySelectorAll('.rnc-avatar');
    expect(roots[0]).toHaveStyle('--av-size: 56px');
    expect(roots[0].querySelector('.rnc-avatar-pic')).toHaveClass('is-rounded');
    expect(roots[1]).toHaveStyle('--av-size: 180px');
    expect(roots[1]).toHaveClass('is-column');
    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Help desk' })).toBeInTheDocument();
  });

  it('AvatarGroup shows up to max and a "+N" count', () => {
    render(<AvatarGroup max={3}>{['Priya Sharma', 'Liam Chen', 'Ava Martin', 'Noah Singh', 'Emma Roy'].map((n) => <Avatar key={n} alt={n} />)}</AvatarGroup>);
    const group = screen.getByRole('group', { name: '5 people' });
    expect(within(group).getAllByRole('img')).toHaveLength(3);
    expect(within(group).getByRole('img', { name: '3 more' })).toHaveTextContent('+3');
  });
});

describe('Sidebar additions', () => {
  const items: SidebarItem[] = [
    { label: 'Live board', href: '/dashboard', icon: 'chart-line-up', current: true, badge: 3 },
    { label: 'Reveal', href: 'https://reveal.example.org', icon: 'drone', external: true, target: '_blank' },
    { label: 'App builds', href: '/dashboard/app-builds', icon: 'device-mobile', description: 'Admins only' },
  ];
  afterEach(() => setReducedMotion(false));

  it('the collapse button calls onCollapsedChange and says what it does', async () => {
    function Harness() {
      const [collapsed, setCollapsed] = useState(false);
      return <Sidebar logo="RNC" items={items} collapsed={collapsed} onCollapsedChange={setCollapsed} />;
    }
    render(<Harness />);
    const toggle = screen.getByRole('button', { name: 'Collapse menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    expect(screen.getByRole('navigation')).toHaveClass('is-collapsed');
    expect(screen.getByRole('button', { name: 'Expand menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('external items are plain links (never the router link) and say they open a new tab', () => {
    render(<Sidebar logo="RNC" items={items} linkComponent={RouterLink} />);
    const reveal = screen.getByRole('link', { name: /Reveal/ });
    expect(reveal).not.toHaveAttribute('data-router');
    expect(reveal).toHaveAttribute('target', '_blank');
    expect(reveal).toHaveAttribute('rel', 'noopener noreferrer');
    expect(reveal).toHaveAccessibleName('Reveal, opens in a new tab');
    expect(reveal.querySelector('.rnc-sidebar-ext')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /App builds/ })).toHaveAttribute('data-router', 'yes');
    expect(screen.getByText('Admins only')).toHaveClass('rnc-sidebar-desc');
  });

  it('pins the main action: a full button, or an icon button with the same name when collapsed', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Sidebar logo="RNC" items={items} primaryAction={{ label: 'New setup form', onClick }} />);
    const full = screen.getByRole('button', { name: 'New setup form' });
    expect(full).toHaveClass('rnc-btn-full');
    await userEvent.click(full);
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<Sidebar logo="RNC" items={items} collapsed primaryAction={{ label: 'New setup form', onClick }} />);
    expect(screen.getByRole('button', { name: 'New setup form' })).toHaveClass('rnc-btn-icon');
  });

  it('a footer function renders in both states and knows which; a badge becomes a dot when collapsed', () => {
    const footer = ({ collapsed }: { collapsed: boolean }) => (collapsed ? <span>v</span> : <span>What’s new v1.5.5</span>);
    const { rerender, container } = render(<Sidebar logo="RNC" items={items} footer={footer} />);
    expect(screen.getByText('What’s new v1.5.5')).toBeInTheDocument();
    rerender(<Sidebar logo="RNC" items={items} footer={footer} collapsed />);
    expect(screen.getByText('v')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Live board, 3' }).querySelector('.rnc-sidebar-dot')).toBeInTheDocument();
    expect(container.querySelector('.rnc-sidebar-badge')).toBeInTheDocument(); // still read out, just hidden from view
  });

  it('collapsed tooltips show on keyboard focus too, and Escape hides them', async () => {
    render(<Sidebar logo="RNC" items={items} collapsed />);
    act(() => screen.getByRole('link', { name: /App builds/ }).focus());
    expect(document.querySelector('.rnc-sidebar-tip')).toHaveTextContent('App builds');
    await userEvent.keyboard('{Escape}');
    expect(document.querySelector('.rnc-sidebar-tip')).toBeNull();
  });

  describe('on phones', () => {
    const narrow = () => {
      window.matchMedia = ((query: string) => ({
        matches: query.includes('max-width'), media: query, onchange: null,
        addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
      })) as unknown as typeof window.matchMedia;
    };
    function Phone({ onChange }: { onChange?: (open: boolean) => void }) {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Menu</button>
          <Sidebar logo="RNC" items={items} collapsed mobileOpen={open} onMobileOpenChange={(o) => { setOpen(o); onChange?.(o); }} primaryAction={{ label: 'New setup form' }} />
        </>
      );
    }

    it('is a drawer: hidden until opened, focus moves in, collapsing ignored, Escape closes and focus returns', async () => {
      narrow();
      render(<Phone />);
      expect(screen.queryByRole('navigation')).toBeNull();
      const menu = screen.getByRole('button', { name: 'Menu' });
      await userEvent.click(menu);
      const dialog = screen.getByRole('dialog', { name: 'Main' });
      expect(within(dialog).getByRole('navigation')).not.toHaveClass('is-collapsed');
      expect(within(dialog).getByRole('link', { name: 'Live board, 3' })).toHaveFocus();
      expect(within(dialog).getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
      expect(within(dialog).queryByRole('button', { name: 'Collapse menu' })).toBeNull();
      expect(document.body.style.overflow).toBe('hidden');
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(menu).toHaveFocus();
      expect(document.body.style.overflow).toBe('');
    });

    it('closes on a tap on the dimmed page, the close button and choosing an item', async () => {
      narrow();
      const onChange = vi.fn();
      render(<Phone onChange={onChange} />);
      const menu = screen.getByRole('button', { name: 'Menu' });
      await userEvent.click(menu);
      await userEvent.click(document.querySelector('.rnc-sidebar-scrim')!);
      expect(screen.queryByRole('dialog')).toBeNull();
      await userEvent.click(menu);
      await userEvent.click(screen.getByRole('button', { name: 'Close menu' }));
      expect(screen.queryByRole('dialog')).toBeNull();
      await userEvent.click(menu);
      fireEvent.click(screen.getByRole('link', { name: /App builds/ }));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(onChange).toHaveBeenCalledTimes(3); // opening is the app's own button; each close reports false
      expect(onChange).toHaveBeenLastCalledWith(false);
    });
  });
});

describe('ReactTableComponent (/tables)', () => {
  type Build = { id: number; platform: string; created_by?: { name: string } };
  const data: Build[] = [
    { id: 3, platform: 'iOS', created_by: { name: 'liam Chen' } },
    { id: 1, platform: 'Android', created_by: { name: 'Ava Martin' } },
    { id: 2, platform: 'iOS', created_by: { name: 'Noah Singh' } },
  ];
  const columns: ReactTableColumn<Build>[] = [
    { Header: 'Build', accessor: 'id', width: 90, resizable: false },
    { Header: 'Uploaded by', accessor: 'created_by.name', minWidth: 150, Cell: ({ value, original, row }) => <span data-testid="cell">{value}|{original.platform}|{row.id}</span> },
    { Header: 'Actions', id: 'actions', sortable: false, width: 110, Cell: ({ original }) => <button type="button">Edit {original.id}</button> },
    { Header: 'Hidden', accessor: 'platform', show: false },
  ];
  const bodyRows = (c: HTMLElement) => Array.from(c.querySelectorAll('.rnc-rt-tbody [role="row"]'));

  it('is the default export too, so the app shims it in one line', () => {
    expect(DefaultTable).toBe(ReactTableComponent);
  });

  it('reads v6 columns: dotted accessors, Cell with value, original and row, hidden columns, v6 widths', () => {
    const { container } = render(<ReactTableComponent columns={columns} data={data} className="-striped -highlight h-100" aria-label="App builds" />);
    expect(container.firstChild).toHaveClass('rnc-rt', '-striped', '-highlight', 'h-100');
    const table = screen.getByRole('table', { name: 'App builds' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Build', 'Uploaded by', 'Actions']);
    expect(screen.getAllByTestId('cell')[0]).toHaveTextContent('liam Chen|iOS|3');
    const [build, by] = within(table).getAllByRole('columnheader');
    expect(build).toHaveStyle({ width: '90px', maxWidth: '90px' });
    expect(by).toHaveStyle({ width: '150px' });
    expect(by.style.maxWidth).toBe('');
  });

  it('sorts like v6: sortable by default, A to Z then Z to A, case-insensitive; sortable: false opts out', async () => {
    const { container } = render(<ReactTableComponent columns={columns} data={data} />);
    expect(screen.queryByRole('button', { name: 'Actions' })).toBeNull();
    const by = screen.getByRole('button', { name: 'Uploaded by' });
    await userEvent.click(by);
    expect(by.closest('[role="columnheader"]')).toHaveAttribute('aria-sort', 'ascending');
    expect(bodyRows(container).map((r) => r.textContent?.split('|')[0])).toEqual(['1Ava Martin', '3liam Chen', '2Noah Singh']);
    await userEvent.click(by);
    expect(by.closest('[role="columnheader"]')).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(by);
    expect(by.closest('[role="columnheader"]')).toHaveAttribute('aria-sort', 'ascending'); // no "unsorted" step, as in v6
  });

  it('applies defaultSorted', () => {
    const { container } = render(<ReactTableComponent columns={columns} data={data} defaultSorted={[{ id: 'id', desc: true }]} />);
    expect(bodyRows(container).map((r) => r.firstChild?.textContent)).toEqual(['3', '2', '1']);
  });

  it('getTrProps adds a class (and style) to a row from rowInfo.original', () => {
    const { container } = render(<ReactTableComponent columns={columns} data={data} getTrProps={(_s, rowInfo) => (rowInfo?.original.id === 2 ? { className: 'ticket-row-highlighted', style: { fontWeight: 700 } } : {})} />);
    const rows = bodyRows(container);
    expect(rows[2]).toHaveClass('rnc-rt-tr', 'ticket-row-highlighted');
    expect(rows[2]).toHaveStyle({ fontWeight: '700' });
    expect(rows[0]).not.toHaveClass('ticket-row-highlighted');
  });

  it('empty: a spinner while loading, otherwise noDataText (default "No records available")', () => {
    const { rerender } = render(<ReactTableComponent columns={columns} data={[]} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    rerender(<ReactTableComponent columns={columns} data={[]} />);
    expect(screen.getByText('No records available')).toBeInTheDocument();
    rerender(<ReactTableComponent columns={columns} data={[]} noDataText="No briefs yet." />);
    expect(screen.getByText('No briefs yet.')).toBeInTheDocument();
  });

  it('shows every row by default (pageSize 10000, no pagination); pageSize and showPagination still work', async () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ id: i, platform: 'iOS' }));
    const { container, rerender } = render(<ReactTableComponent columns={columns} data={many} />);
    expect(bodyRows(container)).toHaveLength(40);
    rerender(<ReactTableComponent columns={columns} data={many} pageSize={15} showPagination />);
    expect(bodyRows(container)).toHaveLength(15);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('filterable adds v6 filters: rows whose value starts with the text', async () => {
    const { container } = render(<ReactTableComponent columns={columns} data={data} filterable />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter Uploaded by' }), 'Ava');
    expect(bodyRows(container)).toHaveLength(1);
    expect(screen.queryByRole('textbox', { name: 'Filter Actions' })).toBeNull();
  });

  it('calls onScrollNearEnd 150ms after scrolling stops past 60%, only while hasMoreData', () => {
    vi.useFakeTimers();
    const near = vi.fn();
    const { rerender } = render(<ReactTableComponent columns={columns} data={data} onScrollNearEnd={near} hasMoreData aria-label="Builds" />);
    const scroller = screen.getByRole('table', { name: 'Builds' });
    const at = (top: number) => {
      Object.defineProperty(scroller, 'scrollHeight', { value: 1000, configurable: true });
      Object.defineProperty(scroller, 'clientHeight', { value: 400, configurable: true });
      Object.defineProperty(scroller, 'scrollTop', { value: top, configurable: true, writable: true });
      fireEvent.scroll(scroller);
    };
    at(100); // (100 + 400) / 1000 = 50%
    act(() => { vi.advanceTimersByTime(200); });
    expect(near).not.toHaveBeenCalled();
    at(250); // 65%
    act(() => { vi.advanceTimersByTime(100); });
    expect(near).not.toHaveBeenCalled(); // still settling
    act(() => { vi.advanceTimersByTime(60); });
    expect(near).toHaveBeenCalledTimes(1);
    rerender(<ReactTableComponent columns={columns} data={data} onScrollNearEnd={near} hasMoreData={false} aria-label="Builds" />);
    at(500);
    act(() => { vi.advanceTimersByTime(200); });
    expect(near).toHaveBeenCalledTimes(1);
  });

  it('appending rows keeps the same scroll area (so the position stays), and accepts isLoadingMore and pagination', () => {
    const { rerender } = render(<ReactTableComponent columns={columns} data={data} aria-label="Builds" pagination={{}} isLoadingMore />);
    const scroller = screen.getByRole('table', { name: 'Builds' });
    scroller.scrollTop = 300;
    expect(screen.getByRole('status')).toHaveTextContent('Loading more');
    rerender(<ReactTableComponent columns={columns} data={[...data, { id: 4, platform: 'iOS' }]} aria-label="Builds" pagination={{}} />);
    expect(screen.getByRole('table', { name: 'Builds' })).toBe(scroller);
    expect(scroller.scrollTop).toBe(300);
    expect(scroller.querySelectorAll('.rnc-rt-tbody [role="row"]')).toHaveLength(4);
  });
});

describe('Switch (/inputs, MUI)', () => {
  it('is MUI’s Switch with the same props, in the design system’s look', async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} inputProps={{ 'aria-label': 'Show on Live board' }} />);
    const input = screen.getByLabelText('Show on Live board') as HTMLInputElement;
    expect(input.closest('.MuiSwitch-root')).toBeInTheDocument();
    await userEvent.click(input);
    expect(onChange).toHaveBeenCalledWith(expect.anything(), true);
  });

  it('passes disabled through', () => {
    render(<Switch disabled defaultChecked inputProps={{ 'aria-label': 'Archived' }} />);
    expect(screen.getByLabelText('Archived')).toBeDisabled();
  });
});
