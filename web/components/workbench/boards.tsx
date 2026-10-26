import type { ReactNode } from 'react';
import { NODES, wiresOf, type NodeId } from './wiring';

/**
 * Where everything sits in the two wiring drawings.
 *
 * wiring.ts says what connects to what; this file only says where to draw it.
 * Each wire id gets a path here, and the check at the bottom fails the build
 * if a wire is added to one file and not the other.
 *
 * The boards are drawn with their pins in the order they have on the real
 * part, so a pin can be found by counting. Units are SVG user units on a
 * 404-wide canvas, shown at about that many pixels.
 */

export type Point = [number, number];
export type WireArt = { d: string; ends: [Point, Point]; chip?: Point };
export type NodeArt = { viewBox: string; wires: Record<string, WireArt>; parts: ReactNode };

/** A straight run. */
const line = (from: Point, to: Point, chip?: Point): WireArt => ({
  d: `M${from}L${to}`,
  ends: [from, to],
  chip,
});

/** A jumper: leaves `from` towards `c1`, arrives at `to` from `c2`. */
const bend = (from: Point, c1: Point, c2: Point, to: Point, chip?: Point): WireArt => ({
  d: `M${from}C${c1} ${c2} ${to}`,
  ends: [from, to],
  chip,
});

/** A box for a module or a loose component. */
function Card({ x, y, w, h, title, titleAt = 14, children }: { x: number; y: number; w: number; h: number; title: string; titleAt?: number; children?: ReactNode }) {
  return (
    <g>
      <rect className="body" x={x} y={y} width={w} height={h} rx="6" />
      <text className="t-strong" x={x + w - 8} y={y + titleAt} textAnchor="end">
        {title}
      </text>
      {children}
    </g>
  );
}

/** A pad with the name printed beside it on the real part. */
function Pad({ at, name, side = 'right' }: { at: Point; name: string; side?: 'right' | 'left' | 'above' | 'below' }) {
  const [x, y] = at;
  const text = {
    right: { x: x + 7, y: y + 3, anchor: 'start' },
    left: { x: x - 7, y: y + 3, anchor: 'end' },
    above: { x, y: y - 7, anchor: 'middle' },
    below: { x, y: y + 13, anchor: 'middle' },
  }[side];
  return (
    <>
      <circle className="pad" cx={x} cy={y} r="3" />
      <text className="t-small" x={text.x} y={text.y} textAnchor={text.anchor as 'start' | 'end' | 'middle'}>
        {name}
      </text>
    </>
  );
}

/** A power rail: one long strip everything on it shares. */
function Rail({ x, from, to, tone, name, at }: { x: number; from: number; to: number; tone: 'hot' | 'ground' | 'warm'; name: string; at: Point }) {
  return (
    <>
      <path className={`rail rail-${tone}`} d={`M${x} ${from}V${to}`} />
      <text className="t-small t-strong" x={at[0]} y={at[1]} textAnchor="middle">
        {name}
      </text>
    </>
  );
}

/** A two-row board: outline, and every pin with its printed name. */
function Header({ x, w, pitch, first, left, right, used }: { x: number; w: number; pitch: number; first: number; left: string[]; right: string[]; used: Set<string> }) {
  const row = (names: string[], side: 'left' | 'right') =>
    names.map((name, index) => {
      const y = first + index * pitch;
      const px = side === 'left' ? x : x + w;
      // "GND" appears on both rows; only the one a wire lands on is marked used.
      // A name printed twice on one side (3V, G) is marked at its first place, where wires land.
      const live = used.has(`${side}:${name}`) && names.indexOf(name) === index;
      return (
        <g key={`${side}-${index}`} className={live ? 'pin pin-used' : 'pin'}>
          <circle className="pad" cx={px} cy={y} r="3" />
          <text className="t-small" x={side === 'left' ? px + 7 : px - 7} y={y + 3} textAnchor={side === 'left' ? 'start' : 'end'}>
            {name}
          </text>
        </g>
      );
    });
  return (
    <>
      {row(left, 'left')}
      {row(right, 'right')}
    </>
  );
}

// --- Node A: NodeMCU, ESP8266 -------------------------------------------------

const A = NODES[0];
const A_PITCH = 26;
const A_FIRST = 150;
const A_X = 36;
const A_W = 96;
const aLeft = (name: string): Point => [A_X, A_FIRST + A.board.left.indexOf(name) * A_PITCH];
const aRight = (name: string): Point => [A_X + A_W, A_FIRST + A.board.right.indexOf(name) * A_PITCH];

const A_V5 = 14;
const A_V33 = 162;
const A_GND = 180;
const A_MOD = 252; // left edge of the module column

const A_WIRES: Record<string, WireArt> = {
  // rails
  'a-3v3': line(aRight('3V'), [A_V33, aRight('3V')[1]]),
  'a-gnd': line(aRight('G'), [A_GND, aRight('G')[1]]),
  'a-5v': line(aLeft('VU'), [A_V5, aLeft('VU')[1]]),
  'a-decouple': line([A_V33, 544], [A_GND, 544], [210, 544]),
  // HX711
  'a-hx-vcc': line([A_MOD, 426], [A_V33, 426]),
  'a-hx-gnd': line([A_MOD, 360], [A_GND, 360]),
  'a-hx-dt': bend([A_MOD, 382], [212, 382], [196, 358], aRight('D6')),
  'a-hx-sck': bend([A_MOD, 404], [212, 404], [196, 384], aRight('D7')),
  'a-hx-caps': bend([A_MOD, 426], [290, 426], [290, 360], [A_MOD, 360], [336, 393]),
  // load cell
  'a-cell-red': line([274, 486], [274, 446]),
  'a-cell-black': line([308, 486], [308, 446]),
  'a-cell-white': line([342, 486], [342, 446]),
  'a-cell-green': line([376, 486], [376, 446]),
  // display
  // Our module's order, from its photo: VCC, GND, SCL, SDA.
  'a-oled-vcc': line([A_MOD, 142], [A_V33, 142]),
  'a-oled-gnd': line([A_MOD, 164], [A_GND, 164]),
  'a-oled-scl': bend([A_MOD, 186], [212, 186], [196, 176], aRight('D1')),
  'a-oled-sda': bend([A_MOD, 208], [212, 208], [196, 202], aRight('D2')),
  // buttons
  'a-tare': bend([A_MOD, 298], [212, 298], [196, 332], aRight('D5')),
  'a-tare-gnd': line([A_MOD, 318], [A_GND, 318]),
  // buzzer
  // D8 is near the USB end and the transistor at the top: up the gap beside the board.
  'a-buz-base': { d: `M${aRight('D8')}H146V112H245V98`, ends: [aRight('D8'), [245, 98]], chip: [214, 112] },
  'a-buz-emitter': line([214, 82], [A_GND, 82]),
  'a-buz-collector': bend([130, 69], [170, 69], [174, 56], [214, 56]),
  'a-buz-supply': line([52, 69], [A_V5, 69]),
  'a-buz-diode': {
    d: 'M130 69C150 69 150 24 120 24H62C32 24 32 69 52 69',
    ends: [
      [130, 69],
      [52, 69],
    ],
    chip: [91, 24],
  },
  // away from the bench
  'a-supply': line([44, 566], [A_V5, 566]),
  'a-supply-gnd': line([128, 566], [A_GND, 566]),
};

const A_USED = new Set(['right:3V', 'right:G', 'left:VU', 'right:D1', 'right:D2', 'right:D5', 'right:D6', 'right:D7', 'right:D8']);

function NodeAParts() {
  return (
    <>
      <Rail x={A_V5} from={12} to={572} tone="warm" name="5 V" at={[A_V5 + 2, 586]} />
      <Rail x={A_V33} from={128} to={556} tone="hot" name="3V3" at={[A_V33 - 4, 122]} />
      <Rail x={A_GND} from={12} to={572} tone="ground" name="GND" at={[A_GND + 16, 22]} />

      {/* the NodeMCU, antenna end up, USB end down */}
      <rect className="pcb" x={A_X} y="130" width={A_W} height="404" rx="6" />
      <rect className="metal" x={A_X + 28} y="138" width="40" height="52" rx="2" />
      <rect className="metal" x={A_X + 34} y="522" width="28" height="16" rx="2" />
      <text className="t-small" x={A_X + 48} y="206" textAnchor="middle">
        ESP8266
      </text>
      <text className="t-small" x={A_X + 48} y="516" textAnchor="middle">
        USB
      </text>
      <Header x={A_X} w={A_W} pitch={A_PITCH} first={A_FIRST} left={A.board.left} right={A.board.right} used={A_USED} />

      <Card x={52} y={40} w={78} h={58} title="BUZZER">
        <circle className="ln-thin" cx="91" cy="74" r="13" />
        <circle className="chip" cx="91" cy="74" r="2.5" />
        <Pad at={[52, 69]} name="S" side="right" />
        <Pad at={[130, 69]} name="−" side="left" />
      </Card>
      <Card x={214} y={40} w={62} h={58} title="2N2222">
        <Pad at={[214, 56]} name="C" />
        <Pad at={[214, 82]} name="E" />
        <Pad at={[245, 98]} name="B" side="above" />
      </Card>

      <Card x={A_MOD} y={124} w={144} h={98} title="OLED">
        <rect className="chip" x="318" y="146" width="66" height="40" rx="3" />
        <text className="t-inv" x="351" y="171" textAnchor="middle">
          143 g
        </text>
        <Pad at={[A_MOD, 142]} name="VCC" />
        <Pad at={[A_MOD, 164]} name="GND" />
        <Pad at={[A_MOD, 186]} name="SCL" />
        <Pad at={[A_MOD, 208]} name="SDA" />
      </Card>

      <Card x={A_MOD} y={234} w={144} h={42} title="2ND BUTTON">
        <circle className="ln-thin" cx="372" cy="262" r="7" />
        <Pad at={[A_MOD, 246]} name="one leg" />
        <Pad at={[A_MOD, 266]} name="opposite leg" />
      </Card>
      <Card x={A_MOD} y={286} w={144} h={42} title="BUTTON">
        <circle className="ln-thin" cx="372" cy="314" r="7" />
        <Pad at={[A_MOD, 298]} name="one leg" />
        <Pad at={[A_MOD, 318]} name="opposite leg" />
      </Card>

      <Card x={A_MOD} y={342} w={144} h={104} title="HX711">
        <Pad at={[A_MOD, 360]} name="GND" />
        <Pad at={[A_MOD, 382]} name="DT" />
        <Pad at={[A_MOD, 404]} name="SCK" />
        <Pad at={[A_MOD, 426]} name="VCC" />
        <Pad at={[274, 446]} name="E+" side="above" />
        <Pad at={[308, 446]} name="E−" side="above" />
        <Pad at={[342, 446]} name="A−" side="above" />
        <Pad at={[376, 446]} name="A+" side="above" />
      </Card>
      <rect className="metal" x={A_MOD} y="486" width="144" height="34" rx="4" />
      <text className="t-strong" x="388" y="538" textAnchor="end">
        LOAD CELL
      </text>
      <Pad at={[274, 486]} name="red" side="below" />
      <Pad at={[308, 486]} name="black" side="below" />
      <Pad at={[342, 486]} name="white" side="below" />
      <Pad at={[376, 486]} name="green" side="below" />

      <rect className="body" x="44" y="552" width="84" height="28" rx="6" />
      <text className="t-small t-strong" x="86" y="570" textAnchor="middle">
        5 V SUPPLY
      </text>
      <circle className="pad" cx="44" cy="566" r="3" />
      <circle className="pad" cx="128" cy="566" r="3" />
    </>
  );
}

// --- Node B: ESP32-CAM ---------------------------------------------------------

const B = NODES[1];
const B_PITCH = 28;
const B_FIRST = 66;
const B_X = 150;
const B_W = 100;
const bLeft = (name: string): Point => [B_X, B_FIRST + B.board.left.indexOf(name) * B_PITCH];

const B_V5 = 16;
const B_GND = 36;

const B_WIRES: Record<string, WireArt> = {
  'b-5v': line([B_V5, bLeft('5V')[1]], bLeft('5V')),
  'b-gnd': line([B_GND, bLeft('GND')[1]], bLeft('GND')),
  'b-bulk': line([118, 66], [118, 94], [92, 80]),
  'b-split': line([B_V5, 396], [B_GND, 396], [68, 396]),
  'b-light-base': bend(bLeft('IO13'), [120, 150], [101, 160], [101, 196], [112, 163]),
  'b-light-pulldown': bend([101, 196], [101, 172], [70, 182], [B_GND, 182], [66, 180]),
  'b-light-emitter': line([70, 238], [B_GND, 238]),
  'b-light-leds': line([B_V5, 338], [170, 338], [76, 338]),
  'b-light-collector': bend([170, 384], [130, 384], [101, 330], [101, 254]),
  'b-light-cap': line([B_V5, 362], [B_GND, 362], [64, 362]),
};

const B_USED = new Set(['left:5V', 'left:GND', 'left:IO13']);

function NodeBParts() {
  return (
    <>
      <Rail x={B_V5} from={30} to={412} tone="warm" name="5 V" at={[B_V5, 22]} />
      <Rail x={B_GND} from={30} to={412} tone="ground" name="GND" at={[B_GND + 12, 22]} />
      <rect className="body" x="6" y="412" width="76" height="28" rx="6" />
      <text className="t-small t-strong" x="44" y="430" textAnchor="middle">
        5 V · 2 A
      </text>

      {/* the ESP32-CAM, seen from the camera side */}
      <rect className="pcb" x={B_X} y="40" width={B_W} height="250" rx="6" />
      <rect className="metal" x={B_X + 30} y="50" width="40" height="44" rx="3" />
      <circle className="chip" cx={B_X + 50} cy="72" r="11" />
      <circle className="body" cx={B_X + 50} cy="72" r="5" />
      <rect className="metal" x={B_X + 28} y="206" width="44" height="52" rx="2" />
      <text className="t-small" x={B_X + 50} y="112" textAnchor="middle">
        lens
      </text>
      <text className="t-small" x={B_X + 50} y="272" textAnchor="middle">
        microSD
      </text>
      <Header x={B_X} w={B_W} pitch={B_PITCH} first={B_FIRST} left={B.board.left} right={B.board.right} used={B_USED} />

      <Card x={70} y={196} w={62} h={58} title="2N2222" titleAt={33}>
        <Pad at={[101, 196]} name="B" side="below" />
        <Pad at={[70, 238]} name="E" />
        <Pad at={[101, 254]} name="C" side="above" />
      </Card>

      <Card x={170} y={318} w={226} h={86} title="6 WHITE LEDS">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <g key={index} transform={`translate(${244 + index * 26} 362)`}>
            <path className="glow" d="M-8 6a8 8 0 0 1 16 0v8h-16z" />
            <path className="ln-thin" d="M-8 6a8 8 0 0 1 16 0v8h-16zM-4 14v12M4 14v8" />
          </g>
        ))}
        <Pad at={[170, 338]} name="long legs" />
        <Pad at={[170, 384]} name="short legs" />
      </Card>
    </>
  );
}

export const ART: Record<NodeId, NodeArt> = {
  a: { viewBox: '0 0 404 592', wires: A_WIRES, parts: <NodeAParts /> },
  b: { viewBox: '0 0 404 448', wires: B_WIRES, parts: <NodeBParts /> },
};

// A wire in wiring.ts with no path here would simply not be drawn. Fail loudly instead.
for (const node of NODES) {
  for (const wire of wiresOf(node)) {
    if (!ART[node.id].wires[wire.id]) {
      throw new Error(`Wire "${wire.id}" is in wiring.ts but has no path in boards.tsx.`);
    }
  }
}
