// @rafflenexuscanada/design-system/tables
// The Raffle Builder's dashboard table: a drop-in for its react-table v6 wrapper (same props and column format),
// built on TanStack Table. No extra peer dependencies. Import '@rafflenexuscanada/design-system/styles.css' once.
//
//   // src/js/shared/ReactTableComponent.jsx
//   export { ReactTableComponent as default } from '@rafflenexuscanada/design-system/tables';

export {
  ReactTableComponent, defaultSortMethod, columnStyle,
  type ReactTableComponentProps, type ReactTableColumn, type CellInfo, type RowInfo,
} from './ReactTableComponent';
export { ReactTableComponent as default } from './ReactTableComponent';
