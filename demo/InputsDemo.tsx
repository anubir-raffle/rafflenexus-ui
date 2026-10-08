import { useState } from 'react';
import { Field, Form } from 'react-final-form';
import { Toaster } from 'react-hot-toast';
import { Switch } from '../src';
import { BriefToolTip, DatePicker, InputMasked, MaskedInput, TextArea, TextInput } from '../src/inputs';

const PROVINCES = [
  { label: 'British Columbia', value: 'BC' }, { label: 'Alberta', value: 'AB' }, { label: 'Saskatchewan', value: 'SK' },
  { label: 'Manitoba', value: 'MB' }, { label: 'Ontario', value: 'ON' },
];
const required = (label: string) => (v: unknown) => (v ? undefined : `Enter the ${label}.`);

/** A sample brief-form page built the way the Raffle Builder builds it: react-final-form Fields with the source app's props. */
export function InputsDemo() {
  const [disabledAll, setDisabledAll] = useState(false);
  return (
    <>
      <Toaster position="bottom-center" />
      <Form
        onSubmit={() => {}}
        initialValues={{ support_email: 'help@samplecause.org', support_website: 'samplecause.org', province: 'BC', ticket_price: '10.00', draw_date: '2027-02-01 00:00:00', sales_open: '2026-11-01 09:00:00', facebook: 'samplecause', split: '50' }}
        render={() => (
          <form style={{ display: 'grid', gap: 20 }} onSubmit={(e) => e.preventDefault()}>
            <Switch label="Review mode (disabledAll): click a field to copy it" checked={disabledAll} onChange={setDisabledAll} />
            <h3 className="rnc-h3" style={{ margin: 0 }}>
              Support contact info
              <BriefToolTip><><p style={{ marginTop: 0 }}>Where the support contact info appears on your raffle website: in the footer and on the receipt.</p></></BriefToolTip>
            </h3>
            <div className="demo-grid">
              <Field name="support_email" validate={required('support email')}>
                {({ input, meta }) => <TextInput {...input} meta={meta} label="Support Email" tooltip="This email will be displayed to users for support inquiries." error={meta.error && meta.touched} disabledAll={disabledAll} />}
              </Field>
              <Field name="support_phone">
                {({ input, meta }) => <MaskedInput input={input} meta={meta} tooltip="This phone number will be displayed to users for support inquiries." label="Support Phone" maskOptions={{ mask: '(___) ___-____', placeholder: '(123) 456-7890' } as never} error={meta.error && meta.touched} disabledAll={disabledAll} />}
              </Field>
              <Field name="support_website">
                {({ input, meta }) => <InputMasked {...input} input={input} meta={meta} error={meta.error && meta.touched} label="Organization URL" maxLength={200} pre="https://" disabledAll={disabledAll} />}
              </Field>
              <Field name="facebook">
                {({ input, meta }) => <InputMasked {...input} input={input} meta={meta} error={meta.error && meta.touched} label="Facebook Page" pre="https://facebook.com/" disabledAll={disabledAll} />}
              </Field>
            </div>
            <h3 className="rnc-h3" style={{ margin: 0 }}>Raffle details</h3>
            <div className="demo-grid">
              <Field name="province">
                {({ input, meta }) => <TextInput {...input} input={input} meta={meta} type="dropdown" label="Province" options={PROVINCES} tooltip="The province that licenses the raffle." error={meta.error && meta.touched} disabledAll={disabledAll} />}
              </Field>
              <Field name="ticket_price">
                {({ input, meta }) => <TextInput {...input} meta={meta} type="number" decimal={2} min={1} label="Ticket price ($)" error={meta.error && meta.touched} disabledAll={disabledAll} />}
              </Field>
              <Field name="split">
                {({ input, meta }) => <InputMasked {...input} input={input} meta={meta} label="Share of the pot to the winner" post="%" maxLength={4} disabledAll={disabledAll} />}
              </Field>
              <Field name="licence_number" validate={required('licence number')}>
                {({ input, meta }) => <TextInput {...input} meta={meta} label="Licence number" helperText={meta.touched && meta.error ? undefined : 'From your gaming licence.'} placeholder="e.g. 171012" error={meta.error && meta.touched} disabledAll={disabledAll} />}
              </Field>
              <Field name="draw_date">
                {({ input, meta }) => <DatePicker dateOnly input={input} meta={meta} label="Draw date" disabled={disabledAll} tooltip="The date of the main draw." />}
              </Field>
              <Field name="sales_open">
                {({ input, meta }) => <DatePicker input={input} meta={meta} label="Ticket sales open" helperText="Pacific time." disabled={disabledAll} />}
              </Field>
              <Field name="admin_password">
                {({ input, meta }) => <TextInput {...input} meta={meta} type="password" showPasswordToggle label="Dashboard password" disabledAll={disabledAll} />}
              </Field>
              <Field name="disabled_example">
                {({ input, meta }) => <TextInput {...input} meta={meta} label="Raffle ID" value="Set when the raffle is created" disabled />}
              </Field>
            </div>
            <Field name="prize_description">
              {({ input }) => <TextArea {...input} label="Prize description" placeholder="Describe the grand prize in a sentence or two." disabled={disabledAll} />}
            </Field>
          </form>
        )}
      />
    </>
  );
}
