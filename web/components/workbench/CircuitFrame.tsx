'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { CIRCUITS, circuitUrl, type Circuit } from './circuits';
import './workbench.css';

/**
 * One of the two transistor circuits, running in the Falstad simulator.
 *
 * The frame is loaded on request, not with the page: the simulator is a large
 * download from someone else's site, and a reader who only wants the wiring
 * should not pay for it or be sent there.
 */
export function CircuitFrame({ id }: { id: Circuit['id'] }) {
  const [loaded, setLoaded] = useState(false);
  const circuit = CIRCUITS.find((item) => item.id === id);
  if (!circuit) throw new Error(`No circuit "${id}" in circuits.ts.`);

  return (
    <figure className="circuit">
      <div className="circuit-screen">
        {loaded ? (
          <iframe src={circuitUrl(circuit, true)} title={`${circuit.title}, in the Falstad circuit simulator`} />
        ) : (
          <button type="button" onClick={() => setLoaded(true)}>
            <Icon name="play" size={18} />
            <strong>Run this circuit</strong>
            <span>Loads the simulator from falstad.com</span>
          </button>
        )}
      </div>
      <figcaption>
        <strong>{circuit.title}</strong>
        {circuit.try}
        <em>{circuit.note}</em>
        <a href={circuitUrl(circuit, false)} target="_blank" rel="noreferrer noopener">
          Open it full size
          <Icon name="external" size={13} />
        </a>
      </figcaption>
    </figure>
  );
}
