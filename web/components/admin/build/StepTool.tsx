'use client';

import { Bench } from '@/components/workbench/SerialBench';
import { FlashButton } from '@/components/workbench/FlashButton';
import type { Tool } from '../roadmap';

/** The live tool a step needs, in the step itself: a flash button, or the bench. */
export function StepTool({ tool }: { tool: Tool }) {
  if (tool.kind === 'flash') {
    return (
      <div className="step-tool">
        <p className="step-tool-label">Flash {tool.label}</p>
        <FlashButton manifest={tool.manifest} label={tool.label} />
      </div>
    );
  }
  return (
    <div className="step-tool step-tool-bench">
      <p className="step-tool-label">The bench: the board, live over USB</p>
      <Bench />
    </div>
  );
}
