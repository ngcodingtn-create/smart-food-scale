import type { ReactNode } from 'react';

/**
 * Bench equipment and build materials: power sources, meters, hand tools, the
 * calibration masses and the pieces the scale itself is built from.
 *
 * Same conventions as ./reference.tsx — each entry is the content of an
 * <svg viewBox="0 0 120 90">, artwork inside x 8..112 / y 8..82, colour only
 * through the classes in ../request.css, one `.hot` accent per drawing.
 */

const rad = (deg: number) => (deg * Math.PI) / 180;
/** Trim computed coordinates to two decimals so the markup stays readable. */
const f = (n: number) => Math.round(n * 100) / 100;

// Calibration masses: left edge, width, body height, label baseline.
const WEIGHTS = [
  { x: 12, w: 24, h: 24, ty: 62, label: '100 g' },
  { x: 42, w: 28, h: 30, ty: 59, label: '200 g' },
  { x: 76, w: 34, h: 38, ty: 50, label: '500 g' },
];

// Horizontal wobble of each coin in the side-on stack, so it looks dropped, not drawn.
const COIN_X = [0, 1.5, -0.5, 1, -1, 0.5];

// Emblem on the face-on coin: a five-point star.
const COIN_STAR = Array.from({ length: 10 }, (_, k) => {
  const r = k % 2 === 0 ? 8.5 : 3.6;
  const a = rad(-90 + k * 36);
  return `${f(88 + r * Math.cos(a))},${f(48 + r * Math.sin(a))}`;
}).join(' ');

// Reeded rim of the face-on coin: 28 short radial ticks.
const COIN_RIM = Array.from({ length: 28 }, (_, i) => {
  const a = rad((i * 360) / 28);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return `M${f(88 + 18.6 * c)} ${f(48 + 18.6 * s)}L${f(88 + 20.4 * c)} ${f(48 + 20.4 * s)}`;
}).join('');

export const ART_BENCH: Record<string, ReactNode> = {
  // 5 V USB wall charger, side-on: mains pins left, USB plug and cable right.
  charger: (
    <>
      {/* the two round mains pins */}
      <rect className="metal" x="16" y="30" width="15" height="6" rx="2.5" />
      <rect className="metal" x="16" y="54" width="15" height="6" rx="2.5" />
      {/* cube body */}
      <rect className="body" x="30" y="24" width="36" height="42" rx="3" />
      <path className="ln-faint" d="M35 24v42" />
      <text x="50.5" y="49" textAnchor="middle">5 V 2 A</text>
      {/* power indicator */}
      <circle className="hot" cx="58" cy="32" r="2" />
      {/* USB plug in the front socket, then the cable */}
      <rect className="metal" x="66" y="40" width="12" height="10" rx="1.5" />
      <rect className="body" x="78" y="41" width="7" height="8" rx="2" />
      <path className="ln" d="M85 45h3c9 0 9 15 17 15" />
    </>
  ),

  // Slim power bank lying flat, with a cable plugged into one end.
  'power-bank': (
    <>
      <rect className="body" x="12" y="26" width="72" height="38" rx="3" />
      {/* printed label and a lightning bolt */}
      <rect className="ln-faint" x="40" y="32" width="34" height="9" rx="1.5" />
      <path className="ln-thin" d="M32 31l-6 8h6l-4 8" />
      {/* charge indicator: one lit, three dark */}
      {Array.from({ length: 4 }, (_, i) =>
        i === 0 ? (
          <circle key="led0" className="hot" cx="26" cy="54" r="2.7" />
        ) : (
          <circle key={`led${i}`} className="ln-thin" cx={26 + i * 9} cy="54" r="2.2" />
        ),
      )}
      {/* power button */}
      <circle className="ln-thin" cx="72" cy="52" r="3.6" />
      <path className="ln-thin" d="M72 49.8v2.4" />
      {/* USB plug on the end, and the short cable */}
      <rect className="metal" x="84" y="40" width="11" height="10" rx="1.5" />
      <rect className="body" x="95" y="41.5" width="6" height="7" rx="2" />
      <path className="ln" d="M101 45h2c6 0 7 14 5 22" />
    </>
  ),

  // Laboratory DC bench power supply, front panel.
  'bench-psu': (
    <>
      <rect className="chip" x="16" y="72" width="12" height="4" rx="1.2" />
      <rect className="chip" x="92" y="72" width="12" height="4" rx="1.2" />
      <rect className="body" x="10" y="16" width="100" height="56" rx="2" />
      {/* voltage and current displays */}
      <rect className="chip" x="16" y="22" width="34" height="17" rx="1.5" />
      <text className="on-dark" x="33" y="33" textAnchor="middle">5.00</text>
      <rect className="chip" x="54" y="22" width="34" height="17" rx="1.5" />
      <text className="on-dark" x="71" y="33" textAnchor="middle">0.00</text>
      {/* mains switch */}
      <circle className="ln-thin" cx="99" cy="30.5" r="4" />
      <path className="ln-thin" d="M99 27.5v3" />
      <path className="ln-faint" d="M14 45h92" />
      {/* voltage and current knobs */}
      <circle className="body" cx="26" cy="58" r="8" />
      <circle className="ln-faint" cx="26" cy="58" r="5.2" />
      <path className="ln-thin" d="M26 58l3.5-5.5" />
      <circle className="body" cx="48" cy="58" r="8" />
      <circle className="ln-faint" cx="48" cy="58" r="5.2" />
      <path className="ln-thin" d="M48 58l-4-5" />
      {/* binding posts: positive (red) and negative (black) */}
      <circle className="ln-thin" cx="80" cy="58" r="5.2" />
      <circle className="hot" cx="80" cy="58" r="3.4" />
      <circle className="ln-thin" cx="96" cy="58" r="5.2" />
      <circle className="chip" cx="96" cy="58" r="3.4" />
    </>
  ),

  // Handheld digital multimeter with two probe leads.
  multimeter: (
    <>
      <rect className="body" x="22" y="8" width="40" height="62" rx="3" />
      {/* display */}
      <rect className="wash" x="27" y="13" width="30" height="12" rx="1.5" />
      <rect className="ln-thin" x="27" y="13" width="30" height="12" rx="1.5" />
      <text x="42" y="21.5" textAnchor="middle">5.01</text>
      {/* range marks around the selector */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = rad(135 + i * 30);
        const c = Math.cos(a);
        const s = Math.sin(a);
        return (
          <path
            key={`tick${i}`}
            className="ln-thin"
            d={`M${f(42 + 13 * c)} ${f(43 + 13 * s)}L${f(42 + 15.2 * c)} ${f(43 + 15.2 * s)}`}
          />
        );
      })}
      {/* selector dial and its pointer */}
      <circle className="metal" cx="42" cy="43" r="10.5" />
      <circle className="ln-faint" cx="42" cy="43" r="5" />
      <path className="hot-ln" d="M43.15 41.36L47.45 35.22" />
      {/* three sockets */}
      {Array.from({ length: 3 }, (_, i) => (
        <g key={`sock${i}`}>
          <circle className="ln-thin" cx={32 + i * 10} cy="62" r="4.2" />
          <circle className="chip" cx={32 + i * 10} cy="62" r="2.4" />
        </g>
      ))}
      {/* leads: black from the first socket, red from the second */}
      <path className="ln" d="M32 62v10q0 7 7 7h48q9 0 9-8v-16" />
      <path className="ln" d="M42 62v7q0 4 4 4h28q6 0 6-6v-13" />
      {/* probes */}
      <rect className="chip" x="93" y="34" width="6" height="21" rx="2" />
      <path className="ln" d="M96 34v-7" />
      <rect className="body" x="77" y="36" width="6" height="18" rx="2" />
      <path className="ln" d="M80 36v-8" />
    </>
  ),

  // Soldering iron resting in its spring stand, tip glowing.
  'soldering-iron': (
    <>
      {/* stand: weighted base and the riser that carries the spring */}
      <rect className="metal" x="56" y="66" width="40" height="9" rx="2" />
      <rect className="body" x="72.5" y="46" width="6" height="20" rx="1" />
      {/* mains cable */}
      <path className="ln" d="M24 40h-4c-6 0-8 5-8 11" />
      {/* handle, ferrule, barrel */}
      <rect className="chip" x="24" y="33" width="34" height="14" rx="5" />
      <rect className="metal" x="57" y="35" width="5" height="10" rx="1.2" />
      <rect className="metal" x="62" y="37" width="24" height="6" rx="1.2" />
      {/* heat halo, tip, glowing end */}
      <circle className="glow" cx="101" cy="40" r="6" />
      <path className="metal" d="M86 37.4L100 38.8Q103 40 100 41.2L86 42.6Z" />
      <circle className="hot" cx="101.5" cy="40" r="1.8" />
      {/* the coiled spring around the barrel */}
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={`coil${i}`} className="ln-thin" cx={66 + i * 3.6} cy="40" rx="2.2" ry="8.5" />
      ))}
      {/* a wisp of flux smoke */}
      <path className="ln-faint" d="M101 33c-3-3 3-5 0-8s3-5 0-8" />
    </>
  ),

  // Calibration masses: three knob-topped cylinders, 100 g / 200 g / 500 g.
  weights: (
    <>
      <path className="ln-thin" d="M8 72.8H112" />
      {Array.from({ length: WEIGHTS.length }, (_, i) => {
        const m = WEIGHTS[i];
        const top = 72 - m.h;
        const cx = m.x + m.w / 2;
        const nw = f(m.w * 0.26);
        const kr = f(m.w * 0.2);
        const kcy = f(top - 4 - kr);
        return (
          <g key={m.label}>
            {/* neck, knob, then the cylinder over them */}
            <rect className="metal" x={f(cx - nw / 2)} y={top - 5} width={nw} height="6" rx="1" />
            <circle className="metal" cx={cx} cy={kcy} r={kr} />
            <rect className="metal" x={m.x} y={top} width={m.w} height={m.h} rx="3" />
            {i === 2 && (
              <>
                {/* the heaviest mass wears the accent band */}
                <rect className="hot" x={m.x} y="57" width={m.w} height="5" />
                <rect className="ln" x={m.x} y={top} width={m.w} height={m.h} rx="3" />
                <path className="ln-thin" d={`M${m.x} 57H${m.x + m.w}M${m.x} 62H${m.x + m.w}`} />
              </>
            )}
            {/* chamfered shoulder and foot ring */}
            <path
              className="ln-faint"
              d={`M${m.x + 2} ${top + 4.5}H${m.x + m.w - 2}M${m.x + 2} 68H${m.x + m.w - 2}`}
            />
            <text x={cx} y={m.ty} textAnchor="middle">{m.label}</text>
          </g>
        );
      })}
    </>
  ),

  // Stack of coins side-on, one coin face-on, and a "known mass" dimension.
  coins: (
    <>
      <path className="ln-thin" d="M8 71H112" />
      {Array.from({ length: 6 }, (_, i) => {
        const x = 12 + COIN_X[i];
        const y = 62 - i * 7;
        const reed = Array.from({ length: 10 }, (_, k) => `M${f(x + 3 + k * 3.2)} ${y + 2}v4`).join('');
        return (
          <g key={`coin${i}`}>
            <rect className="metal" x={x} y={y} width="34" height="8" rx="2" />
            <path className="ln-faint" d={reed} />
          </g>
        );
      })}
      {/* the face-on coin */}
      <circle className="metal" cx="88" cy="48" r="22" />
      <path className="ln-faint" d={COIN_RIM} />
      <circle className="ln-thin" cx="88" cy="48" r="16" />
      <polygon className="hot" points={COIN_STAR} />
      {/* known mass */}
      <path className="cool-ln" d="M56.5 27V70M53 30.5L56.5 27l3.5 3.5M53 66.5L56.5 70l3.5-3.5" />
    </>
  ),

  // Dinner plate from above, with its diameter dimensioned underneath.
  plate: (
    <>
      <circle className="body" cx="60" cy="38" r="29" />
      <circle className="ln-thin" cx="60" cy="38" r="25.5" />
      <path className="ln-faint" d="M34.44 28.7A27.2 27.2 0 0 1 50.7 12.44" />
      <circle className="wash" cx="60" cy="38" r="19" />
      <circle className="hot-ln" cx="60" cy="38" r="19" />
      {/* extension lines and the diameter */}
      <path className="ln-faint" d="M31 38V69.5M89 38V69.5" />
      <path className="cool-ln" d="M31 73H46M74 73H89M31 69.5v7M89 69.5v7" />
      <text x="60" y="75" textAnchor="middle">Ø 18 cm</text>
    </>
  ),

  // Exploded Z-mount: platform, spacer, load cell, spacer, base.
  platform: (
    <>
      {/* assembly axes */}
      <path
        className="ln-faint"
        strokeDasharray="1.6 1.6"
        d="M76 19v8M90 19v8M76 34v6M90 34v6M30 50v6M44 50v6M30 63v7M44 63v7"
      />
      {/* weighing platform */}
      <rect className="body" x="12" y="12" width="96" height="7" rx="3" />
      {/* spacer over the loaded (right) end */}
      <rect className="hot" x="76" y="27" width="14" height="7" rx="1" />
      <rect className="ln" x="76" y="27" width="14" height="7" rx="1" />
      {/* load-cell bar */}
      <rect className="metal" x="26" y="40" width="68" height="10" rx="2" />
      <rect className="wash" x="48" y="43.5" width="24" height="3" rx="1.5" />
      {/* spacer under the fixed (left) end */}
      <rect className="hot" x="30" y="56" width="14" height="7" rx="1" />
      <rect className="ln" x="30" y="56" width="14" height="7" rx="1" />
      <text x="52" y="64">Z-mount</text>
      {/* base */}
      <rect className="body" x="14" y="70" width="92" height="8" rx="2" />
    </>
  ),

  // Plywood / MDF / acrylic sheet: two sheets, grain, a cut slot, the thickness.
  'sheet-material': (
    <>
      {/* the sheet behind */}
      <rect className="wash" x="22" y="16" width="68" height="48" rx="1.5" />
      <rect className="ln" x="22" y="16" width="68" height="48" rx="1.5" />
      <path className="ln-faint" d="M28 21c10-2 20 2 30 0M82 33c2 1 4-1 6 0M82 42c2 1 4-1 6 0M82 51c2 1 4-1 6 0" />
      {/* the sheet in front */}
      <rect className="body" x="12" y="26" width="68" height="48" rx="1.5" />
      {/* wood grain and a knot */}
      <path
        className="ln-faint"
        d="M16 33c7-3 13 3 22 0s13-3 20 0 11 3 16 0M16 42c8 3 14-3 22 0s13 3 20 0 9-2 14 0M16 67c9-2 15 2 24 0s14-2 20 0 10 2 14 1"
      />
      <ellipse className="ln-faint" cx="26" cy="55" rx="5" ry="3" />
      <ellipse className="ln-faint" cx="26" cy="55" rx="9" ry="5.4" />
      {/* a laser-cut slot */}
      <rect className="hot-ln" x="44" y="54" width="22" height="6" rx="3" />
      {/* the sheet edge-on, dimensioned: its thickness */}
      <rect className="body" x="97" y="26" width="8" height="48" rx="1" />
      <path className="ln-faint" d="M99.8 28V72M102.2 28V72" />
      <path className="cool-ln" d="M97 19h8M97 15.5v7M105 15.5v7" />
      <text x="112" y="12.5" textAnchor="end">3–5 mm</text>
    </>
  ),

  // Retort stand holding the camera above the plate, side elevation.
  'camera-arm': (
    <>
      <path className="ln-thin" d="M8 78H112" />
      {/* heavy base and rod */}
      <rect className="metal" x="12" y="70" width="36" height="8" rx="2" />
      <rect className="metal" x="27" y="14" width="5" height="56" rx="1.5" />
      {/* boss head, its thumbscrew, and the arm */}
      <rect className="chip" x="27" y="22.5" width="5" height="3.5" rx="1" />
      <rect className="body" x="22" y="26" width="15" height="12" rx="2" />
      <rect className="metal" x="37" y="29" width="52" height="4.5" rx="1.5" />
      {/* camera board hanging from the arm end, lens down */}
      <rect className="metal" x="85" y="33.5" width="4" height="4" />
      <rect className="pcb" x="77" y="37.5" width="20" height="4" rx="1" />
      <rect className="chip" x="84" y="41.5" width="6" height="3.5" rx="1" />
      {/* the plate, edge-on */}
      <ellipse className="body" cx="87" cy="74" rx="19" ry="4" />
      <ellipse className="ln-faint" cx="87" cy="74.2" rx="12" ry="2" />
      {/* line of sight */}
      <path className="hot-ln" strokeDasharray="3.5 2.5" d="M87 47V66" />
      <path className="hot-ln" d="M84.5 64.5L87 68l2.5-3.5" />
      <text x="82" y="58" textAnchor="end">≈ 25 cm</text>
    </>
  ),

  // Flat digital kitchen scale, top view.
  'kitchen-scale': (
    <>
      <rect className="body" x="14" y="10" width="92" height="66" rx="3" />
      {/* weighing platter */}
      <circle className="metal" cx="60" cy="35" r="21" />
      <circle className="ln-faint" cx="60" cy="35" r="16.5" />
      <path className="ln-faint" d="M42.96 27.06A18.8 18.8 0 0 1 53.57 17.33" />
      {/* display and the two buttons */}
      <rect className="chip" x="42" y="59" width="36" height="11" rx="1.5" />
      <text className="on-dark" x="60" y="67.2" textAnchor="middle">0 g</text>
      <circle className="body" cx="27" cy="64.5" r="3.6" />
      <circle className="hot" cx="93" cy="64.5" r="3.4" />
      <circle className="ln-thin" cx="93" cy="64.5" r="3.4" />
    </>
  ),

  // Open-frame 3D printer mid-print.
  'printer-3d': (
    <>
      <rect className="body" x="14" y="68" width="92" height="10" rx="2" />
      {/* uprights and the top bar */}
      <rect className="metal" x="24" y="12" width="7" height="56" rx="1.5" />
      <rect className="metal" x="89" y="12" width="7" height="56" rx="1.5" />
      <rect className="metal" x="24" y="9" width="72" height="6" rx="2" />
      {/* gantry */}
      <rect className="body" x="31" y="29" width="58" height="6" rx="1.5" />
      {/* print head and nozzle */}
      <rect className="hot" x="44" y="31" width="14" height="13" rx="2" />
      <rect className="ln" x="44" y="31" width="14" height="13" rx="2" />
      <path className="ln-thin" d="M47 36h8" />
      <path className="chip" d="M48.5 44h5l-2.5 5z" />
      {/* bed carriage, build plate, half-printed L-bracket */}
      <rect className="body" x="30" y="62" width="60" height="6" rx="1.5" />
      <rect className="metal" x="34" y="58" width="52" height="4" rx="1" />
      <path className="body" d="M46 58V50h8v4h18v4Z" />
      <path className="ln-faint" d="M47 52h6M47 56h24" />
    </>
  ),

  // Smartphone sharing its connection: the hotspot the boards join.
  'phone-hotspot': (
    <>
      <rect className="body" x="45" y="32" width="30" height="48" rx="3" />
      <rect className="wash" x="48.5" y="38" width="23" height="34" rx="1" />
      <rect className="ln-thin" x="48.5" y="38" width="23" height="34" rx="1" />
      <path className="ln-thin" d="M56.5 35h7" />
      {/* hotspot toggle, switched on */}
      <rect className="ln-thin" x="53" y="51" width="14" height="7" rx="3.5" />
      <circle className="chip" cx="63.5" cy="54.5" r="2.4" />
      <circle className="ln-thin" cx="60" cy="76" r="1.8" />
      {/* Wi-Fi: a dot and three arcs */}
      <circle className="hot-ln" cx="60" cy="28" r="1" />
      <path className="hot-ln" d="M55.76 23.76A6 6 0 0 1 64.24 23.76" />
      <path className="hot-ln" d="M51.51 19.51A12 12 0 0 1 68.49 19.51" />
      <path className="hot-ln" d="M47.27 15.27A18 18 0 0 1 72.73 15.27" />
    </>
  ),

  // Laptop, front-on with the lid open, cabled to the boards.
  laptop: (
    <>
      <rect className="body" x="18" y="10" width="68" height="46" rx="3" />
      <rect className="wash" x="22.5" y="14.5" width="59" height="37" rx="1" />
      <rect className="ln-thin" x="22.5" y="14.5" width="59" height="37" rx="1" />
      {/* two lines of code and the cursor */}
      <path className="ln-faint" d="M28 24h10M41 24h14M32 31h8M43 31h16" />
      <rect className="hot" x="62" y="29" width="2.6" height="4.6" rx="0.4" />
      {/* keyboard deck, three rows of keys, front lip */}
      <path className="body" d="M10 72L18 56H86L94 72Z" />
      {Array.from({ length: 3 }, (_, i) => (
        <path
          key={`keys${i}`}
          className="ln-faint"
          strokeDasharray="4 1.6"
          d={`M${21 - i * 2} ${60 + i * 4}H${83 + i * 2}`}
        />
      ))}
      <rect className="metal" x="10" y="72" width="84" height="4" rx="1.5" />
      {/* USB cable leaving the right-hand side */}
      <rect className="metal" x="91" y="64" width="6" height="4" rx="1" />
      <path className="ln" d="M97 66h4c6 0 8-4 8-10" />
    </>
  ),

  // Hot-glue gun with a screwdriver crossing behind its grip.
  'glue-tools': (
    <g transform="translate(2 -4)">
      {/* screwdriver, tip up and right */}
      <g transform="translate(16 76) rotate(-22)">
        <rect className="chip" x="0" y="-4.5" width="22" height="9" rx="3" />
        <rect className="metal" x="22" y="-3" width="4" height="6" rx="1" />
        <rect className="metal" x="26" y="-0.8" width="44" height="1.6" rx="0.8" />
        <path className="metal" d="M70 -1.6L75.5 -1V1L70 1.6Z" />
      </g>
      {/* glue stick feeding in at the back */}
      <rect className="body" x="76" y="29" width="26" height="5" rx="2.5" />
      {/* trigger, tucked behind the grip */}
      <rect className="metal" x="44" y="41" width="5.5" height="16" rx="2" transform="rotate(-18 46.75 41)" />
      {/* grip and barrel */}
      <path className="body" d="M50 42L64 42L71 72L59 72Z" />
      <rect className="body" x="32" y="22" width="44" height="20" rx="3" />
      <path className="ln-faint" d="M40 27v10M44 27v10M48 27v10" />
      {/* nozzle and its drip */}
      <path className="metal" d="M32 26L21 30.5V34.5L32 38Z" />
      <rect className="metal" x="16" y="30.5" width="5" height="4" rx="1" />
      <path className="hot" d="M18.5 36c-1.5 2.5-2.5 4-2.5 5.5a2.5 2.5 0 0 0 5 0c0-1.5-1-3-2.5-5.5z" />
      {/* mains cord */}
      <path className="ln" d="M65 72c0 7 6 8 12 7s10-3 15-2" />
    </g>
  ),
};
