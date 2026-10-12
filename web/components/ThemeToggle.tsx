'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { Icon, type IconName } from '@/components/icons';

/**
 * Theme controls. The source of truth is the `dark` class on <html>, set
 * before first paint by the boot script in app/layout.tsx; `localStorage.theme`
 * holds an explicit choice, and its absence means "follow the system".
 *
 * Two controls read the same state — the three-way switch in the sidebar and
 * the single button in the mobile top bar — so the state lives outside React
 * and both subscribe to it.
 */
type Preference = 'light' | 'dark' | 'system';

const SYSTEM_DARK = '(prefers-color-scheme: dark)';
const CHANGE_EVENT = 'themechange';

// Private mode can block storage; the choice then lasts for this page only.
let unsavedPreference: Preference | null = null;

function readPreference(): Preference {
  try {
    const stored = localStorage.getItem('theme');
    return stored === 'light' || stored === 'dark' ? stored : (unsavedPreference ?? 'system');
  } catch {
    return unsavedPreference ?? 'system';
  }
}

function applyPreference(preference: Preference) {
  const dark =
    preference === 'dark' || (preference === 'system' && matchMedia(SYSTEM_DARK).matches);
  document.documentElement.classList.toggle('dark', dark);
}

/** What the boot script in app/layout.tsx decided. Mirrors it; change both together. */
function initialDark(): boolean {
  const forced = new URLSearchParams(location.search).get('theme');
  if (forced) return forced === 'dark';
  const preference = readPreference();
  return preference === 'dark' || (preference === 'system' && matchMedia(SYSTEM_DARK).matches);
}

/**
 * In development React's Strict Mode remounts the tree once, and on that
 * remount it resets <html> to the attributes in the JSX — dropping the `dark`
 * class the boot script added. Put it back before the browser paints. In a
 * production build the class is already right and this changes nothing.
 */
function useRestoreThemeClass() {
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', initialDark());
  }, []);
}

function choose(preference: Preference) {
  unsavedPreference = preference;
  try {
    if (preference === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', preference);
  } catch {
    // Blocked storage — `unsavedPreference` above carries it instead.
  }
  applyPreference(preference);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(notify: () => void) {
  const media = matchMedia(SYSTEM_DARK);
  // Another tab changed the choice, or the OS flipped while we follow it.
  const resync = () => {
    applyPreference(readPreference());
    notify();
  };
  window.addEventListener(CHANGE_EVENT, notify);
  window.addEventListener('storage', resync);
  media.addEventListener('change', resync);
  return () => {
    window.removeEventListener(CHANGE_EVENT, notify);
    window.removeEventListener('storage', resync);
    media.removeEventListener('change', resync);
  };
}

// A string, so useSyncExternalStore can compare snapshots by value.
const getSnapshot = () =>
  `${readPreference()}:${document.documentElement.classList.contains('dark') ? 'dark' : 'light'}`;
// Unknown on the server: the boot script decides before hydration.
const getServerSnapshot = () => null;

const OPTIONS: { value: Preference; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Light theme', icon: 'sun' },
  { value: 'dark', label: 'Dark theme', icon: 'moon' },
  { value: 'system', label: 'Match system theme', icon: 'monitor' },
];

/** Light / dark / system, as a segmented control. */
export function ThemeSwitch() {
  useRestoreThemeClass();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const preference = snapshot?.split(':')[0];

  return (
    <div className="theme-switch" role="group" aria-label="Colour theme">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={preference === option.value}
          aria-label={option.label}
          title={option.label}
          onClick={() => choose(option.value)}
        >
          <Icon name={option.icon} size={15} />
        </button>
      ))}
    </div>
  );
}

/** One button that flips between light and dark. */
export function ThemeToggle() {
  useRestoreThemeClass();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const dark = snapshot?.endsWith(':dark') ?? false;

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => choose(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {/* Rendered only once mounted, so SSR and client markup agree. */}
      {snapshot === null ? <span className="inline-block w-[18px]" /> : <Icon name={dark ? 'sun' : 'moon'} />}
    </button>
  );
}
