# Notes for AI agents

Start with **[`ai-docs/SESSION-HANDOFF.md`](ai-docs/SESSION-HANDOFF.md)**: the current
state, what is next, and what is known to be wrong. Then
[`ai-docs/RUNBOOK.md`](ai-docs/RUNBOOK.md) to run and check things, and
[`ai-docs/PROJECT-MAP.md`](ai-docs/PROJECT-MAP.md) to find them.

The rules that matter most here:

- **Nothing is invented.** Every nutrient value is flagged as an estimate; every
  unmeasured dimension is labelled as one; empty result tables stay empty. A number that
  looks precise and is not is the failure this project exists to prevent. Hold your own
  writing to it.
- **Change the source, not the copy.** Parts live in `web/components/request/bom.ts`,
  rig dimensions in `web/components/rig/specs.ts`, wiring and GPIO numbers in
  `web/components/workbench/wiring.ts`, dishes in `backend/data/tunisian_foods.json`,
  navigation in `web/lib/nav.ts`. Pages are generated from them.
- **`web/` runs a Next.js newer than you may remember.** Read `web/AGENTS.md`, and the
  docs bundled in `web/node_modules/next/dist/docs/`, before writing Next-specific code.
- **One Next.js dev server at a time.** Next refuses a second in the same folder. Never
  kill a PID taken from a stale lock file without checking what it is.
- **Run the checks before claiming something works**, and look at the page in a
  browser. The list is in the runbook.
- **`main` is production.** Push only when asked.
- **Before you stop, rewrite `ai-docs/SESSION-HANDOFF.md`** and add an entry to
  `ai-docs/WORK-LOG.md`.
