/**
 * Scenes past the bench: whole meals on the rig, the charts of calibration,
 * the server online, the app, the card, power, the rig and soldering.
 */
import type { ReactNode } from 'react';
import { Appear, Cyl, Drop, MAT, OnTop, P, Slab, type V, during, k, ke, lerp } from './iso';
import {
  Breadboard,
  Button,
  Camera,
  Charger,
  Chart,
  Cloud,
  Desk,
  DeskPhone,
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
  Plate,
  Rig,
  SDCard,
  Tag,
  Waves,
  Wire,
} from './parts';
import type { Beat, SceneDef } from './types';

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

function Flyer({ from, to, p, children }: { from: V; to: V; p: number; children: ReactNode }) {
  if (p <= 0 || p >= 1) return null;
  return <g transform={`translate(${lerp(from[0], to[0], p).toFixed(1)} ${(lerp(from[1], to[1], p) - Math.sin(p * Math.PI) * 30).toFixed(1)})`}>{children}</g>;
}

const Photo = () => (
  <g>
    <rect x={-11} y={-8} width={22} height={16} rx={2} fill="#fff" stroke="#999" strokeWidth={0.5} />
    <circle cx={0} cy={1} r={4.5} fill="#d9923f" />
  </g>
);

// --- a whole meal --------------------------------------------------------------

const MEAL = {
  test: {
    first: { text: 'Claude runs the whole-meal test from the laptop', who: 'claude' as const },
    end: 'Six checks, from the scale to the server: all PASS',
    target: 'laptop',
  },
  app: {
    first: { text: 'The scale is paired; the server is online', who: 'claude' as const },
    end: 'The meal is in your app, with its grams',
    target: 'cloud',
  },
  demo: {
    first: { text: 'In front of people: one real meal, start to finish', who: 'you' as const },
    end: 'Weighed, photographed, named, in the app',
    target: 'cloud',
  },
} as const;

export function mealScene(variant: string): SceneDef {
  const m = MEAL[(variant in MEAL ? variant : 'test') as keyof typeof MEAL];
  const pretend = variant !== 'demo';
  const beats: Beat[] = [
    { at: 0, ...m.first },
    { at: 1, text: pretend ? 'A plate goes on (the pretend weight until milestone 9)' : 'The empty plate goes on', who: pretend ? undefined : 'you' },
    { at: 3.2, text: 'Hold the button 5 s: TARE OK, 0.0 g', who: 'you' },
    { at: 5.4, text: 'Serve the food: the weight settles', who: 'you' },
    { at: 7.6, text: 'Click: the light, the photo, the grams sent', who: 'you' },
    { at: 9.4, text: m.end, who: m.target === 'laptop' ? 'claude' : undefined },
  ];
  return {
    T: 13,
    beats,
    view: '-180 -125 430 341',
    draw: (t) => {
      const raw = t < 5.4 ? landed(0, 420, t - 1.4) : landed(420, 570, t - 5.6);
      const tared = t >= 4.6;
      const shown = raw - (tared ? 420 : 0);
      const bottom = t >= 9.4 ? (m.target === 'laptop' ? 'SAVED' : 'SENT') : t >= 7.6 ? 'WEIGHING' : t >= 4.6 && t < 5.4 ? 'TARE OK' : during(t, 3.4, 4.6) ? `HOLD: TARE IN ${5 - Math.floor((t - 3.4) * 4)} s` : 'READY';
      const plateDrop = ke(t, 1, 0.5);
      const food = ke(t, 5.4, 0.8);
      const flash = during(t, 7.6, 8.2) ? k(t, 7.6, 0.6) : 0;
      const press = during(t, 3.2, 4.6) ? ke(t, 3.2, 0.2) : during(t, 7.4, 7.8) ? ke(t, 7.4, 0.15) * (1 - ke(t, 7.6, 0.15)) : 0;
      const cam = P(205, 70, 125);
      const target = m.target === 'laptop' ? P(65, 30, 60) : [-120, -80];
      return (
        <>
          <Desk />
          {m.target === 'laptop' ? <Laptop screen={t > 9.4 ? <Lines lines={['scale answers   PASS', 'calibrated      PASS', 'plate, tare     PASS', '150 g           PASS', 'photo           PASS', 'saved           PASS']} size={5} gap={7.5} shown={Math.floor((t - 9.4) * 50)} /> : null} /> : <Cloud at={[-120, -80]} label="our server" />}
          <Rig x={150} y={60} flash={flash} />
          {plateDrop > 0 ? (
            <g transform={`translate(0 ${(-(1 - plateDrop) * 40).toFixed(1)})`}>
              <Plate x={200} y={105} z={14} food={food} />
            </g>
          ) : null}
          <Display x={160} y={165} lines={['CAMERA ch 6', grams(t < 1.4 ? 0 : shown), bottom]} />
          <Button x={212} y={168} z={0} press={press} />
          <Finger at={P(218, 174, 6)} down={press} show={during(t, 3, 4.9) || during(t, 7.2, 8.1) ? 1 : 0} />
          <Flyer from={cam} to={target as V} p={ke(t, 8, 1.4)}>
            <Photo />
          </Flyer>
          {m.target === 'cloud' ? (
            <Phone at={[-125, 120]} scale={0.6}>
              {t > 9.4 ? (
                <g opacity={k(t, 9.4, 0.4)} fontSize={7} fill="#222">
                  <text x={8} y={18} fontSize={9} fontWeight={700}>
                    Aujourd’hui
                  </text>
                  <rect x={6} y={28} width={78} height={30} rx={5} fill="#fff" stroke="#e5d6c6" />
                  <circle cx={20} cy={43} r={8} fill="#d9923f" />
                  <text x={33} y={40}>{variant === 'demo' ? 'Your dish' : 'A dish'}</text>
                  <text x={33} y={50} fill="#9a4f1e">
                    150 g
                  </text>
                </g>
              ) : null}
            </Phone>
          ) : null}
          <Appear t={t} at={9.4}>
            <Tag at={P(150, 220, 0)} text={m.target === 'laptop' ? 'all six PASS' : 'in your app'} tone="ok" size={8} />
          </Appear>
        </>
      );
    },
  };
}

// --- charts: the sign, calibration, accuracy ------------------------------------

const MASSES = [100, 200, 500];

export function graphScene(variant: string): SceneDef {
  if (variant === 'sign') {
    return {
      T: 10,
      view: '-120 -120 300 238',
      beats: [
        { at: 0, text: 'Claude watches the raw counts', who: 'claude' },
        { at: 1, text: 'When Claude says “now”, press the cell’s free end gently', who: 'you' },
        { at: 2.4, text: 'The counts rise: the wires are right' },
        { at: 5.6, text: 'If they fall instead: USB out, swap white and green', who: 'you' },
      ],
      draw: (t) => {
        const press = during(t, 1.4, 3.6) ? ke(t, 1.4, 0.4) : 0;
        const wrong = t > 5.6;
        return (
          <>
            <Desk />
            <Slab x={20} y={60} w={30} d={30} h={14} m={MAT.wood} />
            <LoadCell x={28} y={40} z={14} bend={wrong ? 0 : press} />
            <Finger at={P(34, 112, 27)} down={press} show={during(t, 1, 4) ? 1 : 0} />
            <Chart at={[20, -110]} w={150} h={95} xLabel="time" yLabel="counts">
              {(sx, sy) => {
                const n = 40;
                const pts: string[] = [];
                const until = Math.min(1, k(t, 0.6, 3.6));
                for (let i = 0; i <= n * until; i++) {
                  const u = i / n;
                  const bump = Math.exp(-(((u - 0.5) / 0.18) ** 2));
                  pts.push(`${sx(u).toFixed(1)},${sy(0.45 + (wrong ? -0.35 : 0.4) * bump).toFixed(1)}`);
                }
                return (
                  <>
                    <polyline points={pts.join(' ')} fill="none" stroke={wrong ? '#c4473a' : '#2f9a62'} strokeWidth={1.6} />
                    {t > 2.6 ? (
                      <text x={sx(0.95)} y={14} fontSize={8} textAnchor="end" fill={wrong ? '#c4473a' : '#2f9a62'}>
                        {wrong ? 'falls: swap white and green' : 'rises ✓'}
                      </text>
                    ) : null}
                  </>
                );
              }}
            </Chart>
          </>
        );
      },
    };
  }
  if (variant === 'accuracy') {
    return {
      T: 9,
      view: '-150 -120 280 222',
      beats: [
        { at: 0, text: 'Masses the calibration did not use, one at a time', who: 'you' },
        { at: 1.5, text: 'Claude compares what the scale says with what each one weighs', who: 'claude' },
        { at: 6, text: 'The errors, in grams, are written on the accuracy page', who: 'claude' },
      ],
      draw: (t) => (
        <>
          <Chart at={[-140, -110]} w={260} h={170} xLabel="known mass" yLabel="error (g)">
            {(sx, sy) => (
              <>
                <line x1={sx(0)} y1={sy(0.5)} x2={sx(1)} y2={sy(0.5)} stroke="var(--rule-strong, #bbb)" strokeDasharray="3 3" />
                {[0.15, 0.32, 0.5, 0.68, 0.86].map((x, i) => {
                  const on = k(t, 1.5 + i * 0.8, 0.4);
                  const err = [0.04, -0.06, 0.03, -0.02, 0.07][i];
                  return on > 0 ? (
                    <g key={x} opacity={on}>
                      <line x1={sx(x)} y1={sy(0.5 + err - 0.04)} x2={sx(x)} y2={sy(0.5 + err + 0.04)} stroke="#e08a4f" strokeWidth={1.2} />
                      <circle cx={sx(x)} cy={sy(0.5 + err)} r={3} fill="#e08a4f" />
                    </g>
                  ) : null;
                })}
                <text x={sx(0.5)} y={sy(0.95)} fontSize={7} textAnchor="middle" fill="var(--ink, #222)" opacity={0.7}>
                  drawn for the idea, not measured
                </text>
              </>
            )}
          </Chart>
        </>
      ),
    };
  }
  const rehearse = variant === 'rehearse';
  const beats: Beat[] = rehearse
    ? [
        { at: 0, text: 'Watch the display: Claude plays a cell wired backwards (sim sign -1)', who: 'claude' },
        { at: 2.4, text: 'Weight on, the counts fall: what a swapped white and green does' },
        { at: 4.2, text: 'Set right (sim sign 1): they rise', who: 'claude' },
        { at: 6, text: 'Calibration: Claude clears it, then puts pretend masses on', who: 'claude' },
        { at: 9.4, text: 'A straight line through the points: its slope is the counts per gram, kept until restart' },
      ]
    : [
        { at: 0, text: 'Empty plate: Claude tares', who: 'claude' },
        { at: 1.4, text: 'Put on a known mass and say its weight', who: 'you' },
        { at: 2.6, text: 'Claude reads the steady counts (board.py counts --grams)', who: 'claude' },
        { at: 6.6, text: 'One point per mass: a straight line through zero' },
        { at: 8.4, text: 'Its slope, counts per gram, is saved on the board (cal)', who: 'claude' },
      ];
  const start = rehearse ? 6 : 1.4;
  return {
    T: rehearse ? 13 : 11,
    view: rehearse ? '-180 -120 440 349' : '-180 -110 420 333',
    beats,
    draw: (t) => (
      <>
        <Desk />
        {rehearse ? (
          <>
            <NodeMCU x={150} y={30} led />
            <Breadboard />
            <Display x={245} y={118} z={7} lines={['CAMERA ?', t < 6 ? (during(t, 2.4, 4.2) ? '-150.0 g' : t > 4.2 ? '150.0 g' : '0.0 g') : `${t > 9.4 ? 'cal' : 'raw'}`, t < 6 ? 'READY' : 'NOT CALIBRATED']} />
          </>
        ) : (
          <>
            <Rig x={150} y={60} arm={false} />
            {MASSES.map((mass, i) => {
              const on = during(t, start + i * 1.7, i === MASSES.length - 1 ? start + 7 : start + (i + 1) * 1.7);
              return on ? (
                <Drop key={mass} t={t} at={start + i * 1.7}>
                  <Cyl x={200} y={105} z={14} r={6 + i * 2} h={8 + i * 4} m={MAT.silver} />
                  <Label at={P(200, 105, 26 + i * 4)} text={`${mass} g`} dy={-12} tone="accent" />
                </Drop>
              ) : null;
            })}
          </>
        )}
        <Chart at={rehearse ? [-175, -115] : [-175, -105]} w={215} h={140} xLabel="grams" yLabel="counts">
          {(sx, sy) => (
            <>
              {rehearse && t < 6 ? (
                <>
                  <line x1={sx(0)} y1={sy(0.5)} x2={sx(1)} y2={sy(0.5)} stroke="var(--rule-strong, #bbb)" strokeDasharray="3 3" />
                  {t > 2.4 ? <line x1={sx(0)} y1={sy(0.5)} x2={sx(0.6)} y2={sy(t > 4.2 ? 0.85 : 0.15)} stroke={t > 4.2 ? '#2f9a62' : '#c4473a'} strokeWidth={2} /> : null}
                  {t > 2.4 ? (
                    <text x={sx(0.62)} y={sy(t > 4.2 ? 0.87 : 0.13)} fontSize={7} fill={t > 4.2 ? '#2f9a62' : '#c4473a'}>
                      {t > 4.2 ? 'rises ✓' : 'falls ✗'}
                    </text>
                  ) : null}
                </>
              ) : (
                <>
                  {MASSES.map((mass, i) => {
                    const on = k(t, start + 1.2 + i * 1.7, 0.3);
                    return on > 0 ? <circle key={mass} cx={sx(mass / 550)} cy={sy(mass / 550)} r={3.2} fill="#e08a4f" opacity={on} /> : null;
                  })}
                  {t > start + 5.2 ? <line x1={sx(0)} y1={sy(0)} x2={sx(lerp(0, 1, ke(t, start + 5.2, 0.8)))} y2={sy(lerp(0, 1, ke(t, start + 5.2, 0.8)))} stroke="#2f9a62" strokeWidth={1.6} /> : null}
                  {t > start + 7 ? (
                    <text x={sx(0.05)} y={sy(0.88)} fontSize={7.5} fill="#2f9a62">
                      {rehearse ? 'cpg set, saved=0' : 'cal: saved on the board'}
                    </text>
                  ) : null}
                </>
              )}
            </>
          )}
        </Chart>
      </>
    ),
  };
}

// --- online ----------------------------------------------------------------------

function ServerBox({ at, label = 'our server' }: { at: V; label?: string }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <rect x={-34} y={-26} width={68} height={52} rx={6} fill="#22303f" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={-28} y={-20 + i * 15} width={56} height={10} rx={2} fill="#2f4256" />
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={22} cy={-15 + i * 15} r={1.6} fill="#3fb37f" />
      ))}
      <text y={38} textAnchor="middle" fontSize={7.5} fill="var(--ink, #222)">
        {label}
      </text>
    </g>
  );
}

export function cloudScene(variant: string): SceneDef {
  if (variant === 'accounts') {
    const tiles = [
      { name: 'Supabase', does: 'database, sign-in, photos' },
      { name: 'Vercel', does: 'runs our server online' },
      { name: 'Gemini', does: 'names the dish from the photo' },
      { name: 'Expo', does: 'puts the app on your phone' },
    ];
    return {
      T: 9,
      beats: [
        { at: 0, text: 'Four free accounts, each signed up by you', who: 'you' },
        ...tiles.map((tile, i) => ({ at: 1 + i * 1.6, text: `${tile.name}: ${tile.does}` })),
        { at: 7.6, text: 'Keys go in files on the laptop, never in the chat', who: 'you' },
      ],
      view: '-190 -135 470 330',
      draw: (t) => (
        <>
          {tiles.map((tile, i) => {
            const on = ke(t, 1 + i * 1.6, 0.5);
            const x = -160 + (i % 2) * 225;
            const y = -110 + Math.floor(i / 2) * 130;
            return on > 0 ? (
              <g key={tile.name} transform={`translate(${x} ${y + (1 - on) * 20})`} opacity={on}>
                <rect width={205} height={110} rx={12} fill="var(--paper-raised, #fff)" stroke="var(--rule, #ddd)" />
                <text x={16} y={34} fontSize={16} fontWeight={700} fill="var(--ink, #222)">
                  {tile.name}
                </text>
                <text x={16} y={56} fontSize={9.5} fill="var(--ink, #222)" opacity={0.75}>
                  {tile.does}
                </text>
                {t > 1.8 + i * 1.6 ? <Tag at={[150, 86]} text="signed up ✓" tone="ok" size={8} /> : null}
              </g>
            ) : null;
          })}
        </>
      ),
    };
  }
  if (variant === 'server') {
    const parts = ['accounts', 'pairing', 'the to-name inbox', 'photos'];
    return {
      T: 9,
      view: '-80 -110 350 278',
      beats: [
        { at: 0, text: 'Claude writes version 2 of the server, on the laptop', who: 'claude' },
        ...parts.map((part, i) => ({ at: 1.2 + i * 1.4, text: `Adds ${part}` })),
        { at: 7, text: 'Tested before it leaves the laptop', who: 'claude' },
      ],
      draw: (t) => (
        <>
          <Desk />
          <Laptop screen={<Lines lines={['def save_meal(...):', '  ...', 'tests: passed']} size={6} shown={Math.floor(t * 20)} />} />
          <ServerBox at={[150, -40]} label="server v2" />
          {parts.map((part, i) => {
            const p = ke(t, 1.2 + i * 1.4, 1);
            return p > 0 && p < 1 ? (
              <Flyer key={part} from={P(65, 30, 60)} to={[150, -40]} p={p}>
                <Tag at={[0, 0]} text={part} tone="claude" size={7} />
              </Flyer>
            ) : null;
          })}
          {parts.map((part, i) =>
            t > 2.2 + i * 1.4 ? (
              <text key={part} x={200} y={-60 + i * 12} fontSize={7} fill="var(--tip-ink, #2f7a52)">
                ✓ {part}
              </text>
            ) : null,
          )}
          <Appear t={t} at={7}>
            <Tag at={[60, 150]} text="tests pass" tone="ok" size={8} />
          </Appear>
        </>
      ),
    };
  }
  if (variant === 'deploy') {
    return {
      T: 8,
      view: '-110 -150 330 262',
      beats: [
        { at: 0, text: 'Claude sends the server to Vercel', who: 'claude' },
        { at: 2.6, text: 'It runs online, with the database on Supabase' },
        { at: 4.6, text: 'An https address: the phone and the scale reach it from anywhere' },
      ],
      draw: (t) => {
        const up = ke(t, 0.6, 2);
        return (
          <>
            <Desk />
            <Laptop />
            <Cloud at={[100, -95]} label="online" scale={1.6} />
            <ServerBox at={[lerp(65, 100, up), lerp(-20, -95, up)]} />
            <Appear t={t} at={2.6}>
              <g transform="translate(190 -70)">
                <Cyl x={0} y={0} r={12} h={22} m={MAT.green} />
              </g>
              <Label at={[190, -95]} text="database" dy={-8} />
            </Appear>
            <Appear t={t} at={4.6}>
              <Tag at={[100, -40]} text="https://… ✓" tone="ok" size={8.5} />
            </Appear>
            <DeskPhone x={50} y={130} on />
            {t > 5 ? <line x1={P(61, 150, 6)[0]} y1={P(61, 150, 6)[1]} x2={100} y2={-80} stroke="#3fb37f" strokeDasharray="3 3" opacity={k(t, 5, 0.5)} /> : null}
          </>
        );
      },
    };
  }
  return {
    T: 9,
    view: '-95 -150 380 302',
    beats: [
      { at: 0, text: 'A fake scale: a small program that sends meals as if it were your scale', who: 'claude' },
      { at: 2, text: 'Each meal goes to the online server' },
      { at: 4.5, text: 'So the app can be built before the real scale is paired' },
    ],
    draw: (t) => (
      <>
        <Desk />
        <Laptop screen={<Lines lines={['$ fake_scale.py', 'sent 150 g', 'sent 220 g', 'sent 90 g'].slice(0, 1 + Math.floor(t / 2))} size={6} />} />
        <Cloud at={[120, -95]} label="our server" scale={1.4} />
        {[0, 1, 2].map((i) => (
          <Flyer key={i} from={P(65, 30, 60)} to={[120, -95]} p={k(t, 2 + i * 2, 1.4)}>
            <Tag at={[0, 0]} text={['150 g', '220 g', '90 g'][i]} tone="claude" size={7} />
          </Flyer>
        ))}
        <g opacity={0.5}>
          <Rig x={170} y={80} />
        </g>
        <Label at={P(225, 125, 20)} text="pretend, no hardware" dy={40} />
      </>
    ),
  };
}

// --- the app ----------------------------------------------------------------------

function AppFrame({ children }: { t: number; children: ReactNode }) {
  return (
    <Phone at={[130, 50]} scale={1.25}>
      {children}
    </Phone>
  );
}

export function appScene(variant: string): SceneDef {
  switch (variant) {
    case 'expo':
      return {
        T: 8,
        view: '-60 -80 315 250',
        beats: [
          { at: 0, text: 'Install Expo Go on your phone', who: 'you' },
          { at: 1.4, text: 'Claude starts the app; a QR code shows on the laptop', who: 'claude' },
          { at: 3, text: 'Scan it with the phone', who: 'you' },
          { at: 5, text: 'Our app opens on your phone' },
        ],
        draw: (t) => (
          <>
            <Desk />
            <Laptop
              screen={
                t > 1.4 ? (
                  <g transform="translate(30 6)">
                    {Array.from({ length: 49 }, (_, i) => ((i * 7 + (i % 5)) % 3 ? <rect key={i} x={(i % 7) * 7} y={Math.floor(i / 7) * 7} width={6} height={6} fill="#e8e8e8" /> : null))}
                  </g>
                ) : null
              }
            />
            <AppFrame t={t}>
              {t < 5 ? (
                <g>
                  <rect width={90} height={170} fill="#111" />
                  {t > 3 ? <rect x={20} y={55} width={50} height={50} fill="none" stroke="#9fe3b0" strokeWidth={2} /> : null}
                  <text x={45} y={140} textAnchor="middle" fontSize={8} fill="#ddd">
                    {t > 3 ? 'scanning…' : 'Expo Go'}
                  </text>
                </g>
              ) : (
                <g opacity={k(t, 5, 0.5)}>
                  <rect width={90} height={170} fill="#fbf4ec" />
                  <circle cx={45} cy={70} r={18} fill="#e08a4f" />
                  <text x={45} y={110} textAnchor="middle" fontSize={11} fontWeight={700} fill="#222">
                    Balance
                  </text>
                </g>
              )}
            </AppFrame>
          </>
        ),
      };
    case 'signin':
      return {
        T: 8,
        view: '-27 -78 315 250',
        beats: [
          { at: 0, text: 'Open the app: Se connecter', who: 'you' },
          { at: 1, text: 'Your email, then the code it sends you', who: 'you' },
          { at: 4.6, text: 'Signed in: the app knows it is you' },
        ],
        draw: (t) => (
          <AppFrame t={t}>
            {t < 4.6 ? (
              <g fontSize={7.5} fill="#222">
                <text x={10} y={30} fontSize={11} fontWeight={700}>
                  Se connecter
                </text>
                <rect x={8} y={44} width={74} height={16} rx={4} fill="#fff" stroke="#ddd" />
                <text x={12} y={55}>{'you@example.com'.slice(0, Math.floor(Math.max(0, t - 1) * 8))}</text>
                <rect x={8} y={68} width={74} height={16} rx={4} fill="#fff" stroke="#ddd" />
                <text x={12} y={79}>{'123456'.slice(0, Math.floor(Math.max(0, t - 3) * 5))}</text>
                <rect x={8} y={94} width={74} height={18} rx={9} fill="#e08a4f" />
                <text x={45} y={106} textAnchor="middle" fill="#fff">
                  Continuer
                </text>
              </g>
            ) : (
              <g opacity={k(t, 4.6, 0.4)} fontSize={8} fill="#222">
                <text x={10} y={30} fontSize={12} fontWeight={700}>
                  Bonjour !
                </text>
                <text x={10} y={48}>
                  Votre balance vous attend.
                </text>
              </g>
            )}
          </AppFrame>
        ),
      };
    case 'today':
      return {
        T: 8,
        view: '-27 -78 315 250',
        beats: [
          { at: 0, text: 'Aujourd’hui: the day at a glance' },
          { at: 1.4, text: 'Each meal the scale sent: its photo, its name, its grams' },
          { at: 4.6, text: 'Nutrients shown as estimates, always marked so' },
        ],
        draw: (t) => (
          <AppFrame t={t}>
            <g fontSize={7} fill="#222">
              <text x={8} y={22} fontSize={11} fontWeight={700}>
                Aujourd’hui
              </text>
              {['Couscous', 'Lablabi', 'Salade'].map((name, i) => {
                const on = ke(t, 1.4 + i * 0.8, 0.5);
                return on > 0 ? (
                  <g key={name} transform={`translate(${(1 - on) * 30} 0)`} opacity={on}>
                    <rect x={6} y={34 + i * 34} width={78} height={28} rx={5} fill="#fff" stroke="#e5d6c6" />
                    <circle cx={20} cy={48 + i * 34} r={8} fill={['#d9923f', '#c4473a', '#7da34a'][i]} />
                    <text x={33} y={45 + i * 34}>{name}</text>
                    <text x={33} y={55 + i * 34} fill="#9a4f1e">
                      {[150, 220, 90][i]} g
                    </text>
                  </g>
                ) : null;
              })}
              {t > 4.6 ? (
                <text x={8} y={150} fontSize={6.5} fill="#9a4f1e" opacity={k(t, 4.6, 0.4)}>
                  ≈ estimates, not measured
                </text>
              ) : null}
            </g>
          </AppFrame>
        ),
      };
    case 'toname':
      return {
        T: 8,
        view: '-27 -78 315 250',
        beats: [
          { at: 0, text: 'À nommer: Gemini could not name this one' },
          { at: 1.4, text: 'Type its name', who: 'you' },
          { at: 4, text: 'Enregistrer: it joins today’s meals, with its grams', who: 'you' },
        ],
        draw: (t) => (
          <AppFrame t={t}>
            <g fontSize={7.5} fill="#222">
              <text x={8} y={22} fontSize={11} fontWeight={700}>
                À nommer
              </text>
              <rect x={10} y={32} width={70} height={52} rx={5} fill="#f1e2cf" />
              <circle cx={45} cy={58} r={16} fill="#c4473a" />
              <text x={10} y={96} fill="#9a4f1e">
                220 g
              </text>
              <rect x={8} y={102} width={74} height={16} rx={4} fill="#fff" stroke="#ddd" />
              <text x={12} y={113}>{'Lablabi'.slice(0, Math.floor(Math.max(0, t - 1.4) * 4))}</text>
              <rect x={8} y={126} width={74} height={18} rx={9} fill={t > 4 ? '#2a8a5c' : '#e08a4f'} />
              <text x={45} y={138} textAnchor="middle" fill="#fff">
                {t > 4.3 ? 'Enregistré ✓' : 'Enregistrer'}
              </text>
            </g>
          </AppFrame>
        ),
      };
    default:
      return {
        T: 9,
        view: '-160 -75 370 294',
        beats: [
          { at: 0, text: 'The scale shows a pairing code on its display' },
          { at: 1.4, text: 'Type it in the app', who: 'you' },
          { at: 4.6, text: 'Balance connectée: its meals now arrive under your account' },
        ],
        draw: (t) => (
          <>
            <Desk />
            <g transform={`translate(${P(187, 111, 15).join(' ')}) scale(2.6) translate(${P(187, 111, 15).map((v) => -v).join(' ')})`}>
              <Display x={170} y={110} lines={['PAIRING', '123 456', 'in the app']} />
            </g>
            <Label at={[P(187, 111, 15)[0], P(187, 111, 15)[1] - 45]} text="an example code" dy={-14} />
            <Phone at={[-90, 60]} scale={1}>
              <g fontSize={7.5} fill="#222">
                <text x={8} y={22} fontSize={10} fontWeight={700}>
                  Ma balance
                </text>
                <rect x={8} y={40} width={74} height={18} rx={4} fill="#fff" stroke="#ddd" />
                <text x={14} y={52} fontSize={9}>
                  {'123 456'.slice(0, Math.floor(Math.max(0, t - 1.4) * 4))}
                </text>
                {t > 4.6 ? (
                  <g opacity={k(t, 4.6, 0.4)}>
                    <rect x={8} y={70} width={74} height={20} rx={10} fill="#2a8a5c" />
                    <text x={45} y={83} textAnchor="middle" fill="#fff">
                      Balance connectée ✓
                    </text>
                  </g>
                ) : null}
              </g>
            </Phone>
          </>
        ),
      };
  }
}

// --- the finished scale ------------------------------------------------------------

export function cardScene(): SceneDef {
  return {
    T: 11,
    view: '-135 -110 290 230',
    beats: [
      { at: 0, text: 'A microSD card, FAT32, into the camera’s slot', who: 'you' },
      { at: 2.4, text: 'Claude turns the hotspot’s link off to test: a photo is kept on the card', who: 'claude' },
      { at: 6.2, text: 'Wi-Fi back: the kept photo is sent', who: 'claude' },
    ],
    draw: (t) => {
      const wifi = !during(t, 2.4, 6.2);
      const cam = P(188, 57, 25);
      return (
        <>
          <Desk />
          <Cloud at={[-110, -80]} label="our server" />
          <Camera x={175} y={45} flash={during(t, 3.4, 4) ? k(t, 3.4, 0.6) : 0} />
          {t < 2 ? <SDCard x={lerp(230, 182, ke(t, 0.4, 1.4))} y={70} z={12} /> : null}
          <DeskPhone x={50} y={130} on={wifi} />
          <Waves at={P(61, 150, 6)} t={t} on={wifi} size={36} colour="#3b6fd0" />
          {!wifi ? <Tag at={P(61, 170, 0)} text="Wi-Fi off" tone="bad" size={7.5} /> : null}
          <Flyer from={cam} to={P(200, 85, 0)} p={ke(t, 4, 1)}>
            <Photo />
          </Flyer>
          <Appear t={t} at={5} out={6.4}>
            <Tag at={[120, 120]} text="kept on the card" tone="ok" size={7.5} />
          </Appear>
          <Flyer from={P(200, 85, 0)} to={[-110, -80]} p={ke(t, 6.6, 1.6)}>
            <Photo />
          </Flyer>
          <Appear t={t} at={8.4}>
            <Tag at={[-110, -50]} text="sent later ✓" tone="ok" size={7.5} />
          </Appear>
        </>
      );
    },
  };
}

export function powerScene(): SceneDef {
  return {
    T: 9,
    view: '-110 -80 350 278',
    beats: [
      { at: 0, text: 'USB out of the laptop', who: 'you' },
      { at: 1.4, text: 'A 5 V, 2 A phone charger instead (not a power bank)', who: 'you' },
      { at: 3.4, text: 'The 1000 µF capacitors steady the 5 V when the camera starts', who: 'you' },
      { at: 5.4, text: 'Both boards run with no laptop' },
    ],
    draw: (t) => (
      <>
        <Desk />
        <g opacity={1 - k(t, 0.4, 1.2) * 0.75}>
          <Laptop />
        </g>
        <NodeMCU x={150} y={30} led={t > 5.4} />
        <Breadboard />
        <Camera x={240} y={30} />
        <Wire a={P(120, 50, 2.5)} b={P(163, 26, 3)} p={1 - ke(t, 0.2, 0.8)} colour="#1f2124" width={2.4} sag={10} />
        <Drop t={t} at={1.4}>
          <Charger x={40} y={140} />
        </Drop>
        <Wire a={P(51, 140, 20)} b={P(160, 158, 7)} p={ke(t, 2.2, 1)} colour="#1f2124" width={2.4} sag={20} />
        <Drop t={t} at={3.4}>
          <Cyl x={180} y={150} z={7} r={4} h={12} m={{ top: '#333', left: '#1f3f73', right: '#183461' }} />
          <Cyl x={195} y={150} z={7} r={4} h={12} m={{ top: '#333', left: '#1f3f73', right: '#183461' }} />
        </Drop>
        <Appear t={t} at={3.6}>
          <Label at={P(187, 150, 20)} text="2 × 1000 µF" dy={-18} />
        </Appear>
        <Waves at={P(253, 42, 22)} t={t} on={t > 5.4} size={20} colour="#3fb37f" />
        <Appear t={t} at={5.4}>
          <Tag at={P(150, 220, 0)} text="no laptop" tone="ok" size={8.5} />
        </Appear>
      </>
    ),
  };
}

export function rigScene(variant: string): SceneDef {
  if (variant === 'mount') {
    return {
      T: 10,
      view: '-40 30 220 175',
      beats: [
        { at: 0, text: 'The load cell bolts to the base at one end only', who: 'you' },
        { at: 2.4, text: 'The top plate bolts to its other end', who: 'you' },
        { at: 4.6, text: 'Weight on the plate bends the free end: that is what it measures' },
        { at: 7, text: 'Nothing else may touch the cell or the plate' },
      ],
      draw: (t) => {
        const bend = during(t, 4.6, 7) ? ke(t, 4.6, 0.4) : 0;
        return (
          <>
            <Desk />
            <Slab x={120} y={60} w={110} d={90} h={10} m={MAT.wood} />
            <Drop t={t} at={0.4}>
              <Slab x={169} y={64} z={10} w={16} d={22} h={6} m={MAT.wood} />
              <LoadCell x={170} y={62} z={16} bend={bend} />
            </Drop>
            <Appear t={t} at={1.2}>
              <Label at={P(176, 70, 30)} text="fixed end" dx={-40} dy={-24} tone="accent" />
            </Appear>
            <Drop t={t} at={2.4}>
              <Slab x={168} y={130} z={29} w={18} d={14} h={6} m={MAT.wood} />
              <g transform={`translate(0 ${bend * 4})`}>
                <Slab x={135} y={105} z={35} w={80} d={45} h={4} m={MAT.wood} />
              </g>
            </Drop>
            <Appear t={t} at={3}>
              <Label at={P(176, 138, 30)} text="free end" dx={50} dy={20} tone="accent" />
            </Appear>
            <Finger at={P(175, 128, 40)} down={bend} show={during(t, 4.2, 7.2) ? 1 : 0} />
          </>
        );
      },
    };
  }
  return {
    T: 9,
    view: '12 -20 275 218',
    beats: [
      { at: 0, text: 'The base: a board under everything', who: 'you' },
      { at: 1.6, text: 'The post and the arm hold the camera above the plate', who: 'you' },
      { at: 4, text: 'The camera looks straight down at the plate', who: 'you' },
      { at: 5.6, text: 'The plate sits on top. The cell goes in at milestone 9.' },
    ],
    draw: (t) => (
      <>
        <Desk />
        <Drop t={t} at={0.2}>
          <Slab x={150} y={60} w={110} d={90} h={10} m={MAT.wood} />
        </Drop>
        <Drop t={t} at={1.6}>
          <Slab x={246} y={64} z={10} w={8} d={8} h={120} m={MAT.wood} />
        </Drop>
        <Drop t={t} at={2.6}>
          <Slab x={190} y={64} z={130} w={64} d={8} h={6} m={MAT.wood} />
        </Drop>
        <Drop t={t} at={4}>
          <Camera x={188} y={48} z={118} base={false} />
        </Drop>
        <Drop t={t} at={5.6}>
          <Slab x={165} y={70} z={10} w={70} d={70} h={4} m={MAT.wood} />
        </Drop>
        <Appear t={t} at={4.4}>
          <line x1={P(201, 60, 118)[0]} y1={P(201, 60, 118)[1]} x2={P(200, 105, 14)[0]} y2={P(200, 105, 14)[1]} stroke="var(--accent, #e08a4f)" strokeDasharray="3 3" />
        </Appear>
      </>
    ),
  };
}

export function solderScene(): SceneDef {
  const pins = Array.from({ length: 8 }, (_, i) => (i < 4 ? P(194 + i * 8, 92, 12) : P(194 + (i - 4) * 8, 152, 12)));
  return {
    T: 12,
    view: '-170 -40 330 262',
    beats: [
      { at: 0, text: 'At the lab: the header strip in, short side up', who: 'you' },
      { at: 1.6, text: 'The iron touches the pad and the pin together, about two seconds', who: 'you' },
      { at: 3, text: 'Solder flows into a small shiny cone', who: 'you' },
      { at: 5.6, text: 'All eight: four on each side' },
    ],
    draw: (t) => {
      const i = Math.min(7, Math.floor(Math.max(0, t - 1.6) / 1.1));
      const pin = pins[i];
      const on = t > 1.6 && t < 1.6 + 8 * 1.1;
      return (
        <>
          <Desk />
          <g transform="translate(-200 -110) scale(1.9)">
            <Slab x={180} y={80} w={50} d={80} h={10} m={MAT.wood} />
            <HX711 x={190} y={88} z={10} />
          </g>
          {pins.map((p, j) => {
            const done = t > 1.6 + j * 1.1 + 0.8;
            const at: V = [-200 + p[0] * 1.9, -110 + p[1] * 1.9];
            return done ? <circle key={j} cx={at[0]} cy={at[1]} r={3.4} fill="#e4e6e8" stroke="#9aa0a6" strokeWidth={0.8} /> : null;
          })}
          {on ? (
            <g>
              <line x1={-200 + pin[0] * 1.9} y1={-110 + pin[1] * 1.9 - 3} x2={-200 + pin[0] * 1.9 + 70} y2={-110 + pin[1] * 1.9 - 90} stroke="#8a8f94" strokeWidth={4} strokeLinecap="round" />
              <line x1={-200 + pin[0] * 1.9 + 50} y1={-110 + pin[1] * 1.9 - 64} x2={-200 + pin[0] * 1.9 + 110} y2={-110 + pin[1] * 1.9 - 140} stroke="#3a3f45" strokeWidth={10} strokeLinecap="round" />
              {[0, 1, 2].map((s) => {
                const p = (t * 0.7 + s / 3) % 1;
                return <circle key={s} cx={-200 + pin[0] * 1.9 + Math.sin(p * 6) * 4} cy={-110 + pin[1] * 1.9 - 8 - p * 30} r={3 + p * 5} fill="#c9ccd0" opacity={0.5 * (1 - p)} />;
              })}
            </g>
          ) : null}
          <Appear t={t} at={10.6}>
            <Tag at={[40, 150]} text="8 shiny cones ✓" tone="ok" size={8.5} />
          </Appear>
        </>
      );
    },
  };
}

