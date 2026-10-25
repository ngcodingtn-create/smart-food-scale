# The prompt to start the next session

Paste this into a new Claude Code session (Code tab of the Claude desktop app), opened on the
folder `D:\smart-food-scale`.

---

You are taking over the Smart Food Scale project from another Claude account that ran out of
usage. Same machine, same folder: `D:\smart-food-scale`. I am a beginner and learn visually;
you are my building partner and you do everything that is not physical (finding ports,
flashing, reading the boards, running the tests), while I only plug in, wire, press and look.

Before you do anything else:

1. Read `AGENTS.md`, then `ai-docs/SESSION-HANDOFF.md` in full (it was rewritten for you), then
   `ai-docs/RUNBOOK.md` and `ai-docs/PROJECT-MAP.md`. Skim the end of `ai-docs/WORK-LOG.md`.
2. Run `git status`, `git log --oneline -12` and `git log origin/main..main --oneline`.
3. Make sure the site runs on http://localhost:3000. If it does not, start `npm run dev` in
   `web/` in a terminal tab (not as a preview process), and keep exactly one dev server.
4. Check the board: `firmware/.venv/Scripts/python firmware/tools/board.py ports` (the NodeMCU
   should be on COM5).

Then do section 5 of the handoff, in order:

- **A.** Finish checking the close-up animations (camera onto its base, hotspot, microSD, M8
  power, the M9 wiring steps, the button step), fix what is off, run `tsc` and the build, look
  at the pages in the browser, and commit.
- **B.** Carry on the physical build with me, step by step from milestone 1, step 3 "Power
  rails" (`/admin/build/m1-scale-brain/rails`), where I stopped. For each step, tell me in
  plain words what my hands do, point me at the step's close-up, wait for me to say I'm done,
  then check the board yourself with `board.py` and tell me what passed.

Rules I care about: never push to production unless I say "push to prod"; never ask me to paste
a password or API key in the chat (I type the Wi-Fi password myself on the bench page); show
me things visually rather than in long text; and before you stop, rewrite
`ai-docs/SESSION-HANDOFF.md` and add an entry to `ai-docs/WORK-LOG.md`.

Start by telling me, in a few lines, where we are and what you'll do first.
