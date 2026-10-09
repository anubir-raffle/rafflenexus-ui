import { useCallback, useState } from 'react';
import { Avatar, AvatarGroup, Button, Sidebar, type SidebarItem } from '../src';
import { ReactTableComponent, type ReactTableColumn } from '../src/tables';
import { Switch as MuiSwitch } from '../src/inputs';

/** Every Button variant, size and state, with a working loading demo. */
export function ButtonsDemo() {
  const [uploading, setUploading] = useState(false);
  const upload = () => { setUploading(true); setTimeout(() => setUploading(false), 2000); };
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="rnc-row">
        <Button>Save changes</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">Edit</Button>
        <Button variant="link">View the changelog</Button>
        <Button variant="danger">Delete raffle</Button>
        <Button variant="danger-ghost">Remove</Button>
      </div>
      <div className="rnc-row">
        <Button size="sm">Small</Button>
        <Button>Medium</Button>
        <Button size="lg">Large</Button>
        <Button startIcon="plus">New setup form</Button>
        <Button variant="secondary" endIcon="arrow-square-out" href="#" target="_blank">Open Reveal</Button>
        <Button variant="ghost" iconOnly startIcon="copy" aria-label="Copy link" />
        <Button variant="secondary" iconOnly startIcon="x" aria-label="Close" />
      </div>
      <div className="rnc-row">
        <Button type="submit" loading={uploading} loadingText="Uploading…" startIcon="upload-simple" onClick={upload}>Upload</Button>
        <Button loading loadingText="Saving…">Save changes</Button>
        <Button iconOnly startIcon="copy" aria-label="Copy link" loading />
        <Button disabled>Save changes</Button>
        <Button variant="secondary" href="/changelog" disabled>Changelog</Button>
      </div>
      <div style={{ width: 320, maxWidth: '100%' }}><Button fullWidth>Continue to payment</Button></div>
    </div>
  );
}

const PEOPLE = ['Priya Sharma', 'Liam Chen', 'Ava Martin', 'Noah Singh', 'Emma Roy', 'Jack Taylor', 'Amrit Gill'];

export function AvatarsDemo() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="rnc-row" style={{ alignItems: 'flex-end', gap: 20 }}>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => <Avatar key={s} alt="Noah Singh" size={s} />)}
        <Avatar alt="Noah Singh" size={96} />
        <Avatar alt="Emma Roy" size="xl" variant="rounded" />
        <Avatar src="data:image/png;base64,AAAA" alt="Liam Chen" size="xl" />
        <Avatar size="xl" />
      </div>
      <div className="rnc-row" style={{ gap: 28 }}>
        <Avatar name="Jordan Lee" subtitle="Account manager" />
        <Avatar name="Amrit Gill" subtitle="Admin" size="xl" layout="column" />
        <div style={{ width: 220 }}><Avatar name="Alexandra Montgomery-Richardson" subtitle="alexandra.montgomery@example.org" /></div>
        <AvatarGroup max={5}>{PEOPLE.map((n) => <Avatar key={n} alt={n} />)}</AvatarGroup>
      </div>
    </div>
  );
}

type Build = { id: number; platform: string; version: string; created_by: { name: string }; date: string };
const makeBuilds = (from: number, n: number): Build[] => Array.from({ length: n }, (_, k) => {
  const i = from + k;
  return { id: 4200 - i, platform: i % 3 ? 'iOS' : 'Android', version: `1.${9 - Math.floor(i / 12)}.${i % 12}`, created_by: { name: PEOPLE[i % 5] }, date: new Date(2026, 9, 9 - Math.floor(i / 3)).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) };
});
// Column definitions written the way the Raffle Builder writes them for react-table v6.
const BUILD_COLUMNS: ReactTableColumn<Build>[] = [
  { Header: 'Build', accessor: 'id', width: 90, resizable: false },
  { Header: 'Platform', accessor: 'platform', minWidth: 100, resizable: false },
  { Header: 'Version', accessor: 'version', width: 100, resizable: false },
  { Header: 'Uploaded by', accessor: 'created_by.name', minWidth: 150, resizable: false, Cell: ({ value }) => <Avatar name={value} size="sm" /> },
  { Header: 'Uploaded', accessor: 'date', minWidth: 120, resizable: false },
  { Header: '', id: 'actions', width: 120, sortable: false, resizable: false, Cell: ({ original }) => <Button variant="ghost" size="sm" onClick={() => alert(`Download build ${original.id}`)}>Download</Button> },
];

const ITEMS: SidebarItem[] = [
  { label: 'Live board', href: '#live', icon: 'chart-line-up', current: true, badge: 3 },
  { label: 'All setup forms', href: '#forms', icon: 'receipt' },
  { label: 'Clients', href: '#clients', icon: 'buildings' },
  { label: 'Reveal', href: 'https://example.org/reveal', icon: 'drone', external: true, target: '_blank' },
  { label: 'Rules of play', href: '#rules', icon: 'shield-check' },
  { label: 'Ticket generator', href: '#tickets', icon: 'ticket' },
  { label: 'App builds', href: '#builds', icon: 'device-mobile', description: 'Admins only' },
];
const Logo = () => <svg width="150" height="32" viewBox="0 0 150 32" role="img" aria-label="Sample logo"><rect width="32" height="32" rx="8" fill="var(--action)" /><text x="42" y="22" fontFamily="DM Sans, Arial" fontWeight="700" fontSize="17" fill="var(--ink)">Raffle Builder</text></svg>;
const Mark = () => <svg width="32" height="32" viewBox="0 0 32 32" role="img" aria-label="Sample logo"><rect width="32" height="32" rx="8" fill="var(--action)" /></svg>;

/** The Raffle Builder's frame: the extended Sidebar beside the scroll table. */
export function RaffleBuilderDemo() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rows, setRows] = useState(() => makeBuilds(0, 20));
  const [loadingMore, setLoadingMore] = useState(false);
  const [saved, setSaved] = useState<number | null>(4198);
  const [live, setLive] = useState(true);
  const hasMore = rows.length < 80;
  const loadMore = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => { setRows((r) => [...r, ...makeBuilds(r.length, 20)]); setLoadingMore(false); }, 700);
  }, [loadingMore]);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="rnc-row">
        <Button variant="secondary" startIcon="list" onClick={() => setMobileOpen(true)}>Open the phone menu</Button>
        <span className="rnc-field-hint">Under 980px wide the sidebar is a drawer: narrow the window, then open it.</span>
      </div>
      <div className="demo-layout" style={{ height: 620 }}>
        <div className="demo-layout-side">
          <Sidebar
            logo={<Logo />} logoCollapsed={<Mark />} items={ITEMS} collapsed={collapsed} onCollapsedChange={setCollapsed}
            primaryAction={{ label: 'New setup form', icon: 'plus', onClick: () => alert('New setup form') }}
            footer={({ collapsed: c }) => (
              <a className="rnc-sidebar-item" href="#changelog" aria-label={c ? 'What’s new, version 1.5.5' : undefined}>
                {c ? null : <span className="rnc-sidebar-label">What’s new</span>}
                <span className="rnc-sidebar-version" style={c ? undefined : { marginLeft: 'auto' }}>{c ? 'v' : 'v1.5.5'}</span>
              </a>
            )}
            mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen}
          />
        </div>
        <div className="demo-layout-main" style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', gap: 12, minHeight: 0 }}>
          <div className="rnc-row" style={{ justifyContent: 'space-between' }}>
            <span className="rnc-field-hint">{rows.length} builds loaded{hasMore ? ', scroll the table for more' : ', that’s all'}. Build {saved ?? '—'} is highlighted with getTrProps.</span>
            <label className="rnc-row" style={{ gap: 4 }}><MuiSwitch checked={live} onChange={(_e, v) => setLive(v)} inputProps={{ 'aria-label': 'Show on Live board' }} /><span>Show on Live board (MUI Switch)</span></label>
          </div>
          <div style={{ minHeight: 0 }}>
            <ReactTableComponent
              columns={BUILD_COLUMNS} data={rows} className="-striped -highlight h-100" aria-label="App builds"
              onScrollNearEnd={loadMore} hasMoreData={hasMore} isLoadingMore={loadingMore}
              getTrProps={(_state, rowInfo) => (rowInfo?.original.id === saved ? { className: 'demo-row-saved', onClick: () => setSaved(null) } : {})}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
