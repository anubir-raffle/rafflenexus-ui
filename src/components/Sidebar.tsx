import {
  useCallback, useEffect, useRef, useState, type ElementType, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
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
  /** A short count or status, e.g. "3". A dot on the icon when collapsed. */
  badge?: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Stable key; defaults to the label. */
  id?: string;
  /** A small second line under the label. */
  description?: ReactNode;
  /** Another site or subdomain: a plain <a> (never linkComponent) with an arrow-out mark. */
  external?: boolean;
  /** e.g. "_blank". Screen readers then hear "opens in a new tab". */
  target?: string;
}
export interface SidebarSection {
  /** Optional small heading over the group, e.g. "Tools". */
  title?: string;
  items: SidebarItem[];
}
export interface SidebarAction {
  label: string;
  /** Default "plus". */
  icon?: IconName | ReactNode;
  href?: string;
  onClick?: () => void;
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
  /** Icons only; each icon shows its name in a tooltip on hover and keyboard focus. */
  collapsed?: boolean;
  /** Called by the built-in collapse button with the new state. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Show the collapse button in the logo row. Default: true when onCollapsedChange is set. */
  showCollapseToggle?: boolean;
  /** One main action pinned above the footer: a full-width button, or an icon button when collapsed. */
  primaryAction?: SidebarAction;
  /** Pinned to the bottom. A function gets `{ collapsed }` and renders in both states; plain content shows only when expanded. */
  footer?: ReactNode | ((state: { collapsed: boolean }) => ReactNode);
  /** The navigation landmark's name. Default "Main". */
  label?: string;
  /** Render links with your router's link component (Next.js Link, React Router Link). It receives href, to, className, aria-current, aria-label and children. */
  linkComponent?: ElementType;
  /** Phones: whether the drawer is open. Setting this or onMobileOpenChange turns on the phone drawer. */
  mobileOpen?: boolean;
  /** Called with false on Escape, a tap on the dimmed page, the close button or choosing an item. */
  onMobileOpenChange?: (open: boolean) => void;
  /** Below this width (px) the sidebar is a drawer. Default 980. */
  mobileBreakpoint?: number;
  /** Labels for the built-in buttons. */
  collapseLabel?: string;
  expandLabel?: string;
  closeLabel?: string;
  className?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ItemIcon({ icon }: { icon: SidebarItem['icon'] }) {
  if (icon == null) return null;
  if (typeof icon === 'string' && icon in ICONS) return <Icon name={icon as IconName} size={22} />;
  return <span className="rnc-sidebar-icon" aria-hidden="true">{icon}</span>;
}

/** True below the breakpoint. False on the server and in browsers without matchMedia. */
function useNarrow(enabled: boolean, breakpoint: number): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.matchMedia) { setNarrow(false); return; }
    const mq = window.matchMedia(`(max-width: ${breakpoint - 0.02}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, [enabled, breakpoint]);
  return narrow;
}

/**
 * An app's main navigation: the logo on top, one icon per menu item, an optional main action and footer. The current page
 * is filled in the action colour. It can collapse to icons (with tooltips), and below `mobileBreakpoint` it becomes a drawer
 * from the left when you control `mobileOpen`.
 */
export function Sidebar({
  logo, logoHref = '/', logoCollapsed, items, sections, collapsed: collapsedProp, onCollapsedChange, showCollapseToggle,
  primaryAction, footer, label = 'Main', linkComponent, mobileOpen, onMobileOpenChange, mobileBreakpoint = 980,
  collapseLabel = 'Collapse menu', expandLabel = 'Expand menu', closeLabel = 'Close menu', className,
}: SidebarProps) {
  const mobileMode = mobileOpen !== undefined || onMobileOpenChange !== undefined;
  const narrow = useNarrow(mobileMode, mobileBreakpoint);
  const drawer = mobileMode && narrow;
  const collapsed = !!collapsedProp && !drawer; // collapsing doesn't apply on phones
  const groups: SidebarSection[] = sections ?? [{ items: items ?? [] }];
  const LinkEl: ElementType = linkComponent ?? 'a';
  const linkProps = (href: string) => (linkComponent ? { href, to: href } : { href });

  // Collapsed tooltips: one fixed tip to the right of the hovered or focused icon. Escape hides it.
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const showTip = useCallback((el: HTMLElement, text: string) => {
    const r = el.getBoundingClientRect();
    setTip({ text, x: r.right + 10, y: r.top + r.height / 2 });
  }, []);
  const hideTip = useCallback(() => setTip(null), []);
  useEffect(() => {
    if (!tip) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setTip(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [tip]);
  useEffect(() => { if (!collapsed) setTip(null); }, [collapsed]);
  // Keyboard focus shows the tip; focus that comes from a click or tap doesn't (hover already did).
  const pointer = useRef(false);
  const tipProps = (text: string) => (collapsed ? {
    onMouseEnter: (e: MouseEvent<HTMLElement>) => showTip(e.currentTarget, text),
    onMouseLeave: hideTip,
    onPointerDown: () => { pointer.current = true; },
    onFocus: (e: FocusEvent<HTMLElement>) => { if (pointer.current) { pointer.current = false; return; } showTip(e.currentTarget, text); },
    onBlur: () => { pointer.current = false; hideTip(); },
  } : {});

  // The phone drawer: focus moves in and stays, the page doesn't scroll, focus returns to the opener on close.
  const panel = useRef<HTMLDivElement>(null);
  const openRef = useRef(onMobileOpenChange);
  openRef.current = onMobileOpenChange;
  const drawerOpen = drawer && !!mobileOpen;
  useEffect(() => {
    if (!drawerOpen) return;
    const back = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const target = panel.current?.querySelector<HTMLElement>('[aria-current="page"]') || panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      if (back && typeof back.focus === 'function' && document.contains(back)) back.focus();
    };
  }, [drawerOpen]);
  const close = () => openRef.current?.(false);
  const onDrawerKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab' || !panel.current) return;
    const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!nodes.length) { e.preventDefault(); return; }
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const toggleShown = !drawer && (showCollapseToggle ?? !!onCollapsedChange);
  const action = primaryAction ? (() => {
    const icon = primaryAction.icon ?? 'plus';
    const link = primaryAction.href != null ? { href: primaryAction.href, as: linkComponent } : {};
    const onClick = () => { primaryAction.onClick?.(); if (drawer) close(); };
    return (
      <div className="rnc-sidebar-action">
        {collapsed
          ? <Button iconOnly startIcon={icon} aria-label={primaryAction.label} onClick={onClick} {...link} {...tipProps(primaryAction.label)} />
          : <Button fullWidth startIcon={icon} onClick={onClick} {...link}>{primaryAction.label}</Button>}
      </div>
    );
  })() : null;
  const foot = typeof footer === 'function' ? footer({ collapsed }) : collapsed ? null : footer;

  const nav = (
    <nav className={cx('rnc-sidebar', collapsed && 'is-collapsed', className)} aria-label={label}>
      {toggleShown || drawer ? (
        <div className="rnc-sidebar-head">
          <LinkEl className="rnc-sidebar-logo" {...linkProps(logoHref)}>{collapsed && logoCollapsed ? logoCollapsed : logo}</LinkEl>
          {drawer
            ? <button type="button" className="rnc-sidebar-toggle" aria-label={closeLabel} onClick={close}><Icon name="x" size={20} /></button>
            : <button type="button" className="rnc-sidebar-toggle" aria-label={collapsed ? expandLabel : collapseLabel} aria-expanded={!collapsed} onClick={() => onCollapsedChange?.(!collapsed)} {...tipProps(expandLabel)}>
                <Icon name={collapsed ? 'caret-right' : 'caret-left'} size={20} />
              </button>}
        </div>
      ) : (
        <LinkEl className="rnc-sidebar-logo" {...linkProps(logoHref)}>{collapsed && logoCollapsed ? logoCollapsed : logo}</LinkEl>
      )}
      <div className="rnc-sidebar-nav" onScroll={tip ? hideTip : undefined}>
        {groups.map((g, gi) => (
          <div key={g.title ?? gi}>
            {g.title ? <p className="rnc-sidebar-section">{g.title}</p> : null}
            <ul className="rnc-sidebar-list">
              {g.items.map((it) => {
                const newTab = it.target === '_blank';
                const hasBadge = it.badge != null && it.badge !== false;
                const text = it.description != null
                  ? <span className="rnc-sidebar-text"><span className="rnc-sidebar-label">{it.label}</span><span className="rnc-sidebar-desc">{it.description}</span></span>
                  : <span className="rnc-sidebar-label">{it.label}</span>;
                // A badge would otherwise run into the label ("Raffles3"); name it "Raffles, 3". A new tab is said out loud.
                const countable = typeof it.badge === 'string' || typeof it.badge === 'number';
                const named = countable || newTab ? `${it.label}${countable ? `, ${it.badge}` : ''}${newTab ? ', opens in a new tab' : ''}` : undefined;
                const inner = (
                  <>
                    <ItemIcon icon={it.icon} />{text}
                    {hasBadge ? <><span className="rnc-sidebar-badge">{it.badge}</span><span className="rnc-sidebar-dot" aria-hidden="true" /></> : null}
                    {it.external ? <Icon name="arrow-square-out" size={16} className="rnc-sidebar-ext" /> : null}
                  </>
                );
                const onClick = (e: MouseEvent<HTMLElement>) => { it.onClick?.(e); if (drawer && !e.defaultPrevented) close(); };
                const common = {
                  className: 'rnc-sidebar-item', 'aria-current': it.current ? ('page' as const) : undefined, 'aria-label': named, onClick,
                  ...tipProps(it.label),
                };
                let el: ReactNode;
                if (it.href == null) el = <button type="button" {...common}>{inner}</button>;
                else if (it.external) el = <a href={it.href} target={it.target} rel={newTab ? 'noopener noreferrer' : undefined} {...common}>{inner}</a>;
                else el = <LinkEl {...linkProps(it.href)} target={it.target} rel={newTab ? 'noopener noreferrer' : undefined} {...common}>{inner}</LinkEl>;
                return <li key={it.id ?? it.label}>{el}</li>;
              })}
            </ul>
          </div>
        ))}
      </div>
      {action}
      {foot != null && foot !== false ? <div className="rnc-sidebar-footer">{foot}</div> : null}
      {tip && typeof document !== 'undefined'
        ? createPortal(<div className="rnc-sidebar-tip" aria-hidden="true" style={{ left: tip.x, top: tip.y }}>{tip.text}</div>, document.body)
        : null}
    </nav>
  );

  if (!drawer) return nav;
  if (!mobileOpen || typeof document === 'undefined') return null;
  return createPortal(
    <>
      <div className="rnc-sidebar-scrim" aria-hidden="true" onClick={close} />
      <div ref={panel} className="rnc-sidebar-drawer" role="dialog" aria-modal="true" aria-label={label} onKeyDown={onDrawerKey}>{nav}</div>
    </>,
    document.body,
  );
}
