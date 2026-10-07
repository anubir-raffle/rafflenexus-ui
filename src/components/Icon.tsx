import type { SVGAttributes } from 'react';
import { ICONS, type IconName } from '../generated/icons';
import { cx } from '../utils';

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  name: IconName;
  /** Pixel size (width and height). Default 24. */
  size?: number;
  /** Accessible name. Leave it out when a word sits beside the icon (the usual case). */
  label?: string;
}

/** Phosphor icons (regular weight). They take the text colour. Always put a word beside them. */
export function Icon({ name, size = 24, label, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 256 256" width={size} height={size} fill="currentColor"
      className={cx('rnc-icon', className)}
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      focusable="false" {...rest}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
