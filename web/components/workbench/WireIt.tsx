'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/icons';
import { ART } from './boards';
import { saveToFile, syncWithFile } from '@/components/admin/saved';
import { NODES, endName, wiresOf, type NodeId, type NodeWiring, type Wire } from './wiring';
import '../figure.css';
import './workbench.css';

/**
 * The wiring, one wire at a time.
 *
 * Starts on the whole board. "Start" walks the wires in bench order; each one
 * is ticked off as it is made, and the ticks are kept in this browser so the
 * page can be closed and reopened at the bench.
 */

const STORE = 'sfs-wired-v1';

/**
 * The ids of the wires already made. Kept in localStorage; works without it.
 * `mirror`: also kept in web/data/progress.json on the laptop (the /admin pages only).
 */
export function useDone(mirror = false) {
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());

  // After mount, so the server's markup and the first client render agree.
  useEffect(() => {
    const load = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORE) ?? '[]');
        if (Array.isArray(saved)) setDone(new Set(saved.filter((id) => typeof id === 'string')));
      } catch {
        // Private window, or storage blocked: the ticks last until the page closes.
      }
    };
    load();
    if (mirror) syncWithFile(STORE).then(load);
  }, [mirror]);

  function update(change: (next: Set<string>) => void) {
    setDone((current) => {
      const next = new Set(current);
      change(next);
      try {
        localStorage.setItem(STORE, JSON.stringify([...next]));
      } catch {
        // See above.
      }
      if (mirror) saveToFile(STORE, [...next]);
      return next;
    });
  }

  return [done, update] as const;
}

const KIND: Record<NonNullable<Wire['kind']>, string> = {
  jumper: 'jumper',
  lead: 'soldered lead',
  part: 'the part’s own legs',
};

function route(node: NodeWiring, wire: Wire) {
  const middle = wire.through ? ` → ${wire.through} → ` : ' → ';
  return `${endName(node, wire.from)}${middle}${endName(node, wire.to)}`;
}

/**
 * The board with its wires. `current` singles one out; `lit`, a step's own
 * wires (the admin build pages), lights several at once.
 */
export function WireDrawing({
  node,
  current,
  done,
  onPick,
  lit,
}: {
  node: NodeWiring;
  current: Wire | null;
  done: ReadonlySet<string>;
  onPick: (wire: Wire) => void;
  lit?: ReadonlySet<string>;
}) {
  const art = ART[node.id];
  return (
    <svg
      className="fig wire-fig"
      viewBox={art.viewBox}
      data-mode={current || lit ? 'step' : 'all'}
      role="img"
      aria-label={`${node.title}, ${node.board.name}, with its ${wiresOf(node).length} wires. The list beside the drawing gives every one in words.`}
    >
      {art.parts}
      {wiresOf(node).map((wire) => {
        const shape = art.wires[wire.id];
        const state = wire === current || lit?.has(wire.id) ? 'current' : done.has(wire.id) ? 'done' : 'todo';
        return (
          <g key={wire.id} className="wire" data-state={state} data-colour={wire.colour} onClick={() => onPick(wire)}>
            {/* a wide, invisible stroke: something to hit with a finger */}
            <path className="wire-hit" d={shape.d} />
            <path className="wire-case" d={shape.d} />
            <path className="wire-line" d={shape.d} />
            {shape.ends.map(([x, y], index) => (
              <circle key={index} className="wire-end" cx={x} cy={y} r="3.4" />
            ))}
            {wire.through && shape.chip ? (
              <g className="wire-chip" transform={`translate(${shape.chip[0]} ${shape.chip[1]})`}>
                <rect x={-wire.through.length * 2.9 - 5} y="-7" width={wire.through.length * 5.8 + 10} height="14" rx="4" />
                <text y="3.2" textAnchor="middle">
                  {wire.through}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function WireIt() {
  const [nodeId, setNodeId] = useState<NodeId>('a');
  // null is the overview: the whole board, nothing singled out.
  const [index, setIndex] = useState<number | null>(null);
  const [done, updateDone] = useDone();

  const node = NODES.find((item) => item.id === nodeId) ?? NODES[0];
  const wires = useMemo(() => wiresOf(node), [node]);
  const current = index === null ? null : wires[index];
  const made = wires.filter((wire) => done.has(wire.id)).length;

  function pickNode(id: NodeId) {
    setNodeId(id);
    setIndex(null);
  }

  function start() {
    const first = wires.findIndex((wire) => !done.has(wire.id));
    setIndex(first === -1 ? 0 : first);
  }

  function finish() {
    if (index === null || !current) return;
    updateDone((next) => next.add(current.id));
    // On to the next wire still to make; after the last one, back to the whole board.
    const rest = wires.findIndex((wire, at) => at > index && !done.has(wire.id));
    setIndex(rest === -1 ? null : rest);
  }

  function toggle(wire: Wire) {
    updateDone((next) => {
      if (!next.delete(wire.id)) next.add(wire.id);
    });
  }

  function reset() {
    updateDone((next) => wires.forEach((wire) => next.delete(wire.id)));
    setIndex(null);
  }

  return (
    <div className="wireit">
      <div className="wireit-tabs" role="group" aria-label="Which board">
        {NODES.map((item) => {
          const total = wiresOf(item);
          const count = total.filter((wire) => done.has(wire.id)).length;
          return (
            <button key={item.id} type="button" aria-pressed={item.id === nodeId} onClick={() => pickNode(item.id)}>
              <strong>{item.title}</strong>
              <span>{item.job}</span>
              <em>
                {count}/{total.length}
              </em>
            </button>
          );
        })}
      </div>

      <div className="wireit-body">
        <div className="wireit-step" aria-live="polite" aria-atomic="true">
          {current && index !== null ? (
            <>
              <p className="wireit-count">
                <span className="wire-swatch" data-colour={current.colour} aria-hidden="true" />
                Wire {index + 1} of {wires.length} · {current.colour} {KIND[current.kind ?? 'jumper']}
                {current.times ? ` · ×${current.times}` : ''}
              </p>
              <p className="wireit-say">{current.say}</p>
              {current.why ? <p className="wireit-why">{current.why}</p> : null}
              {current.proposed ? (
                <p className="wireit-why" data-tone="proposed">
                  <strong>Proposed.</strong> {current.proposed}
                </p>
              ) : null}
              <div className="wireit-actions">
                <button type="button" className="wireit-back" aria-label="Previous wire" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                  <Icon name="chevron-left" size={16} />
                </button>
                <button type="button" className="wireit-done" onClick={finish}>
                  <Icon name="check" size={15} />
                  {done.has(current.id) ? 'Next' : 'Done, next'}
                </button>
                <button type="button" className="wireit-quiet" onClick={() => setIndex(null)}>
                  Whole board
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="wireit-count">
                {node.board.name} · {made} of {wires.length} wires made
              </p>
              <p className="wireit-say">
                {made === wires.length ? `${node.title} is wired. Check it against the drawing before power goes on.` : `${wires.length} wires. Take them one at a time, or pick any from the list.`}
              </p>
              <div className="wireit-actions">
                <button type="button" className="wireit-done" onClick={start}>
                  <Icon name="play" size={14} />
                  {made === 0 ? 'Start' : made === wires.length ? 'Go through again' : 'Carry on'}
                </button>
                {made > 0 ? (
                  <button type="button" className="wireit-quiet" onClick={reset}>
                    <Icon name="reset" size={14} />
                    Clear ticks
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>

        <div className="wireit-canvas">
          <WireDrawing node={node} current={current} done={done} onPick={(wire) => setIndex(wires.indexOf(wire))} />
        </div>

        <div className="wireit-list">
          {node.groups.map((group) => (
            <section key={group.title}>
              <p className="label">{group.title}</p>
              <ul>
                {group.wires.map((wire) => (
                  <li key={wire.id} data-current={wire === current} data-done={done.has(wire.id)}>
                    <input type="checkbox" checked={done.has(wire.id)} onChange={() => toggle(wire)} aria-label={`Made: ${route(node, wire)}`} />
                    <button type="button" onClick={() => setIndex(wires.indexOf(wire))}>
                      <span className="wire-swatch" data-colour={wire.colour} aria-hidden="true" />
                      <span>{route(node, wire)}</span>
                      {wire.proposed ? <em>proposed</em> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
