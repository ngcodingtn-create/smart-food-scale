'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '@/components/icons';

/**
 * Steps through one capture on the system map.
 *
 * The map itself is drawn on the server and passed in as children. This only
 * sets `data-step` on the wrapper; arch.css does the highlighting from that
 * attribute, so none of the drawings ship to the browser as JavaScript.
 */
const STEP_MS = 2600;

export function MapPlayer({ steps, children }: { steps: string[]; children: ReactNode }) {
  // 0 is the overview: everything lit, nothing moving.
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (step >= steps.length) setPlaying(false);
      else setStep(step + 1);
    }, step === 0 ? 0 : STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, step, steps.length]);

  function go(next: number) {
    setPlaying(false);
    setStep(Math.min(Math.max(next, 0), steps.length));
  }

  function togglePlay() {
    if (playing) {
      setPlaying(false);
      return;
    }
    // Starting from the end, or from the overview, means "from the top".
    if (step === 0 || step >= steps.length) setStep(0);
    setPlaying(true);
  }

  return (
    <div className="map" data-step={step} data-playing={playing}>
      <div className="map-canvas">{children}</div>

      <div className="map-bar">
        <button type="button" className="map-play" onClick={togglePlay}>
          <Icon name={playing ? 'close' : 'play'} size={14} />
          {playing ? 'Stop' : step === 0 ? 'Play' : 'Replay'}
        </button>

        <div className="map-steps" role="group" aria-label="Steps of one capture">
          <button type="button" aria-label="Previous step" disabled={step <= 1} onClick={() => go(step - 1)}>
            <Icon name="chevron-left" size={15} />
          </button>
          {steps.map((title, index) => (
            <button
              key={title}
              type="button"
              className="map-dot"
              aria-pressed={step === index + 1}
              aria-label={`Step ${index + 1}: ${title}`}
              onClick={() => go(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next step"
            disabled={step >= steps.length}
            onClick={() => go(step + 1)}
          >
            <Icon name="chevron-left" size={15} style={{ rotate: '180deg' }} />
          </button>
        </div>

        <button type="button" className="map-all" aria-pressed={step === 0} onClick={() => go(0)}>
          Whole system
        </button>
      </div>

      <p className="map-caption" aria-live="polite" aria-atomic="true">
        {step === 0 ? (
          'The whole system. Press play, or pick a step.'
        ) : (
          <>
            <span className="map-caption-n">{step}</span>
            {steps[step - 1]}
          </>
        )}
      </p>
    </div>
  );
}
