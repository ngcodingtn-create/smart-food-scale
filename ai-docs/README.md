# AI docs

Notes written by AI agents, for the next agent (or person) who picks this project up
cold. They record what the code cannot: why things are the way they are, what was
verified and how, what is half-done, and the traps already fallen into.

Human-facing status lives elsewhere and stays the source of truth for it:

| For | Read |
| --- | --- |
| Where the project stands, in plain words | [`PROGRESS.md`](../PROGRESS.md) |
| Every design decision, with reasoning (D0–D14) | [`docs/decisions.md`](../docs/decisions.md) |
| What the project is | [`README.md`](../README.md) |

## Read in this order

1. **[SESSION-HANDOFF.md](SESSION-HANDOFF.md)** — start here. The state of the repo right
   now, what is finished, what is next, and what is known to be wrong.
2. **[RUNBOOK.md](RUNBOOK.md)** — how to run, check and deploy, and the environment
   traps that cost time (one dev server only, hidden browser pane, stale lock file).
3. **[PROJECT-MAP.md](PROJECT-MAP.md)** — where everything is, and the handful of files
   that are the single source of truth for something.
4. **[WORK-LOG.md](WORK-LOG.md)** — what each session did, in order, with commit hashes.
5. **[research/](research/)** — two research reports recovered verbatim from subagents.
   The component request and decisions D12 and D13 were made from them. Two more: free
   hosting for the backend (not acted on yet), and web tools for the build (the
   Workbench pages came from it).

## Rules for whoever updates these

- **Update `SESSION-HANDOFF.md` before you stop.** It describes the present, so rewrite
  it; do not append a diary to it. The diary is `WORK-LOG.md`.
- **Say what you verified and how.** "Build passes" means you ran it. If you could not
  check something, say that instead.
- **Do not copy facts that live in code.** Point at the file. A number written here
  and in `specs.ts` is a number that will be wrong in one of them.
- **Keep the project's own rule:** an estimate is labelled an estimate, and no figure is
  invented. That applies to these notes as much as to the site.
