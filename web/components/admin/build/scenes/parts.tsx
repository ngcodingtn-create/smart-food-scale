/**
 * The owner's parts, drawn in 2.5D for the step scenes. Sizes are chosen to
 * read well together, not measured: the photos on each step are the truth.
 */
import type { ReactNode } from 'react';
import { C, Cyl, MAT, OnFront, OnTop, P, S, Slab, type V, lerp } from './iso';

const MONO = 'var(--font-mono, ui-monospace, monospace)';

export function Desk() {
  return <Slab x={0} y={0} z={-10} w={300} d={200} h={10} m={MAT.desk} />;
}

/** The laptop at the back left. `screen` draws in screen units 100 × 66. */
export function Laptop({ x = 10, y = 10, screen }: { x?: number; y?: number; screen?: ReactNode }) {
  return (
    <g>
      <Slab x={x} y={y} w={110} d={70} h={5} m={MAT.laptop} />
      <OnTop x={x + 12} y={y + 18} z={5}>
        {Array.from({ length: 4 }, (_, row) => (
          <rect key={row} x={0} y={row * 8} width={86} height={6} rx={1} fill="#2b2f34" />
        ))}
        <rect x={30} y={36} width={26} height={14} rx={2} fill="#2b2f34" />
      </OnTop>
      <Slab x={x} y={y} z={5} w={110} d={4} h={78} m={MAT.laptop} />
      <OnFront x={x} y={y + 4} z={83}>
        <rect x={5} y={5} width={100} height={66} rx={2} fill="#0d1117" />
        <g transform="translate(5 5)">{screen}</g>
      </OnFront>
    </g>
  );
}

/** Lines of text on a screen, typed out up to `shown` characters overall. */
export function Lines({ lines, shown = Infinity, size = 6, colour = '#9fe3b0', x = 4, y = 9, gap = 8.5 }: { lines: string[]; shown?: number; size?: number; colour?: string; x?: number; y?: number; gap?: number }) {
  let left = shown;
  return (
    <g fontFamily={MONO} fontSize={size} fill={colour}>
      {lines.map((line, i) => {
        const text = line.slice(0, Math.max(0, left));
        left -= line.length;
        return text ? (
          <text key={i} x={x} y={y + i * gap}>
            {text}
          </text>
        ) : null;
      })}
    </g>
  );
}

/** The NodeMCU, long side along y, USB at its back end (small y). */
export function NodeMCU({ x, y, z = 0, led = false }: { x: number; y: number; z?: number; led?: boolean }) {
  return (
    <g>
      <Slab x={x + 9} y={y - 4} z={z + 1} w={8} d={6} h={3} m={MAT.silver} />
      <Slab x={x} y={y} z={z} w={26} d={50} h={2} m={MAT.board} />
      <OnTop x={x} y={y} z={z + 2}>
        {Array.from({ length: 15 }, (_, i) => (
          <g key={i}>
            <circle cx={2.5} cy={4 + i * 3.1} r={0.9} fill="#d9b44a" />
            <circle cx={23.5} cy={4 + i * 3.1} r={0.9} fill="#d9b44a" />
          </g>
        ))}
        <rect x={6} y={22} width={14} height={22} rx={1} fill="#c9ced2" />
        <rect x={7.5} y={23.5} width={11} height={13} fill="#b5bbc0" />
        <rect x={9} y={8} width={8} height={6} fill="#111" />
        <rect x={4.5} y={3} width={3} height={2} fill="#999" />
        <rect x={18.5} y={3} width={3} height={2} fill="#999" />
        <circle cx={13} cy={17} r={1.2} fill={led ? '#5ab4ff' : '#24425e'} />
      </OnTop>
    </g>
  );
}

/** The ESP32-CAM, optionally seated on its MB base. The lens looks up. */
export function Camera({ x, y, z = 0, base = true, flash = 0 }: { x: number; y: number; z?: number; base?: boolean; flash?: number }) {
  const top = z + (base ? 10 : 0);
  return (
    <g>
      {base ? (
        <>
          <Slab x={x + 9} y={y + 38} z={z + 2} w={9} d={5} h={3} m={MAT.silver} />
          <Slab x={x} y={y} z={z} w={27} d={40} h={10} m={MAT.black} />
        </>
      ) : null}
      <Slab x={x} y={y} z={top} w={27} d={40} h={2} m={MAT.board} />
      <OnTop x={x} y={y} z={top + 2}>
        <rect x={5} y={24} width={17} height={12} fill="#c9ced2" />
        <rect x={20} y={4} width={4} height={4} fill="#fff6d8" />
      </OnTop>
      <Cyl x={x + 13.5} y={y + 12} z={top + 2} r={5} h={5} m={MAT.black} />
      <Cyl x={x + 13.5} y={y + 12} z={top + 7} r={3} h={0.5} m={{ top: '#20304a', left: '#111', right: '#111' }} />
      {flash > 0 ? <circle cx={P(x + 13.5, y + 12, top + 9)[0]} cy={P(x + 13.5, y + 12, top + 9)[1]} r={14 + flash * 30} fill="#fffbe6" opacity={0.85 * (1 - flash)} /> : null}
    </g>
  );
}

/** The breadboard, long side along x. */
export function Breadboard({ x = 150, y = 112, w = 140 }: { x?: number; y?: number; w?: number }) {
  return (
    <g>
      <Slab x={x} y={y} w={w} d={50} h={7} m={MAT.white} />
      <OnTop x={x} y={y} z={7}>
        <line x1={4} y1={3} x2={w - 4} y2={3} stroke="#d0453c" strokeWidth={0.8} />
        <line x1={4} y1={8} x2={w - 4} y2={8} stroke="#3b6fd0" strokeWidth={0.8} />
        <line x1={4} y1={42} x2={w - 4} y2={42} stroke="#d0453c" strokeWidth={0.8} />
        <line x1={4} y1={47} x2={w - 4} y2={47} stroke="#3b6fd0" strokeWidth={0.8} />
        <rect x={2} y={23.5} width={w - 4} height={3} fill="#cfcbbf" />
        {Array.from({ length: Math.floor((w - 8) / 4) }, (_, i) => (
          <g key={i} fill="#9a968b">
            {[13, 16, 19, 22, 28, 31, 34, 37].map((row) => (
              <rect key={row} x={4 + i * 4} y={row - 0.6} width={1.2} height={1.2} />
            ))}
          </g>
        ))}
      </OnTop>
    </g>
  );
}

/** The display, standing up and facing the viewer, its lines drawn on it. */
export function Display({ x, y, z = 0, lines, big }: { x: number; y: number; z?: number; lines: [string, string, string]; big?: boolean }) {
  return (
    <g>
      <Slab x={x} y={y} z={z} w={34} d={3} h={30} m={MAT.blue} />
      <OnFront x={x} y={y + 3} z={z + 30}>
        <rect x={2} y={3} width={30} height={20} fill="#05070a" />
        <g fontFamily={MONO} fill="#9fd8ff">
          <text x={3.5} y={8} fontSize={3.2}>
            {lines[0]}
          </text>
          <text x={3.5} y={16} fontSize={big === false ? 3.2 : 6.2}>
            {lines[1]}
          </text>
          <text x={3.5} y={21.5} fontSize={3.2}>
            {lines[2]}
          </text>
        </g>
        {['VCC', 'GND', 'SCL', 'SDA'].map((pin, i) => (
          <text key={pin} x={4 + i * 7.5} y={27.5} fontSize={2.2} fill="#cfe0ff" fontFamily={MONO}>
            {pin}
          </text>
        ))}
      </OnFront>
    </g>
  );
}

/** The 12 mm button. `press` from 0 (up) to 1 (down). */
export function Button({ x, y, z = 7, press = 0 }: { x: number; y: number; z?: number; press?: number }) {
  return (
    <g>
      <Slab x={x} y={y} z={z} w={12} d={12} h={4} m={MAT.black} />
      <Cyl x={x + 6} y={y + 6} z={z + 4} r={3.5} h={lerp(3, 0.8, press)} m={{ top: '#5a5e63', left: '#3c3f43', right: '#333' }} />
    </g>
  );
}

export function Buzzer({ x, y, z = 7 }: { x: number; y: number; z?: number }) {
  return (
    <g>
      <Slab x={x - 8} y={y - 8} z={z} w={16} d={16} h={2} m={MAT.green} />
      <Cyl x={x} y={y} z={z + 2} r={6.5} h={8} m={MAT.black} />
      <Cyl x={x} y={y} z={z + 10} r={1.2} h={0.3} m={{ top: '#000', left: '#000', right: '#000' }} />
    </g>
  );
}

export function Transistor({ x, y, z = 7 }: { x: number; y: number; z?: number }) {
  const [a, b] = P(x, y, z);
  return (
    <g>
      {[-1.8, 0, 1.8].map((dx) => (
        <line key={dx} x1={a + dx} y1={b} x2={a + dx} y2={b - 5} stroke="#bbb" strokeWidth={0.6} />
      ))}
      <Cyl x={x} y={y} z={z + 5} r={2.4} h={5} m={MAT.black} />
    </g>
  );
}

export function Led({ x, y, z = 7, lit = 0 }: { x: number; y: number; z?: number; lit?: number }) {
  const [a, b] = P(x, y, z + 8);
  return (
    <g>
      {lit > 0 ? <circle cx={a} cy={b} r={6 + lit * 6} fill="#fff4c2" opacity={0.55 * lit} /> : null}
      <Cyl x={x} y={y} z={z} r={2.2} h={7} m={lit > 0.3 ? { top: '#fffbe8', left: '#fff2b8', right: '#f3e3a0' } : { top: '#eef1f3', left: '#cfd5d9', right: '#bdc4c9' }} />
    </g>
  );
}

/** A resistor lying flat, along x. */
export function Resistor({ x, y, z = 7 }: { x: number; y: number; z?: number }) {
  return (
    <g>
      <line x1={P(x - 5, y, z + 1)[0]} y1={P(x - 5, y, z + 1)[1]} x2={P(x + 15, y, z + 1)[0]} y2={P(x + 15, y, z + 1)[1]} stroke="#aaa" strokeWidth={0.6} />
      <Slab x={x} y={y - 1.5} z={z} w={10} d={3} h={3} m={{ top: '#d9c08f', left: '#bfa676', right: '#a99264' }} />
    </g>
  );
}

export function LoadCell({ x, y, z = 0, bend = 0 }: { x: number; y: number; z?: number; bend?: number }) {
  return (
    <g>
      <Slab x={x} y={y} z={z} w={13} d={80} h={13} m={MAT.alu} />
      <OnTop x={x} y={y} z={z + 13}>
        <circle cx={6.5} cy={8} r={2} fill="#7b8287" />
        <circle cx={6.5} cy={18} r={2} fill="#7b8287" />
        <circle cx={6.5} cy={62} r={2} fill="#7b8287" />
        <circle cx={6.5} cy={72} r={2} fill="#7b8287" />
        <rect x={3} y={34} width={7} height={12} rx={1} fill="#e7e2c6" />
      </OnTop>
      {bend > 0 ? (
        <path d={`M${P(x + 6, y + 82, z + 6)[0]},${P(x + 6, y + 82, z + 6)[1]} l0 ${(8 * bend).toFixed(1)}`} stroke="var(--accent, #e08a4f)" strokeWidth={1.4} markerEnd="url(#sc-arrow)" />
      ) : null}
    </g>
  );
}

export function HX711({ x, y, z = 7 }: { x: number; y: number; z?: number }) {
  return (
    <g>
      <Slab x={x} y={y} z={z} w={20} d={32} h={2} m={MAT.green} />
      <OnTop x={x} y={y} z={z + 2}>
        <rect x={6} y={11} width={8} height={10} fill="#111" />
        {Array.from({ length: 4 }, (_, i) => (
          <circle key={i} cx={4 + i * 4} cy={3} r={0.9} fill="#d9b44a" />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <circle key={i} cx={4 + i * 4} cy={29} r={0.9} fill="#d9b44a" />
        ))}
      </OnTop>
    </g>
  );
}

export function Plate({ x, y, z, food = 0 }: { x: number; y: number; z: number; food?: number }) {
  return (
    <g>
      <Cyl x={x} y={y} z={z} r={24} h={3} m={MAT.white} />
      <Cyl x={x} y={y} z={z + 3} r={19} h={0.4} m={{ top: '#e9e6dc', left: '#ddd', right: '#ddd' }} />
      {food > 0 ? (
        <g opacity={Math.min(1, food * 2)}>
          <Cyl x={x} y={y} z={z + 3} r={13 * Math.min(1, food * 1.2)} h={5 * food} m={MAT.food} />
          <circle cx={P(x - 3, y, z + 9 * food)[0]} cy={P(x - 3, y, z + 9 * food)[1]} r={2} fill="#7da34a" />
          <circle cx={P(x + 4, y + 3, z + 9 * food)[0]} cy={P(x + 4, y + 3, z + 9 * food)[1]} r={1.6} fill="#c43c2c" />
        </g>
      ) : null}
    </g>
  );
}

/** The scale on its rig: base, cell inside, top plate, the arm with the camera above. */
export function Rig({ x = 150, y = 70, plateZ = 0, arm = true, flash = 0 }: { x?: number; y?: number; plateZ?: number; arm?: boolean; flash?: number }) {
  return (
    <g>
      <Slab x={x} y={y} w={110} d={90} h={10} m={MAT.wood} />
      {arm ? <Slab x={x + 96} y={y + 4} z={10} w={8} d={8} h={120} m={MAT.wood} /> : null}
      <Slab x={x + 15} y={y + 10} z={10 + plateZ} w={70} d={70} h={4} m={MAT.wood} />
      {arm ? (
        <>
          <Slab x={x + 40} y={y + 4} z={130} w={64} d={8} h={6} m={MAT.wood} />
          <Camera x={x + 38} y={y - 12} z={118} base={false} flash={flash} />
        </>
      ) : null}
    </g>
  );
}

export function Charger({ x, y, z = 0 }: { x: number; y: number; z?: number }) {
  return (
    <g>
      <Slab x={x} y={y} z={z} w={22} d={20} h={24} m={MAT.white} />
      <Slab x={x + 7} y={y - 6} z={z + 8} w={2} d={6} h={6} m={MAT.silver} />
      <Slab x={x + 13} y={y - 6} z={z + 8} w={2} d={6} h={6} m={MAT.silver} />
    </g>
  );
}

export function SDCard({ x, y, z }: { x: number; y: number; z: number }) {
  return <Slab x={x} y={y} z={z} w={11} d={15} h={1} m={{ top: '#3a3d42', left: '#222', right: '#1a1a1a' }} />;
}

/** A wire or cable in screen space, drawn up to `p` (0 to 1), sagging between its ends. */
export function Wire({ a, b, p = 1, colour, width = 1.6, sag = 18 }: { a: V; b: V; p?: number; colour: string; width?: number; sag?: number }) {
  if (p <= 0) return null;
  const mid: V = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + sag];
  return (
    <path
      d={`M${a[0].toFixed(1)},${a[1].toFixed(1)} Q${mid[0].toFixed(1)},${mid[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`}
      fill="none"
      stroke={colour}
      strokeWidth={width}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
    />
  );
}

/** Radio waves leaving a point, `phase` in seconds. */
export function Waves({ at, t, colour = 'var(--accent, #e08a4f)', size = 26, on = true }: { at: V; t: number; colour?: string; size?: number; on?: boolean }) {
  if (!on) return null;
  return (
    <g fill="none" stroke={colour} strokeWidth={1.3}>
      {[0, 1, 2].map((i) => {
        const p = (t * 0.8 + i / 3) % 1;
        return <circle key={i} cx={at[0]} cy={at[1]} r={4 + p * size} opacity={1 - p} />;
      })}
    </g>
  );
}

/** A finger coming down onto a screen point. `down` from 0 (up) to 1 (touching). */
export function Finger({ at, down, show = 1 }: { at: V; down: number; show?: number }) {
  if (show <= 0) return null;
  const lift = (1 - down) * 18;
  return (
    <g transform={`translate(${at[0].toFixed(1)} ${(at[1] - lift).toFixed(1)})`} opacity={show}>
      <path d="M-5,-2 C-5,-8 5,-8 5,-2 L6,34 L-6,34 Z" fill="#e9b892" stroke="#b9845e" strokeWidth={0.6} />
      <path d="M-3,-3.5 C-3,-6.5 3,-6.5 3,-3.5 L3,1 L-3,1 Z" fill="#f6dccb" />
    </g>
  );
}

/** A label in screen space with a short leader, upright whatever the faces do. */
export function Label({ at, text, dx = 0, dy = -16, tone = 'ink', size = 7.5, anchor = 'middle' }: { at: V; text: string; dx?: number; dy?: number; tone?: 'ink' | 'accent' | 'tip'; size?: number; anchor?: 'start' | 'middle' | 'end' }) {
  const colour = tone === 'accent' ? 'var(--accent-ink, #b4602c)' : tone === 'tip' ? 'var(--tip-ink, #2f7a52)' : 'var(--ink, #222)';
  const end: V = [at[0] + dx, at[1] + dy];
  return (
    <g>
      <line x1={at[0]} y1={at[1]} x2={end[0]} y2={end[1] + (dy > 0 ? -size : size * 0.3)} stroke={colour} strokeWidth={size * 0.08} opacity={0.7} />
      <text x={end[0]} y={end[1]} textAnchor={anchor} fontSize={size} fill={colour} paintOrder="stroke" stroke="var(--paper, #fff)" strokeWidth={size * 0.32} strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
}

/** A chip of text in screen space, like a message or a status. */
export function Tag({ at, text, tone = 'ink', size = 7 }: { at: V; text: string; tone?: 'ink' | 'ok' | 'bad' | 'you' | 'claude'; size?: number }) {
  const fill = { ink: 'var(--paper-raised, #fff)', ok: '#e3f5ea', bad: '#fbe4e1', you: '#fbe7d6', claude: '#dff1e7' }[tone];
  const ink = { ink: 'var(--ink, #222)', ok: '#1d6b42', bad: '#a0332a', you: '#9a4f1e', claude: '#1d6b42' }[tone];
  const w = text.length * size * 0.58 + 10;
  return (
    <g transform={`translate(${at[0].toFixed(1)} ${at[1].toFixed(1)})`}>
      <rect x={-w / 2} y={-size - 3} width={w} height={size + 8} rx={(size + 8) / 2} fill={fill} stroke={ink} strokeWidth={0.5} />
      <text textAnchor="middle" fontSize={size} fill={ink} y={1}>
        {text}
      </text>
    </g>
  );
}

/** A cloud, for the online server. */
export function Cloud({ at, label, scale = 1 }: { at: V; label?: string; scale?: number }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]}) scale(${scale})`}>
      <path d="M-34,10 C-48,10 -48,-8 -34,-8 C-34,-24 -10,-26 -4,-14 C2,-26 26,-24 26,-8 C42,-8 42,10 28,10 Z" fill="var(--paper-raised, #fff)" stroke="var(--rule-strong, #bbb)" strokeWidth={1} />
      {label ? (
        <text textAnchor="middle" y={4} fontSize={7.5} fill="var(--ink, #222)">
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** A phone drawn upright in screen space, slightly turned: `children` draw on a 90 × 170 screen. */
export function Phone({ at, children, scale = 1 }: { at: V; children?: ReactNode; scale?: number }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]}) scale(${scale}) skewY(-6)`}>
      <rect x={-50} y={-95} width={100} height={190} rx={14} fill="#1b1d20" />
      <rect x={-54} y={-95} width={4} height={190} rx={2} fill="#2f3237" />
      <rect x={-45} y={-85} width={90} height={170} rx={8} fill="#f7f6f2" />
      <rect x={-12} y={-82} width={24} height={4} rx={2} fill="#1b1d20" />
      <g transform="translate(-45 -85)">{children}</g>
    </g>
  );
}

/** A tiny phone on the desk, for hotspot scenes. */
export function DeskPhone({ x, y, z = 0, on = false }: { x: number; y: number; z?: number; on?: boolean }) {
  return (
    <g>
      <Slab x={x} y={y} z={z} w={22} d={40} h={3} m={MAT.phone} />
      <OnTop x={x} y={y} z={z + 3}>
        <rect x={2} y={3} width={18} height={34} rx={2} fill={on ? '#1e3a5c' : '#0d1117'} />
        {on ? (
          <g fill="none" stroke="#9fd8ff" strokeWidth={1}>
            <path d="M6,20 Q11,15 16,20" />
            <path d="M8,22.5 Q11,19.5 14,22.5" />
            <circle cx={11} cy={25} r={0.8} fill="#9fd8ff" />
          </g>
        ) : null}
      </OnTop>
    </g>
  );
}

/** A Windows-like dialog in screen space. */
export function Dialog({ at, title, body, button, pressed }: { at: V; title: string; body: string; button: string; pressed?: boolean }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <rect x={-55} y={-26} width={110} height={52} rx={4} fill="#f4f6f8" stroke="#8a96a3" strokeWidth={0.6} />
      <rect x={-55} y={-26} width={110} height={11} rx={4} fill="#dde4ec" />
      <text x={-50} y={-18} fontSize={6} fill="#223">
        {title}
      </text>
      <text x={-50} y={-4} fontSize={5.5} fill="#334">
        {body}
      </text>
      <rect x={14} y={8} width={34} height={12} rx={2} fill={pressed ? '#1f5fbf' : '#2b74e0'} />
      <text x={31} y={16.5} fontSize={6} fill="#fff" textAnchor="middle">
        {button}
      </text>
    </g>
  );
}

/** A small chart panel in screen space: `w` × `h`, x from 0 to 1, y from 0 to 1. */
export function Chart({ at, w = 120, h = 80, children, xLabel, yLabel }: { at: V; w?: number; h?: number; children: (sx: (v: number) => number, sy: (v: number) => number) => ReactNode; xLabel?: string; yLabel?: string }) {
  const sx = (v: number) => 10 + v * (w - 16);
  const sy = (v: number) => h - 12 - v * (h - 20);
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <rect width={w} height={h} rx={5} fill="var(--paper-raised, #fff)" stroke="var(--rule, #ddd)" />
      <line x1={10} y1={h - 12} x2={w - 4} y2={h - 12} stroke="var(--rule-strong, #bbb)" />
      <line x1={10} y1={6} x2={10} y2={h - 12} stroke="var(--rule-strong, #bbb)" />
      {xLabel ? (
        <text x={w - 4} y={h - 3} fontSize={5.5} textAnchor="end" fill="var(--ink, #222)" opacity={0.7}>
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <text x={13} y={11} fontSize={5.5} fill="var(--ink, #222)" opacity={0.7}>
          {yLabel}
        </text>
      ) : null}
      {children(sx, sy)}
    </g>
  );
}

export const scr = (x: number, y: number, z = 0): V => P(x, y, z);
export { C, S };
