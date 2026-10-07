import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type Row, type RowSelectionState, type SortingState,
} from '@tanstack/react-table';
import { useFieldId } from './Field';
import { cx } from '../utils';

/**
 * Column options the Table reads from `meta` (TanStack's free-form column field):
 *   { align: 'right' | 'center', numeric: true }  numeric right-aligns the column and sets it in the mono face.
 */
export interface TableColumnMeta {
  align?: 'left' | 'right' | 'center';
  numeric?: boolean;
}

export interface TableProps<TData> {
  /** The rows. Keep the array stable (useMemo or state) so the table doesn't reset on every render. */
  data: TData[];
  /** TanStack Table column definitions: accessorKey or accessorFn, header, cell, enableSorting, meta… */
  columns: ColumnDef<TData, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** What the table shows, for screen readers (and on screen with showCaption). Required. */
  caption: string;
  showCaption?: boolean;
  /** Click headers to sort. Default true; switch a column off with enableSorting: false. */
  enableSorting?: boolean;
  initialSorting?: SortingState;
  /** Show a search box that filters every column. */
  searchable?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;
  /** Rows per page. Leave out to show every row. */
  pageSize?: number;
  /** Add a checkbox per row and a select-all for the page. */
  enableRowSelection?: boolean;
  /** Called with the selected rows' data whenever the selection changes. */
  onRowSelectionChange?: (rows: TData[]) => void;
  /** A stable id per row (e.g. an order number). Defaults to the row index. */
  getRowId?: (row: TData, index: number) => string;
  /** Names a row for its checkbox, e.g. (o) => `order ${o.id}`. */
  getRowLabel?: (row: TData) => string;
  /** Shown when there are no rows, or none match the search. */
  emptyMessage?: ReactNode;
  /** Nouns for the count, e.g. ["order", "orders"]. Default ["row", "rows"]. */
  countNoun?: [string, string];
  className?: string;
}

function alignClass(meta: TableColumnMeta | undefined) {
  if (!meta) return undefined;
  if (meta.numeric) return 'is-num';
  return meta.align === 'right' ? 'is-num' : meta.align === 'center' ? 'is-center' : undefined;
}

/**
 * Data in rows, with TanStack Table (react-table) behaviour: pass `columns` and `data`, and get sorting,
 * search, row selection and pages, styled for Raffle Nexus. Sortable headers are buttons with aria-sort.
 */
export function Table<TData>({
  data, columns, caption, showCaption, enableSorting = true, initialSorting = [], searchable, searchLabel = 'Search',
  searchPlaceholder, pageSize, enableRowSelection, onRowSelectionChange, getRowId, getRowLabel,
  emptyMessage = 'Nothing to show yet.', countNoun = ['row', 'rows'], className,
}: TableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const searchId = `${useFieldId()}-search`;

  const allColumns = useMemo<ColumnDef<TData, any>[]>(() => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!enableRowSelection) return columns;
    const select: ColumnDef<TData, unknown> = {
      id: '__select',
      enableSorting: false,
      enableGlobalFilter: false,
      header: ({ table }) => (
        <input type="checkbox" aria-label="Select all rows on this page" checked={table.getIsAllPageRowsSelected()}
          ref={(el) => { if (el) el.indeterminate = table.getIsSomePageRowsSelected(); }}
          onChange={table.getToggleAllPageRowsSelectedHandler()} />
      ),
      cell: ({ row }) => (
        <input type="checkbox" aria-label={`Select ${getRowLabel ? getRowLabel(row.original) : `row ${row.index + 1}`}`}
          checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} />
      ),
    };
    return [select, ...columns];
  }, [columns, enableRowSelection, getRowLabel]);

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, globalFilter, rowSelection },
    enableSorting,
    enableRowSelection: !!enableRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pageSize ? { getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageIndex: 0, pageSize } } } : {}),
  });

  // Report the selection to the caller.
  const onSel = useRef(onRowSelectionChange);
  onSel.current = onRowSelectionChange;
  useEffect(() => {
    onSel.current?.(table.getSelectedRowModel().flatRows.map((r: Row<TData>) => r.original));
  }, [rowSelection]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCount = table.getFilteredRowModel().rows.length;
  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;
  const rows = table.getRowModel().rows;
  const colCount = table.getVisibleLeafColumns().length;

  return (
    <div className={cx('rnc-table-block', className)}>
      {searchable || enableRowSelection ? (
        <div className="rnc-table-toolbar">
          {searchable ? (
            <div className="rnc-field rnc-table-search">
              <label className="rnc-field-label" htmlFor={searchId}>{searchLabel}</label>
              <input id={searchId} className="rnc-input" type="search" value={globalFilter} placeholder={searchPlaceholder}
                onChange={(e) => { setGlobalFilter(e.target.value); if (pageSize) table.setPageIndex(0); }} />
            </div>
          ) : <span />}
          <span className="rnc-table-count" aria-live="polite">
            {`${filteredCount} ${filteredCount === 1 ? countNoun[0] : countNoun[1]}${selectedCount ? ` · ${selectedCount} selected` : ''}`}
          </span>
        </div>
      ) : null}
      <div className="rnc-table-wrap">
        <table className="rnc-table">
          <caption className={showCaption ? undefined : 'rnc-sr-only'}>{caption}</caption>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const meta = h.column.columnDef.meta as TableColumnMeta | undefined;
                  const sorted = h.column.getIsSorted();
                  const canSort = h.column.getCanSort();
                  const content = h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext());
                  return (
                    <th key={h.id} scope="col" colSpan={h.colSpan}
                      className={cx(h.column.id === '__select' && 'rnc-table-check', alignClass(meta))}
                      aria-sort={canSort ? (sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none') : undefined}>
                      {canSort ? (
                        <button type="button" className="rnc-table-sort" onClick={h.column.getToggleSortingHandler()}>
                          {content}<span className="rnc-table-sort-icon" aria-hidden="true" />
                        </button>
                      ) : content}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.id} className={row.getIsSelected() ? 'is-selected' : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={cx(cell.column.id === '__select' && 'rnc-table-check', alignClass(cell.column.columnDef.meta as TableColumnMeta | undefined))}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            )) : (
              <tr><td className="rnc-table-empty" colSpan={colCount}>{emptyMessage}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pageSize && table.getPageCount() > 1 ? (
        <nav className="rnc-table-pager" aria-label={`${caption}, pages`}>
          <span>{`Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}</span>
          <button type="button" className="rnc-btn rnc-btn-secondary" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</button>
          <button type="button" className="rnc-btn rnc-btn-secondary" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</button>
        </nav>
      ) : null}
    </div>
  );
}
