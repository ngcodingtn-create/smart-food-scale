'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { fitThroughZero, median, parseLine, type Point, type Reading } from './bench';
import './workbench.css';

/**
 * Node A on the bench, read live over USB.
 *
 * Talks to the board through Web Serial at 115200 baud, in the line format of
 * firmware/node-a-scale/README.md. With no board, "Practice" runs a pretend
 * scale in this page that speaks the same lines, so the page can be learnt
 * before the parts arrive. Practice numbers are invented and say so.
 */

type Source = { send: (command: string) => void; close: () => void };

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
function openPractice(onLine: (line: string) => void, massOf: () => number): Source {
  const COUNTS_PER_GRAM = 100; // invented, like the firmware's node-a-sim build
  const ZERO = 84000;
  let offset = 0;
  let cpg = NaN;
  let seq = 1;
  const raw = () => Math.round(ZERO + massOf() * COUNTS_PER_GRAM + (Math.random() * 7 - 3));
  const grams = (counts: number) => (Number.isNaN(cpg) ? 'nan' : ((counts - offset) / cpg).toFixed(1));

  onLine('E boot fw=practice calibrated=0 cpg=nan');
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
        onLine(`E info fw=practice calibrated=${Number.isNaN(cpg) ? 0 : 1} cpg=${cpg} offset=${offset} camera_ch=0`);
      } else if (word === 'find') {
        onLine('E link none');
      }
    },
    close: () => window.clearInterval(timer),
  };
}

/** "+1.2 g", "−0.4 g", and a plain "0.0 g" rather than a "−0.0 g" that rounds to nothing. */
function signed(grams: number) {
  const text = Math.abs(grams).toFixed(1);
  return text === '0.0' ? '0.0 g' : `${grams > 0 ? '+' : '−'}${text} g`;
}

export function Bench() {
  const source = useRef<Source | null>(null);
  const recent = useRef<Reading[]>([]);
  const [mode, setMode] = useState<'off' | 'board' | 'practice'>('off');
  const [reading, setReading] = useState<Reading | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [link, setLink] = useState('not found');
  const [problem, setProblem] = useState<string | null>(null);
  const [practiceMass, setPracticeMass] = useState(0);
  const mass = useRef(0);
  const [points, setPoints] = useState<Point[]>([]);
  const [known, setKnown] = useState('');
  const fit = fitThroughZero(points);
  // Known only in the browser; assumed until then, so the first render matches the server's.
  const [supported, setSupported] = useState(true);
  useEffect(() => setSupported('serial' in navigator), []);

  function onLine(text: string) {
    const line = parseLine(text);
    if (line.kind === 'reading') {
      recent.current = [...recent.current.slice(-19), line.reading];
      setReading(line.reading);
      return;
    }
    if (line.kind === 'event' && line.event.name === 'link') {
      setLink(line.event.fields.ch ? `channel ${line.event.fields.ch}` : 'not found');
    }
    setLog((current) => [...current.slice(-59), text]);
  }

  function stop() {
    source.current?.close();
    source.current = null;
    recent.current = [];
    setMode('off');
    setReading(null);
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

  function practise() {
    setProblem(null);
    source.current = openPractice(onLine, () => mass.current);
    setMode('practice');
  }

  useEffect(() => () => source.current?.close(), []);

  const send = (command: string) => {
    // Logged first: practice answers at once, and the answer belongs under the command.
    setLog((current) => [...current.slice(-59), `> ${command}`]);
    source.current?.send(command);
  };

  function record() {
    const grams = Number(known);
    const nets = recent.current.slice(-10).map((item) => item.net);
    if (!(grams > 0) || nets.length < 5) return;
    setPoints((current) => [...current, { grams, counts: median(nets) }]);
    setKnown('');
  }

  const shown = reading === null ? '—' : reading.grams === null ? `${reading.raw}` : `${reading.grams.toFixed(1)} g`;

  return (
    <div className="bench">
      <div className="bench-top">
        {mode === 'off' ? (
          <>
            <button type="button" className="btn btn-primary" onClick={connect} disabled={!supported}>
              <Icon name="plug" size={16} />
              Connect the board
            </button>
            <button type="button" className="btn btn-secondary" onClick={practise}>
              <Icon name="play" size={15} />
              Practise without a board
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
        <p className="bench-mode">{mode === 'board' ? 'Node A, over USB' : mode === 'practice' ? 'Practice: a pretend scale, invented numbers' : 'Not connected'}</p>
        <p className="bench-value" aria-live="polite">
          {shown}
          {reading?.grams === null ? <span>raw counts · not calibrated</span> : null}
        </p>
        <p className="bench-meta">
          <span data-on={reading?.stable ?? false}>{reading?.stable ? 'settled' : 'moving'}</span>
          <span>camera: {link}</span>
          {reading ? <span>net {reading.net} counts</span> : null}
        </p>
      </div>

      {mode === 'practice' ? (
        <label className="bench-mass">
          <span>Mass on the pretend scale: {practiceMass} g</span>
          <input type="range" min="0" max="3000" step="10" value={practiceMass} onChange={(event) => {
              mass.current = Number(event.target.value);
              setPracticeMass(mass.current);
            }}
          />
        </label>
      ) : null}

      <div className="bench-commands" role="group" aria-label="Commands">
        {[
          ['tare', 'Tare'],
          ['capture', 'Photo'],
          ['info', 'Info'],
          ['find', 'Find camera'],
        ].map(([command, label]) => (
          <button key={command} type="button" disabled={mode === 'off'} onClick={() => send(command)}>
            {label}
          </button>
        ))}
      </div>

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
          <button type="button" onClick={record} disabled={mode === 'off' || !(Number(known) > 0)}>
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
            <button type="button" className="btn btn-primary" onClick={() => send(`cal ${fit.slope.toFixed(6)}`)} disabled={mode === 'off'}>
              Save to the board
            </button>
          </p>
        ) : (
          <p className="bench-hint">Two masses give a line; five give one worth trusting.</p>
        )}
      </section>

      <details className="bench-log">
        <summary>Everything else the board said ({log.length})</summary>
        <pre>{log.join('\n') || 'Nothing yet.'}</pre>
      </details>
    </div>
  );
}
