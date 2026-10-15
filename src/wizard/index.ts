// @rafflenexuscanada/design-system/wizard
// The Raffle Builder's setup form wizard on react-final-form, with the app's props and behaviour, in the design system's look.
// Peer dependencies (the app already has them): react-final-form, final-form, final-form-arrays.
// Import '@rafflenexuscanada/design-system/styles.css' once.

export {
  Wizard, WizardPage, WizardSteps,
  type WizardProps, type WizardPageProps, type WizardMutators, type WizardStep, type WizardStepState,
} from './Wizard';
export {
  WizardHeader, WizardDeadline, WizardSection,
  type WizardHeaderProps, type WizardDeadlineProps, type WizardSectionProps,
} from './parts';
export { Wizard as default } from './Wizard';
