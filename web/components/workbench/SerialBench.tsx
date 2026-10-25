'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { fitThroughZero, median, parseLine, type Point, type Reading } from './bench';
import './workbench.css';

/**
 * Either board on the bench, read live over USB.
 *
 * Talks to the board through Web Serial at 115200 baud, in the line format of
 * the firmware's READMEs. Which board it is comes from its boot or info line
 * (`node=a` or `node=b`); the controls follow. With no board, "Practise" runs a
 * pretend board in this page that speaks the same lines, so the page can be
 * learnt before the parts arrive. Practice numbers are invented and say so.
 */

type Source = { send: (command: string) => void; close: () => void };
type NodeId = 'a' | 'b';

// The few Web Serial types this page uses; TypeScript's DOM library has none yet.
type SerialPortLike = {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
};
type SerialLike = { requestPort(): Promise<SerialPortLike> };

async function openBoard(onLine: (line: string) => void, onGone: (why: string) => void): Promise<Source> {
  const serial = (navigator as unknown as { serial: SerialLike }).serial;
  const port = await serial.requestPort();
  await port.open({ baudRate: 115200 });
  const reader = port.readable!.pipeThrough(new TextDecoderStream() as unknown as ReadableWritablePair<string, Uint8Array>).getReader();
  const writer = port.writable!.getWriter();
  const encoder = new TextEncoder();
  let open = true;

  (async () => {
    let buffer = '';
    try {
      while (open) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';
        lines.forEach((line) => line && onLine(line));
      }
    } catch {
      if (open) onGone('The board went away. Check the cable, then connect again.');
    }
  })();

  return {
    send: (command) => void writer.write(encoder.encode(`${command}\n`)),
    close: () => {
      open = false;
      void reader.cancel().catch(() => {});
      writer.releaseLock();
      void port.close().catch(() => {});
    },
  };
}

/** A pretend Node A: the firmware's lines and commands, with invented numbers. */
function practiseScale(onLine: (line: string) => void, massOf: () => number, setMass: (grams: number) => void): Source {
  const COUNTS_PER_GRAM = 100; // invented, like the firmware's node-a-sim build
  const ZERO = 84000;
  let offset = 0;
  let cpg = NaN;
  let seq = 1;
  const raw = () => Math.round(ZERO + massOf() * COUNTS_PER_GRAM + (Math.random() * 7 - 3));
  const grams = (counts: number) => (Number.isNaN(cpg) ? 'nan' : ((counts - offset) / cpg).toFixed(1));

  onLine('E boot node=a fw=practice calibrated=0 cpg=nan');
  onLine('E link none');
  const timer = window.setInterval(() => {
    const counts = raw();
    onLine(`R raw=${counts} net=${counts - offset} g=${grams(counts)} stable=1`);
  }, 100);

  return {
    send(command) {
      const [word, value] = command.split(' ');
      if (word === 'tare') {
        offset = raw();
        onLine(`E tare offset=${offset}`);
      } else if (word === 'capture') {
        if (Number.isNaN(cpg)) return onLine('E error not-calibrated');
        const counts = raw();
        onLine(`E capture g=${grams(counts)} median=${counts} samples=practice`);
        onLine('E link none');
        onLine(`E sent seq=${seq++} g=${grams(counts)} ok=0`);
      } else if (word === 'cal' && value === 'clear') {
        cpg = NaN;
        onLine('E cal cleared');
      } else if (word === 'cal' && Number(value) > 0) {
        cpg = Number(value);
        onLine(`E cal cpg=${cpg.toFixed(6)}`);
      } else if (word === 'info') {
        onLine(`E info node=a fw=practice calibrated=${Number.isNaN(cpg) ? 0 : 1} cpg=${cpg} offset=${offset} camera_ch=0`);
      } else if (word === 'find') {
        onLine('E link none');
      } else if (word === 'sim' && Number(value) >= 0) {
        setMass(Number(value));
        onLine(`E sim g=${Number(value).toFixed(1)}`);
      }
    },
    close: () => window.clearInterval(timer),
  };
}

/**
 * A pretend Node B. It has no camera and no network: a test photo has an
 * invented size and is "kept on the card", which is what the real board does
 * when it cannot reach the backend. The address is from the range reserved for
 * examples (192.0.2.x), so it can never be mistaken for a real one.
 */
function practiseCamera(onLine: (line: string) => void): Source {
  let ssid = '';
  let backend = '';
  let online = false;
  let kept = 0;
  const timers: number[] = [];

  onLine('E boot node=b fw=practice psram=1 camera=1 card=1');
  onLine('E wifi not-set');

  return {
    send(command) {
      const space = command.indexOf(' ');
      const word = space < 0 ? command : command.slice(0, space);
      const rest = space < 0 ? '' : command.slice(space + 1);
      if (word === 'ssid') {
        ssid = rest;
        onLine(`E set ssid=${rest}`);
      } else if (word === 'pass') {
        onLine('E set pass');
      } else if (word === 'backend') {
        backend = rest.replace(/\/+$/, '');
        onLine(`E set backend=${backend}`);
      } else if (word === 'wifi') {
        if (!ssid) return onLine('E wifi not-set');
        timers.push(
          window.setTimeout(() => {
            online = true;
            onLine('E wifi up ch=6 ip=192.0.2.10');
          }, 700),
        );
      } else if (word === 'shoot') {
        const grams = Number(rest).toFixed(1);
        onLine('E photo bytes=41230 ms=520');
        if (!backend) onLine('E error backend-not-set');
        kept += 1;
        onLine(`E upload g=${grams} status=-1 outcome=queued`);
      } else if (command === 'light on' || command === 'light off') {
        onLine(`E light ${rest}`);
      } else if (word === 'flush') {
        if (kept && online) onLine(`E flush id=/queue/00000001 status=-1 kept left=${kept}`);
      } else if (word === 'info') {
        onLine(`E info node=b fw=practice psram=1 camera=1 card=1 wifi=${online ? 'up' : 'down'} ch=${online ? 6 : 1} ssid=${ssid} backend=${backend} kept=${kept}`);
      }
    },
    close: () => timers.forEach((timer) => window.clearTimeout(timer)),
  };
}

/** "+1.2 g", "−0.4 g", and a plain "0.0 g" rather than a "−0.0 g" that rounds to nothing. */
function signed(grams: number) {
  const text = Math.abs(grams).toFixed(1);
  return text === '0.0' ? '0.0 g' : `${grams > 0 ? '+' : '−'}${text} g`;
}

const OUTCOME: Record<string, string> = {
  saved: 'saved by the backend',
  queued: 'kept on the card, to send later',
  unknown: 'the backend could not name the dish',
  failed: 'failed',
};

/** One step of the whole-meal test, and how it went. */
type Step = { label: string; state: 'waiting' | 'running' | 'ok' | 'fail'; note?: string };

// The meal the test plays: an empty plate, then the plate with food on it.
// Invented masses, like everything on the pretend scale.
const PLATE_G = 420;
const FOOD_G = 150;

const STEPS = [
  'The scale answers',
  `Empty plate (${PLATE_G} g), then TARE`,
  `Food on: the scale reads ${FOOD_G} g`,
  'PHOTO: twelve readings, one weight',
  'The camera confirms',
  'The backend saves the meal',
];

/** A field of an event line ("E sent seq=3 ok=1" → seq is "3"), or undefined. */
function fieldOf(text: string, key: string) {
  const line = parseLine(text);
  return line.kind === 'event' ? line.event.fields[key] : undefined;
}

export function Bench() {
  const source = useRef<Source | null>(null);
  const recent = useRef<Reading[]>([]);
  const [mode, setMode] = useState<'off' | 'board' | 'practice'>('off');
  const [node, setNode] = useState<NodeId | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  // Node A
  const [reading, setReading] = useState<Reading | null>(null);
  const [link, setLink] = useState('not found');
  const [practiceMass, setPracticeMass] = useState(0);
  // A real board running the pretend-scale build: its weight is typed here.
  const [simulated, setSimulated] = useState(false);
  const [simGrams, setSimGrams] = useState('150');
  const [typed, setTyped] = useState('');
  // The whole-meal test: lines it waits for, and how far it got.
  const waiters = useRef<{ test: (text: string) => boolean; done: (text: string) => void }[]>([]);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [testing, setTesting] = useState(false);
  const mass = useRef(0);
  const [points, setPoints] = useState<Point[]>([]);
  const [known, setKnown] = useState('');
  const fit = fitThroughZero(points);
  // Node B
  const [wifi, setWifi] = useState<{ state: string; detail: string }>({ state: '—', detail: '' });
  const [photo, setPhoto] = useState<string | null>(null);
  const [upload, setUpload] = useState<string | null>(null);
  const [setup, setSetup] = useState({ ssid: '', pass: '', backend: '' });
  const [testGrams, setTestGrams] = useState('150');
  // Known only in the browser; assumed until then, so the first render matches the server's.
  const [supported, setSupported] = useState(true);
  useEffect(() => setSupported('serial' in navigator), []);

  function onLine(text: string) {
    for (const waiter of [...waiters.current]) {
      if (waiter.test(text)) {
        waiters.current = waiters.current.filter((item) => item !== waiter);
        waiter.done(text);
      }
    }
    const line = parseLine(text);
    if (line.kind === 'reading') {
      recent.current = [...recent.current.slice(-19), line.reading];
      setReading(line.reading);
      return;
    }
    if (line.kind === 'event') {
      const { name, fields, text: rest } = line.event;
      if ((name === 'boot' || name === 'info') && (fields.node === 'a' || fields.node === 'b')) setNode(fields.node);
      if ((name === 'boot' || name === 'info') && fields.node === 'a') setSimulated(fields.simulated === '1');
      if (name === 'link') setLink(fields.ch ? `channel ${fields.ch}` : 'not found');
      if (name === 'wifi') {
        if (fields.ch) setWifi({ state: 'Wi-Fi up', detail: `channel ${fields.ch} · ${fields.ip ?? ''}` });
        else setWifi({ state: rest.includes('not-set') ? 'Wi-Fi not set' : 'Wi-Fi down', detail: '' });
      }
      if (name === 'info' && fields.node === 'b') {
        setWifi({ state: fields.wifi === 'up' ? 'Wi-Fi up' : fields.ssid ? 'Wi-Fi down' : 'Wi-Fi not set', detail: fields.wifi === 'up' ? `channel ${fields.ch}` : '' });
        setSetup((current) => ({ ...current, ssid: current.ssid || fields.ssid || '', backend: current.backend || fields.backend || '' }));
      }
      if (name === 'photo') setPhoto(`${Number(fields.bytes).toLocaleString('en-GB')} bytes`);
      if (name === 'upload') {
        const status = Number(fields.status);
        setUpload(`${fields.g} g · ${OUTCOME[fields.outcome] ?? fields.outcome}${status > 0 ? ` · HTTP ${status}` : ' · no answer'}`);
      }
    }
    setLog((current) => [...current.slice(-79), text]);
  }

  function stop() {
    source.current?.close();
    source.current = null;
    recent.current = [];
    setMode('off');
    setNode(null);
    setSimulated(false);
    setReading(null);
    setWifi({ state: '—', detail: '' });
    setPhoto(null);
    setUpload(null);
  }

  async function connect() {
    setProblem(null);
    try {
      source.current = await openBoard(onLine, (why) => {
        setProblem(why);
        stop();
      });
      setMode('board');
    } catch (error) {
      // Picking no port is not a problem worth a message.
      if (!(error instanceof DOMException && error.name === 'NotFoundError')) {
        setProblem('Could not open the board. Is another program (a serial monitor) using it?');
      }
    }
  }

  function practise(which: NodeId) {
    setProblem(null);
    source.current =
      which === 'a'
        ? practiseScale(
            onLine,
            () => mass.current,
            (grams) => {
              mass.current = grams;
              setPracticeMass(grams);
            },
          )
        : practiseCamera(onLine);
    setMode('practice');
  }

  useEffect(() => () => source.current?.close(), []);

  const send = (command: string) => {
    // Logged first: practice answers at once, and the answer belongs under the command.
    setLog((current) => [...current.slice(-79), `> ${command.startsWith('pass ') ? 'pass ••••••' : command}`]);
    source.current?.send(command);
  };

  /** The first line from the board that passes `test`, or null after `ms`. */
  function waitFor(test: (text: string) => boolean, ms: number): Promise<string | null> {
    return new Promise((resolve) => {
      const waiter = {
        test,
        done: (text: string) => {
          window.clearTimeout(timer);
          resolve(text);
        },
      };
      const timer = window.setTimeout(() => {
        waiters.current = waiters.current.filter((item) => item !== waiter);
        resolve(null);
      }, ms);
      waiters.current.push(waiter);
    });
  }

  const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  /**
   * Play one meal through the pretend scale and check every line the boards
   * print on the way: the path a real meal takes, with the weight typed.
   * It never sends `cal` to a real board: a calibration saved now would outlive
   * the pretend scale and make tomorrow's real one read wrong.
   */
  async function runMealTest() {
    const states: Step[] = STEPS.map((label) => ({ label, state: 'waiting' }));
    const mark = (index: number, state: Step['state'], note?: string) => {
      states[index] = { ...states[index], state, note };
      setSteps([...states]);
    };
    setTesting(true);
    setSteps([...states]);
    try {
      mark(0, 'running');
      if (mode === 'practice') send('cal 100'); // the practice scale only: it starts uncalibrated
      // Each answer is listened for before the command goes: practice answers at once.
      const infoLine = waitFor((text) => text.startsWith('E info node=a'), 3000);
      send('info');
      const info = await infoLine;
      if (!info) return mark(0, 'fail', 'No answer to info. Is this the scale, running the pretend-scale image?');
      if (fieldOf(info, 'calibrated') !== '1') {
        return mark(0, 'fail', 'The scale says it is not calibrated. The pretend-scale image calibrates itself: flash it again.');
      }
      const simulatedNote = fieldOf(info, 'simulated') === '1' ? `pretend scale, firmware ${fieldOf(info, 'fw')}` : `firmware ${fieldOf(info, 'fw')}`;
      mark(0, 'ok', mode === 'practice' ? 'practice' : simulatedNote);

      mark(1, 'running');
      send(`sim ${PLATE_G}`);
      await pause(2500); // the pretend plate wobbles for about 1.5 s, like a real one
      const tareLine = waitFor((text) => text.startsWith('E tare'), 6000);
      send('tare');
      const tared = await tareLine;
      if (!tared) return mark(1, 'fail', 'No answer to TARE.');
      mark(1, 'ok', `offset ${fieldOf(tared, 'offset')} counts`);

      mark(2, 'running');
      send(`sim ${PLATE_G + FOOD_G}`);
      let shown = NaN;
      const settled = await waitFor((text) => {
        const line = parseLine(text);
        if (line.kind !== 'reading' || line.reading.grams === null) return false;
        shown = line.reading.grams;
        return line.reading.stable && Math.abs(shown - FOOD_G) <= 1;
      }, 8000);
      if (!settled) return mark(2, 'fail', `The reading never settled within 1 g of ${FOOD_G} g (last: ${shown} g).`);
      mark(2, 'ok', `${shown.toFixed(1)} g, settled`);

      mark(3, 'running');
      const captureLine = waitFor((text) => text.startsWith('E capture') || text.startsWith('E error'), 6000);
      const sentLine = waitFor((text) => text.startsWith('E sent'), 26000);
      const resultLine = waitFor((text) => text.startsWith('E result'), 60000);
      send('capture');
      const captured = await captureLine;
      if (!captured || captured.startsWith('E error')) return mark(3, 'fail', captured ?? 'No answer to PHOTO.');
      const grams = Number(fieldOf(captured, 'g'));
      if (!(Math.abs(grams - FOOD_G) <= 1)) return mark(3, 'fail', `Weighed ${grams} g, not ${FOOD_G}.`);
      mark(3, 'ok', `${grams.toFixed(1)} g`);

      mark(4, 'running');
      const sent = await sentLine;
      if (mode === 'practice') return mark(4, 'fail', 'Practice has no camera: on the real boards, this is where the camera answers.');
      if (!sent || fieldOf(sent, 'ok') !== '1') {
        return mark(4, 'fail', 'The camera did not confirm. It must be on and on the hotspot (Wi-Fi up); then press Find camera and run the test again.');
      }
      mark(4, 'ok', `seq ${fieldOf(sent, 'seq')}`);

      mark(5, 'running');
      const result = await resultLine;
      const outcome = result ? fieldOf(result, 'outcome') : undefined;
      if (outcome === 'saved') return mark(5, 'ok', 'saved: the whole chain works');
      if (outcome === 'unknown') return mark(5, 'ok', 'reached the backend, which could not name the dish: the chain works');
      if (outcome === 'queued') return mark(5, 'fail', 'Kept on the camera’s card: it could not reach the backend. Check the backend address and the firewall.');
      return mark(5, 'fail', outcome ? `The camera reports ${outcome}.` : 'No result from the camera within a minute.');
    } finally {
      setTesting(false);
    }
  }

  function record() {
    const grams = Number(known);
    const nets = recent.current.slice(-10).map((item) => item.net);
    if (!(grams > 0) || nets.length < 5) return;
    setPoints((current) => [...current, { grams, counts: median(nets) }]);
    setKnown('');
  }

  function saveSetup() {
    if (setup.ssid) send(`ssid ${setup.ssid}`);
    if (setup.pass) send(`pass ${setup.pass}`);
    if (setup.backend) send(`backend ${setup.backend}`);
    send('wifi');
    setSetup((current) => ({ ...current, pass: '' }));
  }

  const who =
    mode === 'off'
      ? 'Not connected'
      : mode === 'practice'
        ? `Practice: a pretend ${node === 'b' ? 'camera board' : 'scale'}, invented numbers`
        : node === 'a'
          ? 'Node A, the scale, over USB'
          : node === 'b'
            ? 'Node B, the camera, over USB'
            : 'A board, over USB. Press Info to see which';
  const shown = reading === null ? '—' : reading.grams === null ? `${reading.raw}` : `${reading.grams.toFixed(1)} g`;
  const off = mode === 'off';

  return (
    <div className="bench">
      <div className="bench-top">
        {off ? (
          <>
            <button type="button" className="btn btn-primary" onClick={connect} disabled={!supported}>
              <Icon name="plug" size={16} />
              Connect a board
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => practise('a')}>
              <Icon name="play" size={15} />
              Practise: the scale
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => practise('b')}>
              <Icon name="play" size={15} />
              Practise: the camera
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={stop}>
            <Icon name="stop" size={15} />
            {mode === 'board' ? 'Disconnect' : 'Stop practising'}
          </button>
        )}
        {!supported ? <p className="bench-note">This browser cannot reach a USB board: use Chrome, Edge or Firefox on a computer. Practice works anywhere.</p> : null}
        {problem ? <p className="bench-note">{problem}</p> : null}
      </div>

      <div className="bench-screen" data-mode={mode}>
        <p className="bench-mode">{who}</p>
        {node === 'b' ? (
          <>
            <p className="bench-value bench-value-small" aria-live="polite">
              {wifi.state}
              {wifi.detail ? <span>{wifi.detail}</span> : null}
            </p>
            <p className="bench-meta">
              <span>last photo: {photo ?? '—'}</span>
              <span>last upload: {upload ?? '—'}</span>
            </p>
          </>
        ) : (
          <>
            <p className="bench-value" aria-live="polite">
              {shown}
              {reading?.grams === null ? <span>raw counts · not calibrated</span> : null}
            </p>
            <p className="bench-meta">
              <span data-on={reading?.stable ?? false}>{reading?.stable ? 'settled' : 'moving'}</span>
              <span>camera: {link}</span>
              {reading ? <span>net {reading.net} counts</span> : null}
            </p>
          </>
        )}
      </div>

      {mode === 'practice' && node === 'a' ? (
        <label className="bench-mass">
          <span>Mass on the pretend scale: {practiceMass} g</span>
          <input
            type="range"
            min="0"
            max="3000"
            step="10"
            value={practiceMass}
            onChange={(event) => {
              mass.current = Number(event.target.value);
              setPracticeMass(mass.current);
            }}
          />
        </label>
      ) : null}

      {mode === 'board' && node === 'a' && simulated ? (
        <form
          className="bench-record"
          onSubmit={(event) => {
            event.preventDefault();
            send(`sim ${simGrams}`);
          }}
        >
          <input inputMode="decimal" value={simGrams} onChange={(event) => setSimGrams(event.target.value)} aria-label="Pretend weight, in grams" />
          <button type="submit" disabled={!(Number(simGrams) >= 0)}>
            Set the pretend weight, g
          </button>
        </form>
      ) : null}

      {node === 'a' && (mode === 'practice' || simulated) ? (
        <section className="bench-cal">
          <p className="label">The whole-meal test</p>
          <p className="bench-hint">
            Plays one meal through the pretend scale, {PLATE_G} g of plate and {FOOD_G} g of food, and checks every step the
            boards report. With the camera on the hotspot, it goes all the way to the backend.
          </p>
          <button type="button" className="btn btn-primary" onClick={runMealTest} disabled={testing}>
            {testing ? 'Running…' : 'Run the whole-meal test'}
          </button>
          {steps ? (
            <ol className="bench-steps">
              {steps.map((step) => (
                <li key={step.label} data-state={step.state}>
                  <span>{step.label}</span>
                  {step.note ? <small>{step.note}</small> : null}
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      <div className="bench-commands" role="group" aria-label="Commands">
        {(node === 'b'
          ? [
              ['light on', 'Light on'],
              ['light off', 'Light off'],
              ['flush', 'Send what is kept'],
              ['info', 'Info'],
            ]
          : node === 'a'
            ? [
                ['tare', 'Tare'],
                ['capture', 'Photo'],
                ['info', 'Info'],
                ['find', 'Find camera'],
              ]
            : [['info', 'Info']]
        ).map(([command, label]) => (
          <button key={command} type="button" disabled={off} onClick={() => send(command)}>
            {label}
          </button>
        ))}
      </div>

      {node === 'b' ? (
        <>
          <div className="bench-record">
            <input inputMode="decimal" value={testGrams} onChange={(event) => setTestGrams(event.target.value)} aria-label="Grams to send with the test photo" />
            <button type="button" disabled={off || !(Number(testGrams) >= 0.5)} onClick={() => send(`shoot ${testGrams}`)}>
              Take a test photo
            </button>
          </div>

          <section className="bench-cal">
            <p className="label">Wi-Fi and backend</p>
            <p className="bench-hint">
              Saved on the board. The password is never printed back. Until the backend is hosted, its address is the laptop’s
              on the hotspot, port 8000: <code>http://192.168.x.y:8000</code>.
            </p>
            <div className="bench-setup">
              <input placeholder="Hotspot name" value={setup.ssid} onChange={(event) => setSetup({ ...setup, ssid: event.target.value })} aria-label="Hotspot name" />
              <input type="password" placeholder="Password" value={setup.pass} onChange={(event) => setSetup({ ...setup, pass: event.target.value })} aria-label="Hotspot password" />
              <input placeholder="Backend address" value={setup.backend} onChange={(event) => setSetup({ ...setup, backend: event.target.value })} aria-label="Backend address" />
              <button type="button" className="btn btn-primary" disabled={off || !setup.ssid} onClick={saveSetup}>
                Save and connect
              </button>
            </div>
          </section>
        </>
      ) : null}

      {node === 'a' ? (
        <section className="bench-cal">
          <p className="label">Calibrate</p>
          <ol>
            <li>Empty plate on, press Tare.</li>
            <li>Put a known mass on, type its grams, press Record. Five masses, from light to near 2 kg.</li>
            <li>Save. Then check with masses you did not use here.</li>
          </ol>
          <div className="bench-record">
            <input
              inputMode="decimal"
              placeholder="Known mass, g"
              value={known}
              onChange={(event) => setKnown(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && record()}
              aria-label="Known mass in grams"
            />
            <button type="button" onClick={record} disabled={off || !(Number(known) > 0)}>
              Record
            </button>
            {points.length ? (
              <button type="button" className="bench-quiet" onClick={() => setPoints([])}>
                Clear
              </button>
            ) : null}
          </div>
          {points.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Known</th>
                    <th>Counts</th>
                    <th>Would show</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point, index) => {
                    const row = fit?.rows[index];
                    return (
                      <tr key={index}>
                        <td>{point.grams} g</td>
                        <td>{point.counts}</td>
                        <td>{row ? `${row.shown.toFixed(1)} g` : '—'}</td>
                        <td>{row ? signed(row.error) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
          {fit ? (
            <p className="bench-fit">
              <span>
                <strong>{fit.slope.toFixed(4)}</strong> counts per gram · worst error {fit.worst.toFixed(1)} g
              </span>
              <button type="button" className="btn btn-primary" onClick={() => send(`cal ${fit.slope.toFixed(6)}`)} disabled={off}>
                Save to the board
              </button>
            </p>
          ) : (
            <p className="bench-hint">Two masses give a line; five give one worth trusting.</p>
          )}
        </section>
      ) : null}

      <details className="bench-log">
        <summary>Everything the board said ({log.length})</summary>
        <pre>{log.join('\n') || 'Nothing yet.'}</pre>
        <form
          className="bench-record"
          onSubmit={(event) => {
            event.preventDefault();
            if (typed.trim()) send(typed.trim());
            setTyped('');
          }}
        >
          <input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Any command from the firmware’s README" aria-label="A command for the board" disabled={off} />
          <button type="submit" disabled={off || !typed.trim()}>
            Send
          </button>
        </form>
      </details>
    </div>
  );
}
