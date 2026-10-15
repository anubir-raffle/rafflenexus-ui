// Site colours from the logo: pickBrandColours (the maths), readable text, and the BrandColours field.
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrandColours, contrastRatio, pickBrandColours, readableOn, type BrandColourSet } from '../src';
import { WizardSitePreview } from '../src/wizard';

/** RGBA pixels: n of each colour. */
const pixels = (...parts: [number, [number, number, number, number]][]) =>
  new Uint8ClampedArray(parts.flatMap(([n, px]) => Array.from({ length: n }, () => px).flat()));
const near = (hex: string, [r, g, b]: [number, number, number], tolerance = 24) => {
  const n = parseInt(hex.slice(1), 16);
  return Math.hypot(((n >> 16) & 255) - r, ((n >> 8) & 255) - g, (n & 255) - b) <= tolerance;
};

describe('pickBrandColours', () => {
  it('a red, navy and gold logo on white: red is primary, navy secondary, gold the accent', () => {
    const set = pickBrandColours(pixels(
      [400, [255, 255, 255, 255]], // background
      [200, [0, 0, 0, 0]], // transparent
      [600, [200, 16, 46, 255]],
      [300, [15, 42, 68, 255]],
      [100, [227, 179, 65, 255]],
    ))!;
    expect(near(set.primary, [200, 16, 46])).toBe(true);
    expect(near(set.secondary, [15, 42, 68])).toBe(true);
    expect(near(set.accent, [227, 179, 65])).toBe(true);
  });

  it('a one-colour logo gets three different shades of that colour', () => {
    const set = pickBrandColours(pixels([500, [255, 255, 255, 255]], [500, [12, 63, 117, 255]]))!;
    expect(near(set.primary, [12, 63, 117])).toBe(true);
    expect(new Set([set.primary, set.secondary, set.accent]).size).toBe(3);
  });

  it('a blank logo gives nothing to pick from', () => {
    expect(pickBrandColours(pixels([100, [255, 255, 255, 255]], [100, [0, 0, 0, 0]]))).toBeNull();
  });

  it('readableOn picks white or dark text, whichever passes 4.5:1', () => {
    expect(readableOn('#0c3f75')).toBe('#ffffff');
    expect(readableOn('#f4d03f')).toBe('#14212e');
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0);
  });
});

describe('BrandColours', () => {
  const START: BrandColourSet = { primary: '#0c3f75', secondary: '#13324f', accent: '#126ab5' };
  function Colours({ logo }: { logo?: string }) { const [v, setV] = useState(START); return <><BrandColours value={v} onChange={setV} logo={logo} /><output data-testid="v">{JSON.stringify(v)}</output></>; }

  it('shows each colour with a picker, its hex value and which text reads on it', () => {
    render(<Colours />);
    expect(screen.getByRole('group', { name: 'Site colours' })).toBeInTheDocument();
    expect(screen.getByLabelText('Primary colour: hex value')).toHaveValue('#0C3F75');
    expect(screen.getByLabelText('Accent colour: pick')).toHaveAttribute('type', 'color');
    expect(screen.getAllByText('White text')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Pick from logo' })).toBeDisabled();
  });

  it('a typed hex value changes the colour once it is a whole value, and says it was edited', () => {
    render(<Colours />);
    const field = screen.getByLabelText('Accent colour: hex value');
    fireEvent.change(field, { target: { value: '#F4D0' } });
    expect(screen.getByTestId('v')).toHaveTextContent('"accent":"#126ab5"');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(field, { target: { value: '#F4D03F' } });
    expect(screen.getByTestId('v')).toHaveTextContent('"accent":"#f4d03f"');
    expect(screen.getByText('Dark text')).toBeInTheDocument();
    expect(screen.getByText('Edited by you.')).toHaveClass('rnc-colours-status');
  });

  it("says so when a logo can't be read", async () => {
    const real = globalThis.Image;
    class Broken { onload: (() => void) | null = null; onerror: (() => void) | null = null; crossOrigin = ''; set src(_v: string) { setTimeout(() => this.onerror?.(), 0); } }
    vi.stubGlobal('Image', Broken);
    const { rerender } = render(<Colours />);
    rerender(<Colours logo="data:image/png;base64,AAAA" />);
    expect(await screen.findByText("We couldn't read colours from that file. Pick them below.")).toBeInTheDocument();
    vi.stubGlobal('Image', real);
  });
});

describe('WizardSitePreview colours and badge', () => {
  it('uses all three colours, readable text on each, and shows the licensed-raffle badge', () => {
    const { container } = render(<WizardSitePreview org="Sample Foundation" heading="Win" colour="#f4d03f" accent="#c8102e" secondary="#13324f" badge={{ regulator: 'IGCO', licence: '000000' }} />);
    const site = container.querySelector('.rnc-wsite') as HTMLElement;
    expect(site.style.getPropertyValue('--site-on-colour')).toBe('#14212e');
    expect(site.style.getPropertyValue('--site-on-accent')).toBe('#ffffff');
    expect(site.style.getPropertyValue('--site-secondary')).toBe('#13324f');
    expect(screen.getByText('Licensed raffle')).toBeInTheDocument();
    expect(screen.getByText('IGCO licence #000000 · GLI-certified RNG')).toBeInTheDocument();
  });
});
