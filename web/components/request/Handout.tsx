import { Figure, FigureGrid } from '../Figure';
import { SideElevation } from '../rig/Drawings';
import { PartArt, PartGlyph } from './PartArt';
import { PARTS, REQUEST, buyTotal, formatTnd, lineNumber, type Part, type Source } from './bom';
import './request.css';

/**
 * The component request in the form it is handed to the lab technician: a
 * picture of what is being built, then every line with what it is for and what
 * would do instead. Everything is read from ./bom.ts, so this sheet, the notes
 * page and the totals cannot disagree.
 */

const find = (prefix: string) => {
  const part = REQUEST.find((item) => item.name.startsWith(prefix));
  if (!part) throw new Error(`No requested part starts with "${prefix}". Check components/request/bom.ts.`);
  return part;
};

// Which parts belong together. Each tile: the start of the part's name, then a short label.
const LANES: { title: string; tone: 'view' | 'glow' | 'wash'; tiles: [string, string][] }[] = [
  {
    title: 'NODE A · WEIGHS THE PLATE',
    tone: 'view',
    tiles: [
      ['Bar load cell', 'load cell'],
      ['HX711', 'amplifier'],
      ['ESP32 DevKit', 'ESP32'],
      ['SSD1306', 'display'],
      ['Tactile push button', 'buttons'],
      ['Passive buzzer', 'buzzer'],
    ],
  },
  {
    title: 'NODE B · PHOTOGRAPHS IT',
    tone: 'glow',
    tiles: [
      ['ESP32-CAM, AI-Thinker', 'camera'],
      ['ESP32-CAM-MB', 'programmer'],
      ['2N2222', 'switches'],
      ['White LED', '6 LEDs'],
      ['microSD', 'microSD'],
    ],
  },
  {
    title: 'POWER AND SMALL PARTS',
    tone: 'wash',
    tiles: [
      ['5 V / 2 A USB wall charger', 'charger'],
      ['Electrolytic capacitor, 1000', '1000 µF'],
      ['Resistors', 'resistors'],
      ['Ceramic capacitor', '100 nF'],
      ['1N4148', 'diode'],
      ['Shielded 4-core', 'cable'],
    ],
  },
];

const LANE_H = 86;
const LANE_STEP = 108;

/** Which requested parts go where. The numbers are the line numbers in the lists below. */
function PartsMap() {
  return (
    <svg className="fig" viewBox={`0 0 360 ${6 + LANE_STEP * 2 + LANE_H + 6}`} role="img" aria-label="The requested parts in three groups: Node A weighs the plate, Node B photographs it, and the power parts feed both.">
      {LANES.map((lane, row) => {
        const top = 6 + row * LANE_STEP;
        return (
          <g key={lane.title}>
            <rect className={lane.tone} x="4" y={top} width="352" height={LANE_H} rx="10" />
            <text className="t-small" x="14" y={top + 14}>
              {lane.title}
            </text>
            {lane.tiles.map(([prefix, label], column) => {
              const part = find(prefix);
              const x = 12 + column * 57;
              return (
                <g key={prefix}>
                  <PartGlyph id={part.art} x={x + 1} y={top + 20} width={50} />
                  <circle className="num" cx={x + 7} cy={top + 25} r="7.5" />
                  <text className="num-t" x={x + 7} y={top + 28.2}>
                    {lineNumber(part)}
                  </text>
                  <text className="t-strong t-small" x={x + 26} y={top + 74} textAnchor="middle">
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Node A tells Node B the weight, board to board */}
      <path className="hot-ln dash" d={`M152 ${6 + LANE_H}V${6 + LANE_H + 11}H38V${6 + LANE_STEP}`} />
      <path className="hot-ln" d={`M33.5 ${6 + LANE_STEP - 7}L38 ${6 + LANE_STEP}L42.5 ${6 + LANE_STEP - 7}`} />
      <text className="t-hot t-small" x="160" y={6 + LANE_H + 14}>
        ESP-NOW · the grams
      </text>
      <text className="t-small" x="180" y={6 + LANE_STEP + LANE_H + 14} textAnchor="middle">
        5 V to both boards
      </text>
    </svg>
  );
}

/** The two drawings at the top of the sheet: the device, and how its parts group. */
export function RequestExplainer() {
  return (
    <FigureGrid>
      <Figure title="What we are building" caption="A plate on a load cell, and a camera looking straight down at it. The scale weighs the meal; the photo says what it is.">
        <SideElevation badges={false} />
      </Figure>
      <Figure title="Where each part goes" caption="Two small boards and their parts. The numbers are the line numbers in the lists below.">
        <PartsMap />
      </Figure>
    </FigureGrid>
  );
}

/** The request at a glance. */
export function RequestCounts() {
  const count = (source: Source) => PARTS.filter((part) => part.source === source).length;
  return (
    <p className="sheet-counts">
      <span>
        <strong>{count('lab')}</strong> lines to borrow
      </span>
      <span>
        <strong>{count('bench')}</strong> to book
      </span>
      <span>
        <strong>{count('buy')}</strong> we buy ourselves, {formatTnd(buyTotal())}
      </span>
    </p>
  );
}

function quantity(part: Part) {
  return part.unit ?? `× ${part.qty}`;
}

/** One section of the sheet: every line, what it is for, and what would do instead. */
export function RequestSheet({ source }: { source: Exclude<Source, 'alt'> }) {
  const rows = REQUEST.filter((part) => part.source === source);
  return (
    <div className="sheet" role="table" aria-label="Requested parts">
      <div className="sheet-row sheet-head" role="row">
        <span role="columnheader">#</span>
        <span role="columnheader" />
        <span role="columnheader">Part</span>
        <span role="columnheader">What it is for</span>
        <span role="columnheader">If you don’t have it</span>
        <span role="columnheader">OK</span>
      </div>
      {rows.map((part) => (
        <div className="sheet-row" role="row" key={part.name}>
          <span className="sheet-n" role="cell">
            {lineNumber(part)}
          </span>
          <span className="sheet-art" role="cell" aria-hidden="true">
            <PartArt id={part.art} title="" />
          </span>
          <span className="sheet-part" role="cell">
            <strong>{part.name}</strong>
            <em>{quantity(part)}</em>
            {part.price ? (
              <small>
                {formatTnd(part.qty * part.price.tnd)} · {part.price.shop}
              </small>
            ) : null}
          </span>
          <span className="sheet-for" role="cell">
            {part.role}
          </span>
          <span className="sheet-swap" role="cell">
            {part.swap ?? '—'}
          </span>
          <span className="sheet-tick" role="cell" aria-label="Tick when handed over" />
        </div>
      ))}
    </div>
  );
}

/** For the printed copy: who asked, who agreed, when. */
export function RequestSignOff() {
  return (
    <div className="sheet-sign">
      <span>Team</span>
      <span>Lab technician</span>
      <span>Date</span>
    </div>
  );
}
