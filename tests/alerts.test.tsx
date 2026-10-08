import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertBox, SweetAlert, configureSweetAlert, isSweetAlertOpen } from '../src/alerts';

afterEach(async () => {
  if (document.querySelector('.swal2-popup')) await waitFor(() => expect(isSweetAlertOpen()).toBe(true));
  SweetAlert.close();
  await waitFor(() => expect(document.querySelector('.swal2-popup')).toBeNull());
  configureSweetAlert({ saveUserSettings: undefined, pushEscapeLayer: undefined });
});

const dialog = () => screen.findByRole('dialog');

describe('SweetAlert (AlertBox)', () => {
  it('is also exported as AlertBox', () => {
    expect(AlertBox).toBe(SweetAlert);
  });

  it('confirm: shows the title and text in the design system classes; Yes runs onConfirm', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const done = SweetAlert.confirm({ title: 'Publish the raffle?', text: 'Ticket sales open straight away.', onConfirm, onCancel });
    const popup = await dialog();
    expect(popup).toHaveClass('rnc-alert');
    expect(screen.getByText('Publish the raffle?')).toHaveClass('rnc-alert-title');
    expect(screen.getByText('Ticket sales open straight away.')).toHaveClass('rnc-alert-body');
    const yes = screen.getByRole('button', { name: 'Yes' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(yes).toHaveClass('rnc-btn', 'rnc-btn-primary');
    expect(cancel).toHaveClass('rnc-btn', 'rnc-btn-secondary');
    // reverseButtons: Cancel comes before Yes
    expect(cancel.compareDocumentPosition(yes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await userEvent.click(yes);
    await done;
    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('confirm: Cancel runs onCancel', async () => {
    const onCancel = vi.fn();
    const done = SweetAlert.confirm({ title: 'Leave without saving?', onCancel });
    await dialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await done;
    expect(onCancel).toHaveBeenCalled();
  });

  it('delete: warning icon, red confirm button, app class names kept', async () => {
    const onConfirm = vi.fn();
    const done = SweetAlert.delete({ title: 'Delete this prize?', onConfirm });
    await dialog();
    expect(screen.getByText("You won't be able to revert this!")).toBeInTheDocument();
    const head = document.querySelector('.swal2-title-with-icon')!;
    expect(head).toHaveClass('rnc-alert-head', 'is-danger');
    expect(head.querySelector('svg')).toHaveClass('swal2-delete-icon', 'rnc-icon');
    const yes = screen.getByRole('button', { name: 'Yes, delete it!' });
    expect(yes).toHaveClass('rnc-btn-danger');
    expect(yes).not.toHaveClass('rnc-btn-primary');
    await userEvent.click(yes);
    await done;
    expect(onConfirm).toHaveBeenCalled();
  });

  it('success, error and info: icon state, OK button, onClose', async () => {
    for (const [fn, state] of [[SweetAlert.success, 'success'], [SweetAlert.error, 'error'], [SweetAlert.info, 'info']] as const) {
      const onClose = vi.fn();
      const done = fn.call(SweetAlert, { title: `A ${state} notice`, text: 'Details.', onClose });
      await dialog();
      expect(document.querySelector('.rnc-alert-head')).toHaveClass(`is-${state}`);
      await userEvent.click(screen.getByRole('button', { name: 'OK' }));
      await done;
      expect(onClose).toHaveBeenCalled();
      await waitFor(() => expect(document.querySelector('.swal2-popup')).toBeNull());
    }
  });

  it('renders JSX content', async () => {
    void SweetAlert.info({ title: 'Heads up', text: <p>Draw at <strong>noon</strong>.</p> });
    await dialog();
    expect(await screen.findByText('noon')).toBeInTheDocument();
  });

  it('skips the alert when the setting says so, but still runs the callback', () => {
    const onConfirm = vi.fn();
    const result = SweetAlert.confirm({ onConfirm, checkboxKey: 'hide_publish', checkSetting: true, userSettings: { hide_publish: true } });
    expect(result).toBeUndefined();
    expect(onConfirm).toHaveBeenCalled();
    expect(document.querySelector('.swal2-popup')).toBeNull();
  });

  it('"Don\'t show this again": saved through saveUserSettings when ticked and confirmed', async () => {
    const saveUserSettings = vi.fn(() => Promise.resolve());
    configureSweetAlert({ saveUserSettings });
    const done = SweetAlert.confirm({ title: 'Publish?', checkboxKey: 'hide_publish' });
    await dialog();
    const box = await screen.findByRole('checkbox', { name: "Don't show this again" });
    expect(box.closest('label')).toHaveClass('rnc-check');
    await userEvent.click(box);
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await done;
    expect(saveUserSettings).toHaveBeenCalledWith({ hide_publish: true });
  });

  it('"Don\'t show this again": not saved when the confirm is cancelled', async () => {
    const saveUserSettings = vi.fn();
    configureSweetAlert({ saveUserSettings });
    const done = SweetAlert.confirm({ title: 'Publish?', checkboxKey: 'hide_publish', checkboxLabel: 'Skip this next time' });
    await dialog();
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Skip this next time' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await done;
    expect(saveUserSettings).not.toHaveBeenCalled();
  });

  it('tracks the open state and claims the Escape layer while open', async () => {
    const release = vi.fn();
    const pushEscapeLayer = vi.fn(() => release);
    configureSweetAlert({ pushEscapeLayer });
    expect(isSweetAlertOpen()).toBe(false);
    const done = SweetAlert.success({ title: 'Saved' });
    await dialog();
    await waitFor(() => expect(isSweetAlertOpen()).toBe(true)); // didOpen runs just after the dialog appears
    expect(pushEscapeLayer).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await done;
    expect(isSweetAlertOpen()).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('has a labelled close button', async () => {
    void SweetAlert.info({ title: 'Information' });
    await dialog();
    expect(screen.getByRole('button', { name: /close/i })).toHaveClass('swal2-custom-close-button', 'rnc-alert-close');
  });

  it('keeps classes passed in customConfig.customClass alongside the design system ones', async () => {
    void SweetAlert.confirm({ title: 'Custom', customConfig: { customClass: { popup: 'my-popup' } } });
    expect(await dialog()).toHaveClass('rnc-alert', 'my-popup');
  });

  it('loading: no buttons, a loader, closes with close()', async () => {
    void SweetAlert.loading({ title: 'Saving your raffle' });
    await dialog();
    expect(screen.getByText('Please wait')).toBeInTheDocument();
    expect(document.querySelector('.swal2-loader')).toHaveClass('rnc-alert-loader');
    expect(screen.queryByRole('button', { name: 'OK' })).toBeNull();
    SweetAlert.close();
    await waitFor(() => expect(document.querySelector('.swal2-popup')).toBeNull());
  });

  it('custom: full SweetAlert2 options on the defaults', async () => {
    const didOpen = vi.fn();
    void SweetAlert.custom({ title: 'Choose a draw time', confirmButtonText: 'Save', didOpen });
    await dialog();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('rnc-btn-primary');
    await waitFor(() => expect(didOpen).toHaveBeenCalled());
    expect(isSweetAlertOpen()).toBe(true);
  });
});
