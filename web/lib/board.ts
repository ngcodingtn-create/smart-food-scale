import { spawn } from 'node:child_process';
import path from 'node:path';

/**
 * The laptop's server talking to the NodeMCU on USB, through the same tool Claude
 * uses (firmware/tools/board.py), so the live wiring page can check each step while
 * the owner works. Only on the laptop: production has no board and no Python.
 *
 * One command at a time (one program can hold the port), each with a hard time limit:
 * a command that hangs, as one did when a wire was moved mid-read, is killed with its
 * whole process tree so it never keeps the port.
 */

const ROOT = path.join(process.cwd(), '..');
const PYTHON = path.join(ROOT, 'firmware', '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const TOOL = path.join(ROOT, 'firmware', 'tools', 'board.py');

/** What the page may ask, and how long each may take. Nothing else reaches the board. */
export const BOARD_ACTIONS = {
  ports: { args: ['ports'], seconds: 10 },
  info: { args: ['send', 'info', '--expect', 'E info'], seconds: 12 },
  i2c: { args: ['send', 'i2c', '--expect', 'E i2c'], seconds: 12 },
  button: { args: ['send', 'button', '--expect', 'E button'], seconds: 12 },
  beep: { args: ['send', 'beep', '--expect', 'E beep'], seconds: 12 },
  boot: { args: ['listen', '--reset', '--seconds', '4'], seconds: 15 },
  meal: { args: ['meal-test', '--no-camera'], seconds: 90 },
} as const;
export type BoardAction = keyof typeof BOARD_ACTIONS;

export const isBoardAction = (value: unknown): value is BoardAction => typeof value === 'string' && value in BOARD_ACTIONS;

/** False on Vercel: there is no board there. */
export const boardReachable = () => !process.env.VERCEL;

export type BoardResult = { ok: boolean; lines: string[]; timedOut: boolean; ms: number };

function killTree(pid: number | undefined) {
  if (!pid) return;
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true });
  else process.kill(pid, 'SIGKILL');
}

function run(action: BoardAction): Promise<BoardResult> {
  const { args, seconds } = BOARD_ACTIONS[action];
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(PYTHON, [TOOL, ...args], { cwd: ROOT, windowsHide: true });
    let out = '';
    let timedOut = false;
    child.stdout.on('data', (chunk) => (out += chunk));
    child.stderr.on('data', (chunk) => (out += chunk));
    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child.pid);
    }, seconds * 1000);
    const finish = (code: number | null) => {
      clearTimeout(timer);
      const lines = out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      resolve({ ok: code === 0 && !timedOut, lines, timedOut, ms: Date.now() - started });
    };
    child.on('error', () => finish(-1));
    child.on('close', finish);
  });
}

let queue: Promise<unknown> = Promise.resolve();

/** Runs one board command after any already running. */
export function askBoard(action: BoardAction): Promise<BoardResult> {
  const next = queue.then(() => run(action));
  queue = next.catch(() => undefined);
  return next;
}
