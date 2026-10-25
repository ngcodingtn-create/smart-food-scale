'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { ACCOUNTS, DAYS, DECISIONS, GOAL, LATER, PLAN_UPDATED, type Status, type Task } from './plan';

const KEY = 'sfs-admin-plan-ticks';

// The owner's ticks, in this browser only. Storage can be missing or refuse
// (private windows): the page still works, it just forgets.
function loadTicks(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

const STATUS: Record<Status, string> = { todo: 'To do', doing: 'Under way', done: 'Done', waiting: 'Waiting' };

/** A ring for the share of ticked tasks. */
function Ring({ done, total }: { done: number; total: number }) {
  const r = 26;
  const length = 2 * Math.PI * r;
  const share = total ? done / total : 0;
  return (
    <svg className="plan-ring" viewBox="0 0 64 64" role="img" aria-label={`${done} of ${total} done`}>
      <circle className="plan-ring-bg" cx="32" cy="32" r={r} />
      <circle className="plan-ring-fg" cx="32" cy="32" r={r} strokeDasharray={`${share * length} ${length}`} transform="rotate(-90 32 32)" />
      <text x="32" y="36" textAnchor="middle">
        {done}/{total}
      </text>
    </svg>
  );
}

function YourTask({ task, ticked, onTick }: { task: Task; ticked: boolean; onTick: (value: boolean) => void }) {
  return (
    <li className="plan-task" data-done={ticked}>
      <label className="plan-check">
        <input type="checkbox" checked={ticked} onChange={(event) => onTick(event.target.checked)} />
        <span className="plan-box" aria-hidden="true">
          <Icon name="check" size={13} />
        </span>
        <span className="plan-task-text">
          <span className="plan-task-title">{task.title}</span>
          {task.doneWhen ? <span className="plan-task-when">{task.doneWhen}</span> : null}
        </span>
      </label>
      {task.href?.startsWith('/admin') ? (
        <Link href={task.href} className="plan-go" aria-label={`Open: ${task.title}`}>
          <Icon name="arrow-right" size={15} />
        </Link>
      ) : task.href ? (
        // A public tool (Flash it, Wire it…): a new tab, so this one stays in /admin.
        <a href={task.href} target="_blank" rel="noreferrer" className="plan-go" aria-label={`Open in a new tab: ${task.title}`}>
          <Icon name="external" size={14} />
        </a>
      ) : null}
    </li>
  );
}

function ClaudeTask({ task }: { task: Task }) {
  return (
    <li className="plan-task" data-done={task.status === 'done'}>
      <span className="plan-status" data-status={task.status}>
        {STATUS[task.status]}
      </span>
      <span className="plan-task-text">
        <span className="plan-task-title">{task.title}</span>
        {task.waitingOn ? <span className="plan-task-when">On {task.waitingOn}</span> : null}
      </span>
    </li>
  );
}

export function PlanBoard() {
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  useEffect(() => setTicks(loadTicks()), []);

  const tick = (id: string, value: boolean) => {
    setTicks((current) => {
      const next = { ...current, [id]: value };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Not saved; the tick still shows until the page is closed.
      }
      return next;
    });
  };

  const yours = DAYS.flatMap((day) => day.you).map((task) => task.id).concat(ACCOUNTS.map((account) => account.id));
  const mine = DAYS.flatMap((day) => day.claude);

  return (
    <div className="plan">
      <header className="plan-head">
        <div className="plan-head-text">
          <p className="label">The plan · updated {PLAN_UPDATED}</p>
          <h1>Two days to one real meal</h1>
          <p className="plan-goal">{GOAL}</p>
        </div>
        <div className="plan-progress">
          <div>
            <Ring done={yours.filter((id) => ticks[id]).length} total={yours.length} />
            <span>You</span>
          </div>
          <div>
            <Ring done={mine.filter((task) => task.status === 'done').length} total={mine.length} />
            <span>Claude</span>
          </div>
        </div>
      </header>

      {DAYS.map((day) => (
        <section key={day.id} className="plan-day" aria-labelledby={`day-${day.id}`}>
          <div className="plan-day-head">
            <h2 id={`day-${day.id}`}>
              {day.title} <span>{day.date}</span>
            </h2>
            <p>{day.summary}</p>
          </div>
          <div className="plan-lanes">
            <div className="plan-lane" data-who="you">
              <h3>
                You <span>{day.you.filter((task) => ticks[task.id]).length} of {day.you.length}</span>
              </h3>
              <ol className="plan-list">
                {day.you.map((task) => (
                  <YourTask key={task.id} task={task} ticked={Boolean(ticks[task.id])} onTick={(value) => tick(task.id, value)} />
                ))}
              </ol>
            </div>
            <div className="plan-lane" data-who="claude">
              <h3>
                Claude <span>{day.claude.filter((task) => task.status === 'done').length} of {day.claude.length}</span>
              </h3>
              <ul className="plan-list">
                {day.claude.map((task) => (
                  <ClaudeTask key={task.id} task={task} />
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}

      <section className="plan-day" aria-labelledby="accounts">
        <div className="plan-day-head">
          <h2 id="accounts">Your four accounts</h2>
          <p>All free. Tell Claude as each exists; secrets go into settings pages, never into the chat.</p>
        </div>
        <ul className="plan-accounts">
          {ACCOUNTS.map((account) => (
            <li key={account.id} className="plan-account" data-done={Boolean(ticks[account.id])}>
              <label className="plan-check">
                <input type="checkbox" checked={Boolean(ticks[account.id])} onChange={(event) => tick(account.id, event.target.checked)} />
                <span className="plan-box" aria-hidden="true">
                  <Icon name="check" size={13} />
                </span>
                <span className="plan-task-text">
                  <span className="plan-task-title">{account.name}</span>
                  <span className="plan-task-when">{account.why}</span>
                  <span className="plan-secret">{account.secret}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="plan-day plan-two" aria-label="Open questions and later">
        <div>
          <h2>Open questions</h2>
          <ul className="plan-plain">
            {DECISIONS.map((decision) => (
              <li key={decision.question}>
                <strong>{decision.question}</strong> {decision.leaning}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Later, not these two days</h2>
          <ul className="plan-chips">
            {LATER.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <p className="plan-foot">
        The reasoning behind this list: <code>ai-docs/APP-PLAN.md</code> and <code>ai-docs/BUILD-PLAN.md</code>. Your ticks are kept in
        this browser.
      </p>
    </div>
  );
}
