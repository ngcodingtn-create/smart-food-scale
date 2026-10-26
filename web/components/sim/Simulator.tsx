'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import {
  EMPTY_DB,
  FOODS,
  deleteMeal,
  findFood,
  postMeal,
  utcToday,
  type ApiResponse,
  type Db,
  type Frame,
  type MealCreated,
} from '@/lib/sim/backend';
import { Phone } from './Phone';
import { SimStage } from './SimStage';
import './sim.css';

/**
 * The whole system, modelled in the browser: bench → Node A → ESP-NOW →
 * Node B → Wi-Fi → backend → phone.
 *
 * What is real and what is not, because the difference matters here:
 *   real       the backend's rules, wording, arithmetic and JSON (lib/sim/backend.ts
 *              mirrors backend/app), the food table, the 10 SPS / median-of-12
 *              reading, the order of the capture sequence.
 *   modelled   the load cell (a number plus a little noise), the photograph
 *              (no image exists), and recognition (told what is on the plate).
 *   not built  the firmware and the phone app. Their behaviour here follows the
 *              project's written plan, not running code.
 */

// --- the bench ---------------------------------------------------------------

const CELL_CAPACITY_G = 3000;

/** Two plates: the plate's own mass comes out of the cell's range, and is what gets tared. */
const PLATES = {
  light: { label: 'Melamine plate', grams: 150 },
  heavy: { label: 'Ceramic plate', grams: 420 },
} as const;
type PlateId = keyof typeof PLATES;

const PORTION_MIN = 10;
const PORTION_MAX = 700;

/** docs: "median filter over 10–16 samples", HX711 at 10 samples per second. */
const SAMPLE_COUNT = 12;
const SAMPLE_PERIOD_MS = 100;
/** Per-sample noise, inside the 0.1–0.2 g "readable" figure the project claims. */
const NOISE_G = 0.06;
/** The one button, as firmware/node-a-scale/include/config.h times it. */
const CLICK_MAX_MS = 800;
const HOLD_TO_TARE_MS = 5000;

// Colours for the mound on the plate and Node B's frame. Illustrative only.
const DISH_COLOUR: Record<string, string> = {
  couscous_tunisien_agneau: '#d39a3a',
  couscous_poisson: '#d6a955',
  lablabi: '#c59b62',
  brik_a_loeuf: '#d9a441',
  ojja_merguez: '#b3442b',
  mloukhia: '#33402a',
  chorba_frik: '#b2622e',
  salade_mechouia: '#a65a2c',
  slata_tounsia: '#7f9e45',
  tajine_tunisien: '#d4ae47',
  kafteji: '#b8782f',
  marqa_jelbana: '#73913c',
  kamounia: '#6d3c24',
  fricasse: '#c68a3d',
  harissa: '#a4241a',
  makroudh: '#a7662d',
  bambalouni: '#d8a659',
  assidat_zgougou: '#4b3b2b',
};

// --- the pipeline ------------------------------------------------------------

type StageId = 'scale' | 'espnow' | 'camera' | 'upload' | 'backend' | 'app';
type Status = 'idle' | 'active' | 'done' | 'failed' | 'held';

const STAGES: { id: StageId; who: string; what: string; how: string }[] = [
  { id: 'scale', who: 'Node A', what: 'Weigh', how: `median of ${SAMPLE_COUNT} samples at 10 SPS` },
  { id: 'espnow', who: 'ESP-NOW', what: 'Hand over', how: 'grams to the camera node, no router' },
  { id: 'camera', who: 'Node B', what: 'Photograph', how: 'light on, one JPEG' },
  { id: 'upload', who: 'Wi-Fi', what: 'Upload', how: 'POST /meals, multipart' },
  { id: 'backend', who: 'Backend', what: 'Compute', how: 'identify · look up · × grams · store' },
  { id: 'app', who: 'App', what: 'Show', how: 'GET /meals and /meals/totals' },
];

const IDLE: Record<StageId, Status> = {
  scale: 'idle',
  espnow: 'idle',
  camera: 'idle',
  upload: 'idle',
  backend: 'idle',
  app: 'idle',
};

type LogLine = { id: number; who: string; text: string; tone?: 'ok' | 'warn' | 'bad' };
type Buffered = { grams: number; frame: Frame };

type World = {
  plate: PlateId | null;
  dishKey: string;
  portion: number;
  foodOn: boolean;
  /** Raw grams the display subtracts. Zero until TARE is first pressed. */
  tareOffset: number;
  wifi: boolean;
  recognisable: boolean;
  busy: boolean;
  flash: boolean;
  /** Second line of the display. */
  note: string;
  stages: Record<StageId, Status>;
  samples: number[];
  median: number | null;
  espnow: string | null;
  request: string | null;
  response: { status: number; body: unknown } | null;
  /** The backend's truth, and the copy the phone fetched last. */
  db: Db;
  appDb: Db;
  freshId: number | null;
  queue: Buffered[];
  log: LogLine[];
  logSeq: number;
};

const INITIAL: World = {
  plate: null,
  dishKey: 'couscous_tunisien_agneau',
  portion: 143.2,
  foodOn: false,
  tareOffset: 0,
  wifi: true,
  recognisable: true,
  busy: false,
  flash: false,
  note: 'READY',
  stages: IDLE,
  samples: [],
  median: null,
  espnow: null,
  request: null,
  response: null,
  db: EMPTY_DB,
  appDb: EMPTY_DB,
  freshId: null,
  queue: [],
  log: [],
  logSeq: 1,
};

type Patch = Partial<World> | ((world: World) => Partial<World>);
const reduce = (world: World, patch: Patch): World => ({
  ...world,
  ...(typeof patch === 'function' ? patch(world) : patch),
});

// --- small helpers -----------------------------------------------------------

const round1 = (value: number) => Math.round(value * 10) / 10;

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length / 2;
  return sorted.length % 2 ? sorted[Math.floor(middle)] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Roughly normal noise: the sum of three uniforms. */
const noise = () => (Math.random() + Math.random() + Math.random() - 1.5) * NOISE_G * 1.6;

function multipart(fields: [string, string][]) {
  return ['POST /meals HTTP/1.1', 'Content-Type: multipart/form-data', '', ...fields.map(([key, value]) => `${key} = ${value}`)].join('\n');
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** The displayed number settling onto a new load, the way a pan comes to rest. */
function useSettling(target: number, instant: boolean) {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (instant) {
      current.current = target;
      setValue(target);
      return;
    }
    const origin = current.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      const eased = 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 2.5);
      current.current = origin + (target - origin) * eased;
      setValue(current.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // Browsers stop animation frames in a background tab. A display left
    // showing a stale mass would be the worst kind of bug for this page, so a
    // plain timer lands the true value whether or not a frame ever ran.
    const land = window.setTimeout(() => {
      current.current = target;
      setValue(target);
    }, 760);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(land);
    };
  }, [target, instant]);

  return value;
}

// --- the simulator -----------------------------------------------------------

export function Simulator() {
  const [world, patch] = useReducer(reduce, INITIAL);
  const [today, setToday] = useState<string | null>(null);
  const [panel, setPanel] = useState<'log' | 'wire'>('log');
  const reducedMotion = usePrefersReducedMotion();

  // Async steps read the latest world and database through refs: a capture
  // spans many renders, and the phone can post or delete while one is running.
  const latest = useRef(world);
  latest.current = world;
  const db = useRef<Db>(EMPTY_DB);
  const run = useRef(0);

  useEffect(() => setToday(utcToday()), []);
  useEffect(() => () => void (run.current += 1), []);

  const say = useCallback((who: string, text: string, tone?: LogLine['tone']) => {
    patch((w) => ({
      log: [...w.log, { id: w.logSeq, who, text, tone }].slice(-60),
      logSeq: w.logSeq + 1,
    }));
  }, []);

  const pause = useCallback(
    (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, reducedMotion ? ms * 0.2 : ms)),
    [reducedMotion],
  );

  const stage = useCallback((id: StageId, status: Status) => {
    patch((w) => ({ stages: { ...w.stages, [id]: status } }));
  }, []);

  // What the cell carries, and what the display therefore shows.
  const plateGrams = world.plate ? PLATES[world.plate].grams : 0;
  const raw = plateGrams + (world.plate && world.foodOn ? world.portion : 0);
  const net = round1(raw - world.tareOffset);
  const overload = raw > CELL_CAPACITY_G;
  const shown = useSettling(net, reducedMotion);
  const dish = findFood(world.dishKey) ?? FOODS[0];

  // --- the phone's own calls -------------------------------------------------

  /** The app re-reads the backend. Nothing pushes to it; it has to ask. */
  const refreshApp = useCallback((freshId: number | null = null) => {
    patch({ appDb: db.current, freshId });
  }, []);

  const manualEntry = useCallback(
    (dishKey: string, grams: number): ApiResponse<MealCreated> => {
      const result = postMeal(db.current, { grams, dish_key: dishKey });
      db.current = result.db;
      patch({
        db: result.db,
        request: multipart([
          ['grams', String(grams)],
          ['dish_key', dishKey],
        ]),
        response: { status: result.response.status, body: result.response.body },
        stages: { ...IDLE, backend: result.response.ok ? 'done' : 'failed', app: result.response.ok ? 'done' : 'idle' },
      });
      if (result.response.ok) {
        const { meal } = result.response.body;
        say('App', `POST /meals with dish_key → 201. ${meal.dish_name}, ${meal.grams} g, entered by hand.`, 'ok');
        refreshApp(meal.id);
      } else {
        say('App', `POST /meals with dish_key → ${result.response.status}. The backend refused the mass.`, 'bad');
      }
      return result.response;
    },
    [refreshApp, say],
  );

  const removeMeal = useCallback(
    (id: number) => {
      const result = deleteMeal(db.current, id);
      db.current = result.db;
      patch({
        db: result.db,
        request: `DELETE /meals/${id} HTTP/1.1`,
        response: { status: result.response.status, body: result.response.body },
      });
      say('App', `DELETE /meals/${id} → ${result.response.status}.`);
      refreshApp();
    },
    [refreshApp, say],
  );

  // --- upload, backend, app: shared by a live capture and a flushed buffer ----

  const deliver = useCallback(
    async (token: number, upload: Buffered) => {
      stage('backend', 'active');
      await pause(650);
      if (token !== run.current) return;

      const result = postMeal(db.current, { grams: upload.grams, frame: upload.frame });
      db.current = result.db;
      patch({ db: result.db, response: { status: result.response.status, body: result.response.body } });

      if (!result.response.ok) {
        stage('backend', 'failed');
        const { detail } = result.response.body;
        if (typeof detail === 'string') {
          patch({ note: 'BAD MASS' });
          say('Backend', `422. ${detail}`, 'bad');
        } else {
          patch({ note: 'DISH ?' });
          say(
            'Backend',
            `422. ${detail.detail} It returned the ${detail.known_dishes.length} dishes it does know, so the measured ${upload.grams} g need not be lost.`,
            'bad',
          );
          say(
            'You',
            'Nothing tells the phone this happened. Read the mass off the display and use Add in the app.',
            'warn',
          );
        }
        return;
      }

      const { meal } = result.response.body;
      stage('backend', 'done');
      patch({ note: 'LOGGED' });
      say(
        'Backend',
        `201. ${meal.dish_name}: ${meal.grams} g × ${result.response.body.nutrition.per_100g.kcal} kcal / 100 g = ${meal.macros.kcal} kcal.`,
        'ok',
      );

      stage('app', 'active');
      await pause(550);
      if (token !== run.current) return;
      refreshApp(meal.id);
      stage('app', 'done');
      say('App', 'GET /meals and /meals/totals. Today’s log is up to date.');
    },
    [pause, refreshApp, say, stage],
  );

  // --- the capture sequence ----------------------------------------------------

  const capture = useCallback(async () => {
    const w = latest.current;
    if (w.busy) return;
    const token = (run.current += 1);

    const plateG = w.plate ? PLATES[w.plate].grams : 0;
    const rawNow = plateG + (w.plate && w.foodOn ? w.portion : 0);
    const netNow = rawNow - w.tareOffset;

    patch({
      busy: true,
      stages: { ...IDLE, scale: 'active' },
      samples: [],
      median: null,
      espnow: null,
      request: null,
      response: null,
      note: 'WEIGHING',
    });

    // 1. Node A — the reading. Twelve samples at the HX711's real 10 per second.
    if (rawNow > CELL_CAPACITY_G) {
      await pause(400);
      if (token !== run.current) return;
      patch({ busy: false, note: 'OVERLOAD', stages: { ...IDLE, scale: 'failed' } });
      say(
        'Node A',
        `Refused: ${round1(rawNow)} g is past the 3 kg cell. The plate alone is ${plateG} g of that.`,
        'bad',
      );
      return;
    }
    const samples: number[] = [];
    for (let i = 0; i < SAMPLE_COUNT; i += 1) {
      samples.push(round1(netNow + noise()));
      patch({ samples: [...samples] });
      await pause(SAMPLE_PERIOD_MS);
      if (token !== run.current) return;
    }
    const grams = round1(median(samples));
    patch({ median: grams });
    stage('scale', 'done');
    say('Node A', `${SAMPLE_COUNT} samples at 10 SPS, median ${grams.toFixed(1)} g.`);

    // The two ways to get the mass wrong without anything noticing.
    if (w.plate && w.foodOn && w.tareOffset < plateG - 0.05) {
      say(
        'You',
        `The plate was never tared, so ${round1(plateG - w.tareOffset)} g of plate is inside that mass. No stage downstream can tell.`,
        'warn',
      );
    } else if (w.plate && w.foodOn && w.tareOffset > plateG + 0.05) {
      say(
        'You',
        `TARE was pressed with food already on the plate: ${round1(w.tareOffset - plateG)} g of the meal was zeroed away.`,
        'warn',
      );
    }

    // 2. ESP-NOW — board to board, no router.
    stage('espnow', 'active');
    patch({ espnow: `capture  grams = ${grams.toFixed(1)}`, note: 'SENT' });
    await pause(450);
    if (token !== run.current) return;
    stage('espnow', 'done');

    // 3. Node B — light, then one frame.
    stage('camera', 'active');
    patch({ flash: true });
    await pause(750);
    if (token !== run.current) return;
    patch({ flash: false });
    stage('camera', 'done');
    const frame: Frame = {
      subject: w.plate && w.foodOn ? w.dishKey : null,
      recognisable: latest.current.recognisable,
    };
    say('Node B', 'Light on, one JPEG (SVGA, 800 × 600), light off.');

    // 4. Wi-Fi — the only stage that needs a network.
    stage('upload', 'active');
    patch({
      request: multipart([
        ['grams', grams.toFixed(1)],
        ['image', 'frame.jpg  (image/jpeg)'],
      ]),
    });
    await pause(600);
    if (token !== run.current) return;

    const upload: Buffered = { grams, frame };
    if (!latest.current.wifi) {
      stage('upload', 'held');
      patch((now) => ({ busy: false, note: 'NO WIFI', queue: [...now.queue, upload] }));
      say(
        'Node B',
        'POST failed: no Wi-Fi. Frame and grams kept on the microSD card until the network returns.',
        'warn',
      );
      return;
    }
    stage('upload', 'done');

    // 5 and 6. Backend, then the phone.
    await deliver(token, upload);
    if (token === run.current) patch({ busy: false });
  }, [deliver, pause, say, stage]);

  /** Wi-Fi came back: Node B posts whatever it buffered, oldest first. */
  const flush = useCallback(async () => {
    const pending = latest.current.queue;
    if (pending.length === 0 || latest.current.busy) return;
    const token = (run.current += 1);
    patch({ busy: true, queue: [] });
    say('Node B', `Wi-Fi is back. Posting ${pending.length} buffered ${pending.length === 1 ? 'capture' : 'captures'}.`);

    for (const upload of pending) {
      patch({
        stages: { ...IDLE, scale: 'done', espnow: 'done', camera: 'done', upload: 'active' },
        request: multipart([
          ['grams', upload.grams.toFixed(1)],
          ['image', 'frame.jpg  (image/jpeg, from microSD)'],
        ]),
        response: null,
      });
      await pause(600);
      if (token !== run.current) return;
      stage('upload', 'done');
      await deliver(token, upload);
      if (token !== run.current) return;
    }
    patch({ busy: false });
  }, [deliver, pause, say, stage]);

  // Whenever the network is up, nothing is running and something is buffered.
  // An effect rather than a call from the Wi-Fi switch, so a capture that was
  // still in flight when Wi-Fi returned is flushed once it has finished.
  useEffect(() => {
    if (world.wifi && !world.busy && world.queue.length > 0) void flush();
  }, [world.wifi, world.busy, world.queue.length, flush]);

  // --- bench actions -----------------------------------------------------------

  function setPlate(next: PlateId | null) {
    if (next === world.plate) return;
    patch({ plate: next, foodOn: false, note: 'READY' });
    say('You', next ? `Put the empty ${PLATES[next].label.toLowerCase()} on the scale.` : 'Took the plate off the scale.');
  }

  function toggleFood() {
    if (!world.plate) return;
    patch({ foodOn: !world.foodOn, note: 'READY' });
    say('You', world.foodOn ? 'Took the food off the plate.' : `Served ${world.portion.toFixed(1)} g of ${dish.name_fr}.`);
  }

  function tare() {
    if (world.busy) return;
    patch({ tareOffset: raw, note: 'TARE OK' });
    say('Node A', `Tare. Zero set with ${round1(raw)} g on the cell.`);
  }

  // The device's one button, timed as the firmware times it (config.h): let go within
  // CLICK_MAX_MS and it is PHOTO; held HOLD_TO_TARE_MS, TARE; let go in between, nothing.
  const [holdLeft, setHoldLeft] = useState<number | null>(null);
  const hold = useRef<{ start: number; frame: number; tared: boolean } | null>(null);
  const tareNow = useRef(tare);
  tareNow.current = tare;
  const captureNow = useRef(capture);
  captureNow.current = capture;

  function press() {
    if (world.busy || hold.current) return;
    const state = { start: performance.now(), frame: 0, tared: false };
    hold.current = state;
    const tick = () => {
      const held = performance.now() - state.start;
      if (held >= HOLD_TO_TARE_MS) {
        state.tared = true;
        setHoldLeft(null);
        tareNow.current();
        return;
      }
      setHoldLeft(held >= CLICK_MAX_MS ? Math.ceil((HOLD_TO_TARE_MS - held) / 1000) : null);
      state.frame = requestAnimationFrame(tick);
    };
    state.frame = requestAnimationFrame(tick);
  }

  function release() {
    const state = hold.current;
    if (!state) return;
    hold.current = null;
    cancelAnimationFrame(state.frame);
    setHoldLeft(null);
    if (!state.tared && performance.now() - state.start < CLICK_MAX_MS) void captureNow.current();
  }

  function setWifi(next: boolean) {
    patch({ wifi: next });
    say('You', next ? 'Wi-Fi restored.' : 'Wi-Fi switched off (a campus captive portal, or the hotspot dropped).');
  }

  function reset() {
    run.current += 1;
    db.current = EMPTY_DB;
    patch(INITIAL);
  }

  // What to do next, for someone who has never used the device.
  const tareMatches = world.plate !== null && Math.abs(world.tareOffset - plateGrams) < 0.05;
  const next: 'plate' | 'tare' | 'food' | 'capture' = !world.plate
    ? 'plate'
    : !world.foodOn && !tareMatches
      ? 'tare'
      : !world.foodOn
        ? 'food'
        : 'capture';

  const hint = {
    plate: 'Start by putting an empty plate on the scale.',
    tare: `The display shows the plate’s own ${plateGrams} g. Hold the button 5 s to zero it.`,
    food: 'Zeroed. Choose a dish and a portion, then put the food on the plate.',
    capture: overload
      ? `Plate plus food is ${round1(raw)} g, past the 3 kg cell. Take some off.`
      : tareMatches
        ? 'Click the button: that is PHOTO. Node A weighs, Node B photographs, the backend does the arithmetic.'
        : 'Not tared: the display includes the plate. Capture anyway to see what that does, or take the food off and tare.',
  }[next];

  const reading = overload ? 'OVERLOAD' : `${shown.toFixed(1)} g`;
  const settled = overload ? 'OVERLOAD' : `${net.toFixed(1)} g`;
  // A manual entry copies the display, so only offer a number that is one.
  const scaleGrams = world.plate && !overload ? net : null;

  return (
    <section className="sim" aria-label="End-to-end simulation of the Smart Food Scale">
      <div className="sim-bar">
        <span className="sim-flag">
          <Icon name="play" size={13} />
          Simulation
        </span>
        <span className="sim-bar-text">No hardware, no network. Everything below runs in this page.</span>
        <button type="button" className="sim-reset" onClick={reset}>
          <Icon name="reset" size={14} />
          Reset
        </button>
      </div>

      <div className="sim-grid">
        {/* ---------------------------------------------------------- bench */}
        <div className="sim-bench">
          <div className="sim-stage" data-flash={world.flash}>
            <SimStage
              view={{
                oled: settled,
                plate: world.plate !== null,
                food: world.foodOn
                  ? { color: DISH_COLOUR[world.dishKey] ?? '#c59b62', amount: world.portion / PORTION_MAX }
                  : null,
                flash: world.flash,
              }}
            />

            {/* What Node B's camera is pointed at. A diagram, not a photograph. */}
            <figure className="sim-frame" data-flash={world.flash}>
              <svg viewBox="0 0 80 60" role="img" aria-label="Node B's view of the plate from above">
                <rect className="sim-frame-bg" width="80" height="60" />
                {world.plate ? (
                  <>
                    <circle className="sim-frame-plate" cx="40" cy="30" r="25" />
                    <circle className="sim-frame-well" cx="40" cy="30" r="17" />
                    {world.foodOn ? (
                      <circle
                        cx="40"
                        cy="30"
                        r={5 + 11 * Math.cbrt(world.portion / PORTION_MAX)}
                        fill={DISH_COLOUR[world.dishKey] ?? '#c59b62'}
                      />
                    ) : null}
                  </>
                ) : null}
              </svg>
              <figcaption>Node B’s view</figcaption>
            </figure>
          </div>

          {/* The device's own front panel: one display, one button. */}
          <div className="sim-panel">
            <div className="sim-oled" role="status" aria-live="polite" aria-atomic="true">
              <span className="sim-oled-value">{reading}</span>
              <span className="sim-oled-note">{holdLeft !== null ? `HOLD: TARE IN ${holdLeft} s` : world.note}</span>
            </div>
            <button
              type="button"
              className="sim-key sim-key-photo"
              data-next={(next === 'tare' || (next === 'capture' && !overload)) && !world.busy}
              disabled={world.busy}
              aria-label="The button: click for PHOTO, hold 5 seconds for TARE"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                press();
              }}
              onPointerUp={release}
              onPointerCancel={release}
              onKeyDown={(event) => {
                if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
                  event.preventDefault();
                  press();
                }
              }}
              onKeyUp={(event) => {
                if (event.key === ' ' || event.key === 'Enter') release();
              }}
            >
              <Icon name="camera" size={15} />
              {holdLeft !== null ? `${holdLeft} s` : 'Click · hold 5 s'}
            </button>
          </div>

          <p className="sim-hint" data-warn={next === 'capture' && (overload || !tareMatches)}>
            {hint}
          </p>

          <div className="sim-controls">
            <div className="sim-field">
              <span className="label">Plate</span>
              <div className="sim-choice" role="group" aria-label="Plate on the scale" data-next={next === 'plate'}>
                <button type="button" aria-pressed={world.plate === null} onClick={() => setPlate(null)}>
                  None
                </button>
                {(Object.keys(PLATES) as PlateId[]).map((id) => (
                  <button key={id} type="button" aria-pressed={world.plate === id} onClick={() => setPlate(id)}>
                    {PLATES[id].label}
                    <small>{PLATES[id].grams} g</small>
                  </button>
                ))}
              </div>
            </div>

            <label className="sim-field">
              <span className="label">Dish</span>
              <select value={world.dishKey} onChange={(event) => patch({ dishKey: event.target.value })}>
                {FOODS.map((food) => (
                  <option key={food.key} value={food.key}>
                    {food.name_fr} — {food.name_en}
                  </option>
                ))}
              </select>
            </label>

            <label className="sim-field">
              <span className="label">
                Portion <output>{world.portion.toFixed(1)} g</output>
              </span>
              <input
                type="range"
                min={PORTION_MIN}
                max={PORTION_MAX}
                step="1"
                value={world.portion}
                onChange={(event) => patch({ portion: Number(event.target.value) })}
              />
              {dish.typical_portion_g ? (
                <button
                  type="button"
                  className="sim-link"
                  onClick={() => patch({ portion: dish.typical_portion_g ?? world.portion })}
                >
                  Typical serving: {dish.typical_portion_g} g
                </button>
              ) : null}
            </label>

            <button
              type="button"
              className="sim-serve"
              data-next={next === 'food'}
              disabled={!world.plate}
              onClick={toggleFood}
            >
              {world.foodOn ? 'Take the food off' : 'Put the food on the plate'}
            </button>

            <div className="sim-switches">
              <label>
                <input type="checkbox" checked={world.wifi} onChange={(event) => setWifi(event.target.checked)} />
                Wi-Fi reachable
                {world.queue.length > 0 ? <em>{world.queue.length} on microSD</em> : null}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={world.recognisable}
                  onChange={(event) => patch({ recognisable: event.target.checked })}
                />
                Recogniser knows the dish
              </label>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------- phone */}
        <div className="sim-phone">
          <Phone
            db={world.appDb}
            today={today}
            scaleGrams={scaleGrams}
            freshId={world.freshId}
            onManual={manualEntry}
            onDelete={removeMeal}
          />
        </div>
      </div>

      {/* --------------------------------------------------------- pipeline */}
      <div className="sim-pipeline" role="list" aria-label="Pipeline">
        {STAGES.map((item, index) => (
          <div key={item.id} role="listitem" className="sim-stage-card" data-status={world.stages[item.id]}>
            <span className="sim-stage-index">{index + 1}</span>
            <span className="label">{item.who}</span>
            <strong>{item.what}</strong>
            <small>{item.how}</small>
          </div>
        ))}
      </div>

      {/* -------------------------------------------------------- inspector */}
      <div className="sim-inspector">
        <div className="sim-tabs" role="group" aria-label="Inspector">
          <button type="button" aria-pressed={panel === 'log'} onClick={() => setPanel('log')}>
            What happened
          </button>
          <button type="button" aria-pressed={panel === 'wire'} onClick={() => setPanel('wire')}>
            On the wire
          </button>
        </div>

        {panel === 'log' ? (
          <div className="sim-log" role="log" aria-live="polite">
            {world.log.length === 0 ? (
              <p className="sim-log-empty">Nothing yet. Every step you take, and every step the system takes, lands here.</p>
            ) : (
              [...world.log].reverse().map((line) => (
                <p key={line.id} data-tone={line.tone}>
                  <span>{line.who}</span>
                  {line.text}
                </p>
              ))
            )}
          </div>
        ) : (
          <div className="sim-wire">
            <div>
              <span className="label">Node A · samples (g)</span>
              <pre>
                {world.samples.length
                  ? `${world.samples.map((sample) => sample.toFixed(1)).join('  ')}${
                      world.median === null ? '' : `\nmedian  ${world.median.toFixed(1)}`
                    }`
                  : '—'}
              </pre>
            </div>
            <div>
              {/* The firmware is not written; this packet is a stand-in for it. */}
              <span className="label">ESP-NOW · Node A → Node B (illustrative)</span>
              <pre>{world.espnow ?? '—'}</pre>
            </div>
            <div>
              <span className="label">HTTP request</span>
              <pre>{world.request ?? '—'}</pre>
            </div>
            <div>
              <span className="label">HTTP response{world.response ? ` · ${world.response.status}` : ''}</span>
              <pre>
                {world.response
                  ? world.response.body === null
                    ? '(no body)'
                    : JSON.stringify(world.response.body, null, 2)
                  : '—'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
