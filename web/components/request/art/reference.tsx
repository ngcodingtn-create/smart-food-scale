import type { ReactNode } from 'react';

/**
 * The two drawings every other part drawing is matched against.
 *
 * Conventions (see ../request.css for the class palette):
 *  - Each entry is the CONTENT of an <svg viewBox="0 0 120 90">; the wrapper in
 *    ../PartArt.tsx supplies the <svg> element itself.
 *  - Keep artwork inside x 8..112, y 8..82 — a margin so nothing touches the edge.
 *  - Boards are drawn from above, flat. Discrete parts are drawn side-on, the
 *    way they sit in a parts drawer. No perspective, no gradients, no shadows.
 *  - Colour comes only from classes. One `.hot` accent area per drawing: the
 *    thing a reader should notice first.
 *  - Outlines are 1.6 wide (class defaults); corner radii 1–3.
 */
export const ART_REFERENCE: Record<string, ReactNode> = {
  // ESP32 DevKit V1, 30-pin, seen from above.
  devkit: (
    <>
      <rect className="pcb" x="12" y="24" width="96" height="42" rx="3" />
      {/* two rows of fifteen header pins */}
      {Array.from({ length: 15 }, (_, i) => (
        <rect key={`t${i}`} className="pin" x={17 + i * 5.2} y="26.6" width="2.6" height="2.6" rx="0.6" />
      ))}
      {Array.from({ length: 15 }, (_, i) => (
        <rect key={`b${i}`} className="pin" x={17 + i * 5.2} y="60.8" width="2.6" height="2.6" rx="0.6" />
      ))}
      {/* WROOM-32 module: metal shield, with the antenna trace beyond it */}
      <path className="ln-faint" d="M15 36h5v4h-5v4h5v4h-5v4h5" />
      <rect className="metal" x="22" y="33" width="34" height="24" rx="1.5" />
      <text x="29" y="47">ESP32</text>
      {/* USB-serial chip, regulator, the two buttons */}
      <rect className="chip" x="62" y="35" width="9" height="8" rx="1" />
      <rect className="chip" x="63" y="49" width="7" height="5" rx="0.8" />
      <rect className="body" x="77" y="33" width="6" height="6" rx="1" />
      <rect className="body" x="77" y="51" width="6" height="6" rx="1" />
      {/* micro-USB socket overhanging the edge */}
      <rect className="metal" x="97" y="38" width="13" height="14" rx="1.5" />
      {/* power LED */}
      <circle className="hot" cx="89" cy="45" r="1.8" />
    </>
  ),

  // Straight-bar load cell, side-on: fixed at the left, loaded at the right.
  'load-cell': (
    <>
      <rect className="metal" x="12" y="38" width="80" height="20" rx="2" />
      {/* the "binocular" cut-out that makes the bar flex */}
      <path className="body" d="M40 44a4 4 0 0 1 4-4h16a4 4 0 0 1 0 8h-1.5a4 4 0 0 0-3-1.4h-7a4 4 0 0 0-3 1.4H44a4 4 0 0 1-4-4z" />
      {/* mounting holes, two each end */}
      <circle className="ln-thin" cx="20" cy="48" r="2.2" />
      <circle className="ln-thin" cx="29" cy="48" r="2.2" />
      <circle className="ln-thin" cx="75" cy="48" r="2.2" />
      <circle className="ln-thin" cx="84" cy="48" r="2.2" />
      {/* strain gauge under its white potting */}
      <rect className="body" x="42" y="34.5" width="20" height="3.5" rx="1" />
      {/* the four bridge wires */}
      <path className="w-red" d="M12 42c-3 0-3-8 1-12" />
      <path className="w-blk" d="M12 46c-5 0-6-12 0-17" />
      <path className="w-wht" d="M12 50c-7 0-9-16-1-22" />
      <path className="w-grn" d="M12 54c-9 0-12-20-2-27" />
      {/* the load */}
      <path className="hot-ln" d="M80 14v18M75 26l5 6 5-6" />
      <text x="88" y="20">3 kg</text>
      {/* the fixed end rests on a spacer */}
      <rect className="wash" x="16" y="58" width="18" height="7" rx="1" />
      <path className="ln-thin" d="M10 65h100" />
    </>
  ),
};
