import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Expected } from '@/components/admin/build/Expected';
import { PartCards, PartGroups } from '@/components/admin/build/PartChip';
import { PhotoHotspots } from '@/components/admin/build/PhotoHotspots';
import { StepChecks } from '@/components/admin/build/StepChecks';
import { StepFooter } from '@/components/admin/build/StepFooter';
import { StepStepper } from '@/components/admin/build/Stepper';
import { StepKeys } from '@/components/admin/build/StepKeys';
import { StepTool } from '@/components/admin/build/StepTool';
import { StepWiring } from '@/components/admin/build/StepWiring';
import { closeupFor, sceneFor } from '@/components/admin/build/scenes';
import { StepScene } from '@/components/admin/build/scenes/StepScene';
import { MILESTONES, milestoneById } from '@/components/admin/roadmap';
import '@/components/admin/build/build.css';

type Params = Promise<{ milestone: string; step: string }>;

export function generateStaticParams() {
  return MILESTONES.flatMap((milestone) => milestone.steps.map((step) => ({ milestone: milestone.id, step: step.id })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { milestone: milestoneId, step: stepId } = await params;
  const step = milestoneById(milestoneId)?.steps.find((item) => item.id === stepId);
  return { title: step ? step.title : 'Step' };
}

export default async function StepPage({ params }: { params: Params }) {
  const { milestone: milestoneId, step: stepId } = await params;
  const milestone = milestoneById(milestoneId);
  const index = milestone?.steps.findIndex((item) => item.id === stepId) ?? -1;
  if (!milestone || index < 0) notFound();
  const step = milestone.steps[index];
  const previous = milestone.steps[index - 1];
  const next = milestone.steps[index + 1];
  const nextMilestone = MILESTONES[MILESTONES.indexOf(milestone) + 1];
  const previousHref = previous ? `/admin/build/${milestone.id}/${previous.id}` : `/admin/build/${milestone.id}`;
  const nextHref = next ? `/admin/build/${milestone.id}/${next.id}` : nextMilestone ? `/admin/build/${nextMilestone.id}` : '/admin/build';
  const hasVisual = Boolean(step.photo || step.wires);
  const closeup = closeupFor(MILESTONES, milestone.id, step.id);
  const previousLabel = previous ? previous.title : `Milestone ${milestone.number}`;
  const nextLabel = next ? next.title : nextMilestone ? `${nextMilestone.number}. ${nextMilestone.title}` : 'The build map';

  return (
    <div className="admin-page">
      <StepKeys previous={previousHref} next={nextHref} />
      <header className="admin-page-head">
        <p className="label">
          <Link href={`/admin/build/${milestone.id}`}>
            Milestone {milestone.number} · {milestone.title}
          </Link>{' '}
          · step {index + 1} of {milestone.steps.length}
        </p>
        <h1>{step.title}</h1>
        <p className="admin-page-lede">{step.goal}</p>
      </header>

      <StepStepper milestoneId={milestone.id} currentStepId={step.id} />

      <StepScene scene={sceneFor(milestone.id, step.id)} />
      {closeup ? (
        <section className="step-closeup">
          <h2>{closeup.kind === 'closeup' ? 'Close up, one wire at a time' : 'Close up, with your hands'}</h2>
          <StepScene scene={closeup} />
        </section>
      ) : null}

      {step.draft ? (
        <p className="step-draft-note">
          This step is still being written. Its detail comes from the research of 25 October as the build reaches it.
        </p>
      ) : (
        <div className={hasVisual ? 'step-grid' : 'step-grid step-grid-single'}>
          {hasVisual ? (
            <div className="step-visual">
              {step.photo ? <PhotoHotspots photo={step.photo} /> : null}
              {step.wires ? <StepWiring node={step.wires.node} ids={step.wires.ids} /> : null}
            </div>
          ) : null}

          <div className="step-text">
            {step.partGroups?.length ? (
              <section>
                <h2>You need, in {step.partGroups.length} groups</h2>
                <PartGroups groups={step.partGroups} />
              </section>
            ) : step.parts?.length ? (
              <section>
                <h2>You need</h2>
                <PartCards ids={step.parts} />
              </section>
            ) : null}
            {step.actions?.length || step.claude?.length ? (
              <section className="step-roles">
                {step.actions?.length ? (
                  <div className="step-role" data-who="you">
                    <h2>You do</h2>
                    <ol className="step-actions">
                      {step.actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                {step.claude?.length ? (
                  <div className="step-role" data-who="claude">
                    <h2>Claude does, from the laptop</h2>
                    <ul className="step-actions">
                      {step.claude.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}
            {step.expect ? (
              <section>
                <h2>You should see</h2>
                <Expected expect={step.expect} />
              </section>
            ) : null}
            {step.checks?.length ? (
              <section>
                <h2>Check</h2>
                <StepChecks milestoneId={milestone.id} stepId={step.id} next={{ href: nextHref, label: nextLabel }} />
              </section>
            ) : null}
            {step.trouble?.length ? (
              <section>
                <h2>If it does not work</h2>
                <dl className="step-trouble">
                  {step.trouble.map((item) => (
                    <div key={item.symptom}>
                      <dt>{item.symptom}</dt>
                      <dd>{item.fix}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>
        </div>
      )}

      {step.tool && !step.draft ? <StepTool tool={step.tool} /> : null}

      <StepFooter
        milestoneId={milestone.id}
        stepId={step.id}
        previous={{ href: previousHref, label: previousLabel }}
        next={{ href: nextHref, label: nextLabel }}
      />
    </div>
  );
}
