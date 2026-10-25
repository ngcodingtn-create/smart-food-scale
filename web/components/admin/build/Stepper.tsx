'use client';

import Link from 'next/link';
import { Icon } from '@/components/icons';
import { milestoneById } from '../roadmap';
import { MILESTONES, milestoneProgress, milestoneState, nextUp, overallProgress, stepDone, useTicks } from './progress';
import './stepper.css';

/** A bar with a visible track, its count and its percentage. */
export function ProgressBar({ done, total, label, size = 'md' }: { done: number; total: number; label?: string; size?: 'sm' | 'md' | 'lg' }) {
  const share = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="pbar" data-size={size}>
      {label ? (
        <div className="pbar-head">
          <span>{label}</span>
          <span className="pbar-num">
            {done}/{total} · {share}%
          </span>
        </div>
      ) : null}
      <div className="pbar-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={label ?? 'Progress'}>
        <span className="pbar-fill" style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

/**
 * The ten milestones as one line of connected circles: done, under way, the one
 * to do now, later. The current page's milestone is ringed. Each opens its page.
 */
export function MilestoneStepper({ currentId }: { currentId?: string }) {
  const { ticks } = useTicks();
  const now = nextUp(ticks)?.milestone.id;
  return (
    <nav className="mstepper" aria-label="Milestones">
      <ol>
        {MILESTONES.map((milestone) => {
          const state = milestoneState(ticks, milestone);
          const progress = milestoneProgress(ticks, milestone);
          const look = state === 'done' ? 'done' : milestone.id === now ? 'now' : state === 'started' ? 'started' : 'todo';
          return (
            <li key={milestone.id} data-state={look} aria-current={milestone.id === currentId ? 'step' : undefined}>
              <Link href={`/admin/build/${milestone.id}`} title={`${milestone.number}. ${milestone.title}`}>
                <span className="mstepper-dot">
                  {look === 'done' ? <Icon name="check" size={14} /> : milestone.number}
                  {progress.done > 0 && look !== 'done' ? (
                    <svg className="mstepper-ring" viewBox="0 0 36 36" aria-hidden="true">
                      <circle cx="18" cy="18" r="16" pathLength={100} strokeDasharray={`${(progress.done / progress.total) * 100} 100`} />
                    </svg>
                  ) : null}
                </span>
                <span className="mstepper-label">{milestone.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** One milestone's steps as numbered dots on a line; the current one named. */
export function StepStepper({ milestoneId, currentStepId }: { milestoneId: string; currentStepId?: string }) {
  const milestone = milestoneById(milestoneId);
  const { ticks } = useTicks();
  if (!milestone) return null;
  return (
    <nav className="sstepper" aria-label={`Steps of milestone ${milestone.number}`}>
      <ol>
        {milestone.steps.map((step, index) => {
          const done = stepDone(ticks, milestone, step);
          const look = done ? 'done' : step.draft ? 'draft' : 'todo';
          return (
            <li key={step.id} data-state={look} aria-current={step.id === currentStepId ? 'step' : undefined}>
              <Link href={`/admin/build/${milestone.id}/${step.id}`} title={`${index + 1}. ${step.title}${step.draft ? ' (being written)' : ''}`}>
                <span className="sstepper-dot">{done ? <Icon name="check" size={12} /> : index + 1}</span>
                <span className="sstepper-label">{step.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The whole build in one card: how far, and the button to carry on. */
export function OverallCard() {
  const { ticks } = useTicks();
  const overall = overallProgress(ticks);
  const next = nextUp(ticks);
  return (
    <section className="overall">
      <div className="overall-text">
        <p className="label">Your progress</p>
        <ProgressBar done={overall.done} total={overall.total} label="Steps done, across the whole build" size="lg" />
        <p className="overall-note">Steps still being written are not counted yet: they join the total as they are written.</p>
      </div>
      {next ? (
        <Link href={`/admin/build/${next.milestone.id}/${next.step.id}`} className="overall-go">
          <span className="overall-go-label">{overall.done ? 'Continue where you left off' : 'Start here'}</span>
          <strong>{next.step.title}</strong>
          <span className="overall-go-where">
            Milestone {next.milestone.number} · step {next.index + 1} · {next.milestone.title}
          </span>
          <span className="overall-go-arrow" aria-hidden="true">
            <Icon name="arrow-right" size={18} />
          </span>
        </Link>
      ) : null}
    </section>
  );
}

/** A milestone's own count, for the sidebar: a tick when done, else done/total. */
export function MilestoneBadge({ href }: { href: string }) {
  const { ticks } = useTicks();
  const milestone = MILESTONES.find((item) => href === `/admin/build/${item.id}`);
  if (!milestone) return null;
  const state = milestoneState(ticks, milestone);
  const progress = milestoneProgress(ticks, milestone);
  if (state === 'done') {
    return (
      <span className="nav-progress" data-state="done" aria-label="done">
        <Icon name="check" size={12} />
      </span>
    );
  }
  if (!progress.total) return null;
  return (
    <span className="nav-progress" data-state={state} aria-label={`${progress.done} of ${progress.total} steps`}>
      {progress.done}/{progress.total}
    </span>
  );
}
