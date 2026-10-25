import type { Metadata } from 'next';
import Link from 'next/link';
import { MILESTONES } from '@/components/admin/roadmap';
import { sceneFor } from '@/components/admin/build/scenes';
import { StepScene } from '@/components/admin/build/scenes/StepScene';
import '@/components/admin/build/build.css';

export const metadata: Metadata = { title: 'Every step, animated' };

/** All the step animations on one page, in build order: for checking them together. */
export default function ScenesPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <p className="label">Build · end to end</p>
        <h1>Every step, animated</h1>
        <p className="admin-page-lede">The same animation that opens each step, all in order. Click a title to open the step.</p>
      </header>
      {MILESTONES.map((milestone) => (
        <section key={milestone.id} className="scene-gallery-milestone">
          <h2>
            {milestone.number}. {milestone.title}
          </h2>
          <div className="scene-gallery">
            {milestone.steps.map((step, index) => (
              <div key={step.id} id={`${milestone.id}-${step.id}`}>
                <h3>
                  <Link href={`/admin/build/${milestone.id}/${step.id}`}>
                    {milestone.number}.{index + 1} {step.title}
                  </Link>
                </h3>
                <StepScene scene={sceneFor(milestone.id, step.id)} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
