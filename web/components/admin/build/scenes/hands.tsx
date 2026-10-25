/**
 * Close-ups of the steps your hands do that are not wiring: the USB plug into
 * the NodeMCU, the camera onto its base, the phone's hotspot, the microSD card.
 */
import { CameraTop, CloseupDefs, COLS, NODE_B, NodeMCUTop, ROW_STEP, ROW_TOP } from './closeup';
import { Appear, k, ke, lerp } from './iso';
import { Label, Tag } from './parts';
import type { SceneDef } from './types';

const DESK = '#b48c5e';
const Desk = () => <rect x={-400} y={-400} width={1600} height={1400} fill={DESK} />;

/** The micro-USB plug, from below: wide side up, as it goes into the NodeMCU. */
export function usbScene(): SceneDef {
  return {
    T: 11,
    view: '15 318 190 151',
    beats: [
      { at: 0, text: 'The micro-USB socket is at the end of the board, between FLASH and RST.', who: 'you' },
      { at: 2, text: 'The plug is wider on one side: turn it so it matches the socket. It only goes in one way.', who: 'you' },
      { at: 4.2, text: 'Push straight in until it stops. Never force it: if it resists, turn it over.', who: 'you' },
      { at: 6.4, text: 'The blue light flashes: it has power. Tell Claude “plugged in”.', who: 'you' },
      { at: 8, text: 'Nothing on the laptop? Try the other cable: some cables only charge.', who: 'you' },
    ],
    draw: (t) => {
      const turn = ke(t, 2, 1.2);
      const push = ke(t, 4.2, 1.6);
      const y = lerp(458, 432, push);
      const led = t > 6.4 && Math.floor(t * 4) % 2 === 0;
      return (
        <>
          <CloseupDefs />
          <Desk />
          <NodeMCUTop led={led} />
          <g transform={`translate(110 ${y})`}>
            <rect x={-6} y={14} width={12} height={80} fill="#1f2124" />
            <rect x={-16} y={2} width={32} height={18} rx={3} fill="#2a2d31" />
            <g transform={`scale(1 ${lerp(-1, 1, turn)})`}>
              <path d="M-9,-14 L9,-14 L7,-4 L-7,-4 Z" fill="url(#cu-can)" stroke="#8d949a" transform="translate(0 9)" />
            </g>
          </g>
          {t < 2 ? <Label at={[110, 420]} text="micro-USB socket" dy={-30} tone="accent" size={8} /> : null}
          <Appear t={t} at={2} out={4.2}>
            <Label at={[110, y - 6]} text={turn > 0.5 ? 'wide side matches' : 'wide side the wrong way'} dx={55} dy={-12} size={7.5} tone={turn > 0.5 ? 'tip' : 'accent'} />
          </Appear>
          <Appear t={t} at={6.4}>
            <Label at={[110, 180]} text="blue light: power" dx={40} dy={10} tone="tip" size={8} />
          </Appear>
          <Appear t={t} at={6.6}>
            <Tag at={[110, 390]} text="“plugged in”" tone="you" size={8} />
          </Appear>
        </>
      );
    },
  };
}

/** The camera onto its MB base: the sockets carry the same names as the camera's pins. */
export function seatScene(): SceneDef {
  const left = NODE_B.board.left;
  const right = NODE_B.board.right;
  const x0 = COLS.b - 13;
  const x1 = COLS.i + 13;
  const rowY = (i: number) => ROW_TOP + i * ROW_STEP;
  return {
    T: 11,
    view: '250 -40 290 230',
    beats: [
      { at: 0, text: 'The base on the desk, its USB socket at the bottom. Read the names beside its sockets.', who: 'you' },
      { at: 1.8, text: 'Turn the camera so the names match: its 5V over the base’s 5V, its GND over GND.', who: 'you' },
      { at: 4, text: 'Line up both rows of pins over both rows of sockets.', who: 'you' },
      { at: 5.6, text: 'Press down evenly on the board’s edges, not on the lens, until no pin shows.', who: 'you' },
      { at: 8, text: 'Plug the base into the laptop and tell Claude: Claude flashes the camera.', who: 'you' },
    ],
    draw: (t) => {
      const lift = lerp(150, 0, ke(t, 4, 1.6)) + (1 - ke(t, 5.6, 1)) * 6;
      const show = k(t, 1.8, 0.5);
      return (
        <>
          <CloseupDefs />
          <Desk />
          {/* the base, sockets on the camera's grid */}
          <rect x={x0 - 8 + 6} y={ROW_TOP - 24 + 8} width={x1 - x0 + 16} height={8 * ROW_STEP + 60} rx={5} fill="#000" opacity={0.25} />
          <rect x={x0 - 8} y={ROW_TOP - 24} width={x1 - x0 + 16} height={8 * ROW_STEP + 60} rx={5} fill="#1b1d20" />
          {left.map((name, i) => (
            <g key={`l${i}`}>
              <rect x={COLS.b - 5} y={rowY(i) - 5} width={10} height={10} rx={1} fill="#0a0a0a" stroke="#3a3a3a" />
              <text x={COLS.b - 9} y={rowY(i) + 3} textAnchor="end" fontSize={7} fill="#f2f5f7" fontFamily="var(--font-mono, monospace)">
                {name}
              </text>
            </g>
          ))}
          {right.map((name, i) => (
            <g key={`r${i}`}>
              <rect x={COLS.i - 5} y={rowY(i) - 5} width={10} height={10} rx={1} fill="#0a0a0a" stroke="#3a3a3a" />
              <text x={COLS.i + 9} y={rowY(i) + 3} fontSize={7} fill="#f2f5f7" fontFamily="var(--font-mono, monospace)">
                {name}
              </text>
            </g>
          ))}
          <rect x={373} y={ROW_TOP + 8 * ROW_STEP + 14} width={36} height={14} rx={2} fill="url(#cu-can)" />
          {/* the camera, coming down */}
          {show > 0 ? (
            <g opacity={show} transform={`translate(${lift * 0.15} ${-lift})`}>
              <rect x={x0 + lift * 0.1} y={ROW_TOP - 12 + lift * 0.12} width={x1 - x0} height={7 * ROW_STEP + 26} rx={4} fill="#000" opacity={0.25} transform={`translate(${6 + lift * 0.1} ${8 + lift * 0.15})`} />
              <CameraTop />
            </g>
          ) : null}
          <Appear t={t} at={1.8} out={4}>
            <Label at={[COLS.b - 20, rowY(0)]} text="5V on 5V" dx={-40} dy={-14} tone="accent" size={8} />
          </Appear>
          <Appear t={t} at={8}>
            <Tag at={[391, ROW_TOP + 8 * ROW_STEP + 46]} text="base → laptop · tell Claude" tone="you" size={8} />
          </Appear>
        </>
      );
    },
  };
}

/** The phone's hotspot: on, and on 2.4 GHz. */
export function hotspotCloseScene(): SceneDef {
  const Toggle = ({ x, y, on }: { x: number; y: number; on: number }) => (
    <g>
      <rect x={x} y={y} width={30} height={18} rx={9} fill={on > 0.5 ? '#34c759' : '#d4d4d8'} />
      <circle cx={x + 9 + on * 12} cy={y + 9} r={7.5} fill="#fff" />
    </g>
  );
  const Screen = ({ x, title, rows }: { x: number; title: string; rows: { label: string; on: number; note?: string }[] }) => (
    <g transform={`translate(${x} 0)`}>
      <rect x={0} y={0} width={170} height={300} rx={22} fill="#1b1d20" />
      <rect x={8} y={10} width={154} height={280} rx={16} fill="#f2f2f7" />
      <text x={20} y={40} fontSize={12} fontWeight={700} fill="#111">
        {title}
      </text>
      {rows.map((row, i) => (
        <g key={row.label} transform={`translate(16 ${62 + i * 58})`}>
          <rect width={138} height={46} rx={8} fill="#fff" />
          <text x={10} y={20} fontSize={9} fill="#111">
            {row.label}
          </text>
          {row.note ? (
            <text x={10} y={34} fontSize={7} fill="#6b6b70">
              {row.note}
            </text>
          ) : null}
          <Toggle x={100} y={14} on={row.on} />
        </g>
      ))}
    </g>
  );
  return {
    T: 10,
    view: '-10 -30 420 334',
    beats: [
      { at: 0, text: 'Settings, then Personal hotspot (iPhone) or Hotspot (Android).', who: 'you' },
      { at: 1.6, text: 'Turn it on.', who: 'you' },
      { at: 3.4, text: 'iPhone: turn on Maximise compatibility. That is 2.4 GHz.', who: 'you' },
      { at: 5.4, text: 'Android: set the band to 2.4 GHz.', who: 'you' },
      { at: 7.2, text: 'The camera cannot see 5 GHz; the laptop can see both. Join it with the laptop.', who: 'you' },
    ],
    draw: (t) => (
      <>
        <rect x={-400} y={-400} width={1600} height={1400} fill="var(--paper-sunken, #eee)" />
        <Screen
          x={10}
          title="Personal hotspot"
          rows={[
            { label: 'Allow others to join', on: ke(t, 1.6, 0.4) },
            { label: 'Maximise compatibility', note: '2.4 GHz', on: ke(t, 3.4, 0.4) },
          ]}
        />
        <text x={95} y={-12} textAnchor="middle" fontSize={11} fill="var(--ink, #222)">
          iPhone
        </text>
        <Screen
          x={220}
          title="Hotspot"
          rows={[
            { label: 'Mobile hotspot', on: ke(t, 1.6, 0.4) },
            { label: 'Band: 2.4 GHz', note: 'not 5 GHz', on: ke(t, 5.4, 0.4) },
          ]}
        />
        <text x={305} y={-12} textAnchor="middle" fontSize={11} fill="var(--ink, #222)">
          Android
        </text>
        <Appear t={t} at={7.2}>
          <Tag at={[200, 296]} text="2.4 GHz ✓" tone="ok" size={10} />
        </Appear>
      </>
    ),
  };
}

/** The microSD card into the camera's slot. */
export function cardCloseScene(): SceneDef {
  return {
    T: 10,
    view: '300 -20 200 159',
    beats: [
      { at: 0, text: 'Unplug the camera first. The slot is on the camera board’s top edge.', who: 'you' },
      { at: 1.6, text: 'Gold contacts facing the board, the card’s narrow end first.', who: 'you' },
      { at: 3.6, text: 'Push until it clicks and stays in.', who: 'you' },
      { at: 6, text: 'Power back on: Claude reads card=1 in the camera’s first line.', who: 'claude' },
    ],
    draw: (t) => {
      const push = ke(t, 3.6, 1.4);
      const y = lerp(-70, -6, push);
      return (
        <>
          <CloseupDefs />
          <Desk />
          <g transform="translate(0 30)">
            <CameraTop />
          </g>
          <rect x={366} y={18} width={50} height={8} rx={1} fill="url(#cu-can)" />
          <g transform={`translate(391 ${y + 30})`} opacity={k(t, 1.2, 0.4)}>
            <path d="M-17,-24 L13,-24 L17,-20 L17,0 L-17,0 Z" fill="#26282c" />
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x={-14 + i * 3.6} y={-6} width={2.4} height={5} fill="#d9b44a" />
            ))}
            <text x={0} y={-12} textAnchor="middle" fontSize={5.5} fill="#ccc">
              microSD
            </text>
          </g>
          <Appear t={t} at={4.8}>
            <Label at={[391, 40]} text="click" dx={50} dy={-8} tone="tip" size={9} />
          </Appear>
          <Appear t={t} at={6}>
            <Tag at={[400, 125]} text="E boot … card=1" tone="claude" size={8} />
          </Appear>
        </>
      );
    },
  };
}
