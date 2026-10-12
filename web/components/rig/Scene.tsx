'use client';

import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { DIM, type PartId } from './specs';
import type { SceneProps } from './RigViewer';
import { RigFallback } from './RigFallback';

type V3 = [number, number, number];
const INK = '#252a2b';
const ALUMINIUM = '#bac2c4';
const ACCENT = '#ba653d';
const PCB = '#173e37';

function Box({ size, position = [0, 0, 0], color = INK, radius = 0, metal = 0, selected = false, rotation, children }: {
  size: V3; position?: V3; color?: string; radius?: number; metal?: number;
  selected?: boolean; rotation?: V3; children?: ReactNode;
}) {
  const geometry = useMemo(() => radius
    ? new RoundedBoxGeometry(...size, 2, radius)
    : new THREE.BoxGeometry(...size), [size[0], size[1], size[2], radius]); // numeric dependencies avoid new geometries on selection
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={position} rotation={rotation} geometry={geometry} castShadow receiveShadow>
    <meshStandardMaterial color={color} metalness={metal} roughness={metal ? .38 : .65}
      emissive={selected ? ACCENT : '#000000'} emissiveIntensity={selected ? .22 : 0} />{children}
  </mesh>;
}

function Cylinder({ radius, height, position, color = INK, metal = 0, selected = false }: {
  radius: number; height: number; position: V3; color?: string; metal?: number; selected?: boolean;
}) {
  return <mesh position={position} castShadow receiveShadow><cylinderGeometry args={[radius, radius, height, 48]} />
    <meshStandardMaterial color={color} roughness={.5} metalness={metal} emissive={selected ? ACCENT : '#000000'} emissiveIntensity={.22} />
  </mesh>;
}

function Stroke({ points, color = ACCENT, dashed = false }: { points: V3[]; color?: string; dashed?: boolean }) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p)));
    const material = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 4, gapSize: 3 }) : new THREE.LineBasicMaterial({ color });
    const result = new THREE.Line(geometry, material); result.computeLineDistances(); return result;
  }, [JSON.stringify(points), color, dashed]);
  useEffect(() => () => { line.geometry.dispose(); line.material.dispose(); }, [line]);
  return <primitive object={line} />;
}

function Wire({ points, color }: { points: V3[]; color: string }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 24, .45, 5, false), [JSON.stringify(points)]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color={color} roughness={.8} /></mesh>;
}

function Label({ text, position, width = 55, dark = false }: { text: string; position: V3; width?: number; dark?: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 112;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = dark ? '#2b2927' : '#f7f5f0'; ctx.fillRect(0, 0, 512, 112);
    ctx.fillStyle = dark ? '#f2ddd0' : '#754223'; ctx.font = '600 64px system-ui';
    const fontSize = Math.min(64, 64 * 475 / ctx.measureText(text).width);
    ctx.font = `600 ${fontSize}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 56);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [text, dark]);
  useEffect(() => () => texture.dispose(), [texture]);
  const displayWidth = Math.max(60, width * 1.5);
  return <sprite position={position} scale={[displayWidth, displayWidth * 112 / 512, 1]}><spriteMaterial map={texture} depthTest={false} toneMapped={false} /></sprite>;
}

function Printing({ text, size, position, color = '#f4eee0', background = '#172326' }: { text: string; size: [number, number]; position: V3; color?: string; background?: string }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const ctx = c.getContext('2d')!; ctx.fillStyle = background; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '500 82px monospace'; ctx.fillText(text, 256, 128);
    const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [text, color, background]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={size} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>;
}

function Moving({ target, reduced, children }: { target: V3; reduced: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const initial = useRef(target);
  const invalidate = useThree((state) => state.invalidate);
  const destination = useMemo(() => new THREE.Vector3(...target), [target[0], target[1], target[2]]);
  useEffect(() => { invalidate(); }, [destination, invalidate]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (reduced || ref.current.position.distanceTo(destination) < .05) ref.current.position.copy(destination);
    else { ref.current.position.lerp(destination, 1 - Math.exp(-Math.min(delta, .1) * 9)); invalidate(); }
  });
  return <group ref={ref} position={initial.current}>{children}</group>;
}

function Part({ id, onSelect, children }: { id: PartId; onSelect: SceneProps['onSelect']; children: ReactNode }) {
  return <group onClick={(event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onSelect(id); }}>{children}</group>;
}

function Pins({ rows = 15, width = 25.4 }: { rows?: number; width?: number }) {
  return <>{[-1, 1].map((side) => <group key={side} position={[side * width / 2, 0, 0]}>
    <Box size={[2.3, 2.5, (rows - 1) * 2.54 + 2.3]} position={[0, -2, 0]} />
    {Array.from({ length: rows }, (_, index) => <Box key={index} size={[.55, 6, .55]} position={[0, -2, (index - (rows - 1) / 2) * 2.54]} color="#c6a759" metal={.65} />)}
  </group>)}</>;
}

function Devkit({ selected }: { selected: boolean }) {
  return <>
    <Box size={[DIM.devkit.width, DIM.devkit.pcb, DIM.devkit.length]} color="#263d3a" selected={selected} />
    <Pins />
    <Box size={[DIM.wroom.width, DIM.wroom.height, DIM.wroom.length]} position={[0, 2.35, -10]} color={ALUMINIUM} metal={.72} />
    <Printing text="ESP32" size={[14, 6]} position={[0, 3.95, -9]} color="#364248" background="#b9c0c0" />
    <Box size={[16, 1, 6]} position={[0, 1.8, -21]} color="#172624" />
    {[0, 1, 2, 3].map((i) => <Box key={i} size={[.45, .2, 4]} position={[-5 + i * 3, 2.45, -21]} color="#b9a356" metal={.7} />)}
    <Box size={[7.5, 3, 6]} position={[0, 1.5, 24]} color={ALUMINIUM} metal={.7} radius={.5} />
    <Box size={[6, 1.6, 1]} position={[0, 1.5, 27.1]} color="#101514" />
    <Box size={[7, 1.6, 7]} position={[0, 1.6, 8]} />
    {[-8, 8].map((x) => <Box key={x} size={[4, 2, 4]} position={[x, 1.8, 18]} color="#767a74" />)}
  </>;
}

function HX711({ selected }: { selected: boolean }) {
  return <>
    <Box size={[DIM.hx711.width, DIM.hx711.pcb, DIM.hx711.length]} color="#9b3432" selected={selected} />
    <Box size={[5, 2, 10]} position={[0, 1.8, 0]} />
    <Pins rows={5} width={18} />
    <Printing text="HX711" size={[14, 5]} position={[0, .91, -11]} background="#9b3432" />
    {[0, 1, 2].map((i) => <Box key={i} size={[2, 1.2, 3]} position={[6, 1.4, -5 + i * 5]} color="#c3b598" />)}
  </>;
}

function LoadCell({ selected }: { selected: boolean }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape(); const { length, height, width } = DIM.cell;
    shape.moveTo(-length / 2, -height / 2); shape.lineTo(length / 2, -height / 2);
    shape.lineTo(length / 2, height / 2); shape.lineTo(-length / 2, height / 2); shape.closePath();
    const hole = new THREE.Path(); hole.moveTo(-10, -2.15); hole.lineTo(10, -2.15);
    hole.absarc(10, 0, 2.15, -Math.PI / 2, Math.PI / 2, false); hole.lineTo(-10, 2.15);
    hole.absarc(-10, 0, 2.15, Math.PI / 2, Math.PI * 1.5, false); shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: 16 });
    g.translate(0, 0, -width / 2); return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <>
    <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={ALUMINIUM} roughness={.3} metalness={.75} emissive={selected ? ACCENT : '#000000'} emissiveIntensity={.22} /></mesh>
    {[-20, 20].flatMap((x) => [-3, 3].map((z) => <Cylinder key={`${x}-${z}`} radius={1.6} height={.3} position={[x, 3.12, z]} color="#4d5554" />))}
    <Box size={[20, .3, 7]} position={[0, 3.2, 0]} color="#eeeee6" />
  </>;
}

function Plate({ selected }: { selected: boolean }) {
  // Profile is 180 mm in diameter and 12 mm tall, with a 3 mm eating surface.
  const profile = useMemo(() => [new THREE.Vector2(0, 0), new THREE.Vector2(59, 0), new THREE.Vector2(61, 2), new THREE.Vector2(80, 6), new THREE.Vector2(89, 10), new THREE.Vector2(90, 11), new THREE.Vector2(89, 12), new THREE.Vector2(80, 9), new THREE.Vector2(60, 3), new THREE.Vector2(0, 3)], []);
  return <mesh castShadow receiveShadow><latheGeometry args={[profile, 96]} /><meshStandardMaterial color="#efeee4" roughness={.26} metalness={.04} side={THREE.DoubleSide} emissive={selected ? ACCENT : '#000000'} emissiveIntensity={.08} /></mesh>;
}

// Simulator only. A plain mound whose size hints at the portion — it is not a
// model of any dish, and it is the one thing in this scene that is not to scale.
function Food({ color, amount }: { color: string; amount: number }) {
  const radius = 26 + 30 * Math.cbrt(amount); // stays inside the plate's 59 mm well
  const height = 7 + 20 * amount;
  return <mesh position={[0, 3, 0]} scale={[radius, height, radius]} castShadow>
    <sphereGeometry args={[1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
    <meshStandardMaterial color={color} roughness={.85} />
  </mesh>;
}

function Ring({ selected, lights }: { selected: boolean; lights: boolean }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape(); shape.absarc(0, 0, DIM.ring.outer / 2, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); hole.absarc(0, 0, DIM.ring.inner / 2, 0, Math.PI * 2, true); shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: false, curveSegments: 48 });
    g.rotateX(Math.PI / 2); g.translate(0, .8, 0); return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <>
    <mesh geometry={geometry} castShadow><meshStandardMaterial color={selected ? '#5f4634' : '#192c27'} roughness={.6} /></mesh>
    {Array.from({ length: DIM.ring.count }, (_, i) => {
      const angle = i * Math.PI * 2 / DIM.ring.count;
      return <group key={i} position={[Math.cos(angle) * 15, -3.35, Math.sin(angle) * 15]} rotation={[0, -angle, 0]}>
        <Box size={[5, 5.1, 5]} color="#d8d5c5" />
        <mesh position={[0, -2.56, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[1.8, 16]} /><meshStandardMaterial color={lights ? '#fff2bf' : '#9a9583'} emissive="#ffdda0" emissiveIntensity={lights ? 2.5 : 0} toneMapped={false} /></mesh>
      </group>;
    })}
  </>;
}

function CameraBoard({ selected }: { selected: boolean }) {
  return <>
    <Box size={[DIM.camera.width, 1.6, DIM.camera.length]} position={[0, -1.45, 0]} color={PCB} selected={selected} />
    <Box size={[16, 2.9, 17]} position={[0, .8, -10]} color={ALUMINIUM} metal={.75} />
    <Box size={[9, 2, 9]} position={[0, -3.25, 0]} color="#181f20" />
    <Cylinder radius={4} height={10} position={[0, -7, 0]} color="#151b1d" />
    <Cylinder radius={3} height={.25} position={[0, -12.13, 0]} color="#25485e" metal={.8} />
    <Printing text="ESP32-CAM" size={[19, 6]} position={[0, -.6, 12]} background={PCB} />
    <Pins rows={8} width={22} />
  </>;
}

function Rig(props: SceneProps) {
  const { selected, onSelect, exploded, reducedMotion, dark, dimensions, lights, preset, sim } = props;
  const e = exploded ? 1 : 0;
  const shell = dark ? '#87867e' : '#d7d5c9';
  return <>
    {/* All authored geometry below is in MILLIMETRES. This sole 0.001 scale
        converts it to the Three.js convention: 1 world unit = 1 METRE.
        Individual components are never enlarged to make them visible. */}
    <group scale={.001}>
      <mesh position={[0, -.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[3000, 3000]} /><shadowMaterial opacity={dark ? .28 : .13} /></mesh>
      {[-103, 103].flatMap((x) => [-96, 96].map((z) => <Cylinder key={`${x}-${z}`} radius={9} height={6} position={[x, 3, z]} color="#383a35" />))}
      <Box size={[DIM.base.width, 6, DIM.base.depth]} position={[0, 9, 0]} radius={2.5} color={shell} />
      {[-1, 1].map((s) => <Box key={s} size={[5, 26, 230]} position={[s * 122.5, 25, 0]} radius={2} color={shell} />)}
      <Box size={[240, 26, 5]} position={[0, 25, -117.5]} radius={2} color={shell} />
      <Box size={[240, 26, 38]} position={[0, 25, 101]} radius={3} color={shell} />
      <Box size={[244, 1.2, 36]} position={[0, 38.5, 101]} color={dark ? '#4d504a' : '#acaea2'} radius={.5} />
      {/* Fixed mount only under the left end; moving end has clear space below. */}
      <Box size={[7, 30, 14]} position={[-20, 27, DIM.plate.z]} color={ALUMINIUM} metal={.65} />
      <Part id="cell" onSelect={onSelect}><Moving target={[0, 45 + e * 49, DIM.plate.z]} reduced={reducedMotion}><LoadCell selected={selected === 'cell'} /></Moving></Part>
      <Part id="plate" onSelect={onSelect}>
        <Moving target={[0, e * 78, 0]} reduced={reducedMotion}>
          <Box size={[7, 18, 12]} position={[20, 57, DIM.plate.z]} color={ALUMINIUM} metal={.7} />
          <Cylinder radius={DIM.platform.diameter / 2} height={DIM.platform.height} position={[0, DIM.platform.y, DIM.plate.z]} color={ALUMINIUM} metal={.65} selected={selected === 'plate'} />
        </Moving>
        <Moving target={[0, DIM.plate.bottom + e * 125, DIM.plate.z]} reduced={reducedMotion}>
          {(sim?.plate ?? true) && <Plate selected={selected === 'plate'} />}
          {sim?.plate && sim.food && <Food color={sim.food.color} amount={sim.food.amount} />}
        </Moving>
      </Part>
      <Part id="devkit" onSelect={onSelect}><Moving target={[-72 - e * 18, 20 + e * 50, -22]} reduced={reducedMotion}><Devkit selected={selected === 'devkit'} /></Moving></Part>
      <Part id="hx711" onSelect={onSelect}><Moving target={[67 + e * 18, 20 + e * 50, -22]} reduced={reducedMotion}><HX711 selected={selected === 'hx711'} /></Moving></Part>
      <Part id="buzzer" onSelect={onSelect}><Moving target={[-67, 22 + e * 24, 53]} reduced={reducedMotion}>
        <Cylinder radius={DIM.buzzer.diameter / 2} height={DIM.buzzer.height} position={[0, 0, 0]} selected={selected === 'buzzer'} />
        <Cylinder radius={1.6} height={.2} position={[0, DIM.buzzer.height / 2 + .11, 0]} color="#040605" />
      </Moving></Part>
      <Part id="oled" onSelect={onSelect}><Moving target={[-33, 38 + e * 20, 101]} reduced={reducedMotion}>
        <Box size={[DIM.oled.width, DIM.oled.height, DIM.oled.length]} position={[0, DIM.oled.height / 2, 0]} color="#1e3940" selected={selected === 'oled'} />
        <Printing text={sim?.oled ?? '143.2 g'} size={[26.6, 19]} position={[0, DIM.oled.height + .1, 0]} color="#bfe6dd" background="#102321" />
      </Moving></Part>
      <Part id="buttons" onSelect={onSelect}><Moving target={[0, e * 24, 0]} reduced={reducedMotion}>
        {[14, 40].map((x, i) => <group key={x} position={[x, 38, 101]}>
          <Box size={[6, DIM.button.height, 6]} position={[0, DIM.button.height / 2, 0]} color="#787c74" selected={selected === 'buttons'} />
          <Cylinder radius={6} height={3} position={[0, DIM.button.height + 1.5, 0]} color={i ? ACCENT : '#515b54'} />
          <Printing text={i ? 'PHOTO' : 'TARE'} size={[14, 5]} position={[0, .75, 13]} color="#e8e9df" background={dark ? '#4d504a' : '#acaea2'} />
        </group>)}
      </Moving></Part>
      <Part id="arm" onSelect={onSelect}>
        <Box size={[34, 7, 34]} position={[0, 41.5, -107]} radius={2} color={ALUMINIUM} metal={.7} />
        <Box size={[20, DIM.arm.postLength, 20]} position={[0, 189, -107]} radius={1.5} color={ALUMINIUM} metal={.78} selected={selected === 'arm'} />
        <Box size={[2, 289, .5]} position={[0, 190, -96.7]} color="#6c7474" />
        <Box size={[20, 20, DIM.arm.reach]} position={[0, 340, -61]} radius={2} color={ALUMINIUM} metal={.78} selected={selected === 'arm'} />
        <Box size={[44, 7, 49]} position={[0, 342, DIM.plate.z]} radius={3} color={ACCENT} />
        {[-12, 12].flatMap((x) => [-119, -95].map((z) => <Cylinder key={`${x}-${z}`} radius={2.8} height={1.5} position={[x, 45.75, z]} color="#5c6565" metal={.7} />))}
      </Part>
      <Part id="camera" onSelect={onSelect}><Moving target={[0, DIM.camera.y + e * 55, DIM.plate.z]} reduced={reducedMotion}><CameraBoard selected={selected === 'camera'} /></Moving></Part>
      <Part id="ring" onSelect={onSelect}><Moving target={[0, 327.9 + e * 22, DIM.plate.z]} reduced={reducedMotion}><Ring selected={selected === 'ring'} lights={lights} /></Moving></Part>
      {!exploded && <>
        {['#be4635', '#252925', '#4f8262', '#e2dfce'].map((color, index) => <Wire key={color} color={color} points={[[-23.5, 45, -18 + index], [-36, 28, -22 + index], [28, 22, -46 + index * 2], [65, 23, -33 + index * 2]]} />)}
        <Wire color="#444941" points={[[12, 27, -100], [13, 178, -107], [13, 327, -104], [13, 328, -30]]} />
      </>}
      {exploded && <>
        <Stroke points={[[0, 48, DIM.plate.z], [0, 195, DIM.plate.z]]} dashed color={dark ? '#ac917b' : '#ab9d86'} />
        <Label text="Plate" position={[-108, 205, DIM.plate.z]} width={36} dark={dark} />
        <Label text="Load cell · 1 kg" position={[0, 94, 37]} width={72} dark={dark} />
        <Label text="Node A" position={[-99, 85, 12]} width={40} dark={dark} />
        <Label text="HX711" position={[99, 85, 12]} width={40} dark={dark} />
      </>}
      {!exploded && (dimensions || selected === 'camera' || selected === 'ring') && <Stroke points={[[0, DIM.camera.lensBottom, DIM.plate.z], [0, DIM.plate.surface, DIM.plate.z]]} dashed />}
      {dimensions && <>
        {/* Plan dimensions — readable from every angle, including straight down. */}
        <Stroke points={[[-125, 1, 144], [125, 1, 144]]} />
        <Stroke points={[[-125, 1, 138], [-125, 1, 150]]} /><Stroke points={[[125, 1, 138], [125, 1, 150]]} />
        <Label text="250 mm" position={[0, 2, 160]} dark={dark} />
        <Label text="Ø180 mm plate" position={[-105, 85 + e * 125, -15]} width={70} dark={dark} />

        {/* Vertical dimensions are hidden in the top view. Seen end-on from
            directly above, a height measurement collapses to a point: the
            leader line shoots off the canvas and the label ends up annotating
            empty space. */}
        {preset !== 'top' && <>
          <Stroke points={[[155, 0, -107], [155, 350, -107]]} />
          <Stroke points={[[149, 0, -107], [161, 0, -107]]} /><Stroke points={[[149, 350, -107], [161, 350, -107]]} />
          <Label text="350 mm" position={[155, 175, -107]} width={51} dark={dark} />
          {!exploded && <Label text="249 mm clearance" position={[0, 230, -15]} width={85} dark={dark} />}
        </>}
      </>}
    </group>
  </>;
}

function Controls({ preset, reset, rotating, reducedMotion, onUnavailable, focusRequest, exploded }: SceneProps) {
  const { camera, gl, invalidate } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement); controls.current = orbit;
    orbit.target.set(0, .17, -.015); orbit.minDistance = .055; orbit.maxDistance = 1.5;
    orbit.maxPolarAngle = Math.PI * .49; orbit.enablePan = false;
    orbit.enableDamping = !reducedMotion; orbit.dampingFactor = .09;
    orbit.autoRotateSpeed = .5;
    const change = () => invalidate(); orbit.addEventListener('change', change);
    const lost = (event: Event) => { event.preventDefault(); onUnavailable(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => { orbit.removeEventListener('change', change); orbit.dispose(); controls.current = null; gl.domElement.removeEventListener('webglcontextlost', lost); };
  }, [camera, gl, invalidate, reducedMotion, onUnavailable]);
  useEffect(() => {
    const positions: Record<SceneProps['preset'], V3> = { perspective: [.43, .36, .56], front: [0, .2, .77], top: [0, .87, -.014] };
    camera.position.set(...positions[preset]); controls.current?.target.set(0, .17, -.015);
    if (controls.current) controls.current.maxPolarAngle = Math.PI * .49;
    controls.current?.update(); invalidate();
  }, [preset, reset, camera, invalidate]);
  useEffect(() => {
    if (!focusRequest || !controls.current) return;
    const e = exploded ? 1 : 0;
    const positions: Record<PartId, V3> = {
      plate: [0, 82 + e * 125, -15], cell: [0, 45 + e * 49, -15],
      devkit: [-72 - e * 18, 20 + e * 50, -22], hx711: [67 + e * 18, 20 + e * 50, -22],
      oled: [-33, 44 + e * 20, 101], buttons: [27, 42 + e * 24, 101],
      buzzer: [-67, 22 + e * 24, 53], camera: [0, 334 + e * 55, -15],
      ring: [0, 327.9 + e * 22, -15], arm: [0, 220, -107],
    };
    const target = new THREE.Vector3(...positions[focusRequest.part]).multiplyScalar(.001);
    const distance = focusRequest.part === 'plate' || focusRequest.part === 'arm' ? .33 : .12;
    // Camera/ring close-ups look upward slightly so the downward optics stay visible.
    const below = focusRequest.part === 'camera' || focusRequest.part === 'ring';
    controls.current.maxPolarAngle = below ? Math.PI * .68 : Math.PI * .49;
    controls.current.target.copy(target);
    camera.position.copy(target).add(new THREE.Vector3(.55, below ? -.32 : .55, 1).normalize().multiplyScalar(distance));
    controls.current.update(); invalidate();
  }, [focusRequest, exploded, camera, invalidate]);
  useFrame(() => {
    if (!controls.current) return;
    controls.current.autoRotate = rotating && !reducedMotion;
    controls.current.update();
    if (rotating && !reducedMotion) invalidate();
  });
  return null;
}

export default function Scene(props: SceneProps) {
  return <Canvas shadows="percentage" dpr={[1, 1.5]} frameloop="demand"
    camera={{ fov: 39, position: [.43, .36, .56], near: .005, far: 10 }}
    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    fallback={<RigFallback message="WebGL is unavailable. Here is the assembly in side view." />}
    aria-hidden="true">
    <ambientLight intensity={props.dark ? .8 : .65} />
    <hemisphereLight args={[props.dark ? '#d7dfe5' : '#fff8e7', '#807b6c', .85]} />
    <directionalLight position={[.5, .8, .4]} intensity={2.2} color="#fff4df" castShadow
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-.4} shadow-camera-right={.4}
      shadow-camera-top={.5} shadow-camera-bottom={-.3} shadow-camera-near={.01} shadow-camera-far={2}
      shadow-bias={-.0001} shadow-normalBias={.0002} />
    <directionalLight position={[-.4, .5, -.3]} intensity={1.4} color="#d4e2ef" />
    {props.lights && <pointLight position={[0, .315, -.015]} intensity={props.sim?.flash ? .32 : .04} color="#ffe1ac" distance={.5} decay={2} />}
    <Rig {...props} /><Controls {...props} />
  </Canvas>;
}
