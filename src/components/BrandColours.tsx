import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { useFieldId } from './Field';
import { cx } from '../utils';

/** A client's site colours: the hero and header (primary), the footer and panels (secondary), buttons and links (accent). Hex, like "#0c3f75". */
export interface BrandColourSet { primary: string; secondary: string; accent: string }

type RGB = [number, number, number];
const hex = ([r, g, b]: RGB) => `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const rgbOf = (h: string): RGB | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hsl = ([r, g, b]: RGB) => {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
};
const fromHsl = (h: number, s: number, l: number): RGB => {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
};
const dist = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const hueGap = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

const luminance = (c: RGB) => {
  const [r, g, b] = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** The WCAG contrast ratio between two hex colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const x = rgbOf(a), y = rgbOf(b);
  if (!x || !y) return 1;
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}
/** White or near-black, whichever reads better on the colour (one of them always reaches 4.5:1). */
export function readableOn(colour: string): '#ffffff' | '#14212e' {
  return contrastRatio(colour, '#ffffff') >= contrastRatio(colour, '#14212e') ? '#ffffff' : '#14212e';
}

interface Swatch { rgb: RGB; count: number; s: number; l: number; h: number }

/**
 * Picks site colours from a logo's pixels (RGBA, as from canvas getImageData). Transparent pixels and the near-white
 * background are skipped; similar colours are grouped. Primary is the strongest brand colour (common and saturated);
 * secondary the next clearly different colour (a dark neutral counts: many logos are a colour plus navy or charcoal);
 * accent the most vivid colour with a different hue. A one-colour logo gets a deeper or brighter shade of it, never an
 * invented colour. Returns null when the logo has no usable colour at all (all white or fully transparent).
 */
export function pickBrandColours(pixels: Uint8ClampedArray | number[]): BrandColourSet | null {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
    if (a < 128) continue;
    if (r > 240 && g > 240 && b > 240) continue; // the background
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const k = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    k.n++; k.r += r; k.g += g; k.b += b;
    buckets.set(key, k);
  }
  if (!buckets.size) return null;
  // Average each bucket, then fold near-identical colours together (anti-aliased edges, gradients).
  const raw: Swatch[] = [...buckets.values()].map((k) => { const rgb: RGB = [k.r / k.n, k.g / k.n, k.b / k.n]; return { rgb, count: k.n, ...hsl(rgb) }; })
    .sort((a, b) => b.count - a.count);
  const swatches: Swatch[] = [];
  for (const s of raw) {
    const near = swatches.find((t) => dist(t.rgb, s.rgb) < 48);
    if (near) {
      const n = near.count + s.count;
      near.rgb = near.rgb.map((v, i) => (v * near.count + s.rgb[i] * s.count) / n) as RGB;
      near.count = n; Object.assign(near, hsl(near.rgb));
    } else swatches.push({ ...s, rgb: [...s.rgb] as RGB });
  }
  const total = swatches.reduce((n, s) => n + s.count, 0);
  const real = swatches.filter((s) => s.count / total >= 0.004); // ignore stray pixels
  const pool = real.length ? real : swatches;
  const colourful = pool.filter((s) => s.s >= 0.22 && s.l > 0.12 && s.l < 0.9);

  const score = (s: Swatch) => (s.count / total) * (0.35 + s.s) * (s.l > 0.85 ? 0.3 : 1);
  const primary = [...(colourful.length ? colourful : pool)].sort((a, b) => score(b) - score(a))[0];
  const rest = pool.filter((s) => s !== primary && dist(s.rgb, primary.rgb) > 60);
  const secondary = rest.sort((a, b) => b.count - a.count)[0];
  const vivid = colourful.filter((s) => s !== primary && s !== secondary && hueGap(s.h, primary.h) >= 30 && dist(s.rgb, primary.rgb) > 60)
    .sort((a, b) => b.s * (1 - Math.abs(b.l - 0.5)) - a.s * (1 - Math.abs(a.l - 0.5)))[0];

  // One-colour logos: a deep, quiet version of the colour for the footer, and a brighter one for buttons.
  const deep = (c: Swatch): RGB => (c.l >= 0.3 ? fromHsl(c.h, Math.min(1, c.s), Math.max(0.16, c.l - 0.24)) : fromHsl(c.h, c.s * 0.4, 0.17));
  const bright = (c: Swatch): RGB => fromHsl(c.h, Math.min(1, Math.max(c.s, 0.15) * 1.1), Math.min(0.6, Math.max(0.42, c.l + 0.2)));
  const p = primary.rgb;
  const second: RGB = secondary ? secondary.rgb : deep(primary);
  const accent: RGB = vivid ? vivid.rgb
    : secondary && secondary.s >= 0.22 && hueGap(secondary.h, primary.h) >= 30 ? secondary.rgb
      : bright(primary);
  return { primary: hex(p), secondary: hex(second), accent: hex(accent) };
}

/** Loads a logo (a URL or data URL), samples it small and picks its colours. Rejects when the image can't be read (another site's image without CORS). */
export async function extractBrandColours(src: string): Promise<BrandColourSet | null> {
  if (typeof document === 'undefined') return null;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('The logo could not be loaded.')); img.src = src; });
  const w = img.naturalWidth || 200, h = img.naturalHeight || 200, k = Math.min(1, 120 / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * k)); canvas.height = Math.max(1, Math.round(h * k));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return pickBrandColours(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
}

const ROLES: { key: keyof BrandColourSet; name: string; role: string }[] = [
  { key: 'primary', name: 'Primary', role: 'The header and the top of the page' },
  { key: 'secondary', name: 'Secondary', role: 'The footer and panels' },
  { key: 'accent', name: 'Accent', role: 'Buttons and links' },
];

export interface BrandColoursProps {
  value: BrandColourSet;
  onChange: (value: BrandColourSet) => void;
  /** The logo to pick from. When it changes (a new upload), the colours are picked again unless `autoFromLogo` is false. */
  logo?: string;
  autoFromLogo?: boolean;
  /** Default "Site colours". */
  label?: ReactNode;
  hint?: ReactNode;
  /** Read-only: swatches and hex values with Copy, no picking. */
  review?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * The raffle site's three colours, picked from the logo and adjustable: each has a swatch (opens the colour picker), its hex
 * value and which text reads on it. "Pick from logo" picks again; a new logo picks automatically. Colours fade to their new value.
 */
export function BrandColours({ value, onChange, logo, autoFromLogo = true, label = 'Site colours', hint, review, disabled, id, className }: BrandColoursProps) {
  const fid = useFieldId(id);
  const [status, setStatus] = useState<'idle' | 'working' | 'logo' | 'edited' | 'failed'>('idle');
  const [drafts, setDrafts] = useState<Partial<Record<keyof BrandColourSet, string>>>({});
  const seenLogo = useRef(logo);
  const latest = useRef(value); latest.current = value;
  const locked = disabled || review;

  const pick = async () => {
    if (!logo) return;
    setStatus('working');
    try {
      const found = await extractBrandColours(logo);
      if (!found) { setStatus('failed'); return; }
      setDrafts({}); onChange(found); setStatus('logo');
    } catch { setStatus('failed'); }
  };
  // A new logo (not the one there on arrival) picks its colours.
  useEffect(() => {
    if (logo === seenLogo.current) return;
    seenLogo.current = logo;
    if (logo && autoFromLogo && !locked) void pick();
  }, [logo]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof BrandColourSet, colour: string) => { onChange({ ...latest.current, [key]: colour.toLowerCase() }); setStatus('edited'); };
  const said = { idle: '', working: 'Picking colours from your logo…', logo: 'Picked from your logo. Change any of them below.', edited: 'Edited by you.', failed: "We couldn't read colours from that file. Pick them below." }[status];

  return (
    <div className={cx('rnc-field', 'rnc-colours', review && 'is-review', className)} role="group" aria-labelledby={`${fid}-label`}>
      <div className="rnc-colours-head">
        <span className="rnc-field-label" id={`${fid}-label`}>{label}</span>
        {!review ? <Button variant="secondary" size="sm" startIcon="palette" disabled={!logo || locked || status === 'working'} onClick={() => void pick()}>Pick from logo</Button> : null}
      </div>
      {hint ? <p className="rnc-field-hint">{hint}</p> : null}
      <ul className="rnc-colours-list">
        {ROLES.map(({ key, name, role }) => {
          const colour = value[key];
          const draft = drafts[key] ?? colour.toUpperCase();
          const bad = !rgbOf(draft);
          const text = readableOn(colour);
          return (
            <li key={key} className="rnc-colour">
              <label className="rnc-colour-swatch" style={{ backgroundColor: colour }}>
                <input type="color" value={colour} disabled={locked} aria-label={`${name} colour: pick`} onChange={(e) => { setDrafts((d) => ({ ...d, [key]: undefined })); set(key, e.target.value); }} />
                <span aria-hidden="true" style={{ color: text }}>Aa</span>
              </label>
              <span className="rnc-colour-name">{name}</span>
              <span className="rnc-colour-role">{role}</span>
              <span className="rnc-colour-row">
                <input className="rnc-colour-hex" aria-label={`${name} colour: hex value`} value={draft} readOnly={locked} spellCheck={false} maxLength={7} aria-invalid={bad || undefined}
                  onChange={(e) => { const v = e.target.value; setDrafts((d) => ({ ...d, [key]: v })); const ok = rgbOf(v); if (ok) set(key, hex(ok)); }}
                  onBlur={() => setDrafts((d) => ({ ...d, [key]: undefined }))} />
                <span className="rnc-colour-text">{text === '#ffffff' ? 'White text' : 'Dark text'}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className={cx('rnc-colours-status', status === 'failed' && 'is-failed')} role="status">
        {status === 'logo' ? <Icon name="check-circle" size={16} /> : null}{said}
      </p>
    </div>
  );
}
