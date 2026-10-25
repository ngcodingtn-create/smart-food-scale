import { flashScene, holdScene, hotspotScene, layoutScene, meetScene, moveScene, photoScene, plugScene, portalScene, pretendMealScene, radioScene, serverScene, wifiScene, wireScene } from './bench-scenes';
import { BENCH_B_IDS, SUPPLY_B_IDS, closeupScene } from './closeup';
import { cardCloseScene, hotspotCloseScene, seatScene, usbScene } from './hands';
import type { SceneDef } from './types';
import { appScene, cardScene, cloudScene, graphScene, mealScene, powerScene, rigScene, solderScene } from './world-scenes';

export type SceneRef = { kind: keyof typeof KINDS; variant?: string };

const KINDS = {
  layout: () => layoutScene(),
  meet: (v?: string) => meetScene(v ?? 'nodemcu'),
  plug: () => plugScene(),
  flash: (v?: string) => flashScene(v ?? 'pretend'),
  wire: (v?: string) => wireScene(v ?? 'rails'),
  hold: () => holdScene(),
  'pretend-meal': () => pretendMealScene(),
  hotspot: () => hotspotScene(),
  server: () => serverScene(),
  wifi: () => wifiScene(),
  portal: () => portalScene(),
  photo: (v?: string) => photoScene(v ?? 'test'),
  move: () => moveScene(),
  radio: () => radioScene(),
  meal: (v?: string) => mealScene(v ?? 'test'),
  graph: (v?: string) => graphScene(v ?? 'calibrate'),
  cloud: (v?: string) => cloudScene(v ?? 'accounts'),
  app: (v?: string) => appScene(v ?? 'today'),
  card: () => cardScene(),
  power: () => powerScene(),
  rig: (v?: string) => rigScene(v ?? 'build'),
  solder: () => solderScene(),
  closeup: (v?: string) => closeupScene(v ?? ''),
  'usb-close': () => usbScene(),
  'seat-close': () => seatScene(),
  'hotspot-close': () => hotspotCloseScene(),
  'card-close': () => cardCloseScene(),
} satisfies Record<string, (variant?: string) => SceneDef>;

export function buildScene({ kind, variant }: SceneRef): SceneDef {
  return KINDS[kind](variant);
}

/** Every step's scene, by `milestone/step`. A step missing here fails the build. */
export const STEP_SCENES: Record<string, SceneRef> = {
  'm0-know-the-parts/lay-out': { kind: 'layout' },
  'm0-know-the-parts/nodemcu': { kind: 'meet', variant: 'nodemcu' },
  'm0-know-the-parts/camera': { kind: 'meet', variant: 'camera' },
  'm0-know-the-parts/display': { kind: 'meet', variant: 'oled' },
  'm0-know-the-parts/buzzer-transistor': { kind: 'meet', variant: 'buzzer' },
  'm0-know-the-parts/breadboard': { kind: 'meet', variant: 'breadboard' },
  'm1-scale-brain/port': { kind: 'plug' },
  'm1-scale-brain/flash': { kind: 'flash', variant: 'pretend' },
  'm1-scale-brain/rails': { kind: 'wire', variant: 'rails' },
  'm1-scale-brain/display': { kind: 'wire', variant: 'display' },
  'm1-scale-brain/tare': { kind: 'hold' },
  'm1-scale-brain/buzzer': { kind: 'wire', variant: 'buzzer' },
  'm1-scale-brain/bench': { kind: 'pretend-meal' },
  'm2-camera/flash-camera': { kind: 'flash', variant: 'camera' },
  'm2-camera/hotspot': { kind: 'hotspot' },
  'm2-camera/backend': { kind: 'server' },
  'm2-camera/wifi': { kind: 'wifi' },
  'm2-camera/test-photo': { kind: 'photo', variant: 'test' },
  'm3-light/off-the-base': { kind: 'move' },
  'm3-light/light-wires': { kind: 'wire', variant: 'light' },
  'm3-light/light-on': { kind: 'photo', variant: 'light' },
  'm4-together/find': { kind: 'radio' },
  'm4-together/meal-test': { kind: 'meal', variant: 'test' },
  'm4-together/rehearse': { kind: 'graph', variant: 'rehearse' },
  'm5-server/accounts': { kind: 'cloud', variant: 'accounts' },
  'm5-server/server-v2': { kind: 'cloud', variant: 'server' },
  'm5-server/deploy': { kind: 'cloud', variant: 'deploy' },
  'm5-server/fake-scale': { kind: 'cloud', variant: 'fake' },
  'm6-app/expo-go': { kind: 'app', variant: 'expo' },
  'm6-app/sign-in': { kind: 'app', variant: 'signin' },
  'm6-app/today': { kind: 'app', variant: 'today' },
  'm6-app/to-name': { kind: 'app', variant: 'toname' },
  'm7-pairing/portal': { kind: 'portal' },
  'm7-pairing/pair': { kind: 'app', variant: 'pair' },
  'm7-pairing/real-meal': { kind: 'meal', variant: 'app' },
  'm8-finish/card': { kind: 'card' },
  'm8-finish/power': { kind: 'power' },
  'm8-finish/rig': { kind: 'rig', variant: 'build' },
  'm9-real-weight/headers': { kind: 'solder' },
  'm9-real-weight/hx711-wires': { kind: 'wire', variant: 'hx711' },
  'm9-real-weight/cell-wires': { kind: 'wire', variant: 'cell' },
  'm9-real-weight/photo-button': { kind: 'wire', variant: 'button2' },
  'm9-real-weight/flash-real': { kind: 'flash', variant: 'real' },
  'm9-real-weight/sign': { kind: 'graph', variant: 'sign' },
  'm9-real-weight/mount': { kind: 'rig', variant: 'mount' },
  'm9-real-weight/calibrate': { kind: 'graph', variant: 'calibrate' },
  'm9-real-weight/accuracy': { kind: 'graph', variant: 'accuracy' },
  'm9-real-weight/demo': { kind: 'meal', variant: 'demo' },
};

export function sceneFor(milestoneId: string, stepId: string): SceneRef {
  const ref = STEP_SCENES[`${milestoneId}/${stepId}`];
  if (!ref) throw new Error(`No scene for ${milestoneId}/${stepId}: add one to components/admin/build/scenes/index.ts.`);
  return ref;
}

/** Close-ups of the steps your hands do that are not wiring. */
const HANDS: Record<string, SceneRef> = {
  'm1-scale-brain/port': { kind: 'usb-close' },
  'm2-camera/flash-camera': { kind: 'seat-close' },
  'm2-camera/hotspot': { kind: 'hotspot-close' },
  'm8-finish/card': { kind: 'card-close' },
};

/** The close-up of a wiring step: this step's wires, and the ones made before it on the same board. */
export function closeupFor(milestones: { id: string; steps: { id: string; wires?: { node: 'a' | 'b'; ids: string[] } }[] }[], milestoneId: string, stepId: string): SceneRef | null {
  const earlier: Record<'a' | 'b', string[]> = { a: [], b: [] };
  const idsOf = (m: string, step: { id: string; wires?: { node: 'a' | 'b'; ids: string[] } }): { node: 'a' | 'b'; ids: string[] } | null => {
    if (m === 'm3-light' && step.id === 'off-the-base') return { node: 'b', ids: BENCH_B_IDS };
    if (m === 'm8-finish' && step.id === 'power' && step.wires) return { node: 'b', ids: [...SUPPLY_B_IDS, ...step.wires.ids] };
    return step.wires ?? null;
  };
  for (const milestone of milestones) {
    for (const step of milestone.steps) {
      const ids = idsOf(milestone.id, step);
      if (milestone.id === milestoneId && step.id === stepId) {
        if (!ids) return HANDS[`${milestoneId}/${stepId}`] ?? null;
        // Once the charger powers the camera, the base's bench wires are gone.
        const before = earlier[ids.node].filter((id) => !(ids.ids.includes('x-supply-5v') && id.startsWith('x-base')));
        return { kind: 'closeup', variant: `${ids.node}:${ids.ids.join(',')}|${before.join(',')}` };
      }
      if (ids) earlier[ids.node].push(...ids.ids);
    }
  }
  return null;
}
