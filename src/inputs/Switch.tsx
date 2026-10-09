import { forwardRef } from 'react';
import { Switch as MuiSwitch, type SwitchProps as MuiSwitchProps } from '@mui/material';
import { RncInputsTheme } from './theme';

export type SwitchProps = MuiSwitchProps;

// The design system's switch (bundle.css .rnc-switch): a 44 × 26 track in `ink-muted`, `action` when on, a 20px white thumb,
// a 2px focus ring, half opacity when disabled. Sizes and colours are fixed here so app themes can't change them.
const look = {
  width: 44 + 16, height: 26 + 16, padding: '8px',
  '& .MuiSwitch-switchBase': {
    padding: '11px', color: 'var(--surface)', transitionDuration: '150ms',
    '&.Mui-checked': { transform: 'translateX(18px)', color: 'var(--surface)' },
    '&.Mui-checked + .MuiSwitch-track': { backgroundColor: 'var(--action)', opacity: 1 },
    '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.5 },
    '&.Mui-disabled .MuiSwitch-thumb': { color: 'var(--surface)' },
    '&.Mui-focusVisible + .MuiSwitch-track': { outline: '2px solid var(--focus)', outlineOffset: '2px' },
    '&:hover': { backgroundColor: 'transparent' },
  },
  '& .MuiSwitch-thumb': { width: 20, height: 20, boxShadow: 'var(--shadow-1)' },
  '& .MuiSwitch-track': { borderRadius: 13, backgroundColor: 'var(--ink-muted)', opacity: 1, transition: 'background-color 150ms ease' },
  '@media (prefers-reduced-motion: reduce)': { '& .MuiSwitch-switchBase': { transitionDuration: '0ms' } },
} as const;

/**
 * MUI's Switch with the same props (`checked`, `onChange`, `disabled`, `inputProps`, `size`…), in the design system's look.
 * Give it a name: wrap it in MUI's FormControlLabel, or pass `inputProps={{ 'aria-label': '…' }}`.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch({ sx, ...props }, ref) {
  return (
    <RncInputsTheme>
      <MuiSwitch ref={ref} disableRipple {...props} sx={[look, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} />
    </RncInputsTheme>
  );
});
