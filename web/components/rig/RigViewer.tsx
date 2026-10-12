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
  sim?: SimView;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <RigFallback message="The 3D view could not start. Here is the assembly in side view." /> : this.props.children; }
}

export default function RigViewer() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [dark, setDark] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [dimensions, setDimensions] = useState(false);
  const [lights, setLights] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [selected, setSelected] = useState<PartId | null>('cell');
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
    const updateMotion = () => { setReducedMotion(media.matches); if (media.matches) setRotating(false); };
    updateMotion(); media.addEventListener('change', updateMotion);
    return () => { observer.disconnect(); media.removeEventListener('change', updateMotion); };
  }, []);

  const part = PARTS.find((item) => item.id === selected);
  function chooseView(next: ViewPreset) { setFocusRequest(null); setPreset(next); setReset((value) => value + 1); setRotating(false); }

  return <div className="rig-viewer" aria-label="Interactive assembly explorer">
    <div className="rig-toolbar">
      <div className="rig-segmented" role="group" aria-label="Assembly mode">
        <button type="button" aria-pressed={!exploded} onClick={() => setExploded(false)}>Assembled</button>
        <button type="button" aria-pressed={exploded} onClick={() => setExploded(true)}>Exploded</button>
      </div>
      <button className="rig-reset" type="button" onClick={() => chooseView('perspective')}>Reset view</button>
    </div>
    <div ref={stage} className="rig-stage" aria-describedby="rig-help rig-assembly-description">
      <div className="rig-stage-caption" aria-hidden="true"><span>Smart Food Scale</span><small>{exploded ? 'Exploded assembly · spacing illustrative' : 'Proposed assembly · dimensions in mm'}</small></div>
      {supported === null ? <RigFallback /> : supported ? <SceneBoundary><Scene
        exploded={exploded} dimensions={dimensions} lights={lights} dark={dark}
        reducedMotion={reducedMotion} rotating={rotating && !reducedMotion} selected={selected}
        onSelect={setSelected} preset={preset} reset={reset} onUnavailable={unavailable} focusRequest={focusRequest}
      /></SceneBoundary> : <RigFallback message="3D is unavailable in this browser. Explore the assembly in side view." />}
      {supported && <div className="rig-view-presets" role="group" aria-label="Camera view">
        <button type="button" aria-pressed={preset === 'perspective'} onClick={() => chooseView('perspective')}>3D</button>
        <button type="button" aria-pressed={preset === 'front'} onClick={() => chooseView('front')}>Front</button>
        <button type="button" aria-pressed={preset === 'top'} onClick={() => chooseView('top')}>Top</button>
      </div>}
    </div>
    <div className="rig-options">
      <label><input type="checkbox" checked={dimensions} onChange={(event) => setDimensions(event.target.checked)} />Dimensions</label>
      <label><input type="checkbox" checked={lights} onChange={(event) => setLights(event.target.checked)} />Light ring</label>
      <label title={reducedMotion ? 'Disabled by your reduced-motion preference' : undefined}><input type="checkbox" checked={rotating && !reducedMotion} disabled={reducedMotion || !supported} onChange={(event) => setRotating(event.target.checked)} />Rotate slowly</label>
    </div>
    <p className="rig-help" id="rig-help">Drag to orbit · pinch or scroll to zoom. Use Front, Top and Reset for keyboard navigation.{exploded && dimensions ? ' Dimensions show the assembled sizes; exploded spacing is illustrative.' : ''}</p>
    <div className="rig-inspector">
      <div className="rig-part-picker"><label>Inspect a component<select value={selected ?? 'cell'} onChange={(event) => setSelected(event.target.value as PartId)}>{PARTS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="rig-focus" type="button" disabled={!supported} onClick={() => {
        setRotating(false);
        if (['cell', 'devkit', 'hx711', 'buzzer'].includes(selected ?? 'cell')) setExploded(true);
        setFocusRequest({ part: selected ?? 'cell', serial: (focusRequest?.serial ?? 0) + 1 });
        stage.current?.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'instant' : 'smooth' });
      }}>Focus component</button></div>
      {part && <div className="rig-part-detail" aria-live="polite" aria-atomic="true"><div className="rig-part-heading"><strong>{part.name}</strong><span>{part.node}</span></div><p>{part.description}</p><div className="rig-part-size">{part.size}</div><p className="rig-part-note">{part.detail}</p></div>}
    </div>
    <div className="rig-signal-path"><span>Node A · measured grams</span><span aria-hidden="true">→</span><span>ESP-NOW</span><span aria-hidden="true">→</span><span>Node B · JPEG + grams</span><span aria-hidden="true">→</span><span>Wi-Fi / backend</span></div>
  </div>;
}
