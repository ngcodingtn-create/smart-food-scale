'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useState, type ReactNode } from 'react';
import { RigFallback } from '@/components/rig/RigFallback';
import type { SimView } from '@/components/rig/RigViewer';
import '@/components/rig/rig.css';

const NOTE = 'The simulation still runs: the readout, the pipeline and the phone do not need 3D.';

// The same model as /rig, behind the same dynamic import, so Three.js stays out
// of every page's initial JavaScript (npm run check:rig enforces that).
const Scene = dynamic(() => import('@/components/rig/Scene'), {
  ssr: false,
  loading: () => <RigFallback note={NOTE} />,
});

class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <RigFallback message="The 3D view could not start." note={NOTE} />
    ) : (
      this.props.children
    );
  }
}

const noop = () => {};

/** The rig, live: what is on the plate, what the OLED reads, whether the ring is lit. */
export function SimStage({ view }: { view: SimView }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [dark, setDark] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const unavailable = useCallback(() => setSupported(false), []);

  useEffect(() => {
    const probe = document.createElement('canvas').getContext('webgl2', {
      failIfMajorPerformanceCaveat: false,
    });
    setSupported(Boolean(probe));
    probe?.getExtension('WEBGL_lose_context')?.loseContext();

    const updateTheme = () => setDark(document.documentElement.classList.contains('dark'));
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener('change', updateMotion);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', updateMotion);
    };
  }, []);

  if (supported === null) return <RigFallback note={NOTE} />;
  if (!supported) {
    return <RigFallback message="3D is unavailable in this browser." note={NOTE} />;
  }

  return (
    <StageBoundary>
      <Scene
        exploded={false}
        dimensions={false}
        lights={view.flash}
        dark={dark}
        reducedMotion={reducedMotion}
        rotating={false}
        selected={null}
        onSelect={noop}
        preset="perspective"
        reset={0}
        onUnavailable={unavailable}
        focusRequest={null}
        sim={view}
      />
    </StageBoundary>
  );
}
