import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PartChips } from '@/components/admin/build/PartChip';
import { MilestoneSteps } from '@/components/admin/build/MilestoneSteps';
import { MilestoneStepper } from '@/components/admin/build/Stepper';
import { MILESTONES, milestoneById } from '@/components/admin/roadmap';
import '@/components/admin/build/build.css';

export function generateStaticParams() {
  return MILESTONES.map((milestone) => ({ milestone: milestone.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ milestone: string }> }): Promise<Metadata> {
  const milestone = milestoneById((await params).milestone);
  return { title: milestone ? `${milestone.number}. ${milestone.title}` : 'Milestone' };
}

export default async function MilestonePage({ params }: { params: Promise<{ milestone: string }> }) {
  const milestone = milestoneById((await params).milestone);
  if (!milestone) notFound();
  const index = MILESTONES.indexOf(milestone);
  const previous = MILESTONES[index - 1];
  const next = MILESTONES[index + 1];

  return (
    <div className="admin-page">
      <MilestoneStepper currentId={milestone.id} />
      <header className="admin-page-head">
        <p className="label">
          Milestone {milestone.number} · {milestone.when}
        </p>
        <h1>{milestone.title}</h1>
        <p className="admin-page-lede">{milestone.goal}</p>
      </header>

      <section className="milestone-done-when">
        <p className="label">Done when</p>
        <p>{milestone.doneWhen}</p>
      </section>


      <section className="milestone-section">
        <h2>The steps</h2>
        <MilestoneSteps milestoneId={milestone.id} />
      </section>

      {milestone.parts.length ? (
        <section className="milestone-section">
          <h2>On the desk for this milestone</h2>
          <PartChips ids={milestone.parts} />
        </section>
      ) : null}

      <nav className="build-pager" aria-label="Other milestones">
        {previous ? (
          <Link href={`/admin/build/${previous.id}`}>
            <span>Previous</span>
            {previous.number}. {previous.title}
          </Link>
        ) : (
          <Link href="/admin/build">
            <span>Back</span>The build map
          </Link>
        )}
        {next ? (
          <Link href={`/admin/build/${next.id}`} className="build-pager-next">
            <span>Next</span>
            {next.number}. {next.title}
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
