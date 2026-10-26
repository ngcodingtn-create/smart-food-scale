import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DIM } from '@/components/rig/specs';
import {
  BASE_AT, BASE_SOCKET_TOP, BB, BOOK, CAM_BOARD, CAM_LEFT, CAM_ON_BB, CAM_RIGHT, CELL, COL_X, CONNECTOR, CUP, DISPLAY, HX711_AT, HX_BOARD, HX_CELL, HX_SIGNAL,
  CHARGER_AT, CHARGER_LEADS, LAPTOP_AT, PCB_TOP, PHONE_AT, ROWS, ROW_X, endPoint, hxPin, isRail, pinZ, rowZ,
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

type Lines = [string, string, string];
type Display = { group: THREE.Group; screen: THREE.MeshStandardMaterial; paint: (lines: Lines) => void };
export const READY: Lines = ['CAMERA ?', '0.0 g', 'READY'];

function display(lit: boolean): Display {
  const group = new THREE.Group();
  group.add(boxMesh([27, 1.6, 27], M.blue, [0, -0.8, 0]));
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const on = new THREE.CanvasTexture(canvas);
  on.colorSpace = THREE.SRGBColorSpace;
  // As the firmware draws it: the number large, except the raw counts of an uncalibrated scale.
  const paint = ([top, number, bottom]: Lines) => {
    const g = canvas.getContext('2d')!;
    g.fillStyle = '#05070a';
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#9fd8ff';
    g.font = '34px monospace';
    g.fillText(top, 18, 52);
    g.font = number.startsWith('raw') ? '40px monospace' : 'bold 82px monospace';
    g.fillText(number, 18, 150);
    g.font = '34px monospace';
    g.fillText(bottom, 18, 214);
    on.needsUpdate = true;
  };
  paint(READY);
  const screen = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.2, emissive: 0xffffff, emissiveMap: on, emissiveIntensity: lit ? 1 : 0 });
  group.add(boxMesh([25, 1, 18], screen, [0, 0.8, 2.5]));
  const names = textPlane('VCC GND SCL SDA', 20, 3.2, '#e9eef7', '#1f4fa0');
  names.position.set(0, 0.82, -8.6);
  group.add(names);
  for (let k = 0; k < 4; k++) {
    group.add(boxMesh([2.54, 2.5, 2.54], material(0xe2c35a), [-3.81 + k * 2.54, -2.6 - 0.8, -12]));
    group.add(boxMesh([0.64, 9, 0.64], M.gold, [-3.81 + k * 2.54, -9.5, -12], false));
  }
  return { group, screen, paint };
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
  // A TO-92 standing up, its flat face towards the middle gap (+X). Looking at the flat face,
  // legs down, the left leg is E: here that is the leg nearest the owner, in `row`.
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 4.8, 24, 1, false, Math.PI, Math.PI), material(0x1e1f21));
  body.position.set(COL_X[col] + 0.6, BB.top + 5.4, rowZ(row + 1));
  const face = textPlane('E B C', 4.4, 1.6, '#cfd3d6', 'transparent');
  face.rotation.set(0, Math.PI / 2, 0);
  face.position.set(COL_X[col] + 0.62, BB.top + 5.6, rowZ(row + 1));
  group.add(face);
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

/** A label lying flat beside a pin, readable from the owner's side. */
function pinLabel(text: string, at: V3) {
  const label = textPlane(text, 5, 2, '#e9eef7', 'transparent');
  label.position.set(at[0], at[1], at[2]);
  return label;
}

function hxPins() {
  const group = new THREE.Group();
  for (const name of [...HX_SIGNAL, ...HX_CELL]) {
    const [x, y, z] = hxPin(name);
    group.add(boxMesh([2.54, 2.5, 2.54], M.header, [x, y - 3.4, z]));
    group.add(boxMesh([0.64, 9, 0.64], M.gold, [x, y - 9.5, z], false));
  }
  return group;
}

function hx711(bare: boolean) {
  const group = new THREE.Group();
  const { x, y, z } = HX711_AT;
  // The owner's XFW-HX711: the chip right of centre, standing along the board, a little to the back.
  group.add(boxMesh([HX_BOARD.w, 1.6, HX_BOARD.d], M.green, [x, y - 1.6, z]));
  group.add(boxMesh([4.1, 1.4, 10.4], M.black, [x + 2, y, z - 1.5]));
  const chip = textPlane('HX711', 7, 2, '#cfd3d6', 'transparent', Math.PI / 2);
  chip.position.set(x + 2, y + 1.42, z - 1.5);
  group.add(chip);
  const maker = textPlane('XFW-HX711', 13, 2, '#f1f3f1', 'transparent');
  maker.position.set(x + 1, y + 0.02, z + 6.6);
  group.add(maker);
  // Each pin's name printed beside it, inboard, as on the board.
  for (const name of HX_SIGNAL) {
    const p = hxPin(name);
    group.add(pinLabel(name, [p[0] - 4, y + 0.02, p[2]]));
  }
  for (const name of HX_CELL) {
    const p = hxPin(name);
    group.add(pinLabel(name, [p[0] + 3.2, y + 0.02, p[2]]));
  }
  if (!bare) group.add(hxPins());
  return group;
}

const ALU = material(0xc3c8cc, { metalness: 0.55, roughness: 0.45 });

/** The owner's round box: yellow round its side, a white lid. */
function book() {
  const group = new THREE.Group();
  const r = (BOOK.x1 - BOOK.x0) / 2, cx = (BOOK.x0 + BOOK.x1) / 2, cz = (BOOK.z0 + BOOK.z1) / 2;
  const side = new THREE.Mesh(new THREE.CylinderGeometry(r, r, BOOK.h - 4, 64), material(0xe9b93b, { roughness: 0.7 }));
  side.position.set(cx, (BOOK.h - 4) / 2, cz);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(r + 1.5, r + 1.5, 4, 64), material(0xf4f2ec, { roughness: 0.6 }));
  lid.position.set(cx, BOOK.h - 2, cz);
  group.add(side, lid);
  return group;
}

function loadcell(onBook: boolean) {
  const group = new THREE.Group();
  const base = onBook ? BOOK.h : 0;
  const len = CELL.z1 - CELL.z0, zc = (CELL.z0 + CELL.z1) / 2, top = base + CELL.size;
  group.add(boxMesh([CELL.size, CELL.size, len], ALU, [CELL.x, base, zc]));
  for (const dz of [-31, -23, 23, 31]) {
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.1, 16), M.hole);
    hole.position.set(CELL.x, top + 0.03, zc + dz);
    group.add(hole);
  }
  // The strain gauge under its white cover, where the wires leave.
  group.add(boxMesh([CELL.size + 0.4, 2.2, 10], material(0xece8d8), [CELL.x, top - 1.6, zc - 9]));
  // Its label on the free end's face, as on the owner's cell: "20Kg ↓", the way the load must push.
  const label = textPlane('20Kg ↓', 11, 6, '#1d2a6b', '#e8d84a');
  label.rotation.set(0, 0, 0);
  label.position.set(CELL.x, base + CELL.size / 2, CELL.z1 + 0.06);
  group.add(label);
  // Its four wires, over the book's edge to the blue connector on the desk.
  ['red', 'black', 'white', 'green'].forEach((colour, k) => {
    const o = (k - 1.5) * 0.9;
    const curve = new THREE.CatmullRomCurve3([
      v([CELL.x + o, top + 0.4, zc - 9]),
      v([CELL.x + 6 + o, top + 2, zc - 4]),
      v([CELL.x + 14 + o, base + 1.5, BOOK.z1 - 6]),
      v([CELL.x + 18 + o, base * 0.5, BOOK.z1 + 6]),
      v([CONNECTOR.x - 12 + o * 2, 2, 24]),
      v([CONNECTOR.x - 3.81 + k * 2.54, 2.6, CONNECTOR.z - 4]),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.4, 6), material(COLOURS[colour])));
  });
  group.add(boxMesh([11, 5, 8], material(0x2f6fd6), [CONNECTOR.x, 0, CONNECTOR.z]));
  return group;
}

/** Two strips of tape over the wired end, down its sides and onto the box; something heavy on top. */
function tape() {
  const group = new THREE.Group();
  const m = material(0xdcd5bd, { roughness: 0.95 });
  const top = BOOK.h + CELL.size, half = CELL.size / 2;
  for (const z of [-15, -6]) {
    group.add(boxMesh([CELL.size + 1, 0.4, 8], m, [CELL.x, top, z]));
    for (const side of [-1, 1]) {
      group.add(boxMesh([0.4, CELL.size, 8], m, [CELL.x + side * (half + 0.4), BOOK.h, z]));
      group.add(boxMesh([10, 0.4, 8], m, [CELL.x + side * (half + 5.4), BOOK.h, z]));
    }
  }
  // Something heavy on the wired end, like the owner's power bank.
  group.add(boxMesh([60, 16, 34], material(0xf2f2ee, { roughness: 0.5 }), [CELL.x, top + 0.4, -19]));
  return group;
}

function cup() {
  const group = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(9, 7, 10, 28, 1, true), material(0xf2f2ef, { side: THREE.DoubleSide }));
  wall.position.set(CUP[0], CUP[1] + 5, CUP[2]);
  group.add(wall);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 0.6, 28), material(0xf2f2ef));
  floor.position.set(CUP[0], CUP[1] + 0.3, CUP[2]);
  group.add(floor);
  return group;
}

function capacitor(type: 'electrolytic' | 'ceramic', from: [Col, number], to: [Col, number]) {
  const group = new THREE.Group();
  const a = endPoint({ hole: from }), b = endPoint({ hole: to });
  const mid: V3 = [(a[0] + b[0]) / 2, BB.top, (a[2] + b[2]) / 2];
  for (const p of [a, b]) group.add(boxMesh([0.45, 4.2, 0.45], M.leg, [p[0], BB.top, p[2]], false));
  if (type === 'electrolytic') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 5.5, 24), material(0x1f2a6b));
    body.position.set(mid[0], BB.top + 4 + 2.75, mid[2]);
    group.add(body);
    // The stripe marks the − leg: towards `to`.
    const angle = Math.atan2(b[0] - mid[0], b[2] - mid[2]);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, 5.5, 24, 1, true, angle - 0.55, 1.1), material(0xd9dde3));
    stripe.position.copy(body.position);
    group.add(stripe);
  } else {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.1, 20), material(0xd9892b));
    disc.position.set(mid[0], BB.top + 4 + 2.2, mid[2]);
    const across = new THREE.Vector3(-(b[2] - a[2]), 0, b[0] - a[0]).normalize();
    disc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), across);
    group.add(disc);
  }
  return group;
}

/** A finger, its tip at the group's origin. */
function finger() {
  const group = new THREE.Group();
  const skin = material(0xd9a585, { roughness: 0.7 });
  const tip = new THREE.Mesh(new THREE.SphereGeometry(4.2, 20, 14), skin);
  tip.position.y = 4.2;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 36, 20), skin);
  shaft.position.y = 4.2 + 18;
  group.add(tip, shaft);
  group.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return group;
}

/** A known mass, its base at the group's origin. */
function knownMass() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 9, 28), material(0xb08d57, { metalness: 0.7, roughness: 0.3 }));
  body.position.y = 4.5;
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 3.4, 20), material(0xb08d57, { metalness: 0.7, roughness: 0.3 }));
  knob.position.y = 9 + 1.7;
  group.add(body, knob);
  group.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return group;
}

// --- wires --------------------------------------------------------------------------------------

type Built = { object: THREE.Object3D; grow?: (p: number) => void; drop?: (p: number) => void; tip: V3 };

function housing(at: V3, kind: 'm' | 'f', end: End): THREE.Object3D {
  if ('dpin' in end || 'hx' in end) return boxMesh([2.6, 14, 2.6], M.black, [at[0], at[1] - 14.4, at[2]]);
  if ('base' in end) return boxMesh([2.6, 9, 2.6], M.black, [at[0], at[1], at[2]]);
  if ('at' in end) return new THREE.Group(); // the blue connector covers it
  if (kind === 'f') return boxMesh([2.6, 13.4, 2.6], M.black, [at[0], PCB_TOP + 4.6, at[2]]);
  return boxMesh([2.6, 9, 2.6], M.black, [at[0], BB.top, at[2]]);
}

/** Where the wire leaves the plastic at this end. */
function wireExit(end: End, kind: 'm' | 'f'): V3 {
  const p = endPoint(end);
  if ('dpin' in end || 'hx' in end) return [p[0], 0.8, p[2]];
  if ('base' in end) return [p[0], p[1] + 9, p[2]];
  if ('at' in end) return p;
  if (kind === 'f') return [p[0], PCB_TOP + 18, p[2]];
  return [p[0], BB.top + 9, p[2]];
}

/** A wire that leaves along the desk (from under a socket, or from the connector), arches, and lands. */
function lowPath(a: THREE.Vector3, b: THREE.Vector3, lift: number) {
  const flat = b.clone().sub(a).setY(0).normalize();
  const leave = (p: THREE.Vector3, dir: THREE.Vector3) => (p.y < 8 ? p.clone().add(dir.clone().multiplyScalar(7)).setY(p.y + 1.5) : p.clone().setY(p.y + 10));
  const mid = a.clone().lerp(b, 0.5).setY(Math.max(a.y, b.y) + lift);
  return [a, leave(a, flat), mid, leave(b, flat.clone().negate()), b];
}

function wire(spec: WireSpec): Built {
  const group = new THREE.Group();
  const [ka, kb] = spec.ends.split('') as ['m' | 'f', 'm' | 'f'];
  const a = wireExit(spec.from, ka), b = wireExit(spec.to, kb);
  const span = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const lift = spec.lift ?? 6 + span * 0.22;
  const top = Math.max(a[1], b[1]) + lift;
  const low = (e: End) => 'hx' in e || 'at' in e;
  const pts = 'dpin' in spec.from
    ? [v(a), v([a[0], a[1], a[2] - 5]), v([(a[0] + b[0]) / 2 + 3, (a[1] + b[1]) / 2 + 4, (a[2] + b[2]) / 2 + 6]), v([b[0], b[1] + 10, b[2] + 2]), v(b)]
    : low(spec.from) || low(spec.to)
      ? lowPath(v(a), v(b), spec.lift ?? 6 + span * 0.12)
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

// --- the camera's side ------------------------------------------------------------------------

/** A screen whose text a beat can set: the phone's, the laptop's. */
type Screen = { paint: (lines: string[]) => void };
type Refs = { current?: Display; glow: THREE.MeshStandardMaterial[]; phone?: Screen; laptop?: Screen };

function screenTexture(w: number, h: number, style: { paper: string; ink: string; title: string }, perLine = 19) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const paint = (lines: string[]) => {
    const g = canvas.getContext('2d')!;
    g.fillStyle = style.paper;
    g.fillRect(0, 0, w, h);
    const size = Math.round(w / perLine);
    lines.forEach((line, i) => {
      g.fillStyle = i === 0 ? style.title : style.ink;
      g.font = `${i === 0 ? 'bold ' : ''}${i === 0 ? size + 6 : size}px sans-serif`;
      g.fillText(line, size * 0.8, size * 2 + i * size * 1.65, w - size * 1.6);
    });
    texture.needsUpdate = true;
  };
  paint([]);
  return { texture, paint };
}

/**
 * The owner's ESP32-CAM, from their photo: 27 × 40.5 mm, the microSD slot at one end with the
 * lens folded over it, then the ribbon, the camera connector, its white LED, "ESP32-CAM".
 * Local frame: the PCB's top at y = 0, the microSD end at -Z, 5V's column at -X.
 */
function esp32cam(glow: THREE.MeshStandardMaterial[]) {
  const g = new THREE.Group();
  const L = CAM_BOARD.l, W = CAM_BOARD.w, end = -L / 2;
  g.add(boxMesh([W, 1.6, L], material(0x161a1f), [0, -1.6, 0]));
  g.add(boxMesh([18, 2.2, 25], M.metal, [0, -3.8, 3]));
  g.add(boxMesh([17, 2.2, 13.7], M.metal, [0, 0, end + 6.85]));
  g.add(boxMesh([9, 3.6, 9], material(0x111111), [0, 2.2, end + 8.6]));
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 3, 24), material(0x151515));
  barrel.position.set(0, 7.3, end + 8.6);
  g.add(barrel);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.2, 20), material(0x1f3350, { metalness: 0.6, roughness: 0.2 }));
  glass.position.set(0, 8.85, end + 8.6);
  g.add(glass);
  g.add(boxMesh([6, 0.3, 9], material(0xc9873a), [0, 0, end + 17.5]));
  g.add(boxMesh([18, 1.8, 6], material(0xecebe6), [0, 0, end + 25.7]));
  const ledMat = material(0xfff6d8, { emissive: 0xffffff, emissiveIntensity: 0 });
  glow.push(ledMat);
  g.add(boxMesh([3, 1, 3], ledMat, [10, 0, end + 29]));
  const name = textPlane('ESP32-CAM', 16, 3.2, '#f2f5f7', 'transparent');
  name.position.set(0, 0.02, end + 37.5);
  g.add(name);
  [...CAM_LEFT.map(() => -11.43), ...CAM_RIGHT.map(() => 11.43)].forEach((x, k) => {
    const z = end + CAM_BOARD.firstPin + (k % 8) * 2.54;
    g.add(boxMesh([2.54, 2.5, 2.54], M.header, [x, -1.6 - 2.5, z]));
    g.add(boxMesh([0.64, 6, 0.64], M.gold, [x, -1.6 - 2.5 - 6, z], false));
  });
  return g;
}

function mbBase() {
  const g = new THREE.Group();
  const { x, z } = BASE_AT;
  g.add(boxMesh([28, 1.6, 41], material(0x1b1d20), [x, 1.6, z]));
  const first = z + CAM_BOARD.l / 2 - CAM_BOARD.firstPin;
  for (const side of [-1, 1]) {
    g.add(boxMesh([2.54, BASE_SOCKET_TOP - 3.2, 8 * 2.54], M.black, [x + side * 11.43, 3.2, first - 3.5 * 2.54]));
    for (let i = 0; i < 8; i++) {
      const hole = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1), M.hole);
      hole.position.set(x + side * 11.43, BASE_SOCKET_TOP + 0.02, first - i * 2.54);
      g.add(hole);
    }
  }
  // The micro-USB socket at the far end; IO0 and RST either side of it, as on the owner's base.
  g.add(boxMesh([8, 3, 6], M.metal, [x, 3.2, z - 17.5]));
  for (const [dx, label] of [[9, 'IO0'], [-9, 'RST']] as const) {
    g.add(boxMesh([4, 1.6, 3], material(0xc9ced2), [x + dx, 3.2, z - 17.5]));
    const t = textPlane(label, 5, 2, '#e9eef7', 'transparent');
    t.position.set(x + dx, 3.22, z - 13.5);
    g.add(t);
  }
  const name = textPlane('ESP32-CAM-MB', 15, 2.4, '#cfd5d9', 'transparent');
  name.position.set(x, 3.22, z - 6);
  g.add(name);
  return g;
}

function baseUsb() {
  const g = new THREE.Group();
  const { x, z } = BASE_AT;
  g.add(boxMesh([10, 6, 14], M.black, [x, 0.6, z - 27.5]));
  const length = z - 34.5 - (LAPTOP_AT.z + 115);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, length, 12), M.black);
  cable.rotation.x = Math.PI / 2;
  cable.position.set(x, 2.4, z - 34.5 - length / 2);
  cable.castShadow = true;
  g.add(cable);
  return g;
}

/** A white 5 mm LED: long leg in column i of its row, short leg bent to the right − rail one row on. */
function led(row: number, glow: THREE.MeshStandardMaterial[]) {
  const g = new THREE.Group();
  const a = v(endPoint({ hole: ['i', row] })), k = v(endPoint({ hole: ['R-', row + 1] }));
  const body = a.clone().lerp(k, 0.5).setY(BB.top + 7);
  for (const foot of [a, k]) {
    const curve = new THREE.CatmullRomCurve3([foot, foot.clone().setY(BB.top + 3), body.clone().setY(BB.top + 5).lerp(foot, 0.25)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.25, 6), M.leg));
  }
  const mat = new THREE.MeshStandardMaterial({ color: 0xf4f6f7, roughness: 0.25, transparent: true, opacity: 0.92, emissive: 0xffffff, emissiveIntensity: 0 });
  glow.push(mat);
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.6, 5, 20), mat);
  cyl.position.copy(body);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  dome.position.copy(body).setY(body.y + 2.5);
  g.add(cyl, dome);
  return g;
}

function sdcard() {
  const g = new THREE.Group();
  g.add(boxMesh([11, 0.8, 15], material(0x2a2f3a), [0, 0, 0]));
  const label = textPlane('microSD', 8, 2.4, '#e9eef7', 'transparent');
  label.position.set(0, 0.82, 2);
  g.add(label);
  return g;
}
/** The card fully in its slot: a couple of millimetres still out, at the camera's microSD end. */
const SD_IN: V3 = [CAM_ON_BB.x, CAM_ON_BB.y + 1.6 + 0.6, CAM_ON_BB.z - CAM_BOARD.l / 2 + 7.5 - 2];

function phone(refs: Refs) {
  const g = new THREE.Group();
  const { x, z } = PHONE_AT;
  g.add(boxMesh([75, 8, 155], material(0x1c1d21, { roughness: 0.4 }), [x, 0, z]));
  const screen = screenTexture(360, 744, { paper: '#f6f5f2', ink: '#2b2b2b', title: '#b4532a' }, 12);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(68, 140), new THREE.MeshBasicMaterial({ map: screen.texture }));
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(x, 8.05, z);
  g.add(plane);
  refs.phone = screen;
  return g;
}

function laptop(refs: Refs) {
  const g = new THREE.Group();
  const { x, z } = LAPTOP_AT;
  g.add(boxMesh([330, 18, 220], material(0x2b2d31), [x, 0, z]));
  g.add(boxMesh([290, 0.6, 110], material(0x1a1b1e), [x, 18, z - 20]));
  const hinge = new THREE.Group();
  hinge.position.set(x, 18, z - 110);
  hinge.rotation.x = -0.26;
  const lid = boxMesh([330, 210, 6], material(0x2b2d31), [0, 0, -3]);
  const screen = screenTexture(1024, 640, { paper: '#fbfaf7', ink: '#2b2b2b', title: '#b4532a' });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(310, 194), new THREE.MeshBasicMaterial({ map: screen.texture }));
  plane.position.set(0, 105, 0.1);
  hinge.add(lid, plane);
  g.add(hinge);
  refs.laptop = screen;
  return g;
}

/** A 5 V phone charger, its cable's far end cut: the red and black leads are wires of the scene. */
function charger() {
  const g = new THREE.Group();
  g.add(boxMesh([42, 28, 46], material(0xf1f0ec, { roughness: 0.5 }), [CHARGER_AT.x, 0, CHARGER_AT.z]));
  const curve = new THREE.CatmullRomCurve3([v([CHARGER_AT.x - 21, 6, CHARGER_AT.z]), v([150, 3, -20]), v([CHARGER_LEADS[0] + 6, 3, CHARGER_LEADS[2]]), v(CHARGER_LEADS)]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 2, 10), M.black);
  cable.castShadow = true;
  g.add(cable);
  return g;
}

/** Food: a small heap, for the cup or the plate. */
function food() {
  const g = new THREE.Group();
  const heap = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), material(0xc9893f, { roughness: 0.9 }));
  heap.scale.set(1, 0.6, 1);
  g.add(heap);
  return g;
}

// --- the rig, alone on the desk: every number from rig/specs.ts -----------------------------------

const SHELL = material(0xcfc8b8, { roughness: 0.8 });
const RIG_ALU = material(0xb9bfc3, { metalness: 0.6, roughness: 0.4 });
const RIG_BASE_TOP = 12;
const RIG_CELL_TOP = DIM.cell.bottom + DIM.cell.height;

function rig(piece: 'base' | 'spacer' | 'cell' | 'platform' | 'plate' | 'post' | 'camera' | 'panel', refs: Refs) {
  const g = new THREE.Group();
  const pz = DIM.plate.z;
  switch (piece) {
    case 'base':
      for (const fx of [-103, 103]) for (const fz of [-96, 96]) {
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 6, 24), material(0x383a35));
        foot.position.set(fx, 3, fz);
        g.add(foot);
      }
      g.add(boxMesh([DIM.base.width, 6, DIM.base.depth], SHELL, [0, 6, 0]));
      for (const s of [-1, 1]) g.add(boxMesh([5, 26, 230], SHELL, [s * 122.5, RIG_BASE_TOP, 0]));
      g.add(boxMesh([240, 26, 5], SHELL, [0, RIG_BASE_TOP, -117.5]));
      g.add(boxMesh([240, 26, 38], SHELL, [0, RIG_BASE_TOP, 101]));
      break;
    case 'spacer':
      g.add(boxMesh([16, DIM.cell.bottom - RIG_BASE_TOP, 14], RIG_ALU, [-DIM.cell.mount, RIG_BASE_TOP, pz]));
      {
        const stop = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, DIM.cell.bottom - 1 - RIG_BASE_TOP, 16), material(0x5c6565, { metalness: 0.7 }));
        stop.position.set(DIM.cell.mount, (DIM.cell.bottom - 1 + RIG_BASE_TOP) / 2, pz);
        g.add(stop);
      }
      break;
    case 'cell': {
      g.add(boxMesh([DIM.cell.length, DIM.cell.height, DIM.cell.width], ALU, [0, DIM.cell.bottom, pz]));
      for (const sx of [-34, -22]) {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 1.6, 6), material(0x4d5554, { metalness: 0.7 }));
        bolt.position.set(sx, RIG_CELL_TOP + 0.8, pz);
        g.add(bolt);
      }
      const arrow = textPlane('↓', 8, 8, '#1d1d1d', 'transparent');
      arrow.rotation.set(0, 0, 0);
      arrow.position.set(6, DIM.cell.bottom + DIM.cell.height / 2, pz + DIM.cell.width / 2 + 0.06);
      g.add(arrow);
      break;
    }
    case 'platform': {
      const riser = DIM.platform.y - DIM.platform.height / 2 - RIG_CELL_TOP;
      g.add(boxMesh([16, riser, 12], RIG_ALU, [DIM.cell.mount, RIG_CELL_TOP, pz]));
      const plat = new THREE.Mesh(new THREE.CylinderGeometry(DIM.platform.diameter / 2, DIM.platform.diameter / 2, DIM.platform.height, 64), RIG_ALU);
      plat.position.set(0, DIM.platform.y, pz);
      g.add(plat);
      break;
    }
    case 'plate': {
      const white = material(0xf2f1ea, { roughness: 0.3, side: THREE.DoubleSide });
      const well = new THREE.Mesh(new THREE.CylinderGeometry(60, 60, DIM.plate.surface - DIM.plate.bottom, 64), white);
      well.position.set(0, (DIM.plate.surface + DIM.plate.bottom) / 2, pz);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(DIM.plate.diameter / 2, 60, DIM.plate.bottom + DIM.plate.height - DIM.plate.surface, 64, 1, true), white);
      rim.position.set(0, (DIM.plate.surface + DIM.plate.bottom + DIM.plate.height) / 2, pz);
      g.add(well, rim);
      break;
    }
    case 'post':
      g.add(boxMesh([34, 7, 34], RIG_ALU, [0, 38, -107]));
      g.add(boxMesh([20, DIM.arm.postLength, 20], RIG_ALU, [0, 38, -107]));
      g.add(boxMesh([20, 20, DIM.arm.reach], RIG_ALU, [0, DIM.arm.top - 20, -61]));
      g.add(boxMesh([44, 7, 49], material(0xb4532a), [0, DIM.arm.top - 11.5, pz]));
      break;
    case 'camera': {
      // Lens down, under the arm's end, inside the ring of six LEDs.
      const cam = esp32cam(refs.glow);
      cam.rotation.x = Math.PI;
      cam.position.set(0, DIM.camera.y, pz);
      g.add(cam);
      const { count, circle, carrier, y } = DIM.light;
      const ring = new THREE.Mesh(new THREE.RingGeometry(circle / 2 - 5, carrier / 2, 48), material(0x2b2d31, { side: THREE.DoubleSide }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, y, pz);
      g.add(ring);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const mat = new THREE.MeshStandardMaterial({ color: 0xf4f6f7, emissive: 0xffffff, emissiveIntensity: 0 });
        refs.glow.push(mat);
        const l = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 7, 16), mat);
        l.position.set(Math.cos(angle) * circle / 2, y - 4, pz + Math.sin(angle) * circle / 2);
        g.add(l);
      }
      break;
    }
    case 'panel': {
      const d = display(true);
      refs.current = d;
      d.group.position.set(-33, 38 + 1.6, 101);
      g.add(d.group);
      g.add(boxMesh([12, 3.6, 12], M.black, [27, 38, 101]));
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 3, 24), material(0xb4532a));
      cap.position.set(27, 38 + 3.6 + 1.5, 101);
      g.add(cap);
      break;
    }
  }
  return g;
}

function part(spec: PartSpec, displayRef: Refs): Built {
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
    case 'hx711':
      object = hx711(Boolean(spec.bare));
      tip = [HX711_AT.x, HX711_AT.y + 4, HX711_AT.z];
      break;
    case 'hx-pins':
      object = hxPins();
      tip = [HX711_AT.x, HX711_AT.y, HX711_AT.z];
      break;
    case 'book':
      object = book();
      tip = [(BOOK.x0 + BOOK.x1) / 2, BOOK.h + 4, (BOOK.z0 + BOOK.z1) / 2];
      break;
    case 'loadcell':
      object = loadcell(spec.onBook ?? true);
      tip = [CELL.x, (spec.onBook ?? true ? BOOK.h : 0) + CELL.size + 4, (CELL.z0 + CELL.z1) / 2];
      break;
    case 'tape':
      object = tape();
      tip = [CELL.x, BOOK.h + CELL.size + 4, -32];
      break;
    case 'cup':
      object = cup();
      tip = [CUP[0], CUP[1] + 12, CUP[2]];
      break;
    case 'cap':
      object = capacitor(spec.type, spec.from, spec.to);
      tip = endPoint({ hole: spec.from });
      break;
    case 'mb-base':
      object = mbBase();
      tip = [BASE_AT.x, BASE_SOCKET_TOP + 4, BASE_AT.z];
      break;
    case 'base-usb':
      object = baseUsb();
      tip = [BASE_AT.x, 8, BASE_AT.z - 28];
      break;
    case 'esp32cam': {
      const cam = esp32cam(displayRef.glow);
      if (spec.on === 'breadboard') {
        cam.position.set(CAM_ON_BB.x, CAM_ON_BB.y + 1.6, CAM_ON_BB.z);
      } else {
        // Seated on the base, its microSD end towards the owner.
        cam.rotation.y = Math.PI;
        cam.position.set(BASE_AT.x, BASE_SOCKET_TOP + 2.5 + 1.6, BASE_AT.z);
      }
      object = cam;
      tip = [cam.position.x, cam.position.y + 10, cam.position.z];
      break;
    }
    case 'led':
      object = led(spec.row, displayRef.glow);
      tip = [COL_X.j + 3, BB.top + 12, rowZ(spec.row)];
      break;
    case 'sdcard': {
      const card = sdcard();
      card.position.set(...SD_IN);
      card.traverse((o) => ((o as THREE.Mesh).castShadow = true));
      // It slides into the slot from beyond the far end, rather than dropping in.
      return { object: card, tip: [SD_IN[0], SD_IN[1] + 8, SD_IN[2]], drop: (p) => { card.visible = p > 0; card.position.z = SD_IN[2] - (1 - p) * 26; } };
    }
    case 'phone':
      object = phone(displayRef);
      tip = [PHONE_AT.x, 20, PHONE_AT.z];
      break;
    case 'charger':
      object = charger();
      tip = [CHARGER_AT.x, 34, CHARGER_AT.z];
      break;
    case 'laptop':
      object = laptop(displayRef);
      tip = [LAPTOP_AT.x, 120, LAPTOP_AT.z - 110];
      break;
    case 'rig':
      object = rig(spec.piece, displayRef);
      tip = [0, 60, 0];
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
  const bench = scene3.bench ?? true;
  scene.add(desk());
  const usb = usbCable();
  if (bench) scene.add(breadboard(), nodemcu(), usb);

  const displayRef: Refs = { glow: [] };
  // What is already on the bench; a beat may take some of it off.
  const standing = new Map<string, Built>();
  for (const p of scene3.parts) {
    const built = part(p, displayRef);
    built.drop?.(1);
    standing.set(p.id, built);
    scene.add(built.object);
  }
  for (const w of scene3.wires) {
    const built = wire(w);
    built.grow?.(1);
    standing.set(w.id, built);
    scene.add(built.object);
  }
  const removedIn = new Map<string, number>();
  scene3.beats.forEach((beat, i) => beat.remove?.forEach((id) => removedIn.set(id, i)));
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
  const hand = finger();
  hand.visible = false;
  scene.add(hand);
  const weight = knownMass();
  weight.visible = false;
  scene.add(weight);
  const meal = food();
  meal.visible = false;
  scene.add(meal);
  const load = scene3.loadAt ?? CUP;
  // The laptop's and the phone's screens: the last lines set at or before a beat.
  const screenFor = (i: number, which: 'laptop' | 'phone') => {
    for (let k = i; k >= 0; k--) if (scene3.beats[k][which]) return scene3.beats[k][which]!;
    return [];
  };
  const paintedScreens = { laptop: '', phone: '' };
  const foodIn = (i: number) => {
    let on = false;
    for (let k = 0; k < i; k++) if (scene3.beats[k].food) on = scene3.beats[k].food === 'in';
    return on;
  };
  // What the display shows at a beat: the last lines set at or before it.
  const linesFor = (i: number) => {
    for (let k = i; k >= 0; k--) if (scene3.beats[k].lines) return scene3.beats[k].lines!;
    return READY;
  };
  let painted = '';
  const massIn = (i: number) => {
    let inCup = false;
    for (let k = 0; k < i; k++) if (scene3.beats[k].mass) inCup = scene3.beats[k].mass === 'in';
    return inCup;
  };

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
        const point: V3 = Array.isArray(at) ? base : [base[0], base[1] + ('hole' in at ? 12 : 'pin' in at ? 14 : 'hx' in at ? 8 : 'base' in at ? 14 : 0), base[2]];
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
    // What comes off: there before its beat, lifted away during it, gone after it.
    for (const [id, when] of removedIn) {
      const built = standing.get(id);
      if (!built) continue;
      const p = beat < when ? 1 : beat > when ? 0 : 1 - seg(t, 0.1, 0.6);
      built.grow?.(p);
      built.drop?.(p);
    }
    // USB.
    const wasIn = usbState(beat);
    const nowIn = b.usb ? b.usb === 'in' : wasIn;
    const out = wasIn === nowIn ? (nowIn ? 0 : 1) : nowIn ? 1 - seg(t, 0.1, 0.6) : seg(t, 0.1, 0.6);
    usb.position.z = -out * 16;
    // The display's screen, and what it says: a beat's own lines show once its action is done.
    if (displayRef.current && b.screen !== undefined) displayRef.current.screen.emissiveIntensity = b.screen ? seg(t, 0.5, 0.85) : 0;
    if (displayRef.current) {
      const lines = b.lines && t < 0.5 ? linesFor(beat - 1) : linesFor(beat);
      const key = lines.join('|');
      if (key !== painted) {
        displayRef.current.paint(lines);
        painted = key;
      }
    }
    // A finger pressing: down, then up again unless it holds.
    hand.visible = Boolean(b.press);
    if (b.press) {
      const at = Array.isArray(b.press.at) ? b.press.at : endPoint(b.press.at);
      const how = b.press.how;
      const down = how === 'tap' ? seg(t, 0.3, 0.42) * (1 - seg(t, 0.5, 0.62)) : how === 'press' ? seg(t, 0.25, 0.45) * (1 - seg(t, 0.75, 0.9)) : seg(t, 0.12, 0.28);
      hand.position.set(at[0], at[1] + (1 - down) * 22, at[2]);
    }
    // The known mass: lowered into the cup, or lifted out.
    const lowered = b.mass === 'in' ? seg(t, 0.2, 0.55) : b.mass === 'out' ? 1 - seg(t, 0.2, 0.55) : massIn(beat) ? 1 : 0;
    weight.visible = lowered > 0;
    weight.position.set(load[0], load[1] + 0.6 + (1 - lowered) * 34, load[2]);
    const served = b.food === 'in' ? seg(t, 0.2, 0.55) : b.food === 'out' ? 1 - seg(t, 0.2, 0.55) : foodIn(beat) ? 1 : 0;
    meal.visible = served > 0;
    meal.position.set(load[0], load[1] + 0.6 + (1 - served) * 34, load[2]);
    // The light: on while a beat says so.
    const shine = b.light ? seg(t, 0.3, 0.42) * (1 - seg(t, 0.85, 0.97)) : 0;
    for (const m of displayRef.glow) m.emissiveIntensity = shine * 1.4;
    // The laptop and the phone.
    for (const which of ['laptop', 'phone'] as const) {
      const screen = displayRef[which];
      if (!screen) continue;
      const lines = b[which] && t < 0.35 ? screenFor(beat - 1, which) : screenFor(beat, which);
      const key = lines.join('|');
      if (key !== paintedScreens[which]) {
        screen.paint(lines);
        paintedScreens[which] = key;
      }
    }
    // The ring.
    ring.visible = Boolean(b.ring);
    if (b.ring) {
      const p = endPoint(b.ring);
      ring.position.set(p[0], 'pin' in b.ring ? PCB_TOP + 2.6 : 'hx' in b.ring ? HX711_AT.y + 0.6 : 'at' in b.ring || 'base' in b.ring ? p[1] + 0.2 : BB.top + 0.2, p[2]);
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
