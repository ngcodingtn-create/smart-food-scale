import Link from 'next/link';
import { Icon } from '@/components/icons';
import { LANES, STAGES, type Stage } from './stages';
import './workbench.css';

const STATE: Record<Stage['state'], string> = {
  open: 'Open',
  partly: 'Partly open',
  waiting: 'Waiting',
};

function StageCard({ stage, n }: { stage: Stage; n: number }) {
  return (
    <li className="stage" data-state={stage.state}>
      <span className="stage-n">{n}</span>
      <div className="stage-main">
        <p className="stage-title">
          {stage.href ? <Link href={stage.href}>{stage.title}</Link> : stage.title}
          <span className="stage-state">{STATE[stage.state]}</span>
        </p>
        <p className="stage-does">{stage.does}</p>
        <p className="stage-tools">
          {stage.tools.map((tool) => (
            <span key={tool}>{tool}</span>
          ))}
        </p>
        <p className="stage-done">
          <Icon name="check-circle" size={15} />
          <span>{stage.done}</span>
        </p>
        {stage.waits ? <p className="stage-waits">{stage.waits}</p> : null}
      </div>
    </li>
  );
}

/** The whole build on one screen. */
export function BuildMap() {
  const open = STAGES.filter((stage) => stage.state !== 'waiting').length;
  let n = 0;
  return (
    <div className="buildmap">
      <p className="buildmap-count">
        <strong>{open}</strong> of {STAGES.length} stages open today
      </p>
      {LANES.map((lane) => (
        <section key={lane.title} className="lane">
          <p className="lane-title">
            {lane.title}
            <span>{lane.note}</span>
          </p>
          <ol>
            {lane.stages.map((stage) => {
              n += 1;
              return <StageCard key={stage.title} stage={stage} n={n} />;
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
