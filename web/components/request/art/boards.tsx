import type { ReactNode } from 'react';

/**
 * Circuit-board drawings, all seen flat from directly above.
 *
 * Same conventions as ./reference.tsx: every value is the CONTENT of an
 * <svg viewBox="0 0 120 90">, artwork stays inside x 8..112 / y 8..82, colour
 * comes only from the classes in ../request.css, and each drawing has exactly
 * one `.hot` accent area.
 */

type Pt = [number, number];

const n2 = (v: number) => Math.round(v * 100) / 100;

/** `n` values starting at `start`, `step` apart. */
const seq = (n: number, start: number, step: number) =>
  Array.from({ length: n }, (_, i) => n2(start + i * step));

/** Short vertical ticks (IC legs) at each x, `len` long, starting at y. */
const legTicks = (xs: number[], y: number, len: number) =>
  xs.map((x) => `M${x} ${y}v${len}`).join('');

/** A closed polygon whose corners are all rounded by up to `r`. */
function roundedPoly(pts: Pt[], r: number): string {
  const count = pts.length;
  let d = '';
  for (let i = 0; i < count; i++) {
    const [px, py] = pts[(i + count - 1) % count];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[(i + 1) % count];
    const l1 = Math.hypot(px - cx, py - cy);
    const l2 = Math.hypot(nx - cx, ny - cy);
    const r1 = Math.min(r, l1 / 2);
    const r2 = Math.min(r, l2 / 2);
    const ax = cx + ((px - cx) / l1) * r1;
    const ay = cy + ((py - cy) / l1) * r1;
    const bx = cx + ((nx - cx) / l2) * r2;
    const by = cy + ((ny - cy) / l2) * r2;
    d += `${i === 0 ? 'M' : 'L'}${n2(ax)} ${n2(ay)}Q${n2(cx)} ${n2(cy)} ${n2(bx)} ${n2(by)}`;
  }
  return `${d}Z`;
}

/** An annulus as a single path; draw it with fillRule="evenodd". */
function ringPath(cx: number, cy: number, ro: number, ri: number): string {
  const circle = (rad: number) =>
    `M${n2(cx + rad)} ${cy}a${rad} ${rad} 0 1 1 ${n2(-2 * rad)} 0a${rad} ${rad} 0 1 1 ${n2(2 * rad)} 0z`;
  return circle(ro) + circle(ri);
}

/** Slightly twisted radial strokes: the wire winding on a toroid. */
function windingTicks(cx: number, cy: number, ri: number, ro: number, count: number, twist: number): string {
  return Array.from({ length: count }, (_, k) => {
    const a = (k / count) * Math.PI * 2;
    const b = a + twist;
    return `M${n2(cx + ri * Math.cos(a))} ${n2(cy + ri * Math.sin(a))}L${n2(cx + ro * Math.cos(b))} ${n2(cy + ro * Math.sin(b))}`;
  }).join('');
}

/* microSD: drawn from real millimetres (15 x 11), scaled and centred in the frame. */
const SD_S = 6.5;
const SD_X = 11.25;
const SD_Y = 9.25;
const sdx = (mm: number) => n2(SD_X + SD_S * mm);
const sdy = (mm: number) => n2(SD_Y + SD_S * mm);
const sdPt = (x: number, y: number): Pt => [sdx(x), sdy(y)];

export const ART_BOARDS: Record<string, ReactNode> = {
  // AI-Thinker ESP32-CAM, portrait: camera on top, ESP32-S shield, SD slot on the reverse.
  'esp32-cam': (
    <>
      <rect className="pcb" x="36" y="9" width="48" height="72" rx="3" />
      {/* eight header pins down each long side */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={`l${i}`} className="pin" x="39" y={35 + i * 6} width="2.6" height="2.6" rx="0.6" />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={`r${i}`} className="pin" x="78.4" y={35 + i * 6} width="2.6" height="2.6" rx="0.6" />
      ))}
      {/* camera module: square body, round lens with a highlight ring */}
      <rect className="body" x="51" y="12" width="18" height="18" rx="2" />
      <circle className="chip" cx="60" cy="21" r="6" />
      <circle className="ln-faint" cx="60" cy="21" r="3.4" />
      <circle className="wash" cx="58.2" cy="19.2" r="0.9" />
      {/* flex ribbon into its socket */}
      <rect className="body" x="55" y="30" width="10" height="6" rx="0.8" />
      <path className="ln-faint" d="M58.3 31.5v3M61.7 31.5v3" />
      <rect className="chip" x="52" y="36" width="16" height="3.4" rx="0.8" />
      {/* the white flash LED */}
      <rect className="hot" x="72" y="30" width="5" height="3.4" rx="0.9" />
      {/* ESP32-S metal shield */}
      <rect className="metal" x="45" y="42" width="30" height="19" rx="1.5" />
      <text x="60" y="53.5" textAnchor="middle">ESP32</text>
      {/* microSD slot, on the reverse of the board */}
      <rect className="ln-faint" x="46" y="64" width="28" height="13" rx="1.5" strokeDasharray="2 1.6" />
    </>
  ),

  // FT232RL / CP2102 USB-to-serial adapter, with its 3.3 V / 5 V jumper.
  'usb-ttl': (
    <>
      <rect className="pcb" x="22" y="21" width="86" height="48" rx="3" />
      {/* USB socket overhanging the left end */}
      <rect className="metal" x="9" y="32" width="24" height="26" rx="1.5" />
      <rect className="ln-faint" x="12" y="35" width="14" height="20" rx="1" />
      {/* the USB-to-serial IC with its legs */}
      <path className="ln-thin" d={legTicks(seq(7, 43.6, 2.5), 36.5, 2.5) + legTicks(seq(7, 43.6, 2.5), 51, 2.5)} />
      <rect className="chip" x="42" y="39" width="18" height="12" rx="1" />
      <circle className="wash" cx="44.6" cy="48.4" r="0.9" />
      {/* a few passives */}
      <rect className="ln-faint" x="44" y="27" width="5" height="3" rx="0.5" />
      <rect className="ln-faint" x="53" y="27" width="5" height="3" rx="0.5" />
      <rect className="ln-faint" x="46" y="58" width="5" height="3" rx="0.5" />
      <rect className="ln-faint" x="55" y="58" width="5" height="3" rx="0.5" />
      {/* the voltage jumper: three pins, a cap on two of them */}
      <rect className="chip" x="68" y="40" width="19" height="9" rx="1" />
      {Array.from({ length: 3 }, (_, i) => (
        <rect key={`j${i}`} className="pin" x={70.2 + i * 6} y="43.2" width="2.6" height="2.6" rx="0.6" />
      ))}
      <rect className="hot" x="69.2" y="38" width="11.6" height="13" rx="1.6" />
      <rect className="ln" x="69.2" y="38" width="11.6" height="13" rx="1.6" />
      <text x="71.5" y="58" textAnchor="middle">5V</text>
      <text x="83.5" y="58" textAnchor="middle">3V3</text>
      {/* six-pin serial header */}
      <rect className="chip" x="96" y="26" width="8" height="38" rx="1" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`h${i}`} className="pin" x="98.7" y={28.7 + i * 6} width="2.6" height="2.6" rx="0.6" />
      ))}
    </>
  ),

  // ESP32-CAM-MB: the USB programmer base the ESP32-CAM plugs into.
  'esp32-cam-mb': (
    <>
      <rect className="pcb" x="34" y="9" width="52" height="69" rx="3" />
      {/* micro-USB socket overhanging the bottom edge */}
      <rect className="metal" x="51" y="71.2" width="18" height="10" rx="1.5" />
      <rect className="ln-faint" x="53.5" y="73.2" width="13" height="6" rx="1" />
      {/* two female header strips, eight sockets each */}
      <rect className="chip" x="38" y="13" width="7.4" height="46.5" rx="1" />
      <rect className="chip" x="74.6" y="13" width="7.4" height="46.5" rx="1" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={`l${i}`} className="pin" x="40.4" y={15.7 + i * 5.5} width="2.6" height="2.6" rx="0.6" />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={`r${i}`} className="pin" x="77" y={15.7 + i * 5.5} width="2.6" height="2.6" rx="0.6" />
      ))}
      {/* CH340 USB-serial chip */}
      <rect className="chip" x="52.5" y="63" width="15" height="6.6" rx="1" />
      {/* RESET and IO0 buttons */}
      <rect className="body" x="38" y="64.5" width="7" height="7" rx="1.5" />
      <circle className="ln-thin" cx="41.5" cy="68" r="1.9" />
      <rect className="body" x="75" y="64.5" width="7" height="7" rx="1.5" />
      <circle className="ln-thin" cx="78.5" cy="68" r="1.9" />
      {/* power LED */}
      <rect className="hot" x="47.5" y="65.5" width="3" height="2.3" rx="0.6" />
    </>
  ),

  // Arduino Uno R3, USB-B and barrel jack on the left, the notched right edge.
  'arduino-uno': (
    <>
      <path
        className="pcb"
        d={roundedPoly(
          [
            [20, 10],
            [110, 10],
            [110, 25],
            [106, 29],
            [106, 72],
            [98, 80],
            [20, 80],
          ],
          2.5,
        )}
      />
      {/* USB-B and the DC barrel jack */}
      <rect className="metal" x="9" y="17" width="22" height="17" rx="1.5" />
      <path className="ln-faint" d="M27 17.5v16" />
      <rect className="chip" x="9" y="50" width="24" height="16" rx="1.5" />
      {/* top headers: D8-D13 group and D0-D7 group */}
      <rect className="chip" x="38" y="12.5" width="35" height="6" rx="1" />
      <rect className="chip" x="77" y="12.5" width="28.2" height="6" rx="1" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={`ta${i}`} className="pin" x={39.25 + i * 3.4} y="14.55" width="1.9" height="1.9" rx="0.4" />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={`tb${i}`} className="pin" x={78.25 + i * 3.4} y="14.55" width="1.9" height="1.9" rx="0.4" />
      ))}
      {/* bottom headers: power group and analog group */}
      <rect className="chip" x="42" y="71.5" width="28.2" height="6" rx="1" />
      <rect className="chip" x="74" y="71.5" width="21.4" height="6" rx="1" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={`ba${i}`} className="pin" x={43.25 + i * 3.4} y="73.55" width="1.9" height="1.9" rx="0.4" />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`bb${i}`} className="pin" x={75.25 + i * 3.4} y="73.55" width="1.9" height="1.9" rx="0.4" />
      ))}
      {/* reset button */}
      <rect className="body" x="38" y="22" width="7" height="7" rx="1.5" />
      <circle className="ln-thin" cx="41.5" cy="25.5" r="1.9" />
      {/* the "L" LED and its resistor */}
      <rect className="hot" x="60" y="23" width="4" height="2.8" rx="0.7" />
      <rect className="ln-faint" x="67" y="22.6" width="4.5" height="3.2" rx="0.5" />
      {/* USB interface chip and the crystal */}
      <rect className="chip" x="40" y="38" width="8" height="8" rx="0.8" />
      <rect className="metal" x="46" y="58.5" width="10" height="4.6" rx="1.4" />
      {/* ICSP header */}
      <rect className="chip" x="96" y="33" width="7.4" height="11" rx="1" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect
          key={`ic${i}`}
          className="pin"
          x={97.05 + (i % 2) * 3.4}
          y={34.15 + Math.floor(i / 2) * 3.4}
          width="1.9"
          height="1.9"
          rx="0.4"
        />
      ))}
      {/* ATmega328P in its socket: DIP-28 with the half-moon notch */}
      <path className="ln-thin" d={legTicks(seq(14, 64.2, 2.6), 55.2, 1.8) + legTicks(seq(14, 64.2, 2.6), 66, 1.8)} />
      <rect className="chip" x="62" y="57" width="40" height="9" rx="1" />
      <path className="wash" d="M62 59.7a1.8 1.8 0 0 1 0 3.6z" />
    </>
  ),

  // HX711 load-cell amplifier: load cell pads on the left, MCU pads on the right.
  hx711: (
    <>
      <rect className="pcb" x="14" y="18" width="92" height="54" rx="2.5" />
      {/* a few tiny passives */}
      <rect className="ln-faint" x="48" y="24" width="5" height="3" rx="0.6" />
      <rect className="ln-faint" x="58" y="24" width="5" height="3" rx="0.6" />
      <rect className="ln-faint" x="68" y="24" width="5" height="3" rx="0.6" />
      <rect className="ln-faint" x="50" y="63" width="5" height="3" rx="0.6" />
      <rect className="ln-faint" x="62" y="63" width="5" height="3" rx="0.6" />
      {/* SOP-16 amplifier IC */}
      <path className="ln-thin" d={legTicks(seq(8, 47.75, 3.5), 33, 3) + legTicks(seq(8, 47.75, 3.5), 54, 3)} />
      <rect className="chip" x="44" y="36" width="32" height="18" rx="1.5" />
      <circle className="wash" cx="47.5" cy="50.8" r="1.1" />
      {/* load cell side: four solder pads, the accent */}
      {Array.from({ length: 4 }, (_, i) => (
        <g key={`lp${i}`}>
          <circle className="hot" cx="21" cy={30 + i * 10} r="2.9" />
          <circle className="chip" cx="21" cy={30 + i * 10} r="1.1" />
        </g>
      ))}
      <text x="27" y="32">E+</text>
      {/* MCU side: four solder pads */}
      {Array.from({ length: 4 }, (_, i) => (
        <g key={`rp${i}`}>
          <circle className="pin" cx="99" cy={30 + i * 10} r="2.9" />
          <circle className="chip" cx="99" cy={30 + i * 10} r="1.1" />
        </g>
      ))}
      <text x="92.5" y="42" textAnchor="end">DT</text>
    </>
  ),

  // 0.96" SSD1306 OLED module showing a reading.
  oled: (
    <>
      <rect className="pcb" x="25" y="10" width="70" height="70" rx="3" />
      {/* four-pin header on the top edge */}
      <rect className="chip" x="46" y="12" width="28" height="7.5" rx="1" />
      {Array.from({ length: 4 }, (_, i) => (
        <rect key={`p${i}`} className="pin" x={48.45 + i * 6.7} y="14.25" width="3" height="3" rx="0.6" />
      ))}
      {/* mounting holes */}
      <circle className="ln-thin" cx="31.5" cy="15" r="2" />
      <circle className="ln-thin" cx="88.5" cy="15" r="2" />
      <circle className="ln-thin" cx="31.5" cy="76" r="2" />
      <circle className="ln-thin" cx="88.5" cy="76" r="2" />
      {/* the dark glass: yellow band on top, then the reading */}
      <rect className="chip" x="29" y="22" width="62" height="50" rx="1.5" />
      <rect className="hot" x="31.5" y="24.5" width="57" height="11" rx="1" />
      <text className="on-dark" x="60" y="56" textAnchor="middle">143.2 g</text>
      {/* the resistors under the glass */}
      <rect className="ln-faint" x="48" y="74.5" width="5" height="3" rx="0.5" />
      <rect className="ln-faint" x="58" y="74.5" width="5" height="3" rx="0.5" />
      <rect className="ln-faint" x="68" y="74.5" width="5" height="3" rx="0.5" />
    </>
  ),

  // 16x2 character LCD with its I2C backpack peeking out at the right.
  lcd1602: (
    <>
      {/* I2C backpack, behind the LCD: trimmer and four-pin header */}
      <rect className="pcb" x="84" y="31" width="27" height="28" rx="2.5" />
      <rect className="cool" x="95.8" y="42.2" width="5" height="5" rx="1" />
      <path className="ln-thin" d="M97 44.7h2.6" />
      <rect className="chip" x="103" y="33.5" width="6" height="23" rx="1" />
      {Array.from({ length: 4 }, (_, i) => (
        <rect key={`i${i}`} className="hot" x="104.75" y={35.65 + i * 5.4} width="2.5" height="2.5" rx="0.5" />
      ))}
      {/* the LCD module itself */}
      <rect className="pcb" x="8" y="24" width="86" height="42" rx="2.5" />
      <circle className="ln-thin" cx="12.5" cy="28.5" r="1.7" />
      <circle className="ln-thin" cx="89.5" cy="28.5" r="1.7" />
      <circle className="ln-thin" cx="12.5" cy="61.5" r="1.7" />
      <circle className="ln-thin" cx="89.5" cy="61.5" r="1.7" />
      <rect className="metal" x="17" y="28" width="68" height="34" rx="2" />
      <rect className="wash" x="21" y="33" width="60" height="24" rx="1" />
      <rect className="ln-thin" x="21" y="33" width="60" height="24" rx="1" />
      {/* 16 columns x 2 rows of character cells */}
      {Array.from({ length: 32 }, (_, i) => (
        <rect
          key={`c${i}`}
          className="ln-faint"
          x={23.35 + (i % 16) * 3.5}
          y={i < 16 ? 36.5 : 47.5}
          width="2.8"
          height="6"
          rx="0.4"
        />
      ))}
    </>
  ),

  // AMS1117-3.3 regulator module.
  regulator: (
    <>
      <rect className="pcb" x="14" y="17" width="92" height="56" rx="3" />
      {/* three-pin headers on both short edges */}
      <rect className="chip" x="17" y="29" width="9" height="32" rx="1" />
      <rect className="chip" x="94" y="29" width="9" height="32" rx="1" />
      {Array.from({ length: 3 }, (_, i) => (
        <rect key={`l${i}`} className="pin" x="19.7" y={32.6 + i * 10.6} width="3.6" height="3.6" rx="0.8" />
      ))}
      {Array.from({ length: 3 }, (_, i) => (
        <rect key={`r${i}`} className="pin" x="96.7" y={32.6 + i * 10.6} width="3.6" height="3.6" rx="0.8" />
      ))}
      {/* input and output capacitors */}
      <rect className="body" x="28.5" y="39" width="13" height="12" rx="1.5" />
      <path className="ln-thin" d="M32.8 39v12" />
      <rect className="body" x="78.5" y="39" width="13" height="12" rx="1.5" />
      <path className="ln-thin" d="M87.2 39v12" />
      {/* SOT-223: wide tab above, body, three leads below */}
      <rect className="metal" x="53" y="29.5" width="14" height="9" rx="1.2" />
      {[52, 60, 68].map((x) => (
        <rect key={`lead${x}`} className="metal" x={x - 1.7} y="50" width="3.4" height="8" rx="0.6" />
      ))}
      <rect className="chip" x="46" y="37" width="28" height="16" rx="1.5" />
      <text className="on-dark" x="60" y="47" textAnchor="middle">1117</text>
      {/* power LED and its resistor */}
      <rect className="hot" x="51" y="63" width="6" height="4" rx="1" />
      <rect className="ln-faint" x="62" y="63.2" width="7" height="3.6" rx="0.6" />
    </>
  ),

  // 74AHCT125 in a DIP-14, seen from above.
  'level-shifter': (
    <>
      {/* seven legs per side, drawn first so the body sits over their roots */}
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={`t${i}`} className="pin" x={21.7 + i * 12} y="25" width="4.6" height="8" rx="0.8" />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={`b${i}`} className="pin" x={21.7 + i * 12} y="57" width="4.6" height="8" rx="0.8" />
      ))}
      <rect className="chip" x="14" y="31" width="92" height="28" rx="2.5" />
      {/* half-moon notch at the pin-1 end, and the pin-1 dot */}
      <path className="wash" d="M14 40.5a4.5 4.5 0 0 1 0 9z" />
      <circle className="hot" cx="22" cy="53.5" r="2" />
      <text className="on-dark" x="60" y="47.2" textAnchor="middle">74AHCT125</text>
    </>
  ),

  // 12-pixel WS2812B ring.
  'led-ring': (
    <>
      {/* light from the lit pixel, behind the ring */}
      <circle className="glow" cx="89.5" cy="45" r="15" />
      <path className="pcb" fillRule="evenodd" d={ringPath(60, 45, 36.2, 22.8)} />
      {/* twelve pixels, evenly spaced; the one at 3 o'clock is lit */}
      {Array.from({ length: 12 }, (_, i) => (
        <g key={`led${i}`} transform={`rotate(${i * 30} 60 45)`}>
          {i === 3 ? (
            <>
              <rect className="hot" x="56.3" y="11.8" width="7.4" height="7.4" rx="1" />
              <rect className="ln" x="56.3" y="11.8" width="7.4" height="7.4" rx="1" />
            </>
          ) : (
            <rect className="body" x="56.3" y="11.8" width="7.4" height="7.4" rx="1" />
          )}
          <circle className="ln-faint" cx="60" cy="15.5" r="2.2" />
        </g>
      ))}
      {/* three solder pads in the gap between two pixels */}
      <g transform="rotate(195 60 45)">
        {[26.2, 29.5, 32.8].map((rad) => (
          <rect key={`pad${rad}`} className="pin" x="58.4" y={n2(45 - rad - 1.2)} width="3.2" height="2.4" rx="0.7" />
        ))}
      </g>
    </>
  ),

  // LM2596 step-down module.
  buck: (
    <>
      <rect className="pcb" x="10" y="20" width="100" height="50" rx="3" />
      {/* IN and OUT pads at the two ends */}
      {[31, 59].map((y) => (
        <g key={`in${y}`}>
          <circle className="pin" cx="17" cy={y} r="3.2" />
          <circle className="chip" cx="17" cy={y} r="1.2" />
        </g>
      ))}
      {[31, 59].map((y) => (
        <g key={`out${y}`}>
          <circle className="pin" cx="103" cy={y} r="3.2" />
          <circle className="chip" cx="103" cy={y} r="1.2" />
        </g>
      ))}
      <text x="17" y="47.5" textAnchor="middle">IN</text>
      <text x="103" y="47.5" textAnchor="middle">OUT</text>
      {/* input electrolytic, from above */}
      <circle className="metal" cx="32" cy="44" r="9" />
      <circle className="ln-faint" cx="32" cy="44" r="6.6" />
      <path className="ln-thin" d="M27.5 44h9M32 39.5v9" />
      {/* toroidal inductor with its winding */}
      <path className="metal" fillRule="evenodd" d={ringPath(60, 41, 14.5, 6)} />
      <path className="ln-faint" d={windingTicks(60, 41, 6, 14.5, 24, 0.14)} />
      {/* LM2596 and the catch diode */}
      <path className="ln-thin" d={legTicks(seq(5, 55.5, 2.6), 57.5, 2.5)} />
      <rect className="chip" x="54" y="60" width="14" height="7.5" rx="1" />
      <rect className="chip" x="72" y="60" width="7" height="5" rx="0.8" />
      {/* output electrolytic */}
      <circle className="metal" cx="86" cy="41" r="7.5" />
      <circle className="ln-faint" cx="86" cy="41" r="5.2" />
      <path className="ln-thin" d="M82.4 41h7.2M86 37.4v7.2" />
      {/* blue trimmer potentiometer with its screw slot */}
      <rect className="cool" x="81" y="53" width="11" height="11" rx="1.5" />
      <circle className="body" cx="86.5" cy="58.5" r="3.4" />
      <path className="ln-thin" d="M84.4 58.5h4.2" />
      {/* power LED and resistor */}
      <rect className="hot" x="28" y="62" width="4.6" height="3.2" rx="0.8" />
      <rect className="ln-faint" x="36" y="62" width="5.4" height="3.2" rx="0.5" />
    </>
  ),

  // microSD card, enlarged.
  microsd: (
    <>
      <path
        className="body"
        d={roundedPoly(
          [
            sdPt(0, 0),
            sdPt(8.4, 0),
            sdPt(9, 0.9),
            sdPt(11.4, 0.9),
            sdPt(12, 0),
            sdPt(13.5, 0),
            sdPt(15, 1.5),
            sdPt(15, 11),
            sdPt(0, 11),
          ],
          2.2,
        )}
      />
      {/* label area with a brand band and printed lines */}
      <rect className="wash" x={sdx(1.3)} y={sdy(1.8)} width={n2(SD_S * 6.3)} height={n2(SD_S * 7.4)} rx="1.5" />
      <rect className="ln-faint" x={sdx(1.3)} y={sdy(1.8)} width={n2(SD_S * 6.3)} height={n2(SD_S * 7.4)} rx="1.5" />
      <rect className="hot" x="23.2" y="25" width="34" height="8" rx="1.2" />
      <path className="ln-faint" d="M23.2 43h34M23.2 50h26M23.2 57h30" />
      {/* eight gold contacts along the insertion edge */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={`ct${i}`}
          className="pin"
          x={sdx(10.6)}
          y={sdy(1.6 + i * 1.1)}
          width={n2(SD_S * 3.8)}
          height={n2(SD_S * 0.8)}
          rx="0.8"
        />
      ))}
    </>
  ),
};
