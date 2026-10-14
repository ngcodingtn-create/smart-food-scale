'use client';

import { createElement, useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import './workbench.css';

/**
 * ESP Web Tools' install button, for one firmware image on this site.
 *
 * The library is loaded when this component mounts, so only the Flash page
 * pays for it. It talks to the board over Web Serial, which needs Chrome, Edge
 * or Firefox on a computer; anywhere else the button explains instead.
 */
export function FlashButton({ manifest, label }: { manifest: string; label: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'no-serial' | 'failed'>('loading');

  useEffect(() => {
    if (!('serial' in navigator)) {
      setState('no-serial');
      return;
    }
    // The library's self-contained browser build. Its npm entry point imports
    // Material Web internals that @material/web no longer ships as JavaScript.
    import('esp-web-tools/dist/web/install-button.js')
      .then(() => setState('ready'))
      .catch(() => setState('failed'));
  }, []);

  if (state === 'no-serial') {
    return <p className="flash-note">This browser cannot reach a USB board. Use Chrome, Edge or Firefox on a computer.</p>;
  }
  if (state === 'failed') {
    return <p className="flash-note">The installer did not load. Reload the page, or flash with PlatformIO instead.</p>;
  }

  // A custom element: React 19 passes `manifest` through as an attribute.
  return createElement(
    'esp-web-install-button',
    { manifest, class: 'flash-button' },
    <button slot="activate" type="button" className="btn btn-primary" disabled={state !== 'ready'}>
      <Icon name="plug" size={16} />
      {state === 'ready' ? `Install ${label}` : 'Loading the installer…'}
    </button>,
    <p slot="unsupported" className="flash-note">
      This browser cannot reach a USB board. Use Chrome, Edge or Firefox on a computer.
    </p>,
    <p slot="not-allowed" className="flash-note">
      The page must be opened over https to reach a board.
    </p>,
  );
}
