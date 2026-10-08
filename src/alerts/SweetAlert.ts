import type { ReactNode } from 'react';
import SwalImport from 'sweetalert2';
import type { SweetAlertCustomClass, SweetAlertOptions, SweetAlertResult } from 'sweetalert2';
import withReactContentImport from 'sweetalert2-react-content';
import { ICONS, type IconName } from '../generated/icons';
import { tokens } from '../generated/tokens';

// Default exports from CommonJS packages can arrive wrapped ({ default: fn }) depending on the bundler: unwrap them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrap = <T,>(m: any): T => { let f = m; while (f && typeof f !== 'function' && f.default) f = f.default; return f as T; };
const Swal = unwrap<typeof SwalImport>(SwalImport);
const withReactContent = unwrap<typeof withReactContentImport>(withReactContentImport);

// SweetAlert instance that also renders React elements (JSX) as content.
const MySwal = withReactContent(Swal);

/** App services the alerts use. The package can't import them, so the app passes them in once (see configureSweetAlert). */
export interface SweetAlertServices {
  /** Saves "Don't show this again" choices, e.g. `saveUserSettings({ [checkboxKey]: true })`. */
  saveUserSettings?: (settings: Record<string, boolean>) => unknown;
  /** Claims the top Escape layer while an alert is open; returns the function that releases it. */
  pushEscapeLayer?: () => (() => void) | null | undefined;
}
let services: SweetAlertServices = {};

/**
 * Connect the alerts to the app's services, once at startup:
 * `configureSweetAlert({ saveUserSettings, pushEscapeLayer })`.
 */
export function configureSweetAlert(next: SweetAlertServices): void {
  services = { ...services, ...next };
}

// Global flag to track if SweetAlert is open
let isAlertOpen = false;

/** True while an alert is open. */
export const isSweetAlertOpen = () => isAlertOpen;

// Removes this alert from the app's shared Escape-layer stack. SweetAlert2 already closes itself on Escape,
// so registering just claims the topmost layer: a Bootstrap modal underneath doesn't also close on the same keypress.
let popEscapeLayer: (() => void) | null = null;

// The "Don't show this again" state, recorded as it changes: the checkbox may already be gone when the alert's
// promise resolves (no close animation, e.g. under reduced motion).
const checkboxState: Record<string, boolean> = {};

const icon = (name: IconName, className: string) =>
  `<svg class="${className} rnc-icon" viewBox="0 0 256 256" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

// Title with a state icon. Keeps the app's class names (swal2-title-with-icon, swal2-*-icon) beside the design system's.
const titleWithIcon = (name: IconName, iconClass: string, state: string, title: string) =>
  `<span class="swal2-title-with-icon rnc-alert-head is-${state}">${icon(name, iconClass)}<span>${title}</span></span>`;

// SweetAlert2 types its options as a union per input type, which doesn't survive spreading; build with a loose type.
type AnyOptions = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

// The design system's classes for each part of the alert (bundle.css, the AlertBox card).
const RNC_CLASSES: SweetAlertCustomClass = {
  container: 'rnc-alert-backdrop',
  popup: 'rnc-alert',
  title: 'rnc-alert-title',
  htmlContainer: 'rnc-alert-body',
  actions: 'rnc-alert-actions',
  confirmButton: 'rnc-btn rnc-btn-primary',
  cancelButton: 'rnc-btn rnc-btn-secondary',
  denyButton: 'rnc-btn rnc-btn-secondary',
  closeButton: 'swal2-custom-close-button rnc-alert-close',
  loader: 'rnc-alert-loader',
};

// Default configuration for all alerts
const defaultConfig: SweetAlertOptions = {
  scrollbarPadding: false,
  heightAuto: false,
  allowOutsideClick: false,
  allowEscapeKey: true, // Enable ESC key to close modal
  // Buttons use the design system's button classes instead of SweetAlert2's inline colours.
  buttonsStyling: false,
  confirmButtonColor: tokens.color.action,
  cancelButtonColor: tokens.color.error,
  reverseButtons: true,
  showCloseButton: true,
  closeButtonHtml: `<svg class="swal2-close-icon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">${ICONS.x}</svg>`,
  customClass: { closeButton: 'swal2-custom-close-button' },
  didOpen: () => {
    // Set flag when alert opens
    isAlertOpen = true;
    popEscapeLayer = services.pushEscapeLayer?.() ?? null;
  },
  willClose: () => {
    // Reset flag when alert closes
    isAlertOpen = false;
    if (popEscapeLayer) {
      popEscapeLayer();
      popEscapeLayer = null;
    }
  },
};

/** Adds the design system's classes to each part, keeping any classes the caller passed in `customClass`. */
function styled(config: AnyOptions, extra: SweetAlertCustomClass = {}): SweetAlertOptions {
  const flat = (v: unknown) => (Array.isArray(v) ? v.join(' ') : typeof v === 'string' ? v : '');
  const base: Record<string, unknown> = { ...RNC_CLASSES, ...extra };
  const user: Record<string, unknown> = (typeof config.customClass === 'object' && config.customClass) || {};
  const merged: Record<string, string> = {};
  for (const key of new Set([...Object.keys(base), ...Object.keys(user)])) {
    const value = [flat(base[key]), flat(user[key])].filter(Boolean).join(' ');
    // De-duplicate (the default closeButton class appears in both).
    merged[key] = [...new Set(value.split(/\s+/).filter(Boolean))].join(' ');
  }
  return { ...config, customClass: merged } as SweetAlertOptions;
}

type Content = string | ReactNode;

interface CheckboxOptions {
  /** Settings key for the "Don't show this again" checkbox. */
  checkboxKey?: string | null;
  /** Checkbox label. Default "Don't show this again". */
  checkboxLabel?: string | null;
  /** Save the checkbox to user settings when it's ticked. Default true. */
  autoSaveCheckbox?: boolean;
  /** Skip the alert when `userSettings[checkboxKey]` is true (the callback still runs). Default false. */
  checkSetting?: boolean;
  /** The user's settings (from Redux). Needed when `checkSetting` is true. */
  userSettings?: Record<string, unknown>;
  /** Any other SweetAlert2 options. */
  customConfig?: SweetAlertOptions;
}

export interface ConfirmOptions extends CheckboxOptions {
  title?: string;
  text?: Content;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm?: (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onCancel?: () => void;
}
export interface DeleteOptions extends CheckboxOptions {
  title?: string;
  text?: Content;
  onConfirm?: (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onCancel?: () => void;
}
export interface NoticeOptions extends CheckboxOptions {
  title?: string;
  text?: Content;
  onClose?: () => void;
}
export interface InfoOptions extends NoticeOptions {
  /** Accepted for API compatibility; unused, as in the app. */
  icon?: unknown;
}
export interface LoadingOptions {
  title?: string;
  text?: Content;
  customConfig?: SweetAlertOptions;
}

/**
 * Global alert dialogs (SweetAlert2), in the design system's look. The same API as the Raffle Builder's
 * `SweetAlert` helper: `SweetAlert.confirm({ title, text, onConfirm })`, `.delete`, `.success`, `.error`, `.info`,
 * `.custom`, `.loading`, `.close`, `.update`.
 */
export class SweetAlert {
  /** True when the user has already chosen "Don't show this again" for this alert. */
  static _shouldSkipAlert(checkSetting?: boolean, checkboxKey?: string | null, userSettings: Record<string, unknown> = {}) {
    return Boolean(checkSetting && checkboxKey && userSettings[checkboxKey] === true);
  }

  /** The checkbox's HTML (placed under the alert's text). */
  static _generateCheckboxHtml(checkboxKey?: string | null, checkboxLabel: string | null = "Don't show this again") {
    if (!checkboxKey || !checkboxLabel) return '';
    return `
      <div class="swal2-checkbox-wrapper rnc-alert-check">
        <label class="swal2-checkbox-label rnc-check">
          <input type="checkbox" id="swal-checkbox-${checkboxKey}" class="swal2-checkbox-input" />
          <span>${checkboxLabel}</span>
        </label>
      </div>
    `;
  }

  /** Appends the checkbox to the alert's text. */
  static _setupCheckboxFooter(checkboxKey?: string | null, checkboxLabel?: string | null) {
    if (!checkboxKey) return;
    const checkboxHtml = this._generateCheckboxHtml(checkboxKey, checkboxLabel || "Don't show this again");
    if (!checkboxHtml) return;
    const htmlContainer = document.querySelector('.swal2-html-container') as HTMLElement | null;
    if (!htmlContainer) return;
    // SweetAlert2 hides the text area when there's no text; the checkbox needs it shown.
    if (htmlContainer.style.display === 'none') htmlContainer.style.display = 'block';
    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.innerHTML = checkboxHtml;
    checkboxWrapper.style.textAlign = 'left';
    htmlContainer.appendChild(checkboxWrapper);
    checkboxState[checkboxKey] = false;
    const input = checkboxWrapper.querySelector('input');
    input?.addEventListener('change', () => { checkboxState[checkboxKey] = input.checked; });
  }

  /** Saves a ticked checkbox through `saveUserSettings` (confirm and delete: only when confirmed). */
  static async _handleCheckboxSave(result: SweetAlertResult, checkboxKey?: string | null, autoSaveCheckbox?: boolean, requireConfirm = true) {
    if (!checkboxKey || !autoSaveCheckbox) return;
    const shouldSave = requireConfirm ? result.isConfirmed : true;
    if (!shouldSave) return;
    const checkbox = document.getElementById(`swal-checkbox-${checkboxKey}`) as HTMLInputElement | null;
    const checked = checkboxState[checkboxKey] ?? Boolean(checkbox && checkbox.checked);
    delete checkboxState[checkboxKey];
    if (checked) {
      if (!services.saveUserSettings) {
        console.warn('SweetAlert: call configureSweetAlert({ saveUserSettings }) to save "Don\'t show this again".');
        return;
      }
      try {
        await services.saveUserSettings({ [checkboxKey]: true });
      } catch (error) {
        console.error('Error saving setting:', error);
      }
    }
  }

  /** Text for a string, otherwise rendered content (JSX). */
  static _createContentProp(text: Content): SweetAlertOptions {
    return typeof text === 'string' ? { text } : { html: text as SweetAlertOptions['html'] };
  }

  /** Merges the default didOpen (open flag, Escape layer), the checkbox and the caller's didOpen. */
  static _didOpen(customConfig: SweetAlertOptions, checkboxKey?: string | null, checkboxLabel?: string | null): SweetAlertOptions['didOpen'] {
    const defaultDidOpen = defaultConfig.didOpen!;
    const customDidOpen = customConfig.didOpen;
    return (popup) => {
      defaultDidOpen(popup);
      if (checkboxKey) this._setupCheckboxFooter(checkboxKey, checkboxLabel);
      if (customDidOpen) customDidOpen(popup);
    };
  }

  /** Confirmation dialog. `onConfirm` runs as SweetAlert2's preConfirm. */
  static confirm({
    title = 'Are you sure?',
    text = '',
    confirmButtonText = 'Yes',
    cancelButtonText = 'Cancel',
    onConfirm = () => {},
    onCancel = () => {},
    checkboxKey = null,
    checkboxLabel = null,
    autoSaveCheckbox = true,
    checkSetting = false,
    userSettings = {},
    customConfig = {},
  }: ConfirmOptions) {
    if (this._shouldSkipAlert(checkSetting, checkboxKey, userSettings)) {
      onConfirm();
      return;
    }
    const config: AnyOptions = {
      ...defaultConfig,
      title,
      ...this._createContentProp(text),
      showCancelButton: onCancel != null,
      confirmButtonText,
      cancelButtonText,
      ...customConfig,
      preConfirm: onConfirm,
    };
    config.didOpen = this._didOpen(customConfig, checkboxKey, checkboxLabel);
    return MySwal.fire(styled(config)).then(async (result) => {
      await this._handleCheckboxSave(result, checkboxKey, autoSaveCheckbox, true);
      if (result.isDismissed && onCancel) onCancel();
    });
  }

  /** Delete confirmation: a warning icon and a red "Yes, delete it!" button. */
  static delete({
    title = 'Delete item?',
    text = "You won't be able to revert this!",
    onConfirm = () => {},
    onCancel = () => {},
    checkboxKey = null,
    checkboxLabel = null,
    autoSaveCheckbox = true,
    checkSetting = false,
    userSettings = {},
    customConfig = {},
  }: DeleteOptions) {
    if (this._shouldSkipAlert(checkSetting, checkboxKey, userSettings)) {
      onConfirm();
      return;
    }
    const config: AnyOptions = {
      ...defaultConfig,
      title: titleWithIcon('warning', 'swal2-delete-icon', 'danger', title),
      ...this._createContentProp(text),
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: tokens.color.error,
      ...customConfig,
      preConfirm: onConfirm,
    };
    config.didOpen = this._didOpen(customConfig, checkboxKey, checkboxLabel);
    return MySwal.fire(styled(config, { confirmButton: 'rnc-btn rnc-btn-danger' })).then(async (result) => {
      await this._handleCheckboxSave(result, checkboxKey, autoSaveCheckbox, true);
      if (result.isDismissed && onCancel) onCancel();
    });
  }

  /** Success notice with an OK button. */
  static success({
    title = 'Success!',
    text = '',
    onClose = () => {},
    checkboxKey = null,
    checkboxLabel = null,
    autoSaveCheckbox = true,
    checkSetting = false,
    userSettings = {},
    customConfig = {},
  }: NoticeOptions) {
    if (this._shouldSkipAlert(checkSetting, checkboxKey, userSettings)) {
      onClose();
      return;
    }
    const config: AnyOptions = {
      ...defaultConfig,
      title: titleWithIcon('check-circle', 'swal2-success-icon', 'success', title),
      ...this._createContentProp(text),
      confirmButtonText: 'OK',
      ...customConfig,
    };
    config.didOpen = this._didOpen(customConfig, checkboxKey, checkboxLabel);
    return MySwal.fire(styled(config)).then(async (result) => {
      await this._handleCheckboxSave(result, checkboxKey, autoSaveCheckbox, false);
      onClose();
    });
  }

  /** Error notice with an OK button. */
  static error({
    title = 'Error!',
    text = 'Something went wrong!',
    onClose = () => {},
    checkboxKey = null,
    checkboxLabel = null,
    autoSaveCheckbox = true,
    checkSetting = false,
    userSettings = {},
    customConfig = {},
  }: NoticeOptions) {
    if (this._shouldSkipAlert(checkSetting, checkboxKey, userSettings)) {
      onClose();
      return;
    }
    const config: AnyOptions = {
      ...defaultConfig,
      title: titleWithIcon('x-circle', 'swal2-error-icon', 'error', title),
      ...this._createContentProp(text),
      confirmButtonText: 'OK',
      ...customConfig,
    };
    config.didOpen = this._didOpen(customConfig, checkboxKey, checkboxLabel);
    return MySwal.fire(styled(config)).then(async (result) => {
      await this._handleCheckboxSave(result, checkboxKey, autoSaveCheckbox, false);
      onClose();
    });
  }

  /** Information notice with an OK button and an optional "Don't show this again" checkbox. */
  static info({
    title = 'Information',
    text = '',
    onClose = () => {},
    checkboxKey = null,
    checkboxLabel = null,
    autoSaveCheckbox = true,
    checkSetting = false,
    userSettings = {},
    customConfig = {},
    icon: _icon = null, // eslint-disable-line @typescript-eslint/no-unused-vars
  }: InfoOptions) {
    if (this._shouldSkipAlert(checkSetting, checkboxKey, userSettings)) {
      onClose();
      return;
    }
    const config: AnyOptions = {
      ...defaultConfig,
      title: titleWithIcon('info', 'swal2-info-icon', 'info', title),
      ...this._createContentProp(text),
      confirmButtonText: 'OK',
      ...customConfig,
    };
    config.didOpen = this._didOpen(customConfig, checkboxKey, checkboxLabel);
    return MySwal.fire(styled(config)).then(async (result) => {
      await this._handleCheckboxSave(result, checkboxKey, autoSaveCheckbox, false);
      onClose();
    });
  }

  /** Any SweetAlert2 configuration, on top of the defaults. */
  static custom(config: SweetAlertOptions) {
    const mergedConfig: AnyOptions = { ...defaultConfig, ...config };
    if (config.didOpen && defaultConfig.didOpen) {
      const customDidOpen = config.didOpen;
      const defaultDidOpen = defaultConfig.didOpen;
      mergedConfig.didOpen = (popup: HTMLElement) => {
        defaultDidOpen(popup);
        customDidOpen(popup);
      };
    }
    return MySwal.fire(styled(mergedConfig));
  }

  /** A loading alert with a spinner and no buttons. Close it with `SweetAlert.close()`. */
  static loading({
    title = 'Loading...',
    text = 'Please wait',
    customConfig = {},
  }: LoadingOptions = {}) {
    const config: AnyOptions = {
      ...defaultConfig,
      title,
      ...this._createContentProp(text),
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      showCloseButton: false, // Don't show close button for loading state
      didOpen: (popup: HTMLElement) => {
        defaultConfig.didOpen!(popup);
        MySwal.showLoading();
      },
      ...customConfig,
    };
    if (customConfig.didOpen) {
      const customDidOpen = customConfig.didOpen;
      const loadingDidOpen = config.didOpen;
      config.didOpen = (popup: HTMLElement) => {
        loadingDidOpen(popup);
        customDidOpen(popup);
      };
    }
    return MySwal.fire(styled(config, { actions: 'rnc-alert-actions is-loading' }));
  }

  /** Closes any open alert. */
  static close() {
    return MySwal.close();
  }

  /** Updates the open alert. */
  static update(config: SweetAlertOptions) {
    return MySwal.update(config as Parameters<typeof MySwal.update>[0]);
  }
}

/** The design system's name for SweetAlert. */
export const AlertBox = SweetAlert;

export default SweetAlert;
