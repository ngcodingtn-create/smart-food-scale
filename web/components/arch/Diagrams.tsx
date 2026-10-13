import { PartGlyph } from '@/components/request/PartArt';
import table from '@/lib/sim/food-table.json';
import '../figure.css';
import './arch.css';

/**
 * Three small drawings for the Architecture page. Each answers one question a
 * reader is likely to ask of the design, with a picture instead of a section.
 */

// --- 1. Who does what, in order ------------------------------------------------

const LANES = ['You', 'Node A', 'Node B', 'Backend', 'App'] as const;
const laneX = (index: number) => 40 + index * 70;

type Message =
  | { kind: 'call'; from: number; to: number; label: string; radio?: boolean }
  | { kind: 'self'; lane: number; label: string; tone: 'a' | 'b' | 's' };

// Top to bottom, in the order it happens. Lanes: 0 You, 1 Node A, 2 Node B, 3 Backend, 4 App.
const MESSAGES: Message[] = [
  { kind: 'call', from: 0, to: 1, label: 'TARE' },
  { kind: 'call', from: 0, to: 1, label: 'PHOTO' },
  { kind: 'self', lane: 1, label: '12× → median', tone: 'a' },
  { kind: 'call', from: 1, to: 2, label: 'grams', radio: true },
  { kind: 'self', lane: 2, label: 'light + photo', tone: 'b' },
  { kind: 'call', from: 2, to: 3, label: 'POST /meals', radio: true },
  { kind: 'self', lane: 3, label: 'dish × grams', tone: 's' },
  { kind: 'call', from: 3, to: 2, label: '201', radio: true },
  { kind: 'call', from: 4, to: 3, label: 'GET /meals', radio: true },
  { kind: 'call', from: 3, to: 4, label: 'the meal', radio: true },
];

const ROW = 38;
const FIRST = 70;
/** Index of the first message that needs the Wi-Fi network. */
const NEEDS_WIFI = 5;

export function Sequence() {
  const rowY = (index: number) => FIRST + index * ROW;
  const bottom = rowY(MESSAGES.length - 1) + 26;
  const wifiTop = rowY(NEEDS_WIFI) - 24;

  return (
    <svg className="fig" viewBox={`0 0 360 ${bottom + 8}`} role="img" aria-label="Sequence of one capture: you press tare then photo; Node A takes twelve readings and keeps the median; the grams go to Node B; Node B lights the plate and takes a photo; it posts both to the backend, which computes and stores the meal; the app then reads it.">
      {/* everything in the band needs the network; everything above it does not */}
      <rect className="view" x="4" y={wifiTop} width="352" height={bottom - wifiTop} rx="8" />
      <text className="t-dim t-small" x="12" y={wifiTop + 13}>
        needs Wi-Fi
      </text>

      {LANES.map((lane, index) => (
        <g key={lane}>
          <path className="life" d={`M${laneX(index)} 34V${bottom}`} />
          <rect className="lane" x={laneX(index) - 31} y="10" width="62" height="24" rx="7" />
          <text className="t-strong" x={laneX(index)} y="26" textAnchor="middle">
            {lane}
          </text>
        </g>
      ))}

      {MESSAGES.map((message, index) => {
        const y = rowY(index);
        if (message.kind === 'self') {
          const x = laneX(message.lane);
          return (
            <g key={index}>
              <rect className={`act act-${message.tone}`} x={x - 48} y={y - 13} width="96" height="24" rx="6" />
              <text className="t-strong" x={x} y={y + 3} textAnchor="middle">
                {message.label}
              </text>
            </g>
          );
        }
        const x1 = laneX(message.from);
        const x2 = laneX(message.to);
        const forward = x2 > x1;
        const tip = forward ? x2 - 2 : x2 + 2;
        const back = forward ? -7 : 7;
        return (
          <g key={index}>
            <path className={message.radio ? 'ln-thin dash' : 'ln'} d={`M${x1} ${y}H${tip}`} />
            <path className="ln" d={`M${tip + back} ${y - 4}L${tip} ${y}L${tip + back} ${y + 4}`} />
            <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle">
              {message.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// --- 2. Why two boards ----------------------------------------------------------

/** One mini chart: a level that either holds, or is knocked about at the moment of the photo. */
function Trace({ x, y, label, disturbed, shape }: { x: number; y: number; label: string; disturbed: boolean; shape: 'dip' | 'wobble' }) {
  const event = x + 92;
  const end = x + 156;
  const flat = `M${x + 34} ${y}H${end}`;
  const dip = `M${x + 34} ${y}H${event - 4}L${event + 2} ${y + 22}L${event + 10} ${y + 5}L${event + 18} ${y}H${end}`;
  const wobble = `M${x + 34} ${y}H${event - 4}L${event + 2} ${y - 13}L${event + 9} ${y + 9}L${event + 16} ${y - 6}L${event + 24} ${y + 3}L${event + 32} ${y}H${end}`;
  return (
    <g>
      <text className="t-small" x={x} y={y + 3}>
        {label}
      </text>
      <path className={disturbed ? 'bad-ln' : 'cool-ln'} d={disturbed ? (shape === 'dip' ? dip : wobble) : flat} />
    </g>
  );
}

export function TwoBoards() {
  const panels = [
    { x: 8, title: 'One board', disturbed: true, verdict: 'resets · wrong weight' },
    { x: 188, title: 'Two boards', disturbed: false, verdict: 'the scale never notices' },
  ];
  return (
    <svg className="fig" viewBox="0 0 360 214" role="img" aria-label="On one board the camera's start-up dips the supply and disturbs the weight reading. On two boards the scale's supply and reading stay flat.">
      {panels.map((panel) => (
        <g key={panel.title}>
          <rect className={panel.disturbed ? 'wash' : 'view'} x={panel.x} y="6" width="164" height="202" rx="10" />
          <text className="t-title" x={panel.x + 12} y="27">
            {panel.title}
          </text>
          <PartGlyph id="esp32-cam" x={panel.x + 12} y={36} width={panel.disturbed ? 62 : 50} />
          <PartGlyph id="hx711" x={panel.x + (panel.disturbed ? 62 : 102)} y={panel.disturbed ? 44 : 40} width={50} />
          {panel.disturbed ? null : <PartGlyph id="devkit" x={panel.x + 58} y={38} width={50} />}
          {/* the moment the camera starts up while the radio is sending */}
          <path className="ln-faint dash" d={`M${panel.x + 100} 96V172`} />
          <text className="t-small" x={panel.x + 100} y="92" textAnchor="middle">
            photo
          </text>
          <Trace x={panel.x + 8} y={118} label="3.3 V" disturbed={panel.disturbed} shape="dip" />
          <Trace x={panel.x + 8} y={156} label="grams" disturbed={panel.disturbed} shape="wobble" />
          <text className={panel.disturbed ? 't-bad' : 't-dim'} x={panel.x + 12} y="195">
            {panel.verdict}
          </text>
        </g>
      ))}
    </svg>
  );
}

// --- 3. What travels with the number ---------------------------------------------

// The same worked example as the home page: 143.2 g of lamb couscous, with the
// per-100 g figure read from the backend's own food table.
const GRAMS = 143.2;
const DISH = table.foods.find((food) => food.key === 'couscous_tunisien_agneau')!;
const KCAL = Math.round((DISH.per_100g.kcal * GRAMS) / 100);

export function DataFlow() {
  return (
    <svg className="fig" viewBox="0 0 360 236" role="img" aria-label={`The measured mass, ${GRAMS} grams, is multiplied by an estimated ${DISH.per_100g.kcal} kilocalories per hundred grams to give ${KCAL} kilocalories. Both labels, measured and estimate, reach the app with the number.`}>
      {/* two inputs, and what each one is */}
      <rect className="chip-cool" x="10" y="8" width="158" height="70" rx="11" />
      <text className="t-dim t-small" x="22" y="26">
        MEASURED · load cell
      </text>
      <text className="t-big" x="22" y="56">
        {GRAMS} g
      </text>
      <rect className="chip-hot" x="192" y="8" width="158" height="70" rx="11" />
      <text className="t-hot t-small" x="204" y="26">
        ESTIMATE · food table
      </text>
      <text className="t-big" x="204" y="56">
        {DISH.per_100g.kcal} kcal
      </text>
      <text className="t-small" x="204" y="70">
        per 100 g
      </text>

      <path className="cool-ln" d="M89 78V96Q89 106 99 106H166" />
      <path className="hot-ln" d="M271 78V96Q271 106 261 106H194" />
      <circle className="body" cx="180" cy="106" r="13" />
      <text className="t-strong" x="180" y="111" textAnchor="middle" style={{ fontSize: 15 }}>
        ×
      </text>
      <path className="ln" d="M180 119V134M175.5 128L180 134L184.5 128" />

      {/* the result carries both labels with it */}
      <rect className="chip-ink" x="76" y="136" width="208" height="58" rx="11" />
      <text className="t-big t-inv" x="92" y="172">
        {KCAL} kcal
      </text>
      <rect className="chip-cool" x="184" y="145" width="88" height="17" rx="5" />
      <text className="t-dim t-small" x="228" y="157" textAnchor="middle">
        measured mass
      </text>
      <rect className="tag-est" x="184" y="168" width="88" height="17" rx="5" />
      <text className="t-est t-small" x="228" y="180" textAnchor="middle">
        estimated values
      </text>

      <path className="ln" d="M180 194V208M175.5 202L180 208L184.5 202" />
      <text className="t-strong" x="180" y="226" textAnchor="middle">
        the app shows the number and both labels
      </text>
    </svg>
  );
}
