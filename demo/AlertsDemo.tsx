import { Button } from '../src';
import { SweetAlert, configureSweetAlert } from '../src/alerts';

// The app passes its own services; the demo just logs.
configureSweetAlert({
  saveUserSettings: (settings) => { console.info('saveUserSettings', settings); },
  pushEscapeLayer: () => () => {},
});

/** Each alert type, called the way the Raffle Builder calls them. */
export function AlertsDemo() {
  return (
    <div className="rnc-row">
      <Button onClick={() => SweetAlert.confirm({ title: 'Publish this raffle?', text: 'Ticket sales open as soon as it is published.', confirmButtonText: 'Publish', checkboxKey: 'demo_publish' })}>Confirm</Button>
      <Button variant="secondary" onClick={() => SweetAlert.delete({ title: 'Delete this prize?', text: 'The prize and its photos are removed from the raffle. You can’t undo this.' })}>Delete</Button>
      <Button variant="secondary" onClick={() => SweetAlert.success({ title: 'Raffle saved', text: 'Your changes are live on the raffle site.' })}>Success</Button>
      <Button variant="secondary" onClick={() => SweetAlert.error({ title: 'We couldn’t save your raffle', text: 'Check your connection and try again. Nothing was lost.' })}>Error</Button>
      <Button variant="secondary" onClick={() => SweetAlert.info({ title: 'Draw dates are locked', text: <p>Your licence sets the draw dates. To change them, contact your <strong>account manager</strong>.</p>, checkboxKey: 'demo_info' })}>Info</Button>
      <Button variant="secondary" onClick={() => { SweetAlert.loading({ title: 'Saving your raffle' }); setTimeout(() => SweetAlert.close(), 2500); }}>Loading</Button>
    </div>
  );
}
