import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type UIEvent } from 'react';
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type ColumnFiltersState, type PaginationState, type Row, type SortingState,
} from '@tanstack/react-table';
import { Button } from '../components/Button';
import { cx } from '../utils';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyRow = any;

/** What a react-table v6 `Cell` receives. */
export interface CellInfo<T = AnyRow> {
  /** The accessor's value. */
  value: any;
  /** The raw row object. */
  original: T;
  /** The row's accessed values by column id, plus `_original` and `_index`, as in v6. */
  row: Record<string, any>;
  index: number;
  viewIndex: number;
  column: ReactTableColumn<T>;
}
/** What `getTrProps` receives for each row, as in v6. */
export interface RowInfo<T = AnyRow> {
  original: T;
  row: Record<string, any>;
  index: number;
  viewIndex: number;
  level: number;
}
/** A react-table v6 column definition. The keys the Raffle Builder uses work unchanged. */
export interface ReactTableColumn<T = AnyRow> {
  Header?: ReactNode | ((info: { column: ReactTableColumn<T>; data: T[] }) => ReactNode);
  /** A property name or dotted path ("created_by.name"), or a function of the row (then give an `id`). */
  accessor?: string | ((row: T) => unknown);
  id?: string;
  Cell?: ReactNode | ((info: CellInfo<T>) => ReactNode);
  /** Pixels. `width` fixes the column; `minWidth` (default 100) lets it grow; `maxWidth` caps it. */
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /** v6 default true. Column resizing isn't built in; the prop is accepted. */
  resizable?: boolean;
  /** v6 default true. */
  sortable?: boolean;
  filterable?: boolean;
  /** false hides the column. */
  show?: boolean;
  className?: string;
  headerClassName?: string;
  style?: CSSProperties;
  headerStyle?: CSSProperties;
  /** (a, b, desc) => number, ascending order. Default: v6's (case-insensitive, empty first). */
  sortMethod?: (a: any, b: any, desc?: boolean) => number;
  /** ({ id, value }, row) => boolean. Default: v6's (the value starts with the filter text). */
  filterMethod?: (filter: { id: string; value: any }, row: Record<string, any>) => boolean;
  [key: string]: unknown;
}
type TrProps = { className?: string; style?: CSSProperties; [key: string]: unknown };

export interface ReactTableComponentProps<T = AnyRow> {
  columns: ReactTableColumn<T>[];
  data: T[];
  /** v6 per-column filters under the header. Default false. */
  filterable?: boolean;
  /** No rows and loading: a spinner where the rows go. */
  loading?: boolean;
  /** No rows and not loading. Default "No records available". */
  noDataText?: ReactNode;
  /** Called when the rows are 60% scrolled (150ms after scrolling stops), only while `hasMoreData`. */
  onScrollNearEnd?: () => void;
  hasMoreData?: boolean;
  /** "-striped" (alternate rows), "-highlight" (row hover), "h-100" (fill the parent's height), plus your own. */
  className?: string;
  style?: CSSProperties;
  /** (state, rowInfo) => { className, style, … } for a row, as in v6. */
  getTrProps?: (state: unknown, rowInfo?: RowInfo<T>, column?: unknown, instance?: unknown) => TrProps | undefined | void;
  /** Default 10000 with no pagination: every row shows. */
  defaultPageSize?: number;
  pageSize?: number;
  showPagination?: boolean;
  /** [{ id, desc }] */
  defaultSorted?: { id: string; desc?: boolean }[];
  /** Table-wide default for columns. v6 default true. */
  sortable?: boolean;
  /** Shows a small spinner under the last row while more rows load. */
  isLoadingMore?: boolean;
  /** Accepted for compatibility; not used. */
  pagination?: unknown;
  minRows?: number;
  resizable?: boolean;
  /** The table's accessible name, e.g. "App builds". */
  'aria-label'?: string;
  [key: string]: unknown;
}

const get = (obj: any, path: string) => path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), obj);

/** v6's default sort: null and undefined as "", strings case-insensitive, ascending. */
export function defaultSortMethod(a: any, b: any): number {
  a = a === null || a === undefined ? '' : a;
  b = b === null || b === undefined ? '' : b;
  a = typeof a === 'string' ? a.toLowerCase() : a;
  b = typeof b === 'string' ? b.toLowerCase() : b;
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

/** v6's flex sizing: `width` fixes the column (and caps it), `minWidth` (default 100) lets it grow, `maxWidth` caps it. */
export function columnStyle(c: ReactTableColumn<any>): CSSProperties {
  const width = c.width ?? c.minWidth ?? 100;
  const max = c.width ?? c.maxWidth;
  return { flex: `${width} 0 auto`, width, maxWidth: max };
}

function render(thing: unknown, params: object): ReactNode {
  // As v6 does: functions are called with the params; class components get rendered; anything else is used as is.
  if (typeof thing === 'function') {
    const C = thing as any;
    return C.prototype && C.prototype.isReactComponent ? <C {...params} /> : C(params);
  }
  return thing as ReactNode;
}

const textOf = (h: unknown, id: string) => (typeof h === 'string' && h ? h : id);

function ReactTableInner<T = AnyRow>({
  columns, data, filterable = false, loading, noDataText = 'No records available', onScrollNearEnd, hasMoreData = false,
  className, style, getTrProps, defaultPageSize, pageSize, showPagination = false, defaultSorted, sortable = true, isLoadingMore,
  'aria-label': ariaLabel,
}: ReactTableComponentProps<T>) {
  const visible = useMemo(() => columns.filter((c) => c.show !== false), [columns]);
  const ids = useMemo(() => visible.map((c, i) => c.id ?? (typeof c.accessor === 'string' ? c.accessor : undefined) ?? `col_${i}`), [visible]);
  const sortDesc = useRef(false);

  const defs = useMemo<ColumnDef<T, unknown>[]>(() => visible.map((c, i) => {
    const id = ids[i];
    const accessorFn = typeof c.accessor === 'function' ? c.accessor : typeof c.accessor === 'string' ? (row: T) => get(row, c.accessor as string) : undefined;
    const sortMethod = c.sortMethod ?? defaultSortMethod;
    return {
      id,
      ...(accessorFn ? { accessorFn: accessorFn as (row: T) => unknown } : {}),
      enableSorting: !!accessorFn && (c.sortable ?? sortable),
      sortingFn: (a: Row<T>, b: Row<T>, colId: string) => sortMethod(a.getValue(colId), b.getValue(colId), sortDesc.current),
      sortUndefined: false,
      enableColumnFilter: !!accessorFn && (c.filterable ?? filterable),
      filterFn: (row: Row<T>, colId: string, value: unknown) => {
        if (c.filterMethod) return c.filterMethod({ id: colId, value }, rowValues(row));
        const v = row.getValue(colId);
        return v === undefined ? true : String(v).startsWith(String(value));
      },
      meta: { col: c },
    } as ColumnDef<T, unknown>;
  }), [visible, ids, sortable, filterable]); // eslint-disable-line react-hooks/exhaustive-deps

  const rowValues = (row: Row<T>): Record<string, any> => {
    const out: Record<string, any> = { _original: row.original, _index: row.index };
    for (const id of ids) out[id] = row.getValue(id);
    return out;
  };

  const [sorting, setSorting] = useState<SortingState>(() => (defaultSorted ?? []).map((s) => ({ id: s.id, desc: !!s.desc })));
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const size = pageSize ?? defaultPageSize ?? 10000;
  const [page, setPage] = useState<PaginationState>({ pageIndex: 0, pageSize: size });
  useEffect(() => setPage((p) => (p.pageSize === size ? p : { pageIndex: 0, pageSize: size })), [size]);
  sortDesc.current = !!sorting[0]?.desc;

  const table = useReactTable<T>({
    data, columns: defs,
    state: { sorting, columnFilters: filters, pagination: page },
    onSortingChange: setSorting, onColumnFiltersChange: setFilters, onPaginationChange: setPage,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSortingRemoval: false, enableMultiSort: false, sortDescFirst: false, autoResetPageIndex: false,
  });
  const rows = table.getRowModel().rows;

  // Infinite scroll: once the rows are 60% scrolled, 150ms after scrolling stops, while there's more to load.
  const latest = useRef({ onScrollNearEnd, hasMoreData });
  latest.current = { onScrollNearEnd, hasMoreData };
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const { onScrollNearEnd: cb, hasMoreData: more } = latest.current;
      if (!cb || !more || !el.scrollHeight) return;
      if ((el.scrollTop + el.clientHeight) / el.scrollHeight >= 0.6) cb();
    }, 150);
  };

  const headerCell = (c: ReactTableColumn<T>, i: number) => {
    const col = table.getColumn(ids[i])!;
    const content = render(c.Header ?? '', { column: c, data });
    const can = col.getCanSort();
    const dir = col.getIsSorted();
    return (
      <div
        key={ids[i]} role="columnheader" aria-sort={can ? (dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none') : undefined}
        className={cx('rnc-rt-th', c.headerClassName)} style={{ ...columnStyle(c), ...c.headerStyle }}
      >
        {can ? (
          <button type="button" className="rnc-table-sort" onClick={() => col.toggleSorting(dir === 'asc')}>
            {content}<span className="rnc-table-sort-icon" aria-hidden="true" />
          </button>
        ) : content}
      </div>
    );
  };

  const showFilters = visible.some((c, i) => table.getColumn(ids[i])?.getCanFilter());
  const pages = Math.max(1, table.getPageCount());

  return (
    <div className={cx('rnc-rt', className)} style={style}>
      <div className="rnc-rt-scroll" role="table" aria-label={ariaLabel} aria-busy={loading || isLoadingMore ? true : undefined} tabIndex={0} onScroll={onScroll}>
        <div className="rnc-rt-thead" role="rowgroup">
          <div className="rnc-rt-tr" role="row">{visible.map(headerCell)}</div>
          {showFilters ? (
            <div className="rnc-rt-tr rnc-rt-filters" role="row">
              {visible.map((c, i) => {
                const col = table.getColumn(ids[i])!;
                return (
                  <div key={ids[i]} role="columnheader" className="rnc-rt-th" style={columnStyle(c)}>
                    {col.getCanFilter() ? (
                      <input
                        className="rnc-rt-filter" type="text" aria-label={`Filter ${textOf(c.Header, ids[i])}`}
                        value={(col.getFilterValue() as string) ?? ''} onChange={(e) => col.setFilterValue(e.target.value || undefined)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        {rows.length ? (
          <div className="rnc-rt-tbody" role="rowgroup">
            {rows.map((row, viewIndex) => {
              const values = rowValues(row);
              const info: RowInfo<T> = { original: row.original, row: values, index: row.index, viewIndex, level: 0 };
              const { className: trClass, style: trStyle, ...trRest } = (getTrProps?.(table.getState(), info, undefined, table) || {}) as TrProps;
              return (
                <div key={row.id} role="row" {...(trRest as object)} className={cx('rnc-rt-tr', trClass)} style={trStyle}>
                  {visible.map((c, i) => {
                    const value = values[ids[i]];
                    const cell = c.Cell != null ? render(c.Cell, { value, original: row.original, row: values, index: row.index, viewIndex, column: c }) : value;
                    return <div key={ids[i]} role="cell" className={cx('rnc-rt-td', c.className)} style={{ ...columnStyle(c), ...c.style }}>{cell as ReactNode}</div>;
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rnc-rt-empty" role={loading ? 'status' : undefined}>
            {loading ? <><span className="rnc-rt-spinner" aria-hidden="true" /><span className="rnc-sr-only">Loading</span></> : noDataText}
          </div>
        )}
        {rows.length && isLoadingMore ? (
          <div className="rnc-rt-more" role="status"><span className="rnc-rt-spinner" aria-hidden="true" /><span className="rnc-sr-only">Loading more</span></div>
        ) : null}
      </div>
      {showPagination ? (
        <div className="rnc-rt-pager">
          <span>Page {page.pageIndex + 1} of {pages}</span>
          <Button variant="secondary" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</Button>
          <Button variant="secondary" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The Raffle Builder's dashboard table, as a drop-in for its react-table v6 wrapper: same props, same column format.
 * Fills its parent (`h-100`), keeps the header in place, scrolls the rows inside, and asks for more near the end.
 * Built on TanStack Table.
 */
export const ReactTableComponent = memo(ReactTableInner) as typeof ReactTableInner;
