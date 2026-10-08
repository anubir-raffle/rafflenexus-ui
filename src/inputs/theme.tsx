import type { ReactNode } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import { tokens } from '../generated/tokens';

const c = tokens.color;

// The "!" badge that starts every error message, as in the design system's .rnc-field-error.
const errorBadge = {
  content: '"!"', flex: 'none', width: 18, height: 18, marginTop: '1px', borderRadius: '50%',
  background: 'var(--error)', color: '#ffffff', font: '700 12px/18px var(--font-sans)', textAlign: 'center' as const,
};

/**
 * The MUI theme behind the inputs. It mirrors the design system's form rules (bundle.css, FormElements):
 * 46px fields, a 1px `line` border, `radius-sm` corners, a 2px `focus` ring, a 2px `error` border, and errors
 * in words with an icon. Palette colours are hex (MUI computes shades from them); everything else uses the
 * CSS variables from styles.css, so import that once in the app.
 */
export const rncInputsTheme = createTheme({
  palette: {
    primary: { main: c.action, contrastText: c['on-action'] },
    error: { main: c.error },
    text: { primary: c.ink, secondary: c['ink-muted'] },
    background: { paper: c.surface, default: c.ground },
    divider: c.line,
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: tokens.font.sans, button: { textTransform: 'none' } },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 46, borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--ink)',
          font: '400 16px/1.4 var(--font-sans)',
          '& .MuiOutlinedInput-notchedOutline': { top: 0, borderColor: 'var(--line)' },
          '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--ink-muted)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--focus)', borderWidth: 2 },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--error)', borderWidth: 2 },
          '&.Mui-disabled': { background: 'var(--surface-tint)', color: 'var(--ink-muted)' },
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--line)' },
          // Review mode (disabledAll): read-only, but the value stays in full ink and the field copies on click.
          '.rnc-mui-field.is-review &.Mui-disabled': { color: 'var(--ink)' },
          '.rnc-mui-field.is-review &.Mui-disabled .MuiInputBase-input': { WebkitTextFillColor: 'var(--ink)' },
          '.rnc-mui-field.is-review &.Mui-disabled .MuiInputBase-input::placeholder': { WebkitTextFillColor: 'var(--ink-muted)' },
          '.rnc-mui-field.is-review &:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--action)' },
        },
        input: {
          height: 'auto', padding: '12px 14px', lineHeight: '22px',
          '&::placeholder': { color: 'var(--ink-muted)', opacity: 1 },
          '&.Mui-disabled': { WebkitTextFillColor: 'var(--ink-muted)' },
        },
        multiline: { padding: '12px 14px', '& textarea': { padding: 0 } },
        adornedStart: { paddingLeft: 14 },
        adornedEnd: { paddingRight: 8 },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: { color: 'var(--ink-muted)', '& .MuiTypography-root': { color: 'var(--ink-muted)', font: '400 16px/1.4 var(--font-sans)' } },
        // Buttons at the end (show password, open calendar): the icon sits 16px from the edge, like the text's 14px inset.
        positionEnd: { marginLeft: 10, '& .MuiIconButton-edgeEnd': { marginRight: 0 } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: 'var(--ink-muted)',
          '&:hover': { color: 'var(--action)', background: 'var(--surface-tint)' },
          '&.Mui-focusVisible': { outline: '2px solid var(--focus)', outlineOffset: 0 },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          margin: '6px 0 0', font: '400 14px/1.4 var(--font-sans)', color: 'var(--ink-muted)',
          '&.Mui-error': { display: 'flex', gap: 6, alignItems: 'flex-start', fontWeight: 600, color: 'var(--error)', '&::before': errorBadge },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          boxSizing: 'border-box', maxWidth: 350, padding: 14, border: '1px solid var(--line)', borderRadius: 'var(--radius-md)',
          background: 'var(--surface)', boxShadow: 'var(--shadow-3)', font: '400 14px/1.45 var(--font-sans)', color: 'var(--ink-body)',
          '& img, & iframe': { display: 'block', maxWidth: '100%', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' },
          '& iframe': { marginTop: 8 },
          '& p': { margin: '6px 0 0', fontSize: 13, color: 'var(--ink-muted)' },
        },
        arrow: { color: 'var(--surface)', fontSize: 18, '&::before': { border: '1px solid var(--line)' } },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { padding: '5px 9px' },
          '& .MuiOutlinedInput-root .MuiAutocomplete-input': { padding: '7px 5px' },
          '& .MuiAutocomplete-endAdornment .MuiIconButton-root': { color: 'var(--ink-body)' },
        },
        paper: { marginTop: 6, border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-3)', background: 'var(--surface)' },
        listbox: {
          padding: 6,
          '& .MuiAutocomplete-option': {
            minHeight: 40, padding: '0 12px', borderRadius: 'var(--radius-sm)', font: '500 15px/1.3 var(--font-sans)', color: 'var(--ink)',
            '&.Mui-focused': { background: 'var(--surface-tint)' },
            '&[aria-selected="true"]': { background: 'var(--lead-soft)', fontWeight: 600 },
            '&[aria-selected="true"].Mui-focused': { background: 'var(--lead-soft)' },
          },
        },
        noOptions: { font: '400 15px/1.3 var(--font-sans)', color: 'var(--ink-muted)' },
      },
    },
    MuiPickersPopper: {
      styleOverrides: { paper: { border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-3)' } },
    },
    MuiPickersDay: { styleOverrides: { root: { fontFamily: 'var(--font-sans)' } } },
  },
});

/** Wraps the inputs in the design system's MUI theme, so they look the same whatever theme the app uses. */
export function RncInputsTheme({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={rncInputsTheme}>{children}</ThemeProvider>;
}
