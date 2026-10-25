'use client';

import { useMemo, useState } from 'react';
import { WireDrawing, useDone } from '@/components/workbench/WireIt';
import { NODES, endName, wiresOf, type Wire } from '@/components/workbench/wiring';
import '@/components/figure.css';

/**
 * Wire it's drawing with only this step's wires lit. Each wire is also listed
 * in words, ticked as it is made; the ticks are Wire it's own, so they show on
 * the public Wire it page too.
 */
export function StepWiring({ node: nodeId, ids }: { node: 'a' | 'b'; ids: string[] }) {
  const node = NODES.find((item) => item.id === nodeId) ?? NODES[0];
  const [done, update] = useDone(true);
  const wires = useMemo(() => {
    const all = wiresOf(node);
    return ids.map((id) => {
      const wire = all.find((item) => item.id === id);
      if (!wire) throw new Error(`No wire "${id}" in wiring.ts. Check components/admin/roadmap.ts.`);
      return wire;
    });
  }, [node, ids]);
  const lit = useMemo(() => new Set(ids), [ids]);
  const [picked, setPicked] = useState<Wire | null>(null);

  return (
    <div className="step-wiring">
      <div className="step-wiring-drawing">
        <WireDrawing node={node} current={null} done={done} lit={lit} onPick={(wire) => setPicked(wire)} />
      </div>
      {picked && !lit.has(picked.id) ? (
        <p className="step-wiring-note">That wire belongs to another step: {endName(node, picked.from)} → {endName(node, picked.to)}.</p>
      ) : null}
      <ol className="step-wires">
        {wires.map((wire) => (
          <li key={wire.id} data-done={done.has(wire.id)}>
            <label>
              <input
                type="checkbox"
                checked={done.has(wire.id)}
                onChange={(event) => {
                  const on = event.target.checked;
                  update((next) => {
                    if (on) next.add(wire.id);
                    else next.delete(wire.id);
                  });
                }}
              />
              <span className="step-wire-dot" data-colour={wire.colour} aria-hidden="true" />
              <span className="step-wire-text">
                <span>{wire.say}</span>
                {wire.why ? <small>{wire.why}</small> : null}
              </span>
            </label>
          </li>
        ))}
      </ol>
    </div>
  );
}
