import { PartGlyph } from '@/components/request/PartArt';
import { MapPlayer } from './MapPlayer';
import '../figure.css';
import './arch.css';

/**
 * The system as one picture: five boxes, four links, and the eight steps of a
 * capture played across them.
 *
 * Drawn twice — wide for a desktop column, tall for a phone — from the same
 * node and step tables, so the two can never tell different stories. Every
 * element carries `data-on`: the steps during which it is active. The player
 * (a small client component) only sets the current step; the CSS lights up
 * whatever lists that step.
 */

type Id = 'scale' | 'a' | 'b' | 'backend' | 'app' | 'wires' | 'espnow' | 'sight' | 'wifi' | 'http';

// The order is the one that works on the bench: the plate is tared EMPTY, then
// loaded. (A tare taken as part of the capture would zero the meal away.)
const STEPS: { title: string; on: Id[] }[] = [
  { title: 'Tare the empty plate.', on: ['scale', 'a', 'wires'] },
  { title: 'Put the food on. Press PHOTO.', on: ['scale', 'a'] },
  { title: 'Node A reads the cell 12 times and keeps the median.', on: ['scale', 'a', 'wires'] },
  { title: 'The grams go to Node B over ESP-NOW. No router in between.', on: ['a', 'b', 'espnow'] },
  { title: 'Node B switches its light on and takes one photo.', on: ['b', 'scale', 'sight'] },
  { title: 'Photo and grams go to the backend over Wi-Fi.', on: ['b', 'backend', 'wifi'] },
  { title: 'The backend names the dish, multiplies by the grams, stores the meal.', on: ['backend'] },
  { title: 'The app asks for today’s meals and shows them.', on: ['backend', 'app', 'http'] },
];

const stepsOf = (id: Id) =>
  STEPS.flatMap((step, index) => (step.on.includes(id) ? [index + 1] : [])).join(' ');

const NODES: Record<'scale' | 'a' | 'b' | 'backend' | 'app', { label: string; title: string; line: string; glyphs: string[] }> = {
  scale: { label: 'THE SCALE', title: 'Plate on a 3 kg cell', line: 'the mass, measured', glyphs: ['plate', 'load-cell'] },
  a: { label: 'NODE A · IN CHARGE', title: 'ESP32 DevKit', line: 'HX711 · display · 2 buttons', glyphs: ['devkit', 'oled'] },
  b: { label: 'NODE B · CAMERA', title: 'ESP32-CAM', line: 'one photo · six white LEDs', glyphs: ['esp32-cam', 'led-white'] },
  backend: { label: 'BACKEND', title: 'FastAPI on a laptop', line: 'name the dish · × grams · store', glyphs: ['laptop'] },
  app: { label: 'PHONE', title: 'The app', line: 'today’s meals · also the hotspot', glyphs: ['phone-hotspot'] },
};

const GLYPH = 70;

function Card({ id, x, y, w, h, tall = false }: { id: keyof typeof NODES; x: number; y: number; w: number; h: number; tall?: boolean }) {
  const node = NODES[id];
  // Wide cards stack text over drawings; tall cards put the drawings on the right.
  const span = node.glyphs.length * GLYPH + (node.glyphs.length - 1) * 6;
  const gx = tall ? x + w - 12 - span : x + 12;
  const gy = tall ? y + 14 : y + 50;
  return (
    <g className="map-node" data-on={stepsOf(id)}>
      <rect className="map-card" x={x} y={y} width={w} height={h} rx="12" />
      <text className="map-label" x={x + 14} y={y + (tall ? 27 : 23)}>
        {node.label}
      </text>
      <text className="t-title" x={x + 14} y={y + (tall ? 47 : 41)}>
        {node.title}
      </text>
      {node.glyphs.map((glyph, index) => (
        <PartGlyph key={glyph} id={glyph} x={gx + index * (GLYPH + 6)} y={gy} width={GLYPH} />
      ))}
      <text className="map-line" x={x + 14} y={y + h - 13}>
        {node.line}
      </text>
    </g>
  );
}

type Direction = 'right' | 'left' | 'down';

function head(x: number, y: number, direction: Direction) {
  if (direction === 'down') return `M${x - 4.5} ${y - 7}L${x} ${y}L${x + 4.5} ${y - 7}`;
  const back = direction === 'right' ? -7 : 7;
  return `M${x + back} ${y - 4.5}L${x} ${y}L${x + back} ${y + 4.5}`;
}

function Edge({
  id,
  d,
  tip,
  label,
  at,
  anchor = 'middle',
  kind = 'wire',
}: {
  id: Id;
  d: string;
  tip: [number, number, Direction];
  label: string;
  at: [number, number];
  anchor?: 'start' | 'middle' | 'end';
  kind?: 'wire' | 'radio' | 'sight';
}) {
  return (
    <g className="map-edge" data-on={stepsOf(id)} data-kind={kind}>
      <path className="map-wire" d={d} />
      <path className="map-head" d={head(...tip)} />
      <text className="map-edge-label" x={at[0]} y={at[1]} textAnchor={anchor}>
        {label}
      </text>
    </g>
  );
}

function Wide() {
  return (
    <svg className="fig map-wide" viewBox="0 0 760 440" aria-hidden="true">
      <rect className="map-group" x="12" y="14" width="436" height="414" rx="16" />
      <text className="map-label" x="432" y="36" textAnchor="end">
        ONE DEVICE, TWO BOARDS
      </text>

      <Edge id="wires" d="M200 337H260" tip={[260, 337, 'right']} label="4 wires" at={[229, 327]} />
      <Edge id="espnow" d="M346 262V119H200" tip={[200, 119, 'left']} label="ESP-NOW · grams" at={[278, 109]} kind="radio" />
      <Edge id="sight" d="M114 194V262" tip={[114, 262, 'down']} label="looks at the plate" at={[124, 232]} anchor="start" kind="sight" />
      <Edge id="wifi" d="M200 80H548" tip={[548, 80, 'right']} label="Wi-Fi · POST /meals · photo + grams" at={[374, 70]} kind="radio" />
      <Edge id="http" d="M646 194V262" tip={[646, 262, 'down']} label="GET /meals" at={[656, 232]} anchor="start" kind="radio" />

      <Card id="b" x={28} y={44} w={172} h={150} />
      <Card id="scale" x={28} y={262} w={172} h={150} />
      <Card id="a" x={260} y={262} w={172} h={150} />
      <Card id="backend" x={548} y={44} w={196} h={150} />
      <Card id="app" x={548} y={262} w={196} h={150} />
    </svg>
  );
}

function Tall() {
  const order = ['scale', 'a', 'b', 'backend', 'app'] as const;
  const links: { id: Id; label: string; kind: 'wire' | 'radio' }[] = [
    { id: 'wires', label: '4 wires', kind: 'wire' },
    { id: 'espnow', label: 'ESP-NOW · grams', kind: 'radio' },
    { id: 'wifi', label: 'Wi-Fi · POST /meals', kind: 'radio' },
    { id: 'http', label: 'GET /meals', kind: 'radio' },
  ];
  const H = 112;
  const GAP = 58;
  const top = (index: number) => 12 + index * (H + GAP);

  return (
    <svg className="fig map-tall" viewBox={`0 0 360 ${top(order.length - 1) + H + 12}`} aria-hidden="true">
      {links.map((link, index) => (
        <Edge
          key={link.id}
          id={link.id}
          d={`M180 ${top(index) + H}V${top(index + 1)}`}
          tip={[180, top(index + 1), 'down']}
          label={link.label}
          at={[192, top(index) + H + GAP / 2 + 4]}
          anchor="start"
          kind={link.kind}
        />
      ))}
      {order.map((id, index) => (
        <Card key={id} id={id} x={16} y={top(index)} w={328} h={H} tall />
      ))}
    </svg>
  );
}

export function SystemMap() {
  return (
    <MapPlayer steps={STEPS.map((step) => step.title)}>
      <Wide />
      <Tall />
      {/* The same story for a screen reader, which the drawings are hidden from. */}
      <div className="sr-only">
        <p>
          The system: a plate on a load cell, wired to Node A (an ESP32 DevKit). Node A talks to Node B
          (an ESP32-CAM above the plate) over ESP-NOW. Node B posts to a FastAPI backend over Wi-Fi.
          The phone app reads from the backend.
        </p>
        {STEPS.map((step, index) => (
          <p key={step.title}>
            Step {index + 1}: {step.title}
          </p>
        ))}
      </div>
    </MapPlayer>
  );
}
