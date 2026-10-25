import type { Metadata } from 'next';
import { LiveWire, type LiveStep } from '@/components/admin/build/LiveWire';
import { benchSceneFor } from '@/components/admin/build/bench3d/scenes';
import { closeupFor, sceneFor } from '@/components/admin/build/scenes';
import { MILESTONES, milestoneById } from '@/components/admin/roadmap';
import '@/components/admin/build/build.css';

export const metadata: Metadata = { title: 'Wire it, live' };

const MILESTONE = 'm1-scale-brain';
/** Milestone 1's hands-on steps, in order, and what the board can tell about each. */
const CHECKS: { id: string; check: LiveStep['check'] }[] = [
  { id: 'port', check: 'board' },
  { id: 'rails', check: 'alive' },
  { id: 'display', check: 'display' },
  { id: 'tare', check: 'button' },
  { id: 'buzzer', check: 'buzzer' },
  { id: 'bench', check: 'whole' },
];

export default function WirePage() {
  const milestone = milestoneById(MILESTONE)!;
  const steps: LiveStep[] = CHECKS.map(({ id, check }) => {
    const step = milestone.steps.find((item) => item.id === id)!;
    return { id, title: step.title, goal: step.goal, actions: step.actions ?? [], scene: closeupFor(MILESTONES, MILESTONE, id) ?? sceneFor(MILESTONE, id), bench: benchSceneFor(MILESTONE, id) ? `${MILESTONE}/${id}` : undefined, check };
  });
  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="label">Milestone 1 · the scale’s brain, end to end</p>
        <h1>Wire it, with Claude watching</h1>
        <p className="admin-page-lede">
          Each step shows the wires on your bench, your NodeMCU upside down as you hold it. While you work, the laptop reads the board and says what is right and what is not, wire by wire. A step the board confirms is ticked on the build map by
          itself.
        </p>
      </header>
      <LiveWire milestoneId={MILESTONE} steps={steps} />
    </div>
  );
}
