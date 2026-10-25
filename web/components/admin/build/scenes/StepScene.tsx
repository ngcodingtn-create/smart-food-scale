'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildScene, type SceneRef } from './index';
import { DESK_VIEW } from './types';
import './scene.css';

const PAUSE_AT_END = 1.6;

/** A step, played as a short 2.5D animation, with its captions in time. */
export function StepScene({ scene }: { scene: SceneRef }) {
  const def = useMemo(() => buildScene(scene), [scene]);
  const loop = def.T + PAUSE_AT_END;
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(true);
  const box = useRef<HTMLElement>(null);

  // Reduced motion: start on the last frame, still, with every caption shown.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPlaying(false);
      setT(def.T);
    }
  }, [def.T]);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setT((previous) => (previous + dt) % loop);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, visible, loop]);

  const shown = Math.min(t, def.T);
  const current = def.beats.reduce((index, beat, i) => (beat.at <= shown ? i : index), 0);

  return (
    <figure className="step-scene" ref={box}>
      <div className="step-scene-stage">
        <svg viewBox={def.camera ? def.camera(shown).map((v) => v.toFixed(1)).join(' ') : (def.view ?? DESK_VIEW)} role="img" aria-label={def.beats.map((beat) => beat.text).join('. ')}>
          <defs>
            <marker id="sc-arrow" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent, #e08a4f)" />
            </marker>
          </defs>
          {def.draw(shown)}
        </svg>
      </div>
      <div className="step-scene-controls">
        <button type="button" className="step-scene-play" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <rect x="3" y="2" width="3.5" height="12" rx="1" />
              <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 2.5v11l9.5-5.5z" />
            </svg>
          )}
        </button>
        <input
          className="step-scene-scrub"
          type="range"
          min={0}
          max={def.T}
          step={0.05}
          value={shown}
          aria-label="Position in the animation"
          onChange={(event) => {
            setT(Number(event.target.value));
            setPlaying(false);
          }}
        />
        <button
          type="button"
          className="step-scene-replay"
          onClick={() => {
            setT(0);
            setPlaying(true);
          }}
        >
          Replay
        </button>
      </div>
      <ol className="step-scene-beats">
        {def.beats.map((beat, i) => (
          <li
            key={beat.text}
            data-state={i < current ? 'past' : i === current ? 'now' : 'next'}
            onClick={() => {
              setT(beat.at);
              setPlaying(false);
            }}
          >
            {beat.who ? <span className="step-scene-who" data-who={beat.who}>{beat.who === 'you' ? 'You' : 'Claude'}</span> : null}
            <span>{beat.text}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
