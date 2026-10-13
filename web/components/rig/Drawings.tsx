import { Figure, FigureGrid, FigureKey } from '../Figure';
import { CLEARANCE, DIM, LENS, PARTS, frameAt, type PartId } from './specs';

/**
 * The rig as four flat drawings. Every coordinate is computed from ./specs.ts —
 * the same table the 3D model is built from — so a drawing cannot disagree with
 * the model, or with the dimension table.
 *
 * Numbered badges are the part numbers used by the 3D viewer's legend.
 * Almost every rig-level size is a design proposal (decision D10), so nearly
 * all dimension lines here are drawn in the "proposed" style.
 */

const r = (value: number) => Math.round(value * 10) / 10;
const numberOf = (id: PartId) => PARTS.findIndex((part) => part.id === id) + 1;

const BASE_TOP = DIM.base.bottom + DIM.base.height; // 38: top edge of the tray
const CELL_TOP = DIM.cell.bottom + DIM.cell.height; // 54.7
const CELL_Y = DIM.cell.bottom + DIM.cell.height / 2;
const PLATFORM_BOTTOM = DIM.platform.y - DIM.platform.height / 2; // 66
const POST_Z = -107;

function Badge({ x, y, id }: { x: number; y: number; id: PartId }) {
  return (
    <g>
      <circle className="num" cx={x} cy={y} r={7.5} />
      <text className="num-t" x={x} y={y + 3.2}>
        {numberOf(id)}
      </text>
    </g>
  );
}

function DimH({ x1, x2, y, label, sourced = false }: { x1: number; x2: number; y: number; label: string; sourced?: boolean }) {
  return (
    <g>
      <path className={sourced ? 'dim' : 'dim-est'} d={`M${x1} ${y}H${x2}M${x1} ${y - 4}v8M${x2} ${y - 4}v8`} />
      <text className={sourced ? 't-dim' : 't-est'} x={r((x1 + x2) / 2)} y={y + 13} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function DimV({ x, y1, y2, label, left = false, sourced = false }: { x: number; y1: number; y2: number; label: string; left?: boolean; sourced?: boolean }) {
  return (
    <g>
      <path className={sourced ? 'dim' : 'dim-est'} d={`M${x} ${y1}V${y2}M${x - 4} ${y1}h8M${x - 4} ${y2}h8`} />
      <text
        className={sourced ? 't-dim' : 't-est'}
        x={left ? x - 7 : x + 7}
        y={r((y1 + y2) / 2 + 3.5)}
        textAnchor={left ? 'end' : 'start'}
      >
        {label}
      </text>
    </g>
  );
}

/** Seen from the right-hand side: the front panel on the left, the arm at the back. */
export function SideElevation({ badges = true }: { badges?: boolean } = {}) {
  const s = 0.62;
  const G = 280; // the bench
  const X = (z: number) => r(176 - z * s);
  const Y = (y: number) => r(G - y * s);
  const pz = DIM.plate.z;
  const half = DIM.arm.section / 2;
  const lensTop = DIM.camera.lensBottom + 10;

  return (
    <svg className="fig" viewBox="0 0 360 326" role="img" aria-label={`Side view of the rig: ${DIM.arm.top} mm tall, lens ${CLEARANCE} mm above the plate`}>
      <path className="ground" d={`M20 ${G}H340`} />
      {[96, -96].map((z) => (
        <rect key={z} className="chip" x={X(z + 9)} y={Y(6)} width={r(18 * s)} height={r(6 * s)} rx="1" />
      ))}

      {/* the tray, with the display standing on its front edge */}
      <rect className="wood" x={X(DIM.base.depth / 2)} y={Y(BASE_TOP)} width={r(DIM.base.depth * s)} height={r(DIM.base.height * s)} rx="2" />
      <rect className="chip" x={X(101 + DIM.oled.length / 2)} y={Y(BASE_TOP + DIM.oled.height)} width={r(DIM.oled.length * s)} height={r(DIM.oled.height * s)} />

      {/* inside the tray, end-on: spacer, then the load cell on it, then the riser */}
      <rect className="ln-faint dash" x={X(pz + 7)} y={Y(DIM.cell.bottom)} width={r(14 * s)} height={r((DIM.cell.bottom - 12) * s)} />
      <rect className="metal" x={X(pz + DIM.cell.width / 2)} y={Y(CELL_TOP)} width={r(DIM.cell.width * s)} height={r(DIM.cell.height * s)} />
      <rect className="metal" x={X(pz + 6)} y={Y(PLATFORM_BOTTOM)} width={r(12 * s)} height={r((PLATFORM_BOTTOM - CELL_TOP) * s)} />

      {/* platform, then the plate on it */}
      <rect className="metal" x={X(pz + DIM.platform.diameter / 2)} y={Y(DIM.plate.bottom)} width={r(DIM.platform.diameter * s)} height={r(DIM.platform.height * s)} />
      <path
        className="body"
        d={`M${X(pz + 90)} ${Y(81)}L${X(pz + 61)} ${Y(70)}H${X(pz - 61)}L${X(pz - 90)} ${Y(81)}L${X(pz - 89)} ${Y(82.5)}L${X(pz - 60)} ${Y(73)}H${X(pz + 60)}L${X(pz + 89)} ${Y(82.5)}Z`}
      />

      {/* the arm: an upright at the back, a member reaching over the plate */}
      <rect className="metal" x={X(POST_Z + half)} y={Y(DIM.arm.top - 10)} width={r(DIM.arm.section * s)} height={r((DIM.arm.top - 10 - BASE_TOP) * s)} />
      <rect className="metal" x={X(-5)} y={Y(DIM.arm.top)} width={r(DIM.arm.reach * s)} height={r(DIM.arm.section * s)} />
      <rect className="hot" x={X(pz + 24.5)} y={Y(DIM.arm.top - 4.5)} width={r(49 * s)} height={r(7 * s)} rx="1" />

      {/* camera board, lens, then the light: carrier, LEDs, diffuser */}
      <rect className="pcb" x={X(pz + DIM.camera.length / 2)} y={Y(DIM.camera.y - 0.6)} width={r(DIM.camera.length * s)} height="2.2" />
      <rect className="chip" x={X(pz + 4)} y={Y(lensTop)} width={r(8 * s)} height={r(10 * s)} />
      <rect className="wood" x={X(pz + DIM.light.carrier / 2)} y={Y(DIM.light.y + 0.8)} width={r(DIM.light.carrier * s)} height="1.6" />
      {[22, 11, -11, -22].map((z) => (
        <rect key={z} className="body" x={X(pz + z + 2.5)} y={Y(DIM.light.y - 0.8)} width={r(DIM.light.led * s)} height={r(DIM.light.ledLength * s)} rx="1.4" />
      ))}
      <path className="ln-thin" d={`M${X(pz + DIM.light.diffuser / 2)} ${Y(DIM.light.y - 12.4)}H${X(pz - DIM.light.diffuser / 2)}`} />

      {/* line of sight */}
      <path className="hot-ln dash" d={`M${X(pz)} ${Y(DIM.camera.lensBottom - 8)}V${Y(DIM.plate.surface)}`} />

      <DimV x={X(pz) - 52} y1={Y(DIM.camera.lensBottom)} y2={Y(DIM.plate.surface)} label={`${CLEARANCE} mm`} left />
      <DimV x={302} y1={Y(DIM.arm.top)} y2={G} label={`${DIM.arm.top} mm`} />
      <DimH x1={X(pz + 90)} x2={X(pz - 90)} y={G + 12} label={`plate Ø${DIM.plate.diameter}`} />
      <DimH x1={X(DIM.base.depth / 2)} x2={X(-DIM.base.depth / 2)} y={G + 30} label={`base ${DIM.base.depth} mm deep`} />

      {/* Numbered for the rig page; the component request uses its own line numbers instead. */}
      {badges ? (
        <>
          <Badge id="plate" x={X(pz + 90) - 11} y={Y(92)} />
          <Badge id="cell" x={X(pz + 30)} y={Y(CELL_Y)} />
          <Badge id="oled" x={X(101)} y={Y(BASE_TOP + DIM.oled.height) - 11} />
          <Badge id="light" x={X(pz + DIM.light.carrier / 2) - 11} y={Y(DIM.light.y - 6)} />
          <Badge id="camera" x={X(pz + 40)} y={Y(DIM.arm.top) - 11} />
          <Badge id="arm" x={X(POST_Z) + 0.5} y={Y(230)} />
        </>
      ) : null}
    </svg>
  );
}

/** Seen from above: the front panel at the bottom, the arm at the top. */
export function PlanView() {
  const X = (x: number) => r(166 + x);
  const Y = (z: number) => r(150 + z);
  const pz = DIM.plate.z;
  const w = DIM.base.width / 2;
  const d = DIM.base.depth / 2;
  const leds = Array.from({ length: DIM.light.count }, (_, i) => ((i + 0.5) * Math.PI * 2) / DIM.light.count);

  return (
    <svg className="fig" viewBox="0 0 360 326" role="img" aria-label={`Plan view of the rig: base ${DIM.base.width} by ${DIM.base.depth} mm, plate ${DIM.plate.diameter} mm across`}>
      <rect className="wood" x={X(-w)} y={Y(-d)} width={DIM.base.width} height={DIM.base.depth} rx="4" />
      <rect className="body" x={X(-w + 5)} y={Y(82)} width={DIM.base.width - 10} height={38 - 5} rx="2" />

      {/* front panel: the display, TARE, PHOTO */}
      <rect className="chip" x={X(-33 - DIM.oled.width / 2)} y={Y(101 - DIM.oled.length / 2)} width={DIM.oled.width} height={DIM.oled.length} rx="1.5" />
      <circle className="body" cx={X(14)} cy={Y(101)} r="6" />
      <circle className="hot" cx={X(40)} cy={Y(101)} r="6" />

      {/* plate, with its well and the platform beneath */}
      <circle className="body" cx={X(0)} cy={Y(pz)} r={DIM.plate.diameter / 2} />
      <circle className="ln-faint" cx={X(0)} cy={Y(pz)} r="59" />
      <circle className="ln-faint dash" cx={X(0)} cy={Y(pz)} r={DIM.platform.diameter / 2} />

      {/* inside the tray, under the plate: drawn dashed, as hidden parts are */}
      <rect className="ln-thin dash" x={X(-DIM.cell.length / 2)} y={Y(pz - DIM.cell.width / 2)} width={DIM.cell.length} height={DIM.cell.width} />
      <rect className="ln-thin dash" x={X(-72 - DIM.devkit.width / 2)} y={Y(-22 - DIM.devkit.length / 2)} width={DIM.devkit.width} height={DIM.devkit.length} rx="1.5" />
      <rect className="ln-thin dash" x={X(67 - DIM.hx711.width / 2)} y={Y(-22 - DIM.hx711.length / 2)} width={DIM.hx711.width} height={DIM.hx711.length} rx="1.5" />
      <circle className="ln-thin dash" cx={X(-67)} cy={Y(53)} r={DIM.buzzer.diameter / 2} />

      {/* the arm above everything: upright, member, then camera and light at its tip */}
      <rect className="metal" fillOpacity="0.6" x={X(-10)} y={Y(-117)} width={DIM.arm.section} height={DIM.arm.reach} rx="2" />
      <rect className="metal" x={X(-10)} y={Y(POST_Z - 10)} width={DIM.arm.section} height={DIM.arm.section} rx="1.5" />
      <circle className="ln-thin" cx={X(0)} cy={Y(pz)} r={DIM.light.carrier / 2} />
      <rect className="pcb" fillOpacity="0.85" x={X(-DIM.camera.width / 2)} y={Y(pz - DIM.camera.length / 2)} width={DIM.camera.width} height={DIM.camera.length} rx="1.5" />
      {leds.map((angle) => (
        <circle key={angle} className="body" cx={r(X(0) + (Math.cos(angle) * DIM.light.circle) / 2)} cy={r(Y(pz) + (Math.sin(angle) * DIM.light.circle) / 2)} r={DIM.light.led / 2} />
      ))}
      <circle className="chip" cx={X(0)} cy={Y(pz)} r="4" />

      <DimH x1={X(-w)} x2={X(w)} y={Y(d) + 14} label={`${DIM.base.width} mm`} />
      <DimV x={X(w) + 14} y1={Y(-d)} y2={Y(d)} label={`${DIM.base.depth} mm`} />

      <Badge id="plate" x={X(-74)} y={Y(pz + 52)} />
      <Badge id="cell" x={X(-DIM.cell.length / 2) - 1} y={Y(pz)} />
      <Badge id="devkit" x={X(-72)} y={Y(-22 - DIM.devkit.length / 2) - 1} />
      <Badge id="hx711" x={X(67)} y={Y(-22 - DIM.hx711.length / 2) - 1} />
      <Badge id="oled" x={X(-33 - DIM.oled.width / 2) - 10} y={Y(101)} />
      <Badge id="buttons" x={X(58)} y={Y(101)} />
      <Badge id="buzzer" x={X(-67)} y={Y(53 + 15)} />
      <Badge id="camera" x={X(DIM.camera.width / 2) + 9} y={Y(pz + 10)} />
      <Badge id="light" x={X(DIM.light.carrier / 2) + 1} y={Y(pz - 24)} />
      <Badge id="arm" x={X(21)} y={Y(POST_Z)} />
    </svg>
  );
}

function Head({ x, y, dir }: { x: number; y: number; dir: 'down' | 'left' | 'right' }) {
  const d = dir === 'down' ? `M${x - 4.5} ${y - 6}L${x} ${y}L${x + 4.5} ${y - 6}` : dir === 'left' ? `M${x + 6} ${y - 4.5}L${x} ${y}L${x + 6} ${y + 4.5}` : `M${x - 6} ${y - 4.5}L${x} ${y}L${x - 6} ${y + 4.5}`;
  return <path className="hot-ln" d={d} />;
}

/** A section through the weighing stack: where the plate's weight goes, and what it must not touch. */
export function LoadPath() {
  const s = 2;
  const X = (x: number) => r(180 + x * s);
  const Y = (y: number) => r(268 - y * s);
  const m = DIM.cell.mount;
  const bore = DIM.cell.height * 0.27 * s;
  const span = DIM.cell.length * 0.13;

  return (
    <svg className="fig" viewBox="0 0 360 300" role="img" aria-label="Section through the weighing stack: the plate's weight goes down the riser, along the load cell, and into the base through one spacer">
      <path className="ground" d="M0 268H360" />
      <rect className="wood" x="-4" y={Y(12)} width="368" height={r(6 * s)} />

      {/* the Z-mount: a spacer under the fixed end only, a stop screw 1 mm short of the free end */}
      <rect className="metal" x={X(-m - 8)} y={Y(DIM.cell.bottom)} width={r(16 * s)} height={r((DIM.cell.bottom - 12) * s)} />
      <rect className="chip" x={X(m - 2.4)} y={Y(DIM.cell.bottom - 1)} width={r(4.8 * s)} height={r((DIM.cell.bottom - 13) * s)} rx="1" />

      {/* the load cell and the cut-out that lets it bend */}
      <rect className="metal" x={X(-DIM.cell.length / 2)} y={Y(CELL_TOP)} width={r(DIM.cell.length * s)} height={r(DIM.cell.height * s)} rx="1.5" />
      <path
        className="body"
        d={`M${X(-span)} ${r(Y(CELL_Y) - bore)}H${X(span)}a${r(bore)} ${r(bore)} 0 0 1 0 ${r(bore * 2)}H${X(-span)}a${r(bore)} ${r(bore)} 0 0 1 0 ${r(-bore * 2)}z`}
      />

      {/* riser, platform, plate, and something to weigh */}
      <rect className="metal" x={X(m - 8)} y={Y(PLATFORM_BOTTOM)} width={r(16 * s)} height={r((PLATFORM_BOTTOM - CELL_TOP) * s)} />
      <rect className="metal" x={X(-DIM.platform.diameter / 2)} y={Y(DIM.plate.bottom)} width={r(DIM.platform.diameter * s)} height={r(DIM.platform.height * s)} rx="1" />
      <path
        className="body"
        d={`M${X(-90)} ${Y(81)}L${X(-61)} ${Y(70)}H${X(61)}L${X(90)} ${Y(81)}L${X(89)} ${Y(82.5)}L${X(60)} ${Y(73)}H${X(-60)}L${X(-89)} ${Y(82.5)}Z`}
      />
      <path className="wash" d={`M${X(-42)} ${Y(73)}C${X(-36)} ${Y(92)} ${X(-14)} ${Y(101)} ${X(0)} ${Y(101)}S${X(36)} ${Y(92)} ${X(42)} ${Y(73)}Z`} />
      <path className="ln-faint dash" d={`M${X(-42)} ${Y(73)}C${X(-36)} ${Y(92)} ${X(-14)} ${Y(101)} ${X(0)} ${Y(101)}S${X(36)} ${Y(92)} ${X(42)} ${Y(73)}`} />

      {/* the force: down onto the platform, across to the riser, down into the free end,
          back along the cell, and out through the fixed end into the base */}
      <path
        className="hot-ln"
        d={`M${X(0)} ${Y(118)}V${Y(DIM.platform.y)}H${X(m)}V${Y(CELL_Y)}H${X(-m)}V${Y(10)}`}
      />
      <Head x={X(0)} y={Y(101)} dir="down" />
      <Head x={X(m)} y={Y(CELL_TOP + 1)} dir="down" />
      <Head x={X(-m + 14)} y={Y(CELL_Y)} dir="left" />
      <Head x={X(-m)} y={Y(13)} dir="down" />

      <text className="t-hot" x={X(0) + 8} y={Y(112)}>the mass</text>
      <text className="t-strong" x={X(m + 11)} y={Y(59)}>only contact</text>
      <text className="t-hot" x={X(0)} y={Y(DIM.cell.bottom) + 13} textAnchor="middle">bends here</text>
      <text className="t-strong" x={X(-m - 11)} y={Y(26)} textAnchor="end">fixed end</text>
      <text className="t-strong" x={X(m + 6)} y={Y(27)}>stop screw</text>
      <text className="t-small" x={X(m + 6)} y={Y(27) + 11}>1 mm short of the cell</text>

      {/* nothing else may hold the platform up */}
      <path className="cool-ln" d={`M${X(-64)} ${Y(PLATFORM_BOTTOM) + 3}V${Y(12) - 3}M${X(-68)} ${Y(PLATFORM_BOTTOM) + 3}h8M${X(-68)} ${Y(12) - 3}h8`} />
      <text className="t-dim" x={X(-69)} y={Y(38)} textAnchor="end">air gap</text>

      <Badge id="plate" x={X(-78)} y={Y(92)} />
      <Badge id="cell" x={X(-DIM.cell.length / 2) - 11} y={Y(CELL_Y)} />
    </svg>
  );
}

/** What the camera sees from its height, and what the light covers. */
export function CameraGeometry() {
  const s = 0.72;
  const P = 282; // the plate's surface
  const X = (u: number) => r(180 + u * s);
  const L = r(P - CLEARANCE * s); // the lens face
  const [long, short] = frameAt(CLEARANCE);
  const margin = Math.round((short - DIM.plate.diameter) / 2);

  return (
    <svg className="fig" viewBox="0 0 360 334" role="img" aria-label={`From ${CLEARANCE} mm the camera frames about ${Math.round(long)} by ${Math.round(short)} mm around a ${DIM.plate.diameter} mm plate`}>
      {/* the light: wide and soft, from six LEDs through a diffuser */}
      <path className="beam" d={`M${X(-DIM.light.diffuser / 2)} ${L + 4}L${X(-168)} ${P}H${X(168)}L${X(DIM.light.diffuser / 2)} ${L + 4}Z`} />
      {/* the view: the short side of the 4:3 frame, which is the tighter one */}
      <path className="view" d={`M${X(0)} ${L}L${X(-short / 2)} ${P}H${X(short / 2)}Z`} />
      <path className="cool-ln dash" d={`M${X(-short / 2)} ${P}L${X(0)} ${L}L${X(short / 2)} ${P}`} />

      {/* arm tip, camera board, lens, carrier, LEDs, diffuser */}
      <rect className="metal" x={X(-40)} y={L - 30} width={r(160 * s)} height="13" rx="2" />
      <rect className="pcb" x={X(-DIM.camera.length / 2)} y={L - 12} width={r(DIM.camera.length * s)} height="2.4" />
      <rect className="chip" x={X(-4)} y={L - 8} width={r(8 * s)} height="8" />
      <rect className="wood" x={X(-DIM.light.carrier / 2)} y={L - 6} width={r(DIM.light.carrier * s)} height="1.8" />
      {[-22, -11, 11, 22].map((u) => (
        <rect key={u} className="body" x={X(u - 2.5)} y={L - 4.2} width={r(DIM.light.led * s)} height="6" rx="1.4" />
      ))}
      <path className="ln-thin" d={`M${X(-DIM.light.diffuser / 2)} ${L + 4}H${X(DIM.light.diffuser / 2)}`} />

      {/* the plate */}
      <path
        className="body"
        d={`M${X(-90)} ${r(P - 6)}L${X(-60)} ${P}H${X(60)}L${X(90)} ${r(P - 6)}L${X(89)} ${r(P - 4)}L${X(61)} ${P + 2.4}H${X(-61)}L${X(-89)} ${r(P - 4)}Z`}
      />
      <path className="ground" d={`M24 ${P + 3}H336`} />

      <text className="t-dim" x={X(0)} y={r((L + P) / 2 + 20)} textAnchor="middle">camera sees</text>
      <text className="t-est" x={X(-112)} y={r(P - 26)} textAnchor="middle">light</text>
      <text className="t-small" x={X(10)} y={L + 24}>{LENS.quotedDeg}° quoted</text>

      <DimV x={X(-short / 2) - 34} y1={L} y2={P} label={`${CLEARANCE} mm`} left />
      <DimH x1={X(-90)} x2={X(90)} y={P + 14} label={`plate ${DIM.plate.diameter} mm`} />
      <DimH x1={X(-short / 2)} x2={X(short / 2)} y={P + 32} label={`frame ≈ ${Math.round(short / 10) * 10} mm · ${margin} mm spare each side`} />

      <Badge id="camera" x={X(DIM.camera.length / 2) + 12} y={L - 12} />
      <Badge id="light" x={X(-DIM.light.carrier / 2) - 12} y={L - 2} />
      <Badge id="plate" x={X(104)} y={P - 9} />
    </svg>
  );
}

/** The four drawings, captioned, with the key to their line styles. */
export function RigDrawings() {
  const [long, short] = frameAt(CLEARANCE);
  const tens = (value: number) => Math.round(value / 10) * 10;
  return (
    <>
      <FigureGrid>
        <Figure title="From the side" caption={`${DIM.arm.top} mm tall. The lens is ${CLEARANCE} mm above the plate.`}>
          <SideElevation />
        </Figure>
        <Figure title="From above" caption={`A ${DIM.base.width} × ${DIM.base.depth} mm base. Dashed parts are inside it, under the plate.`}>
          <PlanView />
        </Figure>
        <Figure
          title="Where the weight goes"
          caption="One path: plate, riser, load cell, spacer, base. Anything else that touches the platform takes grams away."
        >
          <LoadPath />
        </Figure>
        <Figure
          title="What the camera sees"
          caption={`About ${tens(long)} × ${tens(short)} mm at the plate, if the lens’s quoted ${LENS.quotedDeg}° is its diagonal. Measure it when the camera arrives.`}
        >
          <CameraGeometry />
        </Figure>
      </FigureGrid>
      <FigureKey
        items={[
          { kind: 'est', label: 'proposed size' },
          { kind: 'force', label: 'force, line of sight' },
          { kind: 'dim', label: 'camera view, free gap' },
        ]}
      />
    </>
  );
}
