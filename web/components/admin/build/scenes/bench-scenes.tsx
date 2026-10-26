/**
 * Scenes on the bench: the parts, plugging in, flashing, wiring, the button,
 * the pretend meal, the hotspot, the laptop's server, the camera's Wi-Fi,
 * photos, and the radio between the boards.
 */
import type { ReactNode } from 'react';
import { Appear, Drop, MAT, OnTop, P, Slab, type V, during, k, ke, lerp } from './iso';
import {
  Breadboard,
  Button,
  Buzzer,
  Camera,
  Desk,
  DeskPhone,
  Dialog,
  Display,
  Finger,
  HX711,
  Label,
  Laptop,
  Led,
  Lines,
  LoadCell,
  NodeMCU,
  Phone,
  Resistor,
  Tag,
  Transistor,
  Waves,
  Wire,
} from './parts';
import { BENCH_BOX, pan, type Beat, type Box, type SceneDef } from './types';

// --- where things sit ---------------------------------------------------------

const MCU = { x: 150, y: 30 };
const LAPTOP_PORT = P(120, 50, 2.5);
const MCU_USB = P(163, 26, 3);
const pinL = (i: number) => P(MCU.x + 2.5, MCU.y + 4 + i * 3.1, 2);
const pinR = (i: number) => P(MCU.x + 23.5, MCU.y + 4 + i * 3.1, 2);
const bb = (x: number, y: number) => P(x, y, 7);

const COLOURS = { red: '#d0453c', black: '#2a2a2a', yellow: '#e2b93b', green: '#3f9b5a', white: '#e8e6df', blue: '#3b6fd0', orange: '#e08a4f', violet: '#8a5cc8', grey: '#8d949a' };

function quadPoint(a: V, b: V, sag: number, p: number): V {
  const m: V = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + sag];
  const q = 1 - p;
  return [q * q * a[0] + 2 * q * p * m[0] + p * p * b[0], q * q * a[1] + 2 * q * p * m[1] + p * p * b[1]];
}

/** The pretend scale's landing: the same spring and damping as the firmware, ten steps a second. */
function landed(from: number, to: number, seconds: number) {
  let x = from;
  let v = 0;
  for (let i = 0; i < Math.floor(Math.max(0, seconds) * 10); i++) {
    v += (to - x) * 0.5 - v * 0.6;
    x += v;
  }
  return x;
}

const grams = (g: number) => `${(Math.abs(g) < 0.05 ? 0 : g).toFixed(1)} g`;

function UsbCable({ p }: { p: number }) {
  return <Wire a={LAPTOP_PORT} b={MCU_USB} p={p} colour="#1f2124" width={2.4} sag={10} />;
}

// --- milestone 0 --------------------------------------------------------------

export function layoutScene(): SceneDef {
  return {
    T: 9,
    view: '-178 -45 445 353',
    beats: [
      { at: 0, text: 'Clear the desk. Wood or a mat, never metal.', who: 'you' },
      { at: 1.2, text: '1 · The scale: NodeMCU, display, button, buzzer, load cell', who: 'you' },
      { at: 3.6, text: '2 · The camera: the ESP32-CAM on its base, the six LEDs', who: 'you' },
      { at: 5.8, text: '3 · Small parts: transistors, diode, resistors, breadboard, jumpers', who: 'you' },
    ],
    draw: (t) => (
      <>
        <Desk />
        <Appear t={t} at={0.6}>
          <OnTop x={8} y={8} z={0.1}>
            <rect width={130} height={100} rx={8} fill="none" stroke="#7a5a35" strokeDasharray="4 3" />
          </OnTop>
          <OnTop x={160} y={8} z={0.1}>
            <rect width={130} height={70} rx={8} fill="none" stroke="#7a5a35" strokeDasharray="4 3" />
          </OnTop>
          <OnTop x={60} y={120} z={0.1}>
            <rect width={230} height={72} rx={8} fill="none" stroke="#7a5a35" strokeDasharray="4 3" />
          </OnTop>
        </Appear>
        <Drop t={t} at={1.2}>
          <LoadCell x={18} y={18} />
          <NodeMCU x={45} y={22} />
        </Drop>
        <Drop t={t} at={1.7}>
          <Display x={85} y={22} lines={['', '', '']} />
          <Button x={88} y={70} z={0} />
          <Buzzer x={118} y={80} z={0} />
        </Drop>
        <Drop t={t} at={3.6}>
          <Camera x={175} y={18} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Led key={i} x={225 + i * 9} y={40} z={0} />
          ))}
        </Drop>
        <Drop t={t} at={5.8}>
          <Breadboard x={150} y={132} w={130} />
          <Transistor x={80} y={140} z={0} />
          <Transistor x={90} y={140} z={0} />
          <Resistor x={80} y={165} z={0} />
          <Resistor x={100} y={172} z={0} />
          <Resistor x={120} y={179} z={0} />
        </Drop>
        <Appear t={t} at={1.2}>
          <Label at={P(70, 40, 30)} text="1 · The scale" dy={-30} tone="accent" size={8.5} />
        </Appear>
        <Appear t={t} at={3.6}>
          <Label at={P(220, 40, 20)} text="2 · The camera" dy={-34} tone="accent" size={8.5} />
        </Appear>
        <Appear t={t} at={5.8}>
          <Label at={P(170, 160, 10)} text="3 · Small parts" dy={30} tone="accent" size={8.5} />
        </Appear>
      </>
    ),
  };
}

type Spot = { at: [number, number, number]; text: string; dx?: number; dy?: number };

/** One part, close up, its features pointed out one at a time. `width` is how much of the desk the view takes in. */
function meet(part: (t: number) => ReactNode, centre: [number, number, number], width: number, spots: Spot[]): SceneDef {
  const c = P(...centre);
  const h = width / 1.26;
  const s = width / 410;
  const step = 1.4;
  return {
    T: 1.4 + spots.length * step + 1.2,
    view: [c[0] - width / 2, c[1] - h / 2, width, h].map((v) => v.toFixed(1)).join(' '),
    beats: [{ at: 0, text: 'Pick it up and turn it so it looks like this.', who: 'you' as const }, ...spots.map((spot, i) => ({ at: 1.2 + i * step, text: spot.text }))],
    draw: (t) => (
      <>
        <Desk />
        <Drop t={t} at={0.2} from={30 * s}>
          {part(t)}
        </Drop>
        {spots.map((spot, i) => {
          const at = P(...spot.at);
          const on = k(t, 1.2 + i * step, 0.3);
          if (on <= 0) return null;
          // Only the feature being explained keeps its label; the caption below has them all.
          const current = i === spots.length - 1 || t < 1.2 + (i + 1) * step;
          const top = c[1] - h / 2;
          const dy = at[1] - 60 * s < top + 20 * s ? 55 * s : -55 * s;
          return (
            <g key={spot.text} opacity={on}>
              {current ? <Label at={at} text={spot.text.split(':')[0]} dy={dy} size={16 * s} /> : null}
              <circle cx={at[0]} cy={at[1]} r={9 * s} fill="var(--accent, #e08a4f)" stroke="#fff" strokeWidth={1.6 * s} />
              <text x={at[0]} y={at[1] + 4 * s} fontSize={11 * s} textAnchor="middle" fill="#fff" fontWeight={700}>
                {i + 1}
              </text>
            </g>
          );
        })}
      </>
    ),
  };
}

export function meetScene(variant: string): SceneDef {
  switch (variant) {
    case 'nodemcu':
      return meet((t) => <NodeMCU x={150} y={30} led={t > 1 && Math.floor(t * 3) % 2 === 0} />, [163, 55, 0], 125, [
        { at: [163, 26, 4], text: 'Micro-USB: power and flashing, from the laptop', dx: 30, dy: -110 },
        { at: [155, 33, 2], text: 'FLASH: only if Claude asks', dx: -90, dy: -80 },
        { at: [171, 33, 2], text: 'RST: restarts it, nothing lost', dx: 90, dy: -60 },
        { at: [163, 63, 2], text: 'ESP8266: the brain, with Wi-Fi', dx: 90, dy: 40 },
        { at: [152.5, 60, 2], text: 'D1, D2, D5 to D8: the scale’s pins', dx: -90, dy: 20 },
        { at: [173.5, 72, 2], text: '3V, G, VU: power out', dx: 40, dy: 100 },
      ]);
    case 'camera':
      return meet(() => <Camera x={150} y={40} base={false} />, [163, 60, 2], 130, [
        { at: [163.5, 52, 9], text: 'The camera: it looks at the plate', dx: -40, dy: -110 },
        { at: [163, 72, 2], text: 'microSD slot: photos kept when Wi-Fi is down', dx: 60, dy: 110 },
        { at: [151, 62, 2], text: '5V and GND: power in', dx: -150, dy: 20 },
        { at: [151, 70, 2], text: 'IO13: switches the light', dx: -140, dy: 80 },
        { at: [176, 50, 2], text: 'IO0: for flashing; the base does it', dx: 150, dy: -40 },
      ]);
    case 'oled':
      return meet(() => <Display x={145} y={50} lines={['CAMERA ?', '0.0 g', 'READY']} />, [162, 52, 15], 120, [
        { at: [160, 53, 24], text: 'The screen: 128 × 64 dots', dx: 140, dy: -60 },
        { at: [150, 53, 3], text: 'VCC and GND: its power, 3.3 V', dx: -120, dy: 70 },
        { at: [166, 53, 3], text: 'SCL and SDA: two data wires', dx: 120, dy: 90 },
      ]);
    case 'buzzer':
      return meet(
        () => (
          <>
            <Buzzer x={160} y={45} z={0} />
            <Transistor x={185} y={60} z={0} />
            <Resistor x={150} y={75} z={0} />
            <Slab x={175} y={80} z={0} w={8} d={2.5} h={2.5} m={{ top: '#c43c2c', left: '#a33024', right: '#8c281e' }} />
          </>
        ),
        [170, 62, 4],
        105,
        [
          { at: [160, 45, 11], text: 'The buzzer module: − and S, S is its +', dx: -60, dy: -60 },
          { at: [185, 60, 10], text: '2N2222A: flat face to you, E B C', dx: 60, dy: -50 },
          { at: [155, 75, 3], text: '1 kΩ: from D8 to the base', dx: -60, dy: 40 },
          { at: [179, 81, 3], text: '1N4148 diode: band towards S', dx: 50, dy: 60 },
        ],
      );
    case 'hx711':
      return meet(
        () => (
          <>
            <LoadCell x={205} y={15} />
            <HX711 x={150} y={70} />
          </>
        ),
        [185, 70, 6],
        150,
        [
          { at: [211, 30, 13], text: 'The load cell: it bends a hair under weight', dx: 70, dy: -70 },
          { at: [211, 92, 6], text: 'Its four wires: red, black, white, green', dx: 80, dy: 40 },
          { at: [160, 73, 9], text: 'HX711: E+ E− A− A+ to the cell', dx: -110, dy: -50 },
          { at: [160, 99, 9], text: 'GND DT SCK VCC to the NodeMCU', dx: -110, dy: 60 },
        ],
      );
    default:
      return meet(() => <Breadboard x={150} y={40} w={140} />, [220, 65, 0], 250, [
        { at: [180, 42, 7], text: '+ and − rails run the whole length', dx: -40, dy: -70 },
        { at: [200, 55, 7], text: 'Each short row of five holes is joined', dx: 40, dy: -90 },
        { at: [240, 65, 7], text: 'The centre gap keeps the two sides apart', dx: -60, dy: 90 },
        { at: [260, 85, 7], text: 'A second pair of rails at the front', dx: -40, dy: 50 },
      ]);
  }
}

// --- plugging in and flashing ------------------------------------------------

export function plugScene(): SceneDef {
  const typed = (t: number, from: number) => Math.floor(Math.max(0, t - from) * 28);
  return {
    T: 8,
    beats: [
      { at: 0, text: 'One USB cable: laptop to the NodeMCU', who: 'you' },
      { at: 2, text: 'Its blue light blinks: it has power' },
      { at: 3.2, text: 'Tell Claude: “plugged in”', who: 'you' },
      { at: 4.4, text: 'Claude finds its port: COM5, a CH340', who: 'claude' },
    ],
    draw: (t) => (
      <>
        <Desk />
        <Laptop
          screen={
            <>
              {t > 4.4 ? <Lines lines={['$ board.py ports', 'COM5  CH340  USB-SERIAL']} shown={typed(t, 4.4)} /> : null}
              {t > 6 ? <Tag at={[50, 50]} text="found it" tone="ok" size={6} /> : null}
            </>
          }
        />
        <NodeMCU x={MCU.x} y={MCU.y} led={t > 2 && Math.floor(t * 4) % 2 === 0} />
        <UsbCable p={ke(t, 0.4, 1.4)} />
        <Appear t={t} at={3.2} out={6.5}>
          <Tag at={[-50, 120]} text="“plugged in”" tone="you" size={8} />
        </Appear>
        <Appear t={t} at={0.4}>
          <Label at={MCU_USB} text="micro-USB" dx={30} dy={-14} />
        </Appear>
      </>
    ),
  };
}

const FLASH = {
  pretend: { env: 'node-a-nodemcu-sim', boot: 'E boot node=a fw=0.3.5 simulated=1', what: 'the pretend scale' },
  real: { env: 'node-a-nodemcu', boot: 'E boot node=a fw=0.3.5 calibrated=0', what: 'the real scale' },
  camera: { env: 'node-b-camera', boot: 'E boot node=b camera=1', what: 'the camera' },
} as const;

export function flashScene(variant: string): SceneDef {
  const f = FLASH[(variant in FLASH ? variant : 'pretend') as keyof typeof FLASH];
  const camera = variant === 'camera';
  const target: V = camera ? P(176, 84, 4) : MCU_USB;
  const beats: Beat[] = [
    camera ? { at: 0, text: 'Seat the camera on its MB base, plug the base in', who: 'you' } : { at: 0, text: 'The board is plugged in: nothing to do', who: 'you' },
    { at: 1, text: `Claude flashes ${f.what}: board.py flash ${f.env}`, who: 'claude' },
    { at: 2.4, text: 'The firmware goes down the cable, about a minute' },
    { at: 6.2, text: 'It restarts and says hello: Claude reads its first line', who: 'claude' },
  ];
  return {
    T: 9,
    beats,
    draw: (t) => {
      const p = k(t, 2.4, 3.6);
      return (
        <>
          <Desk />
          <Laptop
            screen={
              <>
                <Lines lines={[`$ board.py flash`, f.env]} shown={Math.floor(Math.max(0, t - 1) * 30)} />
                {t > 2.4 ? (
                  <g>
                    <rect x={4} y={28} width={92} height={6} rx={2} fill="#1d2630" />
                    <rect x={4} y={28} width={92 * p} height={6} rx={2} fill="#3fb37f" />
                    <text x={4} y={44} fontSize={6} fill="#9fe3b0" fontFamily="ui-monospace, monospace">
                      {p < 1 ? `Writing ${Math.round(p * 100)} %` : 'Done'}
                    </text>
                  </g>
                ) : null}
                {t > 6.2 ? <Lines lines={[f.boot]} y={56} size={4.6} shown={Math.floor((t - 6.2) * 40)} /> : null}
              </>
            }
          />
          {camera ? <Camera x={163} y={42} /> : <NodeMCU x={MCU.x} y={MCU.y} led={during(t, 2.4, 6) ? Math.floor(t * 10) % 2 === 0 : t > 6.2} />}
          <Wire a={LAPTOP_PORT} b={target} colour="#1f2124" width={2.4} sag={10} />
          {during(t, 2.4, 6)
            ? [0, 0.25, 0.5, 0.75].map((o) => {
                const q = (t * 0.9 + o) % 1;
                const [x, y] = quadPoint(LAPTOP_PORT, target, 10, q);
                return <circle key={o} cx={x} cy={y} r={2} fill="#3fb37f" />;
              })
            : null}
          <Appear t={t} at={1}>
            <Tag at={P(70, 150, 0)} text="Claude, from the laptop" tone="claude" size={7.5} />
          </Appear>
        </>
      );
    },
  };
}

// --- wiring ---------------------------------------------------------------------

type WireSpec = { from: V; to: V; colour: string; say: string; label: string; /** Where its label sits, from the wire's end. */ at?: V };
type WireVariant = { zoom?: Box; module: (t: number, after: number) => ReactNode; wires: WireSpec[]; end?: { beats: Beat[]; draw: (t: number, at: number) => ReactNode; T: number }; mcu?: boolean };

const DISPLAY_AT = { x: 245, y: 118 };
const WIRE_ZOOM: Box = [-25, 70, 205, 163];
const BENCH_VIEW = BENCH_BOX.join(' ');
const displayPin = (i: number) => P(DISPLAY_AT.x + 5 + i * 7.5, DISPLAY_AT.y + 3, 9);

function wireVariant(variant: string): WireVariant {
  switch (variant) {
    case 'rails':
      return {
        module: () => null,
        wires: [
          { from: pinR(13), to: bb(170, 115), colour: COLOURS.red, say: '3V to the back + rail: the 3.3 V rail', label: '3.3 V rail' },
          { from: pinR(14), to: bb(200, 120), colour: COLOURS.black, say: 'G to the − rail', label: '− rail' },
          { from: pinL(2), to: bb(160, 154), colour: COLOURS.orange, say: 'VU to the front + rail: the 5 V rail', label: '5 V rail' },
        ],
        end: {
          T: 2.6,
          beats: [{ at: 0, text: 'Never join the two + rails. Claude checks it still boots.', who: 'claude' }],
          draw: (t, at) => (
            <Appear t={t} at={at}>
              <Tag at={[190, 0]} text="3.3 V and 5 V never touch" tone="bad" size={7.5} />
            </Appear>
          ),
        },
      };
    case 'display':
      return {
        module: (t, after) => <Display x={DISPLAY_AT.x} y={DISPLAY_AT.y} z={7} lines={t > after ? ['CAMERA ?', '0.0 g', 'READY'] : ['', '', '']} />,
        wires: [
          { from: pinR(13), to: displayPin(0), colour: COLOURS.red, say: 'VCC to 3V', label: 'VCC', at: [-14, 18] },
          { from: pinR(14), to: displayPin(1), colour: COLOURS.black, say: 'GND to G', label: 'GND', at: [-4, 26] },
          { from: pinL(1), to: displayPin(2), colour: COLOURS.yellow, say: 'SCL to D1', label: 'SCL', at: [8, 18] },
          { from: pinL(2), to: displayPin(3), colour: COLOURS.green, say: 'SDA to D2', label: 'SDA', at: [18, 26] },
        ],
        end: { T: 2.4, beats: [{ at: 0, text: 'It lights up: CAMERA ?, 0.0 g, READY' }], draw: () => null },
      };
    case 'buzzer':
      return {
        module: () => (
          <>
            <Resistor x={190} y={128} />
            <Transistor x={212} y={140} />
            <Buzzer x={245} y={135} />
            <Slab x={232} y={148} z={7} w={8} d={2.5} h={2.5} m={{ top: '#c43c2c', left: '#a33024', right: '#8c281e' }} />
          </>
        ),
        wires: [
          { from: pinL(7), to: bb(188, 128), colour: COLOURS.blue, say: 'D8, through the 1 kΩ, to the base (B)', label: 'D8 → 1 kΩ → B' },
          { from: bb(210, 140), to: bb(205, 116), colour: COLOURS.black, say: 'Emitter (E) to the − rail', label: 'E → −' },
          { from: bb(214, 140), to: bb(240, 138), colour: COLOURS.grey, say: 'Collector (C) to the buzzer’s −', label: 'C → buzzer −' },
          { from: bb(250, 132), to: bb(265, 156), colour: COLOURS.orange, say: 'The buzzer’s S to the 5 V rail; the diode across − and S', label: 'S → 5 V' },
        ],
        end: {
          T: 3,
          beats: [{ at: 0, text: 'Claude sends “tare”: you hear a short beep', who: 'claude' }],
          draw: (t, at) => (
            <>
              <Appear t={t} at={at}>
                <Tag at={P(60, 150, 0)} text="tare" tone="claude" size={8} />
              </Appear>
              <Waves at={P(245, 135, 20)} t={t} on={t > at + 0.4} size={20} />
            </>
          ),
        },
      };
    case 'light':
      return {
        mcu: false,
        module: (t, after) => (
          <>
            <Camera x={155} y={118} z={7} base={false} />
            <Transistor x={205} y={150} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Led key={i} x={222 + i * 9} y={128} lit={t > after ? 1 : 0} />
            ))}
          </>
        ),
        wires: [
          { from: P(157, 150, 9), to: bb(200, 150), colour: COLOURS.violet, say: 'IO13, through 470 Ω, to the base', label: 'IO13 → 470 Ω → B', at: [-30, -26] },
          { from: bb(200, 152), to: bb(205, 162), colour: COLOURS.grey, say: '10 kΩ from the base to the − rail: off unless told', label: '10 kΩ → −', at: [-20, 22] },
          { from: bb(206, 150), to: bb(215, 160), colour: COLOURS.black, say: 'Emitter to the − rail', label: 'E → −', at: [26, 18] },
          { from: bb(208, 150), to: bb(222, 130), colour: COLOURS.orange, say: 'The six LEDs, each with its 100 Ω, to the collector', label: '6 × LED + 100 Ω', at: [30, -24] },
        ],
      };
    case 'hx711':
      return {
        module: () => <HX711 x={215} y={118} />,
        wires: [
          { from: pinR(13), to: P(219, 119, 9), colour: COLOURS.red, say: 'VCC to 3V', label: 'VCC' },
          { from: pinR(14), to: P(223, 119, 9), colour: COLOURS.black, say: 'GND to G', label: 'GND' },
          { from: pinL(5), to: P(227, 119, 9), colour: COLOURS.yellow, say: 'DT to D6', label: 'DT' },
          { from: pinL(6), to: P(231, 119, 9), colour: COLOURS.green, say: 'SCK to D7', label: 'SCK' },
        ],
        end: { T: 2.4, beats: [{ at: 0, text: '100 nF and 10 µF across VCC and GND, close to the HX711' }], draw: () => null },
      };
    case 'cell':
    default:
      return {
        zoom: [-25, 40, 260, 206],
        module: () => (
          <>
            <LoadCell x={265} y={20} />
            <HX711 x={215} y={118} />
          </>
        ),
        wires: [
          { from: P(270, 100, 4), to: P(219, 149, 9), colour: COLOURS.red, say: 'Red to E+', label: 'E+' },
          { from: P(271, 100, 4), to: P(223, 149, 9), colour: COLOURS.black, say: 'Black to E−', label: 'E−' },
          { from: P(272, 100, 4), to: P(227, 149, 9), colour: COLOURS.white, say: 'White to A−', label: 'A−' },
          { from: P(273, 100, 4), to: P(231, 149, 9), colour: COLOURS.green, say: 'Green to A+', label: 'A+' },
        ],
      };
  }
}

export function wireScene(variant: string): SceneDef {
  const v = wireVariant(variant);
  const t0 = 1.6;
  const per = 1.2;
  const tIn = t0 + v.wires.length * per + 0.2;
  const after = tIn + 1;
  const T = after + (v.end?.T ?? 1.6);
  const beats: Beat[] = [
    { at: 0, text: 'USB out before wiring. Always.', who: 'you' },
    ...v.wires.map((w, i) => ({ at: t0 + i * per, text: w.say, who: 'you' as const })),
    { at: tIn, text: 'USB back in, tell Claude', who: 'you' },
    ...(v.end?.beats.map((b) => ({ ...b, at: b.at + after })) ?? []),
  ];
  return {
    T,
    beats,
    camera: pan([
      [0, BENCH_BOX],
      [t0, v.zoom ?? WIRE_ZOOM],
      [tIn, v.zoom ?? WIRE_ZOOM],
      [tIn + 0.9, BENCH_BOX],
    ]),
    draw: (t) => {
      const cable = t < tIn ? 1 - ke(t, 0.2, 0.8) : ke(t, tIn, 0.8);
      return (
        <>
          <Desk />
          <Laptop />
          {v.mcu === false ? null : <NodeMCU x={MCU.x} y={MCU.y} led={t > tIn + 0.8} />}
          <Breadboard />
          {v.module(t, after)}
          {v.mcu === false ? null : <UsbCable p={cable} />}
          {v.wires.map((w, i) => {
            const p = ke(t, t0 + i * per, 0.9);
            return (
              <g key={w.label}>
                <Wire a={w.from} b={w.to} p={p} colour={w.colour} width={1.8} sag={14} />
                {p > 0.95 ? <circle cx={w.to[0]} cy={w.to[1]} r={1.6} fill={w.colour} /> : null}
                {during(t, t0 + i * per + 0.6, tIn) ? <Label at={w.to} text={w.label} dx={w.at?.[0] ?? (i % 2 ? 1 : -1) * 6} dy={w.at?.[1] ?? -14 - (i % 2) * 8} size={6.5} /> : null}
              </g>
            );
          })}
          <Appear t={t} at={0} out={1.2}>
            <Tag at={P(140, 40, 30)} text="USB out" tone="you" size={8} />
          </Appear>
          {v.end?.draw(t, after)}
        </>
      );
    },
  };
}

// --- the one button -----------------------------------------------------------

export function holdScene(): SceneDef {
  return {
    T: 12,
    camera: pan([
      [0, WIRE_ZOOM],
      [2.2, [20, 95, 160, 127]],
      [10.4, [20, 95, 160, 127]],
      [11.4, WIRE_ZOOM],
    ]),
    beats: [
      { at: 0, text: 'The button across the centre gap: one leg to D5, the diagonal leg to −', who: 'you' },
      { at: 2.6, text: 'Hold it down…', who: 'you' },
      { at: 3.4, text: '…the display counts 5, 4, 3, 2, 1' },
      { at: 8, text: 'TARE OK: the scale is zeroed. Let go.' },
      { at: 9.2, text: 'A quick click is PHOTO. Nothing on the scale, so NOTHING ON IT.', who: 'you' },
    ],
    draw: (t) => {
      const holding = during(t, 3, 8);
      const left = 5 - Math.floor(Math.max(0, t - 3));
      const bottom = t >= 9.6 ? 'NOTHING ON IT' : t >= 8 ? 'TARE OK' : holding && t >= 3.8 ? `HOLD: TARE IN ${left} s` : 'READY';
      const fingerDown = t < 9 ? ke(t, 2.6, 0.4) * (1 - ke(t, 8.2, 0.3)) : ke(t, 9.1, 0.15) * (1 - ke(t, 9.35, 0.15));
      return (
        <>
          <Desk />
          <Laptop />
          <NodeMCU x={MCU.x} y={MCU.y} led />
          <Breadboard />
          <Display x={DISPLAY_AT.x} y={DISPLAY_AT.y} z={7} lines={['CAMERA ?', '0.0 g', bottom]} />
          <Button x={205} y={128} press={fingerDown} />
          <UsbCable p={1} />
          <Wire a={pinL(4)} b={bb(207, 130)} p={ke(t, 0.4, 0.8)} colour={COLOURS.white} width={1.8} sag={14} />
          <Wire a={bb(216, 139)} b={bb(222, 160)} p={ke(t, 1.2, 0.8)} colour={COLOURS.black} width={1.8} sag={6} />
          <Finger at={P(211, 134, 13)} down={fingerDown} show={k(t, 2.2, 0.3) * (1 - k(t, 10.6, 0.4))} />
          {holding ? (
            <g>
              <circle cx={P(211, 134, 13)[0] + 34} cy={P(211, 134, 13)[1] - 30} r={13} fill="var(--paper-raised, #fff)" stroke="var(--rule, #ddd)" />
              <circle
                cx={P(211, 134, 13)[0] + 34}
                cy={P(211, 134, 13)[1] - 30}
                r={10}
                fill="none"
                stroke="var(--accent, #e08a4f)"
                strokeWidth={3}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - k(t, 3, 5)}
                transform={`rotate(-90 ${P(211, 134, 13)[0] + 34} ${P(211, 134, 13)[1] - 30})`}
              />
              <text x={P(211, 134, 13)[0] + 34} y={P(211, 134, 13)[1] - 27} textAnchor="middle" fontSize={8} fill="var(--ink, #222)">
                {left}
              </text>
            </g>
          ) : null}
          <Appear t={t} at={8} out={9}>
            <Tag at={P(250, 100, 50)} text="E tare" tone="claude" />
          </Appear>
          <Appear t={t} at={9.6}>
            <Tag at={P(250, 100, 50)} text="E capture · too-light" tone="claude" />
          </Appear>
        </>
      );
    },
  };
}

// --- the pretend meal, from the laptop -----------------------------------------

export function pretendMealScene(): SceneDef {
  return {
    T: 14,
    view: BENCH_VIEW,
    beats: [
      { at: 0, text: 'Watch the display and listen', who: 'you' },
      { at: 0.8, text: 'Claude puts a pretend 420 g plate on (sim 420)', who: 'claude' },
      { at: 1.6, text: 'It overshoots and wobbles, then settles, like a real plate' },
      { at: 4.2, text: 'Claude tares: 0.0 g', who: 'claude' },
      { at: 6, text: 'Pretend food, 150 g', who: 'claude' },
      { at: 9, text: 'Photo: NO CAMERA and a long low beep. Right: no camera yet.' },
      { at: 11.5, text: 'Claude reads every line: each step PASS', who: 'claude' },
    ],
    draw: (t) => {
      const raw = t < 6 ? landed(0, 420, t - 0.8) : landed(420, 570, t - 6);
      const tare = t >= 4.2 ? 420 : 0;
      const shown = t < 0.8 ? 0 : raw - tare;
      const bottom = t >= 9.4 ? 'NO CAMERA' : t >= 9 ? 'WEIGHING' : t >= 4.2 && t < 6 ? 'TARE OK' : 'READY';
      const lines = ['$ board.py meal-test --no-camera'];
      if (t > 0.8) lines.push('sim 420');
      if (t > 4.2) lines.push('tare      PASS');
      if (t > 6) lines.push('sim 570');
      if (t > 8.5) lines.push('150.0 g   PASS');
      if (t > 9.4) lines.push('capture   NO CAMERA PASS');
      return (
        <>
          <Desk />
          <Laptop screen={<Lines lines={lines} size={5.2} gap={7.5} />} />
          <NodeMCU x={MCU.x} y={MCU.y} led />
          <Breadboard />
          <Display x={DISPLAY_AT.x} y={DISPLAY_AT.y} z={7} lines={['CAMERA ?', grams(shown), bottom]} />
          <Button x={205} y={128} />
          <Buzzer x={180} y={140} />
          <UsbCable p={1} />
          <Waves at={P(180, 140, 18)} t={t} on={during(t, 9.4, 10.6)} colour="#c4473a" size={22} />
          <Waves at={P(180, 140, 18)} t={t} on={during(t, 4.2, 4.6)} size={14} />
          <Appear t={t} at={11.5}>
            <Tag at={P(90, 160, 0)} text="all steps PASS" tone="ok" size={8} />
          </Appear>
        </>
      );
    },
  };
}

// --- the network ---------------------------------------------------------------

const PHONE_AT = { x: 50, y: 130 };

export function hotspotScene(): SceneDef {
  return {
    T: 8,
    beats: [
      { at: 0, text: 'On the phone: Personal hotspot on', who: 'you' },
      { at: 1.4, text: '2.4 GHz: the camera cannot see 5 GHz (iPhone: Maximise compatibility)', who: 'you' },
      { at: 3.4, text: 'The laptop joins the phone’s hotspot', who: 'you' },
      { at: 5.4, text: 'Claude checks the laptop is on it and finds its address', who: 'claude' },
    ],
    draw: (t) => (
      <>
        <Desk />
        <Laptop
          screen={
            t > 3.4 ? (
              <>
                <Lines lines={['Wi-Fi', '  ✓ Your phone', '    hotspot · 2.4 GHz']} size={6} />
                {t > 5.4 ? <Lines lines={['$ ipconfig', 'IPv4 … found']} y={44} size={5.5} shown={Math.floor((t - 5.4) * 30)} /> : null}
              </>
            ) : null
          }
        />
        <DeskPhone x={PHONE_AT.x} y={PHONE_AT.y} on={t > 0.6} />
        <Waves at={P(61, 150, 6)} t={t} on={t > 1} size={40} colour="#3b6fd0" />
        <Appear t={t} at={1.4}>
          <Tag at={P(61, 175, 0)} text="2.4 GHz" tone="you" size={8} />
        </Appear>
        {t > 3.4 ? <line x1={P(61, 150, 6)[0]} y1={P(61, 150, 6)[1]} x2={P(65, 50, 40)[0]} y2={P(65, 50, 40)[1]} stroke="#3b6fd0" strokeWidth={1.2} strokeDasharray="3 3" opacity={k(t, 3.4, 0.5)} /> : null}
      </>
    ),
  };
}

export function serverScene(): SceneDef {
  return {
    T: 10,
    beats: [
      { at: 0, text: 'Claude starts the server where the camera can reach it', who: 'claude' },
      { at: 2, text: 'Windows asks about Python and the network', who: 'you' },
      { at: 3.4, text: 'Click Allow, on private networks', who: 'you' },
      { at: 5.6, text: 'The phone opens the server’s page: it is reachable', who: 'claude' },
    ],
    draw: (t) => (
      <>
        <Desk />
        <Laptop screen={<Lines lines={['$ uvicorn app.main:app', '  --host 0.0.0.0 --port 8000', 'Application startup complete']} size={5.2} shown={Math.floor(t * 30)} />} />
        <DeskPhone x={PHONE_AT.x} y={PHONE_AT.y} on />
        <Appear t={t} at={2} out={4.4}>
          <Dialog at={P(65, 40, 50)} title="Windows Security" body="Allow Python on private networks?" button="Allow" pressed={t > 3.6} />
        </Appear>
        <Finger at={[P(65, 40, 50)[0] + 31, P(65, 40, 50)[1] + 14]} down={ke(t, 3.2, 0.3) * (1 - ke(t, 3.9, 0.3))} show={k(t, 2.8, 0.3) * (1 - k(t, 4.3, 0.3))} />
        {t > 5.6 ? (
          <g opacity={k(t, 5.6, 0.5)}>
            <line x1={P(61, 150, 6)[0]} y1={P(61, 150, 6)[1]} x2={P(65, 50, 40)[0]} y2={P(65, 50, 40)[1]} stroke="#3fb37f" strokeWidth={1.4} strokeDasharray="3 3" />
            <Tag at={[40, 135]} text="http://<laptop>:8000/docs ✓" tone="ok" size={7.5} />
          </g>
        ) : null}
      </>
    ),
  };
}

export function wifiScene(): SceneDef {
  return {
    T: 11,
    beats: [
      { at: 0, text: 'On Test and calibrate: Connect a board, pick the camera', who: 'you' },
      { at: 1.6, text: 'Type the hotspot’s name and password. Only you type passwords.', who: 'you' },
      { at: 4.4, text: 'Paste the server address Claude gives you', who: 'claude' },
      { at: 6, text: 'Save and connect', who: 'you' },
      { at: 7.4, text: 'The camera joins the hotspot: Wi-Fi up', who: 'claude' },
    ],
    draw: (t) => {
      const typedName = 'Your phone'.slice(0, Math.floor(Math.max(0, t - 1.6) * 12));
      const dots = '••••••••'.slice(0, Math.floor(Math.max(0, t - 2.8) * 8));
      const server = 'http://<laptop>:8000'.slice(0, Math.floor(Math.max(0, t - 4.4) * 18));
      return (
        <>
          <Desk />
          <Laptop
            screen={
              <g fontSize={5.6} fill="#dfe7ee">
                <text x={4} y={9}>Hotspot name</text>
                <rect x={44} y={3} width={52} height={8} rx={1} fill="#1d2630" />
                <text x={46} y={9} fill="#9fe3b0">{typedName}</text>
                <text x={4} y={21}>Password</text>
                <rect x={44} y={15} width={52} height={8} rx={1} fill="#1d2630" />
                <text x={46} y={21.5} fill="#9fe3b0">{dots}</text>
                <text x={4} y={33}>Server</text>
                <rect x={44} y={27} width={52} height={8} rx={1} fill="#1d2630" />
                <text x={46} y={33} fill="#9fe3b0" fontSize={4.6}>{server}</text>
                <rect x={44} y={40} width={52} height={10} rx={2} fill={t > 6.2 ? '#2a8a5c' : '#2b74e0'} />
                <text x={70} y={47} textAnchor="middle" fill="#fff">Save and connect</text>
                {t > 7.4 ? <text x={4} y={60} fill="#9fe3b0" fontFamily="ui-monospace, monospace">E wifi up ch=6</text> : null}
              </g>
            }
          />
          <Camera x={175} y={45} />
          <Wire a={LAPTOP_PORT} b={P(188, 87, 4)} colour="#1f2124" width={2.4} sag={10} />
          <DeskPhone x={PHONE_AT.x} y={PHONE_AT.y} on />
          <Waves at={P(61, 150, 6)} t={t} size={36} colour="#3b6fd0" />
          <Waves at={P(188, 57, 20)} t={t} on={t > 7.4} size={26} colour="#3b6fd0" />
          <Finger at={[P(65, 40, 50)[0] + 31, P(65, 40, 50)[1] + 10]} down={ke(t, 6, 0.25) * (1 - ke(t, 6.4, 0.25))} show={k(t, 5.6, 0.3) * (1 - k(t, 7, 0.3))} />
          <Appear t={t} at={1.6} out={4.2}>
            <Tag at={[40, 135]} text="you type the password" tone="you" size={7.5} />
          </Appear>
          <Appear t={t} at={7.4}>
            <Tag at={[150, 60]} text="Wi-Fi up" tone="ok" size={8} />
          </Appear>
        </>
      );
    },
  };
}

export function photoScene(variant: string): SceneDef {
  const light = variant === 'light';
  return {
    T: 9,
    view: light ? BENCH_VIEW : undefined,
    beats: light
      ? [
          { at: 0, text: 'Claude sends the camera “light on”', who: 'claude' },
          { at: 1, text: 'All six LEDs light: look that none stays dark', who: 'you' },
          { at: 5, text: '“light off”: all go out', who: 'claude' },
        ]
      : [
          { at: 0, text: 'Point the camera at something', who: 'you' },
          { at: 1, text: 'Claude asks for a test photo with 150 g', who: 'claude' },
          { at: 2.4, text: 'Light, click: the camera takes the photo' },
          { at: 3.4, text: 'It travels over Wi-Fi to the laptop’s server' },
          { at: 5.4, text: 'Saved: HTTP 201, with its 150 g', who: 'claude' },
        ],
    draw: (t) => {
      if (light) {
        const lit = during(t, 1, 5) ? k(t, 1, 0.3) : 0;
        return (
          <>
            <Desk />
            <Laptop screen={<Lines lines={['$ board.py send', '  "light on"', ...(t > 5 ? ['  "light off"'] : [])]} size={6} />} />
            <Breadboard />
            <Camera x={155} y={118} z={7} base={false} />
            <Transistor x={205} y={150} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Led key={i} x={222 + i * 9} y={128} lit={lit} />
            ))}
            <Appear t={t} at={1.2} out={5}>
              <Tag at={P(250, 100, 40)} text="six lit" tone="ok" size={8} />
            </Appear>
          </>
        );
      }
      const flash = during(t, 2.4, 3) ? k(t, 2.4, 0.6) : 0;
      const fly = ke(t, 3.4, 1.6);
      const from = P(188, 57, 25);
      const to = P(65, 30, 60);
      return (
        <>
          <Desk />
          <Laptop screen={t > 5.2 ? <Lines lines={['POST /meals', '201 · 150 g · saved']} size={6} shown={Math.floor((t - 5.2) * 30)} /> : null} />
          <Camera x={175} y={45} flash={flash} />
          <Slab x={175} y={110} w={24} d={24} h={14} m={MAT.white} />
          <DeskPhone x={PHONE_AT.x} y={PHONE_AT.y} on />
          {fly > 0 && fly < 1 ? (
            <g transform={`translate(${lerp(from[0], to[0], fly)} ${lerp(from[1], to[1], fly) - Math.sin(fly * Math.PI) * 30})`}>
              <rect x={-11} y={-8} width={22} height={16} rx={2} fill="#fff" stroke="#999" strokeWidth={0.5} />
              <circle cx={0} cy={1} r={4.5} fill="#d9923f" />
            </g>
          ) : null}
          <Appear t={t} at={1} out={3}>
            <Tag at={[150, 60]} text="shoot 150" tone="claude" size={8} />
          </Appear>
          <Appear t={t} at={5.4}>
            <Tag at={[40, 135]} text="HTTP 201 · saved" tone="ok" size={8} />
          </Appear>
        </>
      );
    },
  };
}

export function moveScene(): SceneDef {
  return {
    T: 9,
    view: BENCH_VIEW,
    beats: [
      { at: 0, text: 'USB out. Lift the camera off its MB base', who: 'you' },
      { at: 1.6, text: 'Into the breadboard, its two rows on either side of the gap', who: 'you' },
      { at: 3.6, text: 'Four jumpers from the base’s sockets: 5V, GND, U0R, U0T', who: 'you' },
      { at: 7.2, text: 'USB back in: the base still powers it and talks to the laptop', who: 'claude' },
    ],
    draw: (t) => {
      const m = ke(t, 0.4, 2.4);
      const x = lerp(165, 200, m);
      const y = lerp(45, 118, m);
      const z = lerp(10, 7, m) + Math.sin(m * Math.PI) * 30;
      const sockets = [0, 1, 2, 3].map((i) => P(168 + i * 6, 64, 10));
      const pins = [0, 1, 2, 3].map((i) => P(202 + i * 6, 150, 9));
      return (
        <>
          <Desk />
          <Laptop />
          <Slab x={165} y={45} w={27} d={40} h={10} m={MAT.black} />
          <Breadboard />
          <Camera x={x} y={y} z={z} base={false} />
          {sockets.map((s, i) => (
            <Wire key={i} a={s} b={pins[i]} p={ke(t, 3.6 + i * 0.8, 0.8)} colour={[COLOURS.red, COLOURS.black, COLOURS.yellow, COLOURS.green][i]} sag={16} />
          ))}
          <Wire a={LAPTOP_PORT} b={P(178, 87, 4)} p={t < 6.8 ? 1 - ke(t, 0, 0.6) : ke(t, 7, 0.6)} colour="#1f2124" width={2.4} sag={10} />
        </>
      );
    },
  };
}

export function radioScene(): SceneDef {
  return {
    T: 8,
    view: BENCH_VIEW,
    beats: [
      { at: 0, text: 'Both boards on; the camera already on Wi-Fi', who: 'you' },
      { at: 1, text: 'Claude sends the scale “find”', who: 'claude' },
      { at: 1.6, text: 'The scale calls on each Wi-Fi channel in turn' },
      { at: 4, text: 'The camera answers on its channel' },
      { at: 5, text: 'The display says CAMERA ch 6', who: 'claude' },
    ],
    draw: (t) => {
      const ch = Math.min(6, 1 + Math.floor(Math.max(0, t - 1.6) * 2.2));
      return (
        <>
          <Desk />
          <Laptop />
          <NodeMCU x={MCU.x} y={MCU.y} led />
          <Breadboard />
          <Display x={DISPLAY_AT.x} y={DISPLAY_AT.y} z={7} lines={[t > 5 ? 'CAMERA ch 6' : 'CAMERA ?', '0.0 g', t > 5 ? 'READY' : during(t, 1.6, 5) ? `LOOKING ch ${ch}` : 'READY']} />
          <Camera x={240} y={20} />
          <UsbCable p={1} />
          <Waves at={P(163, 55, 6)} t={t} on={during(t, 1.6, 4.4)} size={50} />
          <Waves at={P(253, 32, 22)} t={t} on={during(t, 4, 5.4)} size={50} colour="#3fb37f" />
          <Appear t={t} at={5}>
            <Tag at={P(250, 100, 50)} text="E link found ch=6" tone="claude" />
          </Appear>
        </>
      );
    },
  };
}

export function portalScene(): SceneDef {
  return {
    T: 10,
    beats: [
      { at: 0, text: 'The camera starts its own setup network', who: 'claude' },
      { at: 1.4, text: 'On your phone, join it', who: 'you' },
      { at: 3.4, text: 'A page opens: pick your home Wi-Fi, type its password', who: 'you' },
      { at: 6.4, text: 'The camera joins your Wi-Fi and the setup network goes away' },
    ],
    view: '-125 -55 330 262',
    draw: (t) => (
      <>
        <Desk />
        <Camera x={200} y={40} />
        <Waves at={P(213, 52, 22)} t={t} on={t < 6.4} size={40} colour="#e08a4f" />
        <Waves at={P(213, 52, 22)} t={t} on={t > 6.6} size={40} colour="#3b6fd0" />
        <Phone at={[-60, 70]} scale={0.95}>
          {t < 3.4 ? (
            <g fontSize={7} fill="#222">
              <text x={8} y={18} fontSize={9} fontWeight={700}>
                Wi-Fi
              </text>
              {['Home Wi-Fi', 'Balance-Setup', 'Neighbour'].map((name, i) => (
                <g key={name}>
                  <rect x={6} y={26 + i * 18} width={78} height={14} rx={3} fill={name === 'Balance-Setup' && t > 1.8 ? '#fbe7d6' : '#fff'} stroke="#ddd" />
                  <text x={11} y={35 + i * 18}>
                    {name}
                  </text>
                </g>
              ))}
            </g>
          ) : (
            <g fontSize={7} fill="#222">
              <text x={8} y={18} fontSize={9} fontWeight={700}>
                Your Wi-Fi
              </text>
              <rect x={6} y={28} width={78} height={14} rx={3} fill="#fff" stroke="#ddd" />
              <text x={11} y={37}>Home Wi-Fi</text>
              <rect x={6} y={48} width={78} height={14} rx={3} fill="#fff" stroke="#ddd" />
              <text x={11} y={57}>{'••••••••'.slice(0, Math.floor(Math.max(0, t - 4) * 6))}</text>
              <rect x={6} y={70} width={78} height={16} rx={8} fill={t > 6 ? '#2a8a5c' : '#e08a4f'} />
              <text x={45} y={81} textAnchor="middle" fill="#fff">
                {t > 6.4 ? 'Connected' : 'Connect'}
              </text>
            </g>
          )}
        </Phone>
        <Appear t={t} at={0.4}>
          <Label at={P(213, 52, 30)} text={t > 6.4 ? 'on your Wi-Fi' : 'Balance-Setup'} dy={-26} tone="accent" />
        </Appear>
      </>
    ),
  };
}
