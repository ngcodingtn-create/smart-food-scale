'use client';

import { useEffect, useRef, useState } from 'react';
import { createBench, type BenchPlayer } from './engine';
import { BENCH_SCENES } from './scenes';
import './bench3d.css';

const SWATCH: Record<string, string> = { red: '#d0453c', black: '#2b2b2b', green: '#3f9b5a', blue: '#3b6fd0', yellow: '#e2b93b', purple: '#8a5cc8', grey: '#8d949a', teal: '#1fa99a', white: '#ecebe6' };

/** A step explained in 3D on the owner's bench (ai-docs/EXPLAINING.md): drag to turn, one action per beat. */
export default function Bench3D({ sceneKey }: { sceneKey: string }) {
  const spec = BENCH_SCENES[sceneKey];
  const canvas = useRef<HTMLCanvasElement>(null);
  const tags = useRef<HTMLDivElement>(null);
  const player = useRef<BenchPlayer | null>(null);
  const [beat, setBeat] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!canvas.current || !tags.current || !spec) return;
    try {
      player.current = createBench(canvas.current, tags.current, spec);
      (window as unknown as { bench3d?: BenchPlayer }).bench3d = player.current;
    } catch {
      setFailed(true);
    }
    return () => {
      player.current?.dispose();
      player.current = null;
    };
  }, [spec]);

  useEffect(() => {
    player.current?.show(beat);
  }, [beat]);

  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'ArrowDown') setBeat((b) => Math.min((spec?.beats.length ?? 1) - 1, b + 1));
      if (event.key === 'ArrowUp') setBeat((b) => Math.max(0, b - 1));
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  }, [spec]);

  if (!spec) return null;
  const current = spec.beats[beat];
  const last = spec.beats.length - 1;

  return (
    <figure className="bench3d">
      <div className="bench3d-stage">
        <canvas ref={canvas} aria-label="Your bench in 3D: the NodeMCU upside down, pins up, the breadboard on its right. Drag to turn it." />
        <div className="bench3d-tags" ref={tags} />
        <span className="bench3d-hint">drag to turn · scroll to zoom</span>
        {failed ? <p className="bench3d-nogl">This browser cannot draw the 3D bench. The steps below still say what to do.</p> : null}
      </div>
      <div className="bench3d-beats" role="tablist" aria-label="Steps of this step">
        {spec.beats.map((item, i) => (
          <button key={item.title} type="button" role="tab" aria-selected={i === beat} className="bench3d-pill" onClick={() => setBeat(i)} title={item.title}>
            {i + 1}
          </button>
        ))}
      </div>
      <figcaption className="bench3d-caption" aria-live="polite">
        <h3>
          {beat + 1}. {current.title}
        </h3>
        <div className="bench3d-doer">
          <span className={`bench3d-who ${current.who}`}>{current.who === 'you' ? 'You do' : 'Claude'}</span>
          {current.text.length > 1 ? (
            <ol>
              {current.text.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ol>
          ) : (
            <p>{current.text[0]}</p>
          )}
        </div>
        <div className="bench3d-nav">
          <button type="button" className="bench3d-btn" onClick={() => setBeat((b) => Math.max(0, b - 1))} disabled={beat === 0}>
            ← Back
          </button>
          <button type="button" className="bench3d-btn" onClick={() => player.current?.replay()}>
            Replay
          </button>
          <button type="button" className="bench3d-btn primary" onClick={() => setBeat((b) => Math.min(last, b + 1))} disabled={beat === last}>
            {beat === last ? 'Done' : 'Next →'}
          </button>
        </div>
      </figcaption>
      {spec.cards?.length ? (
        <div className="bench3d-cards">
          {spec.cards.map((card) => (
            <div key={card.title} className="bench3d-card">
              <b>
                {card.colour ? <i style={{ background: SWATCH[card.colour] ?? card.colour }} aria-hidden="true" /> : null}
                {card.title}
              </b>
              <span>{card.text}</span>
            </div>
          ))}
        </div>
      ) : null}
    </figure>
  );
}
