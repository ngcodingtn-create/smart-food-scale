'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { PARTS, type PartId } from './specs';
import { RigFallback } from './RigFallback';
import './rig.css';

// MDX is a Server Component. The browser-only import MUST stay in this wrapper.
// Nothing in the shared layout/nav imports Scene, three or react-three/fiber.
const Scene = dynamic(() => import('./Scene'), { ssr: false, loading: () => <RigFallback /> });

export type ViewPreset = 'perspective' | 'front' | 'top';
// Live state for the /prototype simulator. Absent on /rig, where the model is a
// static reference: plate on, nothing on it, the OLED showing its sample reading.
export interface SimView {
  oled: string;
  plate: boolean;
  // `amount` is 0..1 of the largest portion. The mound only hints at quantity.
  food: { color: string; amount: number } | null;
  flash: boolean;
}
export interface SceneProps {
  exploded: boolean; dimensions: boolean; lights: boolean; dark: boolean;
  reducedMotion: boolean; rotating: boolean; selected: PartId | null;
  onSelect: (id: PartId) => void; preset: ViewPreset; reset: number;
  onUnavailable: () => void;
  focusRequest: { part: PartId; serial: number } | null;
  /** Numbered markers on the parts, matching the list under the viewer. */
  pins: boolean;
  sim?: SimView;
}

// Parts that sit inside the base: focusing one opens the exploded view so it can be seen.
const HIDDEN_IN_BASE: PartId[] = ['cell', 'devkit', 'hx711', 'buzzer'];

const VIEWS: { id: ViewPreset; label: string }[] = [
  { id: 'perspective', label: '3D' },
  { id: 'front', label: 'Front' },
  { id: 'top', label: 'Top' },
];

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <RigFallback message="The 3D view could not start. Here is the assembly in side view." />
    ) : (
      this.props.children
    );
  }
}

export default function RigViewer() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [dark, setDark] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [dimensions, setDimensions] = useState(false);
  const [lights, setLights] = useState(true);
  const [pins, setPins] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [selected, setSelected] = useState<PartId | null>('plate');
  const [preset, setPreset] = useState<ViewPreset>('perspective');
  const [reset, setReset] = useState(0);
  const [focusRequest, setFocusRequest] = useState<SceneProps['focusRequest']>(null);
  const unavailable = useCallback(() => setSupported(false), []);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    setSupported(Boolean(context));
    // Release the probe; the scene creates its own context only after support is known.
    context?.getExtension('WEBGL_lose_context')?.loseContext();

    const updateTheme = () => setDark(document.documentElement.classList.contains('dark'));
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      setReducedMotion(media.matches);
      if (media.matches) setRotating(false);
    };
    updateMotion();
    media.addEventListener('change', updateMotion);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', updateMotion);
    };
  }, []);

  function chooseView(next: ViewPreset) {
    setFocusRequest(null);
    setPreset(next);
    setReset((value) => value + 1);
    setRotating(false);
  }

  /** From the list: select the part and fly the camera to it. */
  function inspect(id: PartId) {
    setSelected(id);
    setRotating(false);
    if (HIDDEN_IN_BASE.includes(id)) setExploded(true);
    setFocusRequest((previous) => ({ part: id, serial: (previous?.serial ?? 0) + 1 }));
    stage.current?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
  }

  const index = PARTS.findIndex((item) => item.id === selected);
  const part = index === -1 ? null : PARTS[index];

  return (
    <div className="rig-viewer" aria-label="Interactive model of the rig">
      <div ref={stage} className="rig-stage" aria-describedby="rig-help rig-assembly-description">
        {supported === null ? (
          <RigFallback />
        ) : supported ? (
          <SceneBoundary>
            <Scene
              exploded={exploded}
              dimensions={dimensions}
              lights={lights}
              dark={dark}
              reducedMotion={reducedMotion}
              rotating={rotating && !reducedMotion}
              selected={selected}
              onSelect={setSelected}
              preset={preset}
              reset={reset}
              onUnavailable={unavailable}
              focusRequest={focusRequest}
              pins={pins}
            />
          </SceneBoundary>
        ) : (
          <RigFallback message="3D is unavailable in this browser. Here is the assembly in side view." />
        )}

        {supported ? (
          <div className="rig-view-presets" role="group" aria-label="Camera view">
            {VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                aria-pressed={preset === view.id && focusRequest === null}
                onClick={() => chooseView(view.id)}
              >
                {view.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rig-toolbar">
        <div className="rig-segmented" role="group" aria-label="Assembly">
          <button type="button" aria-pressed={!exploded} onClick={() => setExploded(false)}>
            Assembled
          </button>
          <button type="button" aria-pressed={exploded} onClick={() => setExploded(true)}>
            Exploded
          </button>
        </div>
        <div className="rig-toggles" role="group" aria-label="Show">
          <button type="button" aria-pressed={pins} onClick={() => setPins((value) => !value)}>
            Numbers
          </button>
          <button type="button" aria-pressed={dimensions} onClick={() => setDimensions((value) => !value)}>
            Sizes
          </button>
          <button type="button" aria-pressed={lights} onClick={() => setLights((value) => !value)}>
            Light
          </button>
          <button
            type="button"
            aria-pressed={rotating && !reducedMotion}
            disabled={reducedMotion || !supported}
            title={reducedMotion ? 'Off, because your system asks for reduced motion' : undefined}
            onClick={() => setRotating((value) => !value)}
          >
            Spin
          </button>
        </div>
      </div>

      {/* The legend. Same numbers as the markers on the model. A <div>, not an
          <ol>: inside .prose an ordered list is restyled as numbered steps. */}
      <div className="rig-parts" role="list" aria-label="Parts">
        {PARTS.map((item, position) => (
          <div role="listitem" key={item.id}>
            <button type="button" aria-pressed={selected === item.id} onClick={() => inspect(item.id)}>
              <span className="rig-number">{position + 1}</span>
              {item.name}
            </button>
          </div>
        ))}
      </div>

      {part ? (
        <div className="rig-part-detail" aria-live="polite" aria-atomic="true">
          <div className="rig-part-heading">
            <span className="rig-number">{index + 1}</span>
            <strong>{part.name}</strong>
            <span className="rig-node">{part.node}</span>
          </div>
          <p>{part.description}</p>
          <p className="rig-part-size">{part.size}</p>
          <p className="rig-part-note">{part.detail}</p>
        </div>
      ) : null}

      <p className="rig-help" id="rig-help">
        Drag to turn · scroll or pinch to zoom · pick a number to fly to that part
        {exploded && dimensions ? ' · sizes are the assembled ones; exploded gaps are not to scale' : ''}
      </p>
    </div>
  );
}
