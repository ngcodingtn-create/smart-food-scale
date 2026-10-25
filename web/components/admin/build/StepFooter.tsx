'use client';

import Link from 'next/link';
import { Icon } from '@/components/icons';
import { milestoneById } from '../roadmap';
import { milestoneProgress, stepDone, useTicks } from './progress';
import './stepper.css';

/**
 * The bar stuck to the bottom of a step: back, where you are, forward. Once the
 * step's checks are all ticked, it says so and "Next" becomes the main button.
 */
export function StepFooter({
  milestoneId,
  stepId,
  previous,
  next,
}: {
  milestoneId: string;
  stepId: string;
  previous: { href: string; label: string };
  next: { href: string; label: string };
}) {
  const milestone = milestoneById(milestoneId);
  const { ticks } = useTicks();
  if (!milestone) return null;
  const index = milestone.steps.findIndex((item) => item.id === stepId);
  const step = milestone.steps[index];
  const done = step ? stepDone(ticks, milestone, step) : false;
  const progress = milestoneProgress(ticks, milestone);
  const share = progress.total ? (progress.done / progress.total) * 100 : 0;

  return (
    <div className="step-footer" data-done={done}>
      <Link href={previous.href} className="step-footer-back" aria-label={`Back: ${previous.label}`}>
        <Icon name="arrow-right" size={16} className="flip" />
        <span>{previous.label}</span>
      </Link>
      <div className="step-footer-mid">
        <span className="step-footer-state">{done ? 'Step done ✓' : `Step ${index + 1} of ${milestone.steps.length}`}</span>
        <span className="step-footer-track" aria-hidden="true">
          <span style={{ width: `${share}%` }} />
        </span>
      </div>
      <Link href={next.href} className="step-footer-next" data-primary={done} aria-label={`Next: ${next.label}`}>
        <span className="step-footer-long">{next.label}</span>
        <span className="step-footer-short">Next</span>
        <Icon name="arrow-right" size={16} />
      </Link>
    </div>
  );
}
