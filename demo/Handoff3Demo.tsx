import { useMemo, useRef, useState } from 'react';
import { Avatar, Button, FilterChip, FilterChipGroup, StatusPill, StepTimeline, StepTimelineLabels, type StatusTone, type TimelineStep } from '../src';
import { ReactTableComponent, type ReactTableColumn } from '../src/tables';

// Made-up setup forms. "!" marks a late step.
type Form = { id: number; name: string; client: string; owner: string; status: string; pct?: number; dates: string[]; archived?: boolean };
const FORMS: Form[] = [
  { id: 1, name: 'Spring Gala Raffle', client: 'Riverside Food Bank', owner: 'Jordan Lee', status: 'In progress', pct: 44, dates: ['May 18', '!Aug 4'] },
  { id: 2, name: 'Untitled Raffle', client: 'Northshore Learning Pod', owner: 'Jordan Lee', status: 'Not started', dates: ['May 18'] },
  { id: 3, name: 'Airshow 2026 Raffle', client: 'Valley Aviation Council', owner: 'Priya Sharma', status: 'In progress', pct: 100, dates: ['Feb 19', '!Mar 2', '!Apr 9'] },
  { id: 4, name: 'A Great Raffle', client: 'Valley Aviation Council', owner: 'Priya Sharma', status: 'Ready for QA', dates: ['Feb 19', 'Feb 19', 'Feb 19', '!May 1'] },
  { id: 5, name: 'Untitled Raffle', client: 'Cedar Minor Hockey Association', owner: 'Liam Chen', status: 'Not started', dates: ['Feb 12'] },
  { id: 6, name: 'Summer 50/50', client: 'Lakeside Legion Branch 12 Poppy Fund and Community Programs', owner: 'Liam Chen', status: 'Completed', dates: ['Jan 29', 'Jan 31', '!May 1', '!May 1'] },
  { id: 7, name: 'Old Fall Raffle', client: 'Riverside Food Bank', owner: 'Jordan Lee', status: 'Completed', dates: ['Jan 4', 'Jan 5', 'Jan 9', 'Jan 20'], archived: true },
];
const TONES: Record<string, StatusTone> = { 'Not started': 'neutral', 'In progress': 'progress', 'Ready for QA': 'review', Completed: 'success' };
const ICONS = { 'Not started': 'clock', 'Ready for QA': 'warning', Completed: 'check-circle' } as const;
const STEP_NAMES = ['Created', 'Started', 'Submitted', 'Completed'];
const toSteps = (dates: string[]): TimelineStep[] => STEP_NAMES.map((label, i) => {
  const d = dates[i];
  if (!d) return { label };
  return d.startsWith('!') ? { label, date: d.slice(1), state: 'late' } : { label, date: d };
});

/** All setup forms, as the Raffle Builder shows it: search, filter chips, status pills and the step timeline in the table. */
export function SetupFormsDemo() {
  const search = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [hideArchived, setHideArchived] = useState(true);
  const [status, setStatus] = useState<string | null>('In progress');
  const [owner, setOwner] = useState<string | null>(null);
  const rows = useMemo(() => FORMS.filter((f) =>
    (!hideArchived || !f.archived) && (!status || f.status === status) && (!owner || f.owner === owner) &&
    (!q || `${f.name} ${f.client}`.toLowerCase().includes(q.toLowerCase()))), [q, hideArchived, status, owner]);
  const columns: ReactTableColumn[] = [
    { Header: 'Raffle name', accessor: 'name', minWidth: 160, Cell: ({ value }) => <strong style={{ color: 'var(--ink)' }}>{value}</strong> },
    {
      Header: 'Status', accessor: 'status', width: 180,
      Cell: ({ value, original }) => (
        <StatusPill tone={TONES[value]} icon={ICONS[value as keyof typeof ICONS]} dot={value === 'In progress'} value={original.pct != null ? `${original.pct}%` : undefined}>{value}</StatusPill>
      ),
    },
    { Header: 'Client', accessor: 'client', minWidth: 160, Cell: ({ value }) => <span title={value} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span> },
    { Header: 'Owner', accessor: 'owner', width: 150, Cell: ({ value }) => <Avatar alt={value} name={value.split(' ')[0]} size="md" /> },
    {
      id: 'timeline', Header: () => <StepTimelineLabels labels={STEP_NAMES} />, width: 368, sortable: false,
      accessor: (f: Form) => f.dates.length, Cell: ({ original }) => <StepTimeline steps={toSteps(original.dates)} showLabels={false} />,
    },
    { id: 'actions', Header: () => <span className="rnc-sr-only">Actions</span>, width: 56, sortable: false, accessor: () => '', Cell: ({ original }) => <Button variant="ghost" size="sm" iconOnly startIcon="list" aria-label={`Actions for ${original.name}`} /> },
  ];
  const chips = [
    hideArchived && <FilterChip key="a" label="Hide archived" onRemove={() => setHideArchived(false)} />,
    status && <FilterChip key="s" label="Status" value={status} onRemove={() => setStatus(null)} />,
    owner && <FilterChip key="o" label="Owner" value={owner} onRemove={() => setOwner(null)} />,
  ].filter(Boolean);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="rnc-row" style={{ gap: 12 }}>
        <label className="rnc-sr-only" htmlFor="sf-search">Search setup forms</label>
        <input
          id="sf-search" ref={search} type="search" placeholder="Search by raffle or client" value={q} onChange={(e) => setQ(e.target.value)}
          style={{ boxSizing: 'border-box', flex: '0 1 360px', minWidth: 200, height: 44, padding: '0 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', font: '400 15px/1 var(--font-sans)', color: 'var(--ink)' }}
        />
        <FilterChipGroup returnFocusRef={search} onClearAll={() => { setHideArchived(false); setStatus(null); setOwner(null); }}>{chips}</FilterChipGroup>
        <div className="rnc-row" style={{ marginLeft: 'auto', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={() => { setHideArchived(true); setStatus('In progress'); setOwner('Priya Sharma'); }}>Add sample filters</Button>
        </div>
      </div>
      <div style={{ height: 460, border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
        <ReactTableComponent columns={columns} data={rows} className="-striped -highlight h-100" aria-label="Setup forms" noDataText="No setup forms match these filters." />
      </div>
      <div className="rnc-row" style={{ gap: 10 }}>
        <StatusPill>Not started</StatusPill>
        <StatusPill tone="progress" value="44%">In progress</StatusPill>
        <StatusPill tone="review">Ready for QA</StatusPill>
        <StatusPill tone="success">Completed</StatusPill>
        <StatusPill tone="error" icon="x-circle">Build failed</StatusPill>
        <StatusPill tone="progress" size="sm" value="100%">In progress</StatusPill>
      </div>
      <div style={{ maxWidth: 440 }}>
        <StepTimeline aria-label="Setup form timeline" steps={[
          { label: 'Created', date: new Date(2026, 4, 18) }, { label: 'Started', date: new Date(2026, 7, 4), state: 'late' }, { label: 'Submitted' }, { label: 'Completed' },
        ]} />
      </div>
    </div>
  );
}
