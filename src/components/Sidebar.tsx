import type { ElementType, MouseEvent, ReactNode } from 'react';
import { Icon } from './Icon';
import { ICONS, type IconName } from '../generated/icons';
import { cx } from '../utils';

export interface SidebarItem {
  label: string;
  /** Where the item goes. Without it, the item is a button (use onClick). */
  href?: string;
  /** A design-system icon name ("ticket", "receipt"…) or your own icon element. */
  icon?: IconName | ReactNode;
  /** Marks the current page (aria-current="page"). */
  current?: boolean;
  /** A short count or status, e.g. "3". */
  badge?: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Stable key; defaults to the label. */
  id?: string;
}
export interface SidebarSection {
  /** Optional small heading over the group, e.g. "Tools". */
  title?: string;
  items: SidebarItem[];
}
export interface SidebarProps {
  /** The logo at the top: an <img>, an inline SVG or any element. */
  logo: ReactNode;
  /** Where the logo links. Default "/". */
  logoHref?: string;
  /** A smaller logo for the collapsed state, e.g. the ticket mark. */
  logoCollapsed?: ReactNode;
  /** The menu items, flat. Or use `sections` for headed groups. */
  items?: SidebarItem[];
  sections?: SidebarSection[];
  /** Icons only; labels stay available to screen readers and as tooltips. */
  collapsed?: boolean;
  /** Anything pinned to the bottom, e.g. the signed-in user. */
  footer?: ReactNode;
  /** The navigation landmark's name. Default "Main". */
  label?: string;
  /** Render links with your router's link component (Next.js Link, React Router Link). It receives href, className, aria-current, title and children. */
  linkComponent?: ElementType;
  className?: string;
}

function ItemIcon({ icon }: { icon: SidebarItem['icon'] }) {
  if (icon == null) return null;
  if (typeof icon === 'string' && icon in ICONS) return <Icon name={icon as IconName} size={22} />;
  return <span className="rnc-sidebar-icon" aria-hidden="true">{icon}</span>;
}

/**
 * An app's main navigation: the logo on top and one icon per menu item. The current page is filled in the action colour.
 * On phones, put it inside an Offcanvas that opens from the left.
 */
export function Sidebar({ logo, logoHref = '/', logoCollapsed, items, sections, collapsed, footer, label = 'Main', linkComponent, className }: SidebarProps) {
  const groups: SidebarSection[] = sections ?? [{ items: items ?? [] }];
  const LinkEl: ElementType = linkComponent ?? 'a';
  return (
    <nav className={cx('rnc-sidebar', collapsed && 'is-collapsed', className)} aria-label={label}>
      <LinkEl className="rnc-sidebar-logo" href={logoHref}>{collapsed && logoCollapsed ? logoCollapsed : logo}</LinkEl>
      <div className="rnc-sidebar-nav">
        {groups.map((g, gi) => (
          <div key={g.title ?? gi}>
            {g.title ? <p className="rnc-sidebar-section">{g.title}</p> : null}
            <ul className="rnc-sidebar-list">
              {g.items.map((it) => {
                const inner = <><ItemIcon icon={it.icon} /><span className="rnc-sidebar-label">{it.label}</span>{it.badge != null ? <span className="rnc-sidebar-badge">{it.badge}</span> : null}</>;
                // A badge would otherwise run into the label ("Raffles3"); name it "Raffles, 3".
                const named = typeof it.badge === 'string' || typeof it.badge === 'number' ? `${it.label}, ${it.badge}` : undefined;
                const common = { className: 'rnc-sidebar-item', 'aria-current': it.current ? ('page' as const) : undefined, 'aria-label': named, title: collapsed ? it.label : undefined, onClick: it.onClick };
                return (
                  <li key={it.id ?? it.label}>
                    {it.href != null ? <LinkEl href={it.href} {...common}>{inner}</LinkEl> : <button type="button" {...common}>{inner}</button>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {footer && !collapsed ? <div className="rnc-sidebar-footer">{footer}</div> : null}
    </nav>
  );
}
