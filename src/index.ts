// @rafflenexuscanada/design-system
// Import the styles once in your app:  import '@rafflenexuscanada/design-system/styles.css';
// and the fonts if you self-host them: import '@rafflenexuscanada/design-system/fonts.css';

export { Button, type ButtonProps, type ButtonVariant } from './components/Button';
export { Icon, type IconProps } from './components/Icon';
export { VerifiedBadge, type VerifiedBadgeProps } from './components/VerifiedBadge';
export { LedgerLine, type LedgerLineProps, type LedgerItem } from './components/LedgerLine';
export { ProofStat, type ProofStatProps } from './components/ProofStat';
export { JackpotFigure, type JackpotFigureProps } from './components/JackpotFigure';
export { JackpotTile, type JackpotTileProps } from './components/JackpotTile';
export { FlagshipRoster, type FlagshipRosterProps, type RosterGroup } from './components/FlagshipRoster';
export { PoweredBy, type PoweredByProps } from './components/PoweredBy';
export { LeaderHero, type LeaderHeroProps, type HeroAction } from './components/LeaderHero';
export { RaffleBrand, type RaffleBrandProps, type BrandMark } from './components/RaffleBrand';
export { NodeGraphic, type NodeGraphicProps } from './components/NodeGraphic';
export { Odometer, type OdometerProps } from './components/Odometer';
export { TicketButton, type TicketButtonProps, type TicketButtonColors } from './components/TicketButton';

// Forms and menus
export { TextField, TextArea, type TextFieldProps, type TextAreaProps } from './components/TextField';
export { Select, type SelectProps, type SelectOption } from './components/Select';
export { Checkbox, RadioGroup, Switch, type CheckboxProps, type RadioGroupProps, type RadioOption, type SwitchProps } from './components/Choices';
export { ErrorSummary, type ErrorSummaryProps, type ErrorSummaryItem } from './components/ErrorSummary';
export { Dropdown, type DropdownProps, type DropdownItem } from './components/Dropdown';
export type { FieldBaseProps } from './components/Field';

export { tokens, type ColorToken } from './generated/tokens';
export { ICONS, ICON_NAMES, type IconName } from './generated/icons';
export { NODES, NODE_NAMES, type NodeName } from './generated/nodes';
export { useReducedMotion } from './utils';
