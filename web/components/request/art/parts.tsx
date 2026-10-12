import type { ReactNode } from 'react';

/**
 * Small discrete parts, drawn side-on the way they sit in a parts drawer.
 * Same conventions as ./reference.tsx: each entry is the CONTENT of an
 * <svg viewBox="0 0 120 90">, artwork stays inside x 8..112 / y 8..82, colour
 * comes only from the classes in ../request.css, and every drawing carries one
 * accent (a `.hot` area or `.hot-ln` strokes).
 */

/** Round to one decimal so generated coordinates stay short. */
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Flat-top regular hexagon, as a closed path (a nut seen face-on). */
const hexPath = (cx: number, cy: number, rad: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${i === 0 ? 'M' : 'L'}${r1(cx + rad * Math.cos(a))} ${r1(cy + rad * Math.sin(a))}`;
  }).join('') + 'z';

/** Axial resistor body centred on y = c: a cylinder with slightly fatter ends. */
const resistorBody = (c: number) => {
  const L = 34;
  const R = 86;
  return [
    `M${L + 4} ${c - 8}H${L + 7}`,
    `C${L + 11} ${c - 8} ${L + 11} ${c - 6} ${L + 15} ${c - 6}`,
    `H${R - 15}`,
    `C${R - 11} ${c - 6} ${R - 11} ${c - 8} ${R - 7} ${c - 8}`,
    `H${R - 4}Q${R} ${c - 8} ${R} ${c - 4}`,
    `V${c + 4}Q${R} ${c + 8} ${R - 4} ${c + 8}`,
    `H${R - 7}`,
    `C${R - 11} ${c + 8} ${R - 11} ${c + 6} ${R - 15} ${c + 6}`,
    `H${L + 15}`,
    `C${L + 11} ${c + 6} ${L + 11} ${c + 8} ${L + 7} ${c + 8}`,
    `H${L + 4}Q${L} ${c + 8} ${L} ${c + 4}`,
    `V${c - 4}Q${L} ${c - 8} ${L + 4} ${c - 8}z`,
  ].join('');
};

/** One row of breadboard holes as a single path of tiny squares. */
const holeRow = (y: number, xs: number[]) =>
  xs.map((x) => `M${r1(x - 0.8)} ${r1(y - 0.8)}h1.6v1.6h-1.6z`).join('');

/** A header pin, centred on x, with a chamfered tip. */
const headerPin = (x: number) =>
  `M${r1(x - 1.2)} 71V35.5L${r1(x - 0.6)} 33H${r1(x + 0.6)}L${r1(x + 1.2)} 35.5V71z`;

// 22 breadboard columns, 3.6 apart; the rails use 4 groups of 5 holes.
const BB_COLS = Array.from({ length: 22 }, (_, i) => r1(22.2 + i * 3.6));
const BB_RAIL = Array.from({ length: 20 }, (_, i) => r1(23.1 + i * 3.6 + Math.floor(i / 5) * 1.8));

const JUMPER_CLASSES = ['w-red', 'w-blk', 'hot-ln', 'w-wht', 'w-grn', 'cool-ln'];
const RESISTOR_BAND_X = [51.5, 56, 60.5, 66.5];

export const ART_PARTS: Record<string, ReactNode> = {
  // Two 6 x 6 mm tactile switches, side-on; the right-hand cap is the accent.
  'push-button': (
    <>
      {Array.from({ length: 2 }, (_, i) => {
        const cx = i === 0 ? 32 : 88;
        const cap = `M${cx - 11} 35v-5q0-4 4-4h14q4 0 4 4v5z`;
        return (
          <g key={`sw${i}`}>
            {/* four bent legs: the two nearer ones solid, the two behind them thinner */}
            <path className="ln-thin" d={`M${cx - 8} 53v3l-3 3v6M${cx + 8} 53v3l3 3v6`} />
            <path className="ln" d={`M${cx - 14} 53v3l-3 3v6M${cx + 14} 53v3l3 3v6`} />
            <rect className="chip" x={cx - 20} y="35" width="40" height="18" rx="2" />
            {i === 1 ? (
              <>
                <path className="hot" d={cap} />
                <path className="ln" d={cap} />
              </>
            ) : (
              <path className="body" d={cap} />
            )}
          </g>
        );
      })}
    </>
  ),

  // Passive piezo buzzer: black can, sound port on top, two leads, sound arcs.
  buzzer: (
    <>
      <path className="ln" d="M36 48v26M64 48v26" />
      <path className="chip" d="M27 50V22a4 4 0 0 1 4-4h38a4 4 0 0 1 4 4v28z" />
      {/* top face with its sound port */}
      <ellipse className="ln-thin" cx="50" cy="23.5" rx="19" ry="3.4" />
      <ellipse className="wash" cx="50" cy="23.5" rx="5.5" ry="1.9" />
      {/* plus mark above the first lead */}
      <rect className="wash" x="33.5" y="38.4" width="5" height="1.3" rx="0.4" />
      <rect className="wash" x="35.35" y="36.55" width="1.3" height="5" rx="0.4" />
      {/* sound */}
      {Array.from({ length: 3 }, (_, i) => {
        const rad = 8 + i * 7;
        const x = r1(73 + rad * Math.cos(0.66));
        const dy = r1(rad * Math.sin(0.66));
        return (
          <path
            key={`snd${i}`}
            className="hot-ln"
            d={`M${x} ${r1(34 - dy)}A${rad} ${rad} 0 0 1 ${x} ${r1(34 + dy)}`}
          />
        );
      })}
    </>
  ),

  // TO-92 transistor: flat face on the left, the same part from above on the right.
  transistor: (
    <>
      {/* three long legs; the middle one (the base) carries the accent */}
      <path className="ln" d="M22 44V70M38 44V70" />
      <path className="hot-ln" d="M30 44V70" />
      {/* D-shaped body, seen from its flat face */}
      <path className="chip" d="M14 48V26a16 16 0 0 1 32 0v22z" />
      <text className="on-dark" x="30" y="37" textAnchor="middle">
        2N2222
      </text>
      <text x="22 30 38" y="79" textAnchor="middle">
        EBC
      </text>
      {/* the same body from above: a half-disc with the three legs end-on */}
      <path className="chip" d="M76 48a14 14 0 0 1 28 0z" />
      {Array.from({ length: 3 }, (_, i) => (
        <circle key={`leg${i}`} className="pin" cx={83 + i * 7} cy="43.5" r="1.5" />
      ))}
    </>
  ),

  // Two axial resistors, a 1 kΩ above a 330 Ω; the red band is the accent.
  resistor: (
    <>
      {[
        { c: 27, bands: ['chip', 'chip', 'hot', 'pin'], label: '1 kΩ' },
        { c: 61, bands: ['cool', 'cool', 'chip', 'pin'], label: '330 Ω' },
      ].map(({ c, bands, label }) => (
        <g key={label}>
          <path className="ln" d={`M10 ${c}H34M86 ${c}H110`} />
          <path className="body" d={resistorBody(c)} />
          {bands.map((cls, i) => (
            <rect
              key={`band${i}`}
              className={cls}
              x={RESISTOR_BAND_X[i]}
              y={r1(c - 5.2)}
              width="2.6"
              height="10.4"
              rx="0.5"
            />
          ))}
          <text x="89" y={r1(c - 3.5)}>
            {label}
          </text>
        </g>
      ))}
    </>
  ),

  // Radial electrolytic: black can, pale negative stripe, longer + lead in the accent.
  'cap-electrolytic': (
    <>
      {/* leads: the short one sits under the stripe (negative) */}
      <path className="ln" d="M36 54v14" />
      <path className="hot-ln" d="M54 54v22" />
      <path className="chip" d="M27 58V15a5 5 0 0 1 5-5h26a5 5 0 0 1 5 5v43z" />
      {/* scored top */}
      <ellipse className="ln-thin" cx="45" cy="15" rx="14" ry="3" />
      <path className="ln-faint" d="M39 15h12M45 13.2v3.6" />
      {/* crimp grooves */}
      <path className="ln-thin" d="M27.8 22H62.2M27.8 53H62.2" />
      {/* negative stripe with minus marks */}
      <rect className="wash" x="27" y="23.5" width="11" height="28" rx="0.5" />
      <path className="ln-faint" d="M30.5 28h4M30.5 34h4M30.5 40h4M30.5 46h4" />
    </>
  ),

  // Two ceramic discs: one in the accent, one plain and marked 104.
  'cap-ceramic': (
    <>
      {/* leads first, so each disc sits over the tops of its own */}
      <path className="ln" d="M29 44v32M43 44v32M77 46v30M91 46v30" />
      <ellipse className="hot" cx="36" cy="34" rx="18" ry="20" />
      <ellipse className="ln" cx="36" cy="34" rx="18" ry="20" />
      <path className="ln-faint" d="M24 30q1-9 9-12" />
      <ellipse className="body" cx="84" cy="37" rx="16" ry="18" />
      <path className="ln-faint" d="M73 34q1-8 8-11" />
      <text x="84" y="39.5" textAnchor="middle">
        104
      </text>
    </>
  ),

  // Three 5 mm LEDs; the middle one is lit.
  'led-white': (
    <>
      <circle className="glow" cx="60" cy="38" r="26" />
      {Array.from({ length: 3 }, (_, i) => {
        const x = 22 + i * 38;
        return (
          <g key={`led${i}`}>
            {/* leads: the cathode (left) is cut short, the anode (right) is long */}
            <path className="ln" d={`M${x - 6} 54v16M${x + 6} 54v26`} />
            <path className="body" d={`M${x - 11} 52V35a11 11 0 0 1 22 0v17z`} />
            <rect className="body" x={x - 13} y="52" width="26" height="4" rx="1" />
            {/* inside the dome: the anvil with its cup, the post and its whisker */}
            <path
              className="ln-faint"
              d={`M${x - 6} 56V39M${x - 9} 34l3 5 3-5M${x + 6} 56V36Q${x} 28 ${x - 6} 35`}
            />
          </g>
        );
      })}
      {/* rays off the lit one */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (([-90, -57, -123, -26, -154][i] ?? -90) * Math.PI) / 180;
        return (
          <path
            key={`ray${i}`}
            className="hot-ln"
            d={`M${r1(60 + 16 * Math.cos(a))} ${r1(35 + 16 * Math.sin(a))}L${r1(60 + 22 * Math.cos(a))} ${r1(35 + 22 * Math.sin(a))}`}
          />
        );
      })}
    </>
  ),

  // Micro-USB cable: USB-A plug at the left, micro plug (accent) at the right.
  'usb-cable': (
    <>
      {/* USB-A plug: metal shell, two retaining windows, moulded boot */}
      <rect className="metal" x="9" y="46" width="21" height="20" rx="1.5" />
      <rect className="chip" x="19" y="51" width="3.5" height="3.5" rx="0.6" />
      <rect className="chip" x="19" y="57.5" width="3.5" height="3.5" rx="0.6" />
      <rect className="chip" x="30" y="43" width="12" height="26" rx="3" />
      {/* micro-USB plug: small chamfered shell, boot in the accent */}
      <path className="metal" d="M96 59H107L110 62V66L107 69H96z" />
      <rect className="hot" x="84" y="56" width="12" height="16" rx="3" />
      <rect className="ln" x="84" y="56" width="12" height="16" rx="3" />
      {/* the cable: one loop, crossing itself */}
      <path
        className="ln"
        d="M42 56C52 56 54 50 60 44C66 38 74 36 74 28C74 20 68 14 60 14C52 14 46 20 46 28C46 38 54 38 60 44C67 51 74 64 84 64"
      />
    </>
  ),

  // A fan of six Dupont jumpers leaving a sleeved ribbon.
  'jumper-wires': (
    <>
      {Array.from({ length: 6 }, (_, i) => {
        const ye = r1(15 + i * 11.5);
        const ys = r1(44 + (i - 2.5) * 2.6);
        return (
          <g key={`jw${i}`}>
            <path className={JUMPER_CLASSES[i]} d={`M10 ${ys}H26C50 ${ys} 60 ${ye} 84 ${ye}`} />
            <rect className="pin" x="98" y={r1(ye - 1.2)} width="10" height="2.4" rx="0.6" />
            <rect className="chip" x="84" y={r1(ye - 4)} width="14" height="8" rx="1.5" />
          </g>
        );
      })}
      {/* heat-shrink sleeve holding the ribbon together */}
      <rect className="body" x="14" y="33" width="7" height="22" rx="2" />
    </>
  ),

  // Solderless breadboard from above: 22 columns, two 5-row banks, two power rails each side.
  breadboard: (
    <>
      <rect className="body" x="12" y="9" width="96" height="72" rx="3" />
      {/* centre trench */}
      <rect className="wash" x="13" y="42.6" width="94" height="4.8" />
      <path className="ln-thin" d="M13 42.6H107M13 47.4H107" />
      {/* rail markings: red outside, blue inside */}
      <path className="hot-ln" d="M20 12.2H100M20 77.8H100" />
      <path className="cool-ln" d="M20 21.8H100M20 68.2H100" />
      {/* main banks: five rows above the trench, five below */}
      {Array.from({ length: 10 }, (_, j) => (
        <path
          key={`row${j}`}
          className="chip"
          d={holeRow(r1(25.2 + (j % 5) * 3.6 + (j >= 5 ? 25.2 : 0)), BB_COLS)}
        />
      ))}
      {/* rails: two rows top and bottom, holes in groups of five */}
      {[15.2, 18.8, 71.2, 74.8].map((y) => (
        <path key={`rail${y}`} className="chip" d={holeRow(y, BB_RAIL)} />
      ))}
    </>
  ),

  // 2.54 mm male header: a long strip and a short one that has been snapped off.
  'header-pins': (
    <>
      {[
        { x0: 14, n: 9 },
        { x0: 82, n: 4 },
      ].map(({ x0, n }) => (
        <g key={`strip${x0}`}>
          {Array.from({ length: n }, (_, i) => (
            <path key={`pin${i}`} className="pin" d={headerPin(x0 + 3 + i * 6)} />
          ))}
          <rect className="chip" x={x0} y="52" width={n * 6} height="8" rx="1.5" />
          {/* break-away notches between the pins */}
          <path
            className="ln-faint"
            d={Array.from({ length: n - 1 }, (_, i) => `M${x0 + 6 + i * 6} 52.8v2.6`).join('')}
          />
        </g>
      ))}
      {/* pitch */}
      <path className="ln-thin" d="M17 28.5H23M17 26v5M23 26v5" />
      <text x="20" y="24" textAnchor="middle">
        2.54
      </text>
      {/* snap here */}
      <path className="hot-ln" d="M77 46l-3 4 4 4-4 4 3 4" />
    </>
  ),

  // Mounting hardware: two screws, two standoffs, two nuts; a tighten arrow on the small nut.
  screws: (
    <>
      {/* M5 screw (long) */}
      <rect className="metal" x="9" y="12" width="7" height="14" rx="2" />
      <path className="metal" d="M16 15.5H60L63 17.5V20.5L60 22.5H16z" />
      <path
        className="ln-faint"
        d={Array.from({ length: 12 }, (_, i) => `M${r1(19.5 + i * 3.2)} 21.5l1.8-5`).join('')}
      />
      <text x="66" y="21.2">
        M5
      </text>
      {/* M4 screw (short) */}
      <rect className="metal" x="9" y="32" width="6" height="12" rx="2" />
      <path className="metal" d="M15 35H44L47 37V39L44 41H15z" />
      <path
        className="ln-faint"
        d={Array.from({ length: 8 }, (_, i) => `M${r1(18.5 + i * 3.2)} 40l1.6-4`).join('')}
      />
      <text x="50" y="40.2">
        M4
      </text>
      {/* hex standoff, female-female */}
      <rect className="metal" x="9" y="50" width="43" height="12" rx="1.5" />
      <path className="ln-thin" d="M10.5 54H50.5M10.5 58H50.5" />
      {/* hex standoff, male-female: the threaded stud first, then the body over it */}
      <rect className="metal" x="33" y="70" width="12" height="6" rx="1" />
      <path
        className="ln-faint"
        d={Array.from({ length: 3 }, (_, i) => `M${r1(35.5 + i * 3)} 75l1.5-4`).join('')}
      />
      <rect className="metal" x="9" y="67" width="24" height="12" rx="1.5" />
      <path className="ln-thin" d="M10.5 71H31.5M10.5 75H31.5" />
      {/* two nuts, face-on */}
      {[
        { cx: 94, cy: 29, rad: 13, bore: 5.5 },
        { cx: 94, cy: 64.5, rad: 11, bore: 4.5 },
      ].map(({ cx, cy, rad, bore }) => (
        <g key={`nut${rad}`}>
          <path className="metal" d={hexPath(cx, cy, rad)} />
          <circle className="ln-faint" cx={cx} cy={cy} r={r1(rad * 0.84)} />
          <circle className="wash" cx={cx} cy={cy} r={bore} />
          <circle className="ln-thin" cx={cx} cy={cy} r={bore} />
        </g>
      ))}
      {/* tighten */}
      <path className="hot-ln" d="M80.1 56.5A16 16 0 0 1 107.9 56.5M107.9 52V56.5L104 54.2" />
    </>
  ),

  // Four-core cable with the jacket cut back: braid, then four cores fanned out.
  'shielded-cable': (
    <>
      {/* outer jacket, cut square at the right */}
      <path className="body" d="M12 31H51A3 13 0 0 1 51 57H12A3 3 0 0 1 9 54V34A3 3 0 0 1 12 31z" />
      {/* exposed braid, with a cross-hatch weave */}
      <rect className="metal" x="52.5" y="35" width="15.5" height="18" rx="1.5" />
      <path
        className="ln-faint"
        d={Array.from(
          { length: 4 },
          (_, i) => `M${r1(54.5 + i * 2.6)} 36.5l4 15M${r1(58.5 + i * 2.6)} 36.5l-4 15`,
        ).join('')}
      />
      {/* four cores, each ending in a bare tip */}
      {Array.from({ length: 4 }, (_, i) => {
        const y0 = r1(40.4 + i * 2.4);
        const ye = [20, 33, 55, 68][i] ?? 44;
        return (
          <g key={`core${i}`}>
            <path
              className={['w-red', 'w-blk', 'w-wht', 'w-grn'][i]}
              d={`M68 ${y0}C80 ${y0} 88 ${ye} 98 ${ye}H104`}
            />
            <rect className="pin" x="104" y={ye - 1} width="6" height="2" rx="0.5" />
          </g>
        );
      })}
      {/* how much jacket to strip back */}
      <path className="hot-ln" d="M54 65H68M54 62.5v5M68 62.5v5" />
    </>
  ),

  // 1N4007-style rectifier diode, with the current arrow pointing at the cathode band.
  diode: (
    <>
      <path className="ln" d="M9 52H38M82 52H111" />
      <rect className="chip" x="36" y="41.5" width="48" height="21" rx="4" />
      <rect className="wash" x="68" y="41.5" width="8" height="21" />
      <text className="on-dark" x="52" y="54" textAnchor="middle">
        1N4007
      </text>
      <path className="hot-ln" d="M40 29H76M71 25l5 4-5 4" />
    </>
  ),
};
