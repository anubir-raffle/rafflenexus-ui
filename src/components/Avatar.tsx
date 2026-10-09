import {
  Children, cloneElement, isValidElement, useEffect, useState, type CSSProperties, type ImgHTMLAttributes, type ReactElement,
  type ReactNode, type SyntheticEvent,
} from 'react';
import { Icon } from './Icon';
import { cx } from '../utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface AvatarProps {
  /** The accessible name, and where initials come from when there's no image. */
  alt?: string;
  src?: string;
  srcSet?: string;
  /** `xs` 20, `sm` 24, `md` 32, `lg` 40 (default), `xl` 56, or a number of pixels. */
  size?: AvatarSize;
  /** Default "circular". */
  variant?: 'circular' | 'rounded' | 'square';
  /** Custom content when there's no image (an icon, your own initials). */
  children?: ReactNode;
  /** A visible name beside (or under) the avatar. */
  name?: ReactNode;
  /** A smaller, muted line under the name (a role, an email). */
  subtitle?: ReactNode;
  /** Name block to the right ("row", default) or underneath ("column"). */
  layout?: 'row' | 'column';
  imgProps?: ImgHTMLAttributes<HTMLImageElement>;
  className?: string;
  style?: CSSProperties;
}

export const AVATAR_SIZES = { xs: 20, sm: 24, md: 32, lg: 40, xl: 56 } as const;
const COLOURS = 6;

/** First letter of the first and last words, at most two, uppercase: "Priya Sharma" → "PS". */
export function avatarInitials(name?: string | null): string {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const first = Array.from(words[0])[0] ?? '';
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? '' : '';
  return (first + last).toUpperCase();
}

/** The same name always picks the same of the six initials colours. */
export function avatarColour(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % COLOURS;
}

const px = (size: AvatarSize | undefined) => (typeof size === 'number' ? size : AVATAR_SIZES[size ?? 'lg'] ?? 40);
const asText = (v: ReactNode) => (typeof v === 'string' || typeof v === 'number' ? String(v) : undefined);

/**
 * A person or organisation as a small picture, MUI-style: `<Avatar alt="Remy Sharp" src="…" />`.
 * Shows the photo; if there's none or it fails, `children`; otherwise initials on a colour fixed to the name;
 * otherwise a person icon. With `name`, the name shows as text and the picture is hidden from screen readers.
 */
export function Avatar({ alt, src, srcSet, size = 'lg', variant = 'circular', children, name, subtitle, layout = 'row', imgProps, className, style }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src, srcSet]);

  const nameText = asText(name);
  const label = alt ?? nameText ?? '';
  const source = nameText ?? alt ?? '';
  const shown = name != null && name !== false && name !== '';
  const initials = avatarInitials(source);

  let inner: ReactNode;
  let tone: string | false = false;
  const hasImage = (!!src || !!srcSet) && !failed;
  if (hasImage) {
    const onError = (e: SyntheticEvent<HTMLImageElement>) => { setFailed(true); imgProps?.onError?.(e); };
    inner = <img {...imgProps} src={src} srcSet={srcSet} alt={shown ? '' : label} onError={onError} />;
  } else if (children != null && children !== false) {
    inner = children;
    tone = source ? `c${avatarColour(source)}` : 'is-blank';
  } else if (initials) {
    inner = <span aria-hidden="true">{initials}</span>;
    tone = `c${avatarColour(source)}`;
  } else {
    inner = <Icon name="user" size={24} />;
    tone = 'is-blank';
  }

  // The picture is named unless the name is already visible beside it (then it'd be read twice).
  const named = !hasImage && !shown && label ? { role: 'img', 'aria-label': label } : {};
  const hidden = shown || (!hasImage && !label) ? { 'aria-hidden': true } : {};
  const pic = (
    <span className={cx('rnc-avatar-pic', variant !== 'circular' && `is-${variant}`, tone)} {...named} {...hidden}>{inner}</span>
  );

  return (
    <span className={cx('rnc-avatar', layout === 'column' && 'is-column', className)} style={{ ['--av-size' as string]: `${px(size)}px`, ...style }}>
      {pic}
      {shown ? (
        <span className="rnc-avatar-text">
          <span className="rnc-avatar-name" title={nameText}>{name}</span>
          {subtitle != null && subtitle !== false && subtitle !== '' ? <span className="rnc-avatar-sub" title={asText(subtitle)}>{subtitle}</span> : null}
        </span>
      ) : null}
    </span>
  );
}

export interface AvatarGroupProps {
  /** The most avatars to show, counting the "+N" one. Default 5. */
  max?: number;
  /** The real number of people, when it's more than the avatars passed in. */
  total?: number;
  /** Applied to every avatar that doesn't set its own. */
  size?: AvatarSize;
  variant?: AvatarProps['variant'];
  /** The group's accessible name, e.g. "Team members". Default: "N people". */
  'aria-label'?: string;
  children?: ReactNode;
  className?: string;
}

/** Overlapping avatars, ending with a "+3" count when there are more than `max`. */
export function AvatarGroup({ max = 5, total, size = 'md', variant, children, className, 'aria-label': ariaLabel }: AvatarGroupProps) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[];
  const count = Math.max(total ?? items.length, items.length);
  const limit = Math.max(1, max);
  const visible = count > limit ? items.slice(0, limit - 1) : items;
  const extra = count - visible.length;
  return (
    <span className={cx('rnc-avatar-group', className)} role="group" aria-label={ariaLabel ?? `${count} ${count === 1 ? 'person' : 'people'}`}>
      {visible.map((child) => cloneElement(child, { size: child.props.size ?? size, variant: child.props.variant ?? variant }))}
      {extra > 0 ? (
        <span className="rnc-avatar" style={{ ['--av-size' as string]: `${px(size)}px` }}>
          <span className={cx('rnc-avatar-pic', 'is-more', variant && variant !== 'circular' && `is-${variant}`)} role="img" aria-label={`${extra} more`}>{`+${extra}`}</span>
        </span>
      ) : null}
    </span>
  );
}
