import { useEffect, useState, type ClipboardEvent, type ReactNode } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment, { type Moment } from 'moment';
import { Icon } from '../components/Icon';
import { copyToClipboard, FieldFrame, useFieldId, type FinalFormInput, type FinalFormMeta } from './shared';

/**
 * The format date-time values are stored and submitted in (SQL datetime). Date-only values are stored as
 * "YYYY-MM-DD 00:00:00". A pasted date-time must match this format exactly.
 */
export const DATEFORMAT_RAFFLE_NEXUS = 'YYYY-MM-DD HH:mm:ss';

export interface DatePickerProps {
  /** Truthy: pick a date only. Otherwise a date and time. */
  dateOnly?: boolean | null;
  input: FinalFormInput;
  helperText?: ReactNode;
  /** Don't show the error under the field (`helperText` still shows). */
  hideHelperText?: boolean;
  label?: ReactNode;
  meta?: FinalFormMeta | null;
  /** Disabled, which is also review mode: the value stays in full ink and a click copies it in SQL format. */
  disabled?: boolean;
  /** `shouldDisableDate`: return true for days that can't be picked. */
  disableDates?: ((day: Moment) => boolean) | null;
  /** Compact field without a visible label (the label is still read out). */
  small?: boolean;
  tooltip?: ReactNode;
  /** Anything else goes to MUI's DatePicker / DateTimePicker (minDate, maxDateTime, views…). */
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const CalendarIcon = () => <Icon name="calendar-blank" size={22} />;

const smallSx = {
  '& .MuiOutlinedInput-root': { minHeight: 40 },
  '& .MuiOutlinedInput-root input': { padding: '9px 12px' },
};

/**
 * A date or date-and-time picker (MUI X, moment adapter) for react-final-form. Values go to the form as
 * "YYYY-MM-DD 00:00:00" (date only) or DATEFORMAT_RAFFLE_NEXUS (date and time).
 */
export function DatePicker({
  dateOnly = null,
  input,
  helperText = '',
  hideHelperText = false,
  label = 'Date Label',
  meta = null,
  disabled = false,
  disableDates = null,
  small = false,
  tooltip = null,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const id = useFieldId(props.id);
  const currentValue = input?.value || null;
  // Copied in SQL format for database compatibility, not the display format.
  const copyValue = currentValue ? moment(currentValue).format(dateOnly ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss') : '';

  const handleCopyOnClick = () => {
    if (!disabled || !copyValue) return;
    copyToClipboard(copyValue);
  };

  // The page doesn't scroll while the picker is open.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  const hasError = Boolean(meta && meta.error);
  const helper = !hideHelperText && meta && meta.error ? meta.error : (helperText || false);
  // Date-only fields show the error in place of the label, as the source app does.
  const shownLabel = dateOnly && meta && meta.error ? meta.error : label;
  const textFieldSx = { ...(small ? smallSx : {}), ...(disabled ? { pointerEvents: 'none' } : {}) };
  const ariaLabel = small && typeof label === 'string' ? { 'aria-label': label } : {};
  const value = input?.value ? moment(input.value) : null;
  const slots = { openPickerIcon: CalendarIcon, ...props.slots };

  return (
    <FieldFrame id={id} label={shownLabel} hideLabel={small} tooltip={tooltip} review={disabled} copyable={disabled && !!copyValue} onCopyClick={handleCopyOnClick}
      className={`${hasError ? 'error ' : ''}datepicker--normal`}>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        {dateOnly ? (
          <MuiDatePicker
            {...props}
            slots={slots}
            disabled={disabled}
            onOpen={() => !disabled && setOpen(true)}
            onClose={() => setOpen(false)}
            slotProps={{
              textField: { id, disabled, error: hasError, helperText: helper, fullWidth: true, sx: textFieldSx, inputProps: ariaLabel },
              popper: { disablePortal: disabled },
            }}
            format="MMMM DD, YYYY"
            onChange={(e: Moment | null) => {
              input.onChange(e ? e.format('YYYY-MM-DD 00:00:00') : null);
            }}
            value={value}
            shouldDisableDate={disableDates || undefined}
          />
        ) : (
          <DateTimePicker
            {...props}
            slots={slots}
            disabled={disabled}
            format="MMM DD, YYYY hh:mm A"
            onOpen={() => !disabled && setOpen(true)}
            onClose={() => setOpen(false)}
            timeSteps={{ minutes: 1 }}
            slotProps={{
              textField: {
                id, disabled, error: hasError, helperText: helper, fullWidth: true, sx: textFieldSx, inputProps: ariaLabel,
                onBlur: () => input.onBlur?.(),
                onPaste: (event: ClipboardEvent<HTMLDivElement>) => {
                  const parsedDate = moment(event.clipboardData.getData('text'), DATEFORMAT_RAFFLE_NEXUS, true);
                  if (parsedDate.isValid()) {
                    input.onChange(parsedDate.format(DATEFORMAT_RAFFLE_NEXUS));
                    input.onBlur?.(); // mark the field as touched
                    event.preventDefault();
                  }
                },
              },
            }}
            onChange={(e: Moment | null) => {
              input.onChange(e ? e.format(DATEFORMAT_RAFFLE_NEXUS) : null);
            }}
            value={value}
            shouldDisableDate={disableDates || undefined}
          />
        )}
      </LocalizationProvider>
    </FieldFrame>
  );
}

export default DatePicker;
