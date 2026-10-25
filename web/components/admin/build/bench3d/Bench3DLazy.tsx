'use client';

import dynamic from 'next/dynamic';

/** The 3D bench, loaded only on the pages that show it: three.js stays out of every other page. */
export const Bench3DLazy = dynamic(() => import('./Bench3D'), {
  ssr: false,
  loading: () => <div className="bench3d-loading">Setting up your bench in 3D…</div>,
});
