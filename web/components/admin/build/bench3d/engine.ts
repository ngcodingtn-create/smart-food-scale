import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  BB, COL_X, DISPLAY, PCB_TOP, ROWS, ROW_X, endPoint, isRail, pinZ, rowZ,
  type BenchScene, type Cam, type Col, type End, type PartSpec, type Tag, type V3, type WireSpec,
} from './model';

/**
 * Draws a BenchScene with three.js and plays its beats: the camera flies to each one,
 * its new parts drop in and its new wires grow from end to end, a ring pulses on the pin
 * that matters, and tags are pinned to the parts. The owner can turn and zoom it freely.
 */

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (t: number, a: number, b: number) => ease(Math.min(1, Math.max(0, (t - a) / (b - a))));
const v = (p: V3) => new THREE.Vector3(...p);

const COLOURS: Record<string, number> = {
  red: 0xd0453c, black: 0x2b2b2b, green: 0x3f9b5a, blue: 0x3b6fd0, yellow: 0xe2b93b, purple: 0x8a5cc8,
  grey: 0x8d949a, teal: 0x1fa99a, white: 0xecebe6, orange: 0xe08a4f, brown: 0x7a5236,
};

function material(color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...extra });
}

function canvasTexture(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function boxMesh(size: V3, mat: THREE.Material, at: V3, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(at[0], at[1] + size[1] / 2, at[2]);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  return mesh;
}

const M = {
  black: material(0x17181b),
  header: material(0x26282c),
  gold: material(0xd9b44a, { metalness: 0.7, roughness: 0.35 }),
  pcb: material(0x121316),
  metal: material(0xb8bec3, { metalness: 0.8, roughness: 0.3 }),
  board: material(0xf3f1ea, { roughness: 0.75 }),
  boardSide: material(0xe2ded2),
  hole: material(0x3a372f),
  green: material(0x1e7a4c),
  blue: material(0x1f4fa0),
  leg: material(0xc4c9cd, { metalness: 0.7, roughness: 0.35 }),
};

// --- the fixed bench ------------------------------------------------------------------------

function desk() {
  const texture = canvasTexture((g, w, h) => {
    g.fillStyle = '#c9a679';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = `rgba(120,80,40,${0.05 + ((i * 37) % 10) / 160})`;
      g.lineWidth = 1 + (i % 3);
      g.beginPath();
      const y = (i * 151) % h;
      g.moveTo(0, y);
      g.bezierCurveTo(w * 0.3, y + 10, w * 0.6, y - 10, w, y + 4);
      g.stroke();
    }
  }, 1024, 1024);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

function breadboard() {
  const group = new THREE.Group();
  const zCentre = BB.zFront - BB.length / 2;
  const body = new THREE.Mesh(new THREE.BoxGeometry(BB.width, BB.top, BB.length), [M.boardSide, M.boardSide, M.board, M.boardSide, M.boardSide, M.boardSide]);
  body.position.set(BB.x0 + BB.width / 2, BB.top / 2, zCentre);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  const gap = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, BB.length - 4), M.boardSide);
  gap.position.set((COL_X.e + COL_X.f) / 2, BB.top + 0.02, zCentre);
  group.add(gap);
  for (const [x, colour] of [[29.3, 0xd0453c], [35.3, 0x3b6fd0], [70.4, 0x3b6fd0], [76.9, 0xd0453c]] as const) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, BB.length - 8), material(colour));
    line.position.set(x, BB.top + 0.03, zCentre);
    group.add(line);
  }
  const cols = Object.keys(COL_X) as Col[];
  const holes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.06, 1), M.hole, ROWS * cols.length);
  const m = new THREE.Matrix4();
  let n = 0;
  for (let row = 1; row <= ROWS; row++)
    for (const col of cols) {
      if (isRail(col) && row % 6 === 0) continue;
      m.setPosition(COL_X[col], BB.top + 0.03, rowZ(row));
      holes.setMatrixAt(n++, m);
    }
  holes.count = n;
  group.add(holes);
  // Row numbers every five, in the centre gap, as printed on the owner's board.
  for (let row = 1; row <= ROWS; row += row === 1 ? 4 : 5) {
    const label = textPlane(String(row), 3.2, 2.2, '#8b877b', 'transparent');
    label.position.set((COL_X.e + COL_X.f) / 2, BB.top + 0.06, rowZ(row));
    group.add(label);
  }
  return group;
}

function textPlane(text: string, w: number, h: number, ink: string, paper: string, rotate = 0) {
  const texture = canvasTexture((g, cw, ch) => {
    if (paper !== 'transparent') {
      g.fillStyle = paper;
      g.fillRect(0, 0, cw, ch);
    }
    g.fillStyle = ink;
    g.font = `bold ${Math.round(ch * 0.62)}px monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, cw / 2, ch / 2);
  }, 256, Math.round((256 * h) / w));
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture, transparent: paper === 'transparent' }));
  plane.rotation.x = -Math.PI / 2;
  plane.rotation.z = rotate;
  return plane;
}

function nodemcu() {
  const group = new THREE.Group();
  group.add(boxMesh([16, PCB_TOP - 1.6, 24], M.metal, [0, 0, 14]));
  group.add(boxMesh([31, 1.6, 58], M.pcb, [0, PCB_TOP - 1.6, 0]));
  const name = textPlane('NodeMcu V3', 34, 8, '#e7e9ec', '#121316', Math.PI / 2);
  name.position.set(0, PCB_TOP + 0.02, -2);
  group.add(name);
  group.add(boxMesh([8, 3, 7], M.metal, [0, 1.2, -31]));
  for (const x of [ROW_X.d, ROW_X.outer]) {
    group.add(boxMesh([2.54, 2.5, 15 * 2.54], M.header, [x, PCB_TOP, pinZ(8)]));
    for (let n = 1; n <= 15; n++) group.add(boxMesh([0.64, 6, 0.64], M.gold, [x, PCB_TOP + 2.5, pinZ(n)], false));
  }
  return group;
}

function usbCable() {
  const group = new THREE.Group();
  group.add(boxMesh([10, 6, 14], M.black, [0, 0.2, -42]));
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 130, 12), M.black);
  cable.rotation.x = Math.PI / 2;
  cable.position.set(0, 2.4, -114);
  cable.castShadow = true;
  group.add(cable);
  return group;
}

// --- the parts --------------------------------------------------------------------------------

type Display = { group: THREE.Group; screen: THREE.MeshStandardMaterial };

function display(lit: boolean): Display {
  const group = new THREE.Group();
  group.add(boxMesh([27, 1.6, 27], M.blue, [0, -0.8, 0]));
  const on = canvasTexture((g, w, h) => {
    g.fillStyle = '#05070a';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#9fd8ff';
    g.font = '34px monospace';
    g.fillText('CAMERA ?', 18, 52);
    g.font = 'bold 82px monospace';
    g.fillText('0.0 g', 18, 150);
    g.font = '34px monospace';
    g.fillText('READY', 18, 214);
  }, 512, 256);
  const screen = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.2, emissive: 0xffffff, emissiveMap: on, emissiveIntensity: lit ? 1 : 0 });
  group.add(boxMesh([25, 1, 18], screen, [0, 0.8, 2.5]));
  const names = textPlane('VCC GND SCL SDA', 20, 3.2, '#e9eef7', '#1f4fa0');
  names.position.set(0, 0.82, -8.6);
  group.add(names);
  for (let k = 0; k < 4; k++) {
    group.add(boxMesh([2.54, 2.5, 2.54], material(0xe2c35a), [-3.81 + k * 2.54, -2.6 - 0.8, -12]));
    group.add(boxMesh([0.64, 9, 0.64], M.gold, [-3.81 + k * 2.54, -9.5, -12], false));
  }
  return { group, screen };
}

function button(rows: [number, number]) {
  const group = new THREE.Group();
  const x = (COL_X.e + COL_X.f) / 2;
  const z = (rowZ(rows[0]) + rowZ(rows[1])) / 2;
  group.add(boxMesh([12, 3.6, 12], M.black, [x, BB.top + 0.6, z]));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 3.2, 24), material(0x3b3e42));
  cap.position.set(x, BB.top + 4.2 + 1.6, z);
  cap.castShadow = true;
  group.add(cap);
  for (const col of ['e', 'f'] as Col[]) for (const row of rows) group.add(boxMesh([0.8, 1.2, 0.5], M.leg, [COL_X[col], BB.top, rowZ(row)], false));
  return group;
}

function transistor(col: Col, row: number) {
  const group = new THREE.Group();
  // A TO-92 standing up: a half-round body, its flat face to the left (-X), the legs in one column.
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 4.8, 24, 1, false, 0, Math.PI), material(0x1e1f21));
  body.position.set(COL_X[col] - 0.6, BB.top + 5.4, rowZ(row + 1));
  body.castShadow = true;
  group.add(body);
  for (let k = 0; k < 3; k++) group.add(boxMesh([0.45, 3, 0.45], M.leg, [COL_X[col], BB.top, rowZ(row + k)], false));
  return group;
}

function twoLegged(from: [Col, number], to: [Col, number], body: THREE.Object3D) {
  const group = new THREE.Group();
  const a = v(endPoint({ hole: from })), b = v(endPoint({ hole: to }));
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y = BB.top + 3.2;
  const curve = new THREE.CatmullRomCurve3([a, a.clone().setY(BB.top + 3.2), mid, b.clone().setY(BB.top + 3.2), b]);
  const leg = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.3, 6), M.leg);
  group.add(leg);
  body.position.copy(mid);
  const dir = b.clone().sub(a).setY(0).normalize();
  body.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  group.add(body);
  return group;
}

function resistor(from: [Col, number], to: [Col, number], bands: string[]) {
  const body = new THREE.Group();
  const core = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 6, 16), material(0xd9c08f));
  core.castShadow = true;
  body.add(core);
  bands.forEach((colour, k) => {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.03, 1.03, 0.6, 16), material(COLOURS[colour] ?? 0x000000));
    band.position.y = -1.8 + k * 1.2;
    body.add(band);
  });
  return twoLegged(from, to, body);
}

function diode(from: [Col, number], to: [Col, number]) {
  const body = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 4, 16), material(0xc43c2c, { roughness: 0.3 }));
  glass.castShadow = true;
  body.add(glass);
  // The black band at the `from` end: put `from` where the band belongs.
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.93, 0.93, 0.7, 16), material(0x111111));
  band.position.y = -1.5;
  body.add(band);
  return twoLegged(from, to, body);
}

function buzzer(col: Col, row: number) {
  const group = new THREE.Group();
  const x = COL_X[col];
  // Its board lies over the right edge, away from the rows the diode and wires use.
  group.add(boxMesh([17, 1.6, 18], M.green, [x + 8, BB.top + 3.4, rowZ(row + 1)]));
  const can = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 7, 32), material(0x151618));
  can.position.set(x + 10, BB.top + 5 + 3.5, rowZ(row + 1));
  can.castShadow = true;
  group.add(can);
  const plus = textPlane('+', 3, 3, '#d8d8d8', 'transparent');
  plus.position.set(x + 10, BB.top + 12.1, rowZ(row + 1) + 3);
  group.add(plus);
  for (let k = 0; k < 3; k++) {
    group.add(boxMesh([2.54, 2.4, 2.54], M.header, [x, BB.top + 1, rowZ(row + k)]));
    group.add(boxMesh([0.64, 3.4, 0.64], M.gold, [x, BB.top, rowZ(row + k)], false));
  }
  const names = textPlane('S  ·  −', 9, 2.4, '#e9eef7', 'transparent', Math.PI / 2);
  names.position.set(x + 2.6, BB.top + 5.02, rowZ(row + 1));
  group.add(names);
  return group;
}

// --- wires --------------------------------------------------------------------------------------

type Built = { object: THREE.Object3D; grow?: (p: number) => void; drop?: (p: number) => void; tip: V3 };

function housing(at: V3, kind: 'm' | 'f', end: End) {
  if ('dpin' in end) return boxMesh([2.6, 14, 2.6], M.black, [at[0], at[1] - 14.4, at[2]]);
  if (kind === 'f') return boxMesh([2.6, 13.4, 2.6], M.black, [at[0], PCB_TOP + 4.6, at[2]]);
  return boxMesh([2.6, 9, 2.6], M.black, [at[0], BB.top, at[2]]);
}

/** Where the wire leaves the plastic at this end. */
function wireExit(end: End, kind: 'm' | 'f'): V3 {
  const p = endPoint(end);
  if ('dpin' in end) return [p[0], 0.8, p[2]];
  if (kind === 'f') return [p[0], PCB_TOP + 18, p[2]];
  return [p[0], BB.top + 9, p[2]];
}

function wire(spec: WireSpec): Built {
  const group = new THREE.Group();
  const [ka, kb] = spec.ends.split('') as ['m' | 'f', 'm' | 'f'];
  const a = wireExit(spec.from, ka), b = wireExit(spec.to, kb);
  const span = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const lift = spec.lift ?? 6 + span * 0.22;
  const top = Math.max(a[1], b[1]) + lift;
  const pts = 'dpin' in spec.from
    ? [v(a), v([a[0], a[1], a[2] - 5]), v([(a[0] + b[0]) / 2 + 3, (a[1] + b[1]) / 2 + 4, (a[2] + b[2]) / 2 + 6]), v([b[0], b[1] + 10, b[2] + 2]), v(b)]
    : [v(a), v([a[0], top, a[2]]).lerp(v([b[0], top, b[2]]), 0.15), v([b[0], top, b[2]]).lerp(v([a[0], top, a[2]]), 0.15), v(b)];
  const curve = new THREE.CatmullRomCurve3(pts);
  const geometry = new THREE.TubeGeometry(curve, 140, 0.75, 10, false);
  const tube = new THREE.Mesh(geometry, material(COLOURS[spec.colour] ?? 0x888888, { roughness: 0.45 }));
  tube.castShadow = true;
  group.add(tube);
  const startCap = housing(endPoint(spec.from), ka, spec.from);
  const endCap = housing(endPoint(spec.to), kb, spec.to);
  group.add(startCap, endCap);
  const total = geometry.index!.count;
  return {
    object: group,
    tip: b,
    grow: (p) => {
      geometry.setDrawRange(0, Math.floor((total * p) / 6) * 6);
      tube.visible = p > 0;
      startCap.visible = p > 0;
      endCap.visible = p >= 1;
    },
  };
}

function part(spec: PartSpec, displayRef: { current?: Display }): Built {
  let object: THREE.Object3D;
  let tip: V3 = [0, 0, 0];
  switch (spec.kind) {
    case 'display': {
      const d = display(Boolean(spec.lit));
      displayRef.current = d;
      d.group.position.set(DISPLAY.x, DISPLAY.y, DISPLAY.z);
      object = d.group;
      tip = [DISPLAY.x, DISPLAY.y + 2, DISPLAY.z];
      break;
    }
    case 'button':
      object = button(spec.rows);
      tip = [(COL_X.e + COL_X.f) / 2, BB.top + 8, (rowZ(spec.rows[0]) + rowZ(spec.rows[1])) / 2];
      break;
    case 'transistor':
      object = transistor(spec.col, spec.row);
      tip = [COL_X[spec.col], BB.top + 8, rowZ(spec.row + 1)];
      break;
    case 'resistor':
      object = resistor(spec.from, spec.to, spec.bands);
      tip = endPoint({ hole: spec.from });
      break;
    case 'diode':
      object = diode(spec.from, spec.to);
      tip = endPoint({ hole: spec.from });
      break;
    case 'buzzer':
      object = buzzer(spec.col, spec.row);
      tip = [COL_X[spec.col] + 10, BB.top + 12, rowZ(spec.row + 1)];
      break;
  }
  object.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true;
  });
  const base = object.position.y;
  return { object, tip, drop: (p) => { object.visible = p > 0; object.position.y = base + (1 - p) * 26; } };
}

// --- the camera's places ---------------------------------------------------------------------------

function camFor(cam: Cam): [V3, V3] {
  if (Array.isArray(cam)) return cam;
  if (cam === 'bench') return [[10, 125, 170], [28, 0, -10]];
  if (cam === 'mcu') return [[-62, 72, 40], [10, 9, 10]];
  if (cam === 'mcu-near') return [[-40, 48, 52], [10, 10, 12]];
  if (cam === 'display') return [[52, 16, 92], [13, 7, 40]];
  if (cam === 'usb') return [[-50, 40, -20], [0, 4, -36]];
  // Close over the rows; for the left half, from the front-right, so the NodeMCU's wires are not in the way.
  const z = (rowZ(cam.rows[0]) + rowZ(cam.rows[1])) / 2;
  const span = Math.abs(rowZ(cam.rows[0]) - rowZ(cam.rows[1]));
  const d = 34 + span * 1.1;
  const x = cam.side === 'right' ? 64 : 46;
  return cam.side === 'right' ? [[x - d * 0.55, d * 1.05, z + d * 0.85], [x, BB.top, z]] : [[x + d * 0.6, d * 1.05, z + d * 0.85], [x, BB.top, z]];
}

// --- the player ---------------------------------------------------------------------------------------

export type BenchPlayer = { show: (beat: number) => void; replay: () => void; dispose: () => void; frameAt: (beat: number, t: number) => void };

export function createBench(canvas: HTMLCanvasElement, tagsEl: HTMLElement, scene3: BenchScene): BenchPlayer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc9a679);
  const camera = new THREE.PerspectiveCamera(38, 16 / 10, 1, 2000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minDistance = 30;
  controls.maxDistance = 420;

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6b5136, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-60, 140, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 420 });
  scene.add(sun);
  scene.add(desk(), breadboard(), nodemcu());
  const usb = usbCable();
  scene.add(usb);

  const displayRef: { current?: Display } = {};
  for (const p of scene3.parts) scene.add(part(p, displayRef).object);
  for (const w of scene3.wires) {
    const built = wire(w);
    built.grow?.(1);
    scene.add(built.object);
  }
  const fresh = new Map<string, Built>();
  for (const p of scene3.newParts ?? []) {
    const built = part(p, displayRef);
    fresh.set(p.id, built);
    scene.add(built.object);
  }
  for (const w of scene3.newWires ?? []) {
    const built = wire(w);
    fresh.set(w.id, built);
    scene.add(built.object);
  }
  const addedIn = new Map<string, number>();
  scene3.beats.forEach((beat, i) => beat.add?.forEach((id) => addedIn.set(id, i)));

  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.35, 8, 32), new THREE.MeshBasicMaterial({ color: 0xff8a3d }));
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  let beat = 0;
  let start = performance.now();
  let fly: { t0: number; p0: THREE.Vector3; q0: THREE.Vector3; p1: THREE.Vector3; q1: THREE.Vector3 } | null = null;
  const [p0, q0] = camFor(scene3.beats[0].cam);
  camera.position.set(...p0);
  controls.target.set(...q0);
  controls.addEventListener('start', () => (fly = null));

  const flyTo = (cam: Cam) => {
    const [p, q] = camFor(cam);
    fly = { t0: performance.now(), p0: camera.position.clone(), q0: controls.target.clone(), p1: v(p), q1: v(q) };
  };

  const resize = () => {
    const rect = canvas.parentElement!.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas.parentElement!);
  resize();

  const usbStartsIn = scene3.usbStartsIn ?? true;
  const usbState = (i: number) => {
    let inNow = usbStartsIn;
    for (let k = 0; k < i; k++) if (scene3.beats[k].usb) inNow = scene3.beats[k].usb === 'in';
    return inNow;
  };

  function tags(list: Tag[]) {
    const rect = canvas.getBoundingClientRect();
    tagsEl.innerHTML = list
      .map(({ at, text, small, tone }) => {
        // Above the part, so the tag never hides what it names.
        const base = Array.isArray(at) ? at : endPoint(at);
        const point: V3 = Array.isArray(at) ? base : [base[0], base[1] + ('hole' in at ? 12 : 'pin' in at ? 14 : 0), base[2]];
        const p = v(point).project(camera);
        if (p.z > 1) return '';
        const x = (p.x * 0.5 + 0.5) * rect.width, y = (-p.y * 0.5 + 0.5) * rect.height;
        return `<span class="bench3d-tag ${tone ?? ''}" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px">${text}${small ? `<small>${small}</small>` : ''}</span>`;
      })
      .join('');
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  let visible = true;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  });
  io.observe(canvas);

  function draw(now: number) {
    const b = scene3.beats[beat];
    const t = reduce ? 1 : Math.min(1, (now - start) / 1000 / (b.T ?? 2.6));
    if (fly) {
      const k = reduce ? 1 : ease(Math.min(1, (now - fly.t0) / 1100));
      camera.position.lerpVectors(fly.p0, fly.p1, k);
      controls.target.lerpVectors(fly.q0, fly.q1, k);
      if (k >= 1) fly = null;
    }
    controls.update();

    // New parts and wires: hidden before their beat, animated during it, there after it.
    const adds = b.add ?? [];
    for (const [id, built] of fresh) {
      const when = addedIn.get(id) ?? Infinity;
      const k = adds.indexOf(id);
      const p = beat > when ? 1 : beat < when ? 0 : seg(t, 0.08 + (k / adds.length) * 0.8, 0.08 + ((k + 0.85) / adds.length) * 0.8);
      built.grow?.(p);
      built.drop?.(p);
    }
    // USB.
    const wasIn = usbState(beat);
    const nowIn = b.usb ? b.usb === 'in' : wasIn;
    const out = wasIn === nowIn ? (nowIn ? 0 : 1) : nowIn ? 1 - seg(t, 0.1, 0.6) : seg(t, 0.1, 0.6);
    usb.position.z = -out * 16;
    // The display's screen.
    if (displayRef.current && b.screen !== undefined) displayRef.current.screen.emissiveIntensity = b.screen ? seg(t, 0.5, 0.85) : 0;
    // The ring.
    ring.visible = Boolean(b.ring);
    if (b.ring) {
      const p = endPoint(b.ring);
      ring.position.set(p[0], 'pin' in b.ring ? PCB_TOP + 2.6 : BB.top + 0.2, p[2]);
      ring.scale.setScalar(1 + Math.sin(now / 160) * 0.12);
    }
    tags(t > 0.35 || reduce ? b.tags ?? [] : []);
    renderer.render(scene, camera);
  }

  function loop(now: number) {
    raf = 0;
    draw(now);
    if (visible) raf = requestAnimationFrame(loop);
  }

  draw(performance.now());
  raf = requestAnimationFrame(loop);

  return {
    show(i) {
      beat = Math.max(0, Math.min(scene3.beats.length - 1, i));
      start = performance.now();
      flyTo(scene3.beats[beat].cam);
      draw(performance.now());
    },
    replay() {
      start = performance.now();
      flyTo(scene3.beats[beat].cam);
    },
    frameAt(i, t) {
      beat = i;
      start = performance.now() - t * (scene3.beats[i].T ?? 2.6) * 1000;
      fly = null;
      const [p, q] = camFor(scene3.beats[i].cam);
      camera.position.set(...p);
      controls.target.set(...q);
      draw(performance.now());
    },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        mats.forEach((m) => {
          (m as THREE.MeshStandardMaterial).map?.dispose();
          m.dispose();
        });
      });
    },
  };
}
