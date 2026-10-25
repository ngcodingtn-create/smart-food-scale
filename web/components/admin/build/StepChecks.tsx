'use client';

import Link from 'next/link';
import { Icon } from '@/components/icons';
import { milestoneById } from '../roadmap';
import { stepKey, useTicks } from './progress';

/**
 * The step's checks, ticked and remembered in this browser. When the last one
 * is ticked, the step says it is done and points at the next.
 */
export function StepChecks({ milestoneId, stepId, next }: { milestoneId: string; stepId: string; next?: { href: string; label: string } }) {
  const milestone = milestoneById(milestoneId);
  const step = milestone?.steps.find((item) => item.id === stepId);
  const { ticks, toggle } = useTicks();
  if (!milestone || !step || !step.checks?.length) return null;
  const key = stepKey(milestone, step);
  const on = new Set(ticks[key] ?? []);
  const all = on.size >= step.checks.length;

  return (
    <div className="step-checks-wrap">
      <p className="step-checks-count" aria-live="polite">
        {on.size} of {step.checks.length} ticked
      </p>
      <ul className="step-checks">
        {step.checks.map((check, index) => (
          <li key={check} data-done={on.has(index)}>
            <label>
              <input type="checkbox" checked={on.has(index)} onChange={(event) => toggle(key, index, event.target.checked)} />
              <span className="step-check-box" aria-hidden="true">
                <Icon name="check" size={13} />
              </span>
              <span>{check}</span>
            </label>
          </li>
        ))}
      </ul>
      {all ? (
        <div className="step-complete" role="status">
          <span className="step-complete-mark" aria-hidden="true">
            <Icon name="check" size={18} />
          </span>
          <span className="step-complete-text">
            <strong>Step done</strong>
            {next ? <span>Next: {next.label}</span> : null}
          </span>
          {next ? (
            <Link href={next.href} className="btn btn-primary">
              Next
              <Icon name="arrow-right" size={16} />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
