'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Brand } from '@/components/Brand';
import { Icon } from '@/components/icons';
import { ThemeSwitch, ThemeToggle } from '@/components/ThemeToggle';
import { NAV, REPO_URL } from '@/lib/nav';

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation">
      {NAV.map((group) => (
        <div key={group.label} className="nav-group">
          <h2 className="nav-label label">{group.label}</h2>
          <ul className="nav-list">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className="nav-link"
                  >
                    {item.icon ? <Icon name={item.icon} size={17} /> : null}
                    <span className="nav-text">{item.label}</span>
                    {item.badge ? (
                      <span className="nav-badge" data-tone={item.badge.tone}>
                        {item.badge.text}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFoot() {
  return (
    <div className="sidebar-foot">
      <a href={REPO_URL} target="_blank" rel="noreferrer noopener" className="repo-link">
        GitHub
        <Icon name="external" size={14} />
      </a>
      <ThemeSwitch />
    </div>
  );
}

/** Desktop: fixed to the left edge, full height. Hidden below 64rem. */
export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <Brand />
      </div>
      <div className="sidebar-scroll">
        <NavList />
      </div>
      <SidebarFoot />
    </aside>
  );
}

/**
 * Small screens: a sticky top bar, and the same navigation in a drawer.
 *
 * The drawer is a native modal <dialog>. That is what traps focus inside it,
 * closes it on Esc and makes the page behind it inert — none of it is
 * re-implemented here.
 */
export function MobileBar() {
  const drawer = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = () => drawer.current?.close();

  // A link in the drawer was followed.
  useEffect(() => {
    drawer.current?.close();
  }, [pathname]);

  // The window grew past the breakpoint with the drawer open: the sidebar is
  // on screen now, so a modal copy of it would only be in the way.
  useEffect(() => {
    const desktop = matchMedia('(min-width: 64rem)');
    const onChange = () => {
      if (desktop.matches) drawer.current?.close();
    };
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          <ThemeToggle />
          <button
            type="button"
            className="icon-btn"
            aria-label="Open navigation"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="nav-drawer"
            onClick={() => {
              drawer.current?.showModal();
              setOpen(true);
            }}
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>

      <dialog
        ref={drawer}
        id="nav-drawer"
        className="drawer"
        aria-label="Site navigation"
        onClose={() => setOpen(false)}
        // The panel fills the dialog, so a click that lands on the dialog
        // itself can only have come from the backdrop.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="drawer-panel">
          <div className="drawer-head">
            <Brand onNavigate={close} />
            <button type="button" className="icon-btn" aria-label="Close navigation" onClick={close}>
              <Icon name="close" />
            </button>
          </div>
          <div className="sidebar-scroll">
            <NavList onNavigate={close} />
          </div>
          <SidebarFoot />
        </div>
      </dialog>
    </>
  );
}
