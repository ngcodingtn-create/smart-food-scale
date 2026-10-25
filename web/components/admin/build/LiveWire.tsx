'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { milestoneById } from '../roadmap';
import { stepKey, useTicks } from './progress';
import { StepScene } from './scenes/StepScene';
import type { SceneRef } from './scenes';
import './live.css';

/**
 * Milestone 1 wired from start to end, with the board checked live from the laptop
 * while the owner works: each step shows its close-up, what the hands do, and what
 * the board says about it right now (through /admin/api/board, the same tool Claude
 * uses). A step the board confirms is ticked on the build map by itself.
 */

export type LiveStep = { id: string; title: string; goal: string; actions: string[]; scene: SceneRef; check: Check };
type Check = 'board' | 'alive' | 'display' | 'button' | 'buzzer' | 'whole';
type Result = { ok: boolean; lines: string[]; timedOut: boolean; error?: string };
type Light = { label: string; state: 'ok' | 'bad' | 'wait' };
type Verdict = { pass: boolean; lights: Light[]; say: string; fix?: string[] };

async function ask(action: string): Promise<Result> {
  try {
    const response = await fetch(`/admin/api/board?do=${action}`, { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) return { ok: false, lines: [], timedOut: false, error: body.error ?? 'The board did not answer.' };
    return body as Result;
  } catch {
    return { ok: false, lines: [], timedOut: false, error: 'The laptop’s server did not answer. Is localhost:3000 running?' };
  }
}

const line = (result: Result, prefix: string) => result.lines.find((text) => text.startsWith(prefix));
const field = (text: string | undefined, name: string) => text?.match(new RegExp(`${name}=(\\S+)`))?.[1];
const unreachable = (result: Result): Verdict => ({
  pass: false,
  lights: [{ label: 'Board', state: 'bad' }],
  say:
    result.error ??
    (result.lines.some((l) => l.includes('Access is denied'))
      ? 'Another program is holding the board’s port.'
      : result.lines.some((l) => l.includes('No board') || l.includes('no board'))
        ? 'No board on USB.'
        : result.timedOut
          ? 'The board took too long to answer.'
          : 'The board did not answer.'),
  fix: ['Is the USB cable in? Unplug it and plug it back in.', 'Close the bench page or any serial monitor: only one program can talk to the board.'],
});

// --- what each step's reading means -----------------------------------------------------

function readDisplay(result: Result, history: string[]): Verdict {
  const text = line(result, 'E i2c');
  if (!text) return unreachable(result);
  const sda = field(text, 'sda_pullup') === '1';
  const scl = field(text, 'scl_pullup') === '1';
  const found = (field(text, 'found') ?? 'none').split(',');
  const swapped = (field(text, 'swapped_found') ?? 'none').split(',');
  const answers = found.includes('3c') || result.lines.some((l) => l.startsWith('E display found'));
  const flicker = history.slice(-8).reduce((n, state, i, all) => n + (i > 0 && state !== all[i - 1] ? 1 : 0), 0) >= 2;
  const lights: Light[] = [
    { label: 'Power', state: sda || scl ? 'ok' : 'bad' },
    { label: 'SDA (D2)', state: sda ? 'ok' : 'bad' },
    { label: 'SCL (D1)', state: scl ? 'ok' : 'bad' },
    { label: 'Answers', state: answers ? 'ok' : 'bad' },
  ];
  const loose = flicker ? ['It comes and goes: a contact is loose. Push each plug of that wire all the way home, or swap the jumper for a fresh one.'] : [];
  if (answers) return { pass: true, lights, say: 'The display answers. Its screen is on: CAMERA ?, 0.0 g, READY.' };
  // A signal line held low with the board's own pull-up on is joined to ground (firmware 0.3.5 and later).
  const sdaGround = field(text, 'sda_ground') === '1';
  const sclGround = field(text, 'scl_ground') === '1';
  if (sclGround || sdaGround) {
    const which = sclGround && sdaGround ? 'Both signal wires are' : sclGround ? 'The SCL wire, from D1, is' : 'The SDA wire, from D2, is';
    return {
      pass: false,
      lights: lights.map((light) => ((sclGround && light.label.startsWith('SCL')) || (sdaGround && light.label.startsWith('SDA')) ? { ...light, label: `${light.label}: on ground` } : light)),
      say: `${which} joined to ground: in the GND row, or touching the − rail.`,
      fix: [sclGround ? 'Move D1’s pin end one row, out of the GND row and into the SCL row (the 2nd row from the far end on your display).' : 'Move D2’s pin end into the SDA row (the 1st row from the far end on your display).', 'Check the bare metal of that jumper is not touching the − rail.'],
    };
  }
  if (!sda && !scl)
    return { pass: false, lights, say: 'Nothing reaches the display yet: no power, or neither signal wire.', fix: [...loose, 'VCC row → the + rail, GND row → the − rail.', '3V and G from the NodeMCU into those same rails (pin ends pushed in, not lying flat).', 'All four display pins down in their holes.'] };
  if (sda && !scl)
    return { pass: false, lights, say: 'Power and SDA reach the display. The SCL wire, from D1, does not.', fix: [...loose, 'D1’s wire in the SCL row: same row of five as the display’s SCL pin, columns a to e.', 'The display’s SCL pin down in its hole, not bent beside it.', 'The socket all the way onto D1: row next to the breadboard, 2nd pin from the far end.', 'The pin end pushed in until the plastic touches the board.', 'Still not? A fresh female–male jumper for D1.'] };
  if (!sda && scl)
    return { pass: false, lights, say: 'Power and SCL reach the display. The SDA wire, from D2, does not.', fix: [...loose, 'D2’s wire in the SDA row: same row of five as the display’s SDA pin.', 'The display’s SDA pin down in its hole.', 'The socket all the way onto D2: row next to the breadboard, 3rd pin from the far end.', 'Still not? A fresh female–male jumper for D2.'] };
  if (swapped.includes('3c')) return { pass: false, lights, say: 'Both wires reach the display, but crossed: SDA and SCL are swapped.', fix: ['Swap the two yellow wires’ breadboard ends: D1 goes to SCL, D2 to SDA.'] };
  return {
    pass: false,
    lights,
    say: 'Both signal wires reach the display, but it does not answer.',
    fix: [
      'The GND row → the − rail, and the − rail → G on the NodeMCU: the display needs ground as well as power.',
      'The display’s GND pin down in its hole.',
      'Each yellow in its own row: D2 in the SDA row, D1 in the SCL row. A yellow in the VCC row, or on the + rail, looks connected to the board.',
      'Still nothing with all of that right? The display itself may be damaged.',
    ],
  };
}

function readAlive(result: Result): Verdict {
  const text = line(result, 'E info');
  if (!text) return unreachable(result);
  return { pass: true, lights: [{ label: 'Board answers', state: 'ok' }], say: `The board answers: no short circuit stopped it (firmware ${field(text, 'fw')}). The display step checks the rails fully: the display gets its power from them.` };
}

// --- the live panel -------------------------------------------------------------------------

function useVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
}

function LivePanel({ step, onPass }: { step: LiveStep; onPass: () => void }) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [busy, setBusy] = useState(false);
  const [seenPressed, setSeenPressed] = useState(false);
  const [heard, setHeard] = useState<boolean | null>(null);
  const [mealLines, setMealLines] = useState<string[]>([]);
  const history = useRef<string[]>([]);
  const visible = useVisible();
  const passed = useRef(false);

  const report = useCallback(
    (next: Verdict) => {
      setVerdict(next);
      if (next.pass && !passed.current) {
        passed.current = true;
        onPass();
      }
    },
    [onPass],
  );

  // Watching: the display and the button are read every couple of seconds while this step is open.
  useEffect(() => {
    if (!visible || (step.check !== 'display' && step.check !== 'button')) return;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      if (step.check === 'display') {
        const result = await ask('i2c');
        const text = line(result, 'E i2c');
        if (text) history.current.push(`${field(text, 'sda_pullup')}${field(text, 'scl_pullup')}`);
        if (!stop) report(readDisplay(result, history.current));
      } else {
        const result = await ask('button');
        const text = line(result, 'E button');
        if (!text) report(unreachable(result));
        else {
          const pressed = field(text, 'main') === '1';
          if (pressed) setSeenPressed(true);
          history.current.push(pressed ? 'p' : 'r');
          const stuck = history.current.length >= 6 && history.current.slice(-6).every((s) => s === 'p');
          const released = seenPressed || pressed ? !pressed : false;
          report({
            pass: (seenPressed || pressed) && released,
            lights: [{ label: pressed ? 'Pressed' : 'Not pressed', state: pressed ? 'ok' : 'wait' }, { label: 'Seen pressed', state: seenPressed || pressed ? 'ok' : 'wait' }],
            say: stuck ? 'It reads pressed all the time.' : seenPressed || pressed ? (pressed ? 'Pressed: the board sees it. Now let go.' : 'The board saw the press. The button works.') : 'Press and hold the button: the board is watching.',
            fix: stuck ? ['The two legs you used are always joined: turn the button a quarter turn.'] : history.current.length > 12 && !seenPressed ? ['One leg → D5: row next to the breadboard, 8th pin from the far end.', 'The diagonally opposite leg → the − rail.', 'Pressing does nothing? Turn the button a quarter turn.'] : undefined,
          });
        }
      }
      if (!stop) setTimeout(tick, step.check === 'display' ? 1600 : 900);
    };
    tick();
    return () => {
      stop = true;
    };
  }, [step.check, visible, report, seenPressed]);

  // Asked once, on opening the step: the board is there and answers.
  useEffect(() => {
    if (step.check !== 'board' && step.check !== 'alive') return;
    let stop = false;
    (async () => {
      setBusy(true);
      const result = await ask('info');
      if (!stop) report(step.check === 'board' && line(result, 'E info') ? { ...readAlive(result), say: `Found: the NodeMCU answers on USB (firmware ${field(line(result, 'E info'), 'fw')}).` } : readAlive(result));
      setBusy(false);
    })();
    return () => {
      stop = true;
    };
  }, [step.check, report]);

  const recheck = async () => {
    setBusy(true);
    report(readAlive(await ask('info')));
    setBusy(false);
  };
  const beep = async () => {
    setBusy(true);
    setHeard(null);
    const result = await ask('beep');
    setBusy(false);
    setVerdict(line(result, 'E beep') ? { pass: false, lights: [{ label: 'Beep sent', state: 'ok' }], say: 'The board beeped. Did you hear it?' } : unreachable(result));
  };
  const answerHeard = (yes: boolean) => {
    setHeard(yes);
    if (yes) report({ pass: true, lights: [{ label: 'Beep heard', state: 'ok' }], say: 'The buzzer works.' });
    else
      setVerdict({
        pass: false,
        lights: [{ label: 'No sound', state: 'bad' }],
        say: 'The board sent the beep, but nothing was heard.',
        fix: ['1 kΩ from D8 (row next to the breadboard, 11th pin from the far end) to the transistor’s middle leg.', 'Transistor flat face to the left: E, B, C from the top. E → the − rail.', 'C → the buzzer’s −. The buzzer’s S → the 5 V rail (VIN’s rail).', 'The 1N4148 across − and S, its band towards S.'],
      });
  };
  const runMeal = async () => {
    setBusy(true);
    setMealLines([]);
    const result = await ask('meal');
    setBusy(false);
    const lines = result.lines.filter((l) => l.startsWith('PASS') || l.startsWith('FAIL'));
    setMealLines(lines);
    const pass = lines.length > 0 && lines.every((l) => l.startsWith('PASS'));
    report(lines.length ? { pass, lights: [{ label: pass ? 'All passed' : 'Something failed', state: pass ? 'ok' : 'bad' }], say: pass ? 'The whole test passed: tare, weight, photo, beep.' : 'Look at the line marked FAIL.' } : unreachable(result));
  };

  return (
    <div className="live" data-pass={verdict?.pass ?? false}>
      <div className="live-head">
        <span className="live-dot" data-on={step.check === 'display' || step.check === 'button'} aria-hidden="true" />
        <span>{step.check === 'display' || step.check === 'button' ? 'Claude is watching the board' : 'Claude checks the board'}</span>
      </div>
      {verdict ? (
        <>
          <div className="live-lights">
            {verdict.lights.map((light) => (
              <span key={light.label} className="live-light" data-state={light.state}>
                <Icon name={light.state === 'ok' ? 'check' : light.state === 'bad' ? 'close' : 'clock'} size={15} />
                {light.label}
              </span>
            ))}
          </div>
          <p className="live-say">{verdict.say}</p>
          {verdict.fix?.length ? (
            <ol className="live-fix">
              {verdict.fix.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ol>
          ) : null}
        </>
      ) : (
        <p className="live-say">{busy ? 'Asking the board…' : 'Waiting for the board…'}</p>
      )}
      {mealLines.length ? (
        <pre className="live-lines">{mealLines.join('\n')}</pre>
      ) : null}
      <div className="live-actions">
        {step.check === 'alive' || step.check === 'board' ? (
          <button type="button" className="live-btn" onClick={recheck} disabled={busy}>
            Check again
          </button>
        ) : null}
        {step.check === 'buzzer' ? (
          <>
            <button type="button" className="live-btn primary" onClick={beep} disabled={busy}>
              Beep now
            </button>
            {verdict?.lights[0]?.label === 'Beep sent' && heard === null ? (
              <>
                <button type="button" className="live-btn" onClick={() => answerHeard(true)}>
                  I heard it
                </button>
                <button type="button" className="live-btn" onClick={() => answerHeard(false)}>
                  No sound
                </button>
              </>
            ) : null}
          </>
        ) : null}
        {step.check === 'whole' ? (
          <button type="button" className="live-btn primary" onClick={runMeal} disabled={busy}>
            {busy ? 'Running, about 30 s…' : 'Run the whole test'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// --- the page ---------------------------------------------------------------------------------

export function LiveWire({ milestoneId, steps }: { milestoneId: string; steps: LiveStep[] }) {
  const [index, setIndex] = useState(0);
  const { ticks, toggle } = useTicks();
  const milestone = milestoneById(milestoneId);
  const step = steps[index];
  const roadmapStep = milestone?.steps.find((item) => item.id === step.id);
  const key = milestone && roadmapStep ? stepKey(milestone, roadmapStep) : '';
  const done = (id: string) => {
    const s = milestone?.steps.find((item) => item.id === id);
    return Boolean(milestone && s?.checks?.length && (ticks[stepKey(milestone, s)] ?? []).length >= s.checks.length);
  };

  const onPass = useCallback(() => {
    if (!roadmapStep?.checks) return;
    roadmapStep.checks.forEach((_, i) => toggle(key, i, true));
  }, [roadmapStep, key, toggle]);

  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(steps.length - 1, i + 1));
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  }, [steps.length]);

  return (
    <div className="livewire">
      <ol className="livewire-steps" aria-label="Steps">
        {steps.map((item, i) => (
          <li key={item.id}>
            <button type="button" aria-current={i === index ? 'step' : undefined} data-done={done(item.id)} onClick={() => setIndex(i)}>
              <span className="livewire-num">{done(item.id) ? <Icon name="check" size={13} /> : i + 1}</span>
              <span>{item.title}</span>
            </button>
          </li>
        ))}
      </ol>

      <section className="livewire-step" aria-live="polite">
        <header>
          <p className="label">
            Step {index + 1} of {steps.length}
          </p>
          <h2>{step.title}</h2>
          <p className="livewire-goal">{step.goal}</p>
        </header>
        <div className="livewire-grid">
          <div className="livewire-scene">
            <StepScene key={step.id} scene={step.scene} />
          </div>
          <div className="livewire-side">
            <div className="livewire-do">
              <span className="livewire-who">You do</span>
              <ol>
                {step.actions.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ol>
            </div>
            <LivePanel key={step.id} step={step} onPass={onPass} />
          </div>
        </div>
        <div className="livewire-nav">
          <button type="button" className="live-btn" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
            ← Back
          </button>
          <button type="button" className="live-btn primary" onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))} disabled={index === steps.length - 1}>
            Next step →
          </button>
        </div>
      </section>
    </div>
  );
}
