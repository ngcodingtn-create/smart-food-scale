'use client';

import { useMemo, useState } from 'react';
import { Icon, type IconName } from '@/components/icons';
import {
  FOODS,
  TABLE_VERSION,
  dailyTotals,
  findFood,
  listMeals,
  type ApiResponse,
  type Db,
  type Macros,
  type MealCreated,
  type MealOut,
} from '@/lib/sim/backend';

/**
 * The phone app, simulated. Its four screens are the four the project plans
 * (see /deliverables/app) and it talks to the backend only the way the real
 * app will: it reads meals and totals, posts a manual entry, deletes a meal.
 * It is given no shortcut the real app would not have.
 */
type Tab = 'today' | 'history' | 'add' | 'settings';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'list' },
  { id: 'history', label: 'History', icon: 'clock' },
  { id: 'add', label: 'Add', icon: 'plus' },
  { id: 'settings', label: 'Settings', icon: 'sliders' },
];

const kcal = (value: number) => Math.round(value).toLocaleString('en-GB');
const grams = (value: number) => value.toFixed(1);

function dayLabel(date: string, today: string | null) {
  if (date === today) return 'Today';
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** Energy share of each macro, by the 4/4/9 Atwater factors the backend also uses. */
function MacroSplit({ macros }: { macros: Macros }) {
  const parts = [
    { id: 'protein', label: 'Protein', grams: macros.protein_g, energy: macros.protein_g * 4 },
    { id: 'carbs', label: 'Carbs', grams: macros.carbohydrate_g, energy: macros.carbohydrate_g * 4 },
    { id: 'fat', label: 'Fat', grams: macros.fat_g, energy: macros.fat_g * 9 },
  ];
  const total = parts.reduce((sum, part) => sum + part.energy, 0);

  return (
    <div className="app-macros">
      <div className="app-macro-bar" aria-hidden="true">
        {total > 0 ? (
          parts.map((part) => (
            <span key={part.id} data-macro={part.id} style={{ flexGrow: part.energy }} />
          ))
        ) : (
          <span data-macro="none" style={{ flexGrow: 1 }} />
        )}
      </div>
      <dl className="app-macro-legend">
        {parts.map((part) => (
          <div key={part.id} data-macro={part.id}>
            <dt>{part.label}</dt>
            <dd>{grams(part.grams)} g</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Today({
  meals,
  db,
  today,
  freshId,
  onOpen,
}: {
  meals: MealOut[];
  db: Db;
  today: string;
  freshId: number | null;
  onOpen: (id: number) => void;
}) {
  const totals = dailyTotals(db, today);

  return (
    <>
      <header className="app-head">
        <p className="app-kicker">{dayLabel(today, null)}</p>
        <p className="app-title" role="heading" aria-level={3}>
          Today
        </p>
      </header>

      <section className="app-card" aria-label="Today's totals">
        <p className="app-kcal">
          <strong>{kcal(totals.totals.kcal)}</strong> kcal
        </p>
        {/* DailyTotals.contains_estimates — the one UI rule the project has
            already fixed: an estimate must never look like a measurement. */}
        {totals.contains_estimates ? (
          <p className="app-qualifier">≈ includes estimated nutrient values</p>
        ) : null}
        <MacroSplit macros={totals.totals} />
      </section>

      <p className="app-section">Meals · {meals.length}</p>
      {meals.length === 0 ? (
        <p className="app-empty">
          Nothing logged yet. Weigh a plate on the scale, or add a meal by hand.
        </p>
      ) : (
        <div className="app-list">
          {meals.map((meal) => (
            <button
              key={meal.id}
              type="button"
              className="app-meal"
              data-fresh={meal.id === freshId}
              onClick={() => onOpen(meal.id)}
            >
              <span className="app-meal-name">{meal.dish_name}</span>
              <span className="app-meal-kcal">{kcal(meal.macros.kcal)} kcal</span>
              <span className="app-meal-meta">
                {grams(meal.grams)} g
                {meal.nutrition_estimated ? ' · estimate' : ''}
                {meal.identified_by === 'manual' ? ' · entered by hand' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function MealDetail({
  meal,
  onBack,
  onDelete,
}: {
  meal: MealOut;
  onBack: () => void;
  onDelete: () => void;
}) {
  const food = findFood(meal.dish_key);
  const rows: { label: string; portion: number; per100: number | undefined; unit: string }[] = [
    { label: 'Energy', portion: meal.macros.kcal, per100: food?.per_100g.kcal, unit: 'kcal' },
    { label: 'Protein', portion: meal.macros.protein_g, per100: food?.per_100g.protein_g, unit: 'g' },
    { label: 'Carbs', portion: meal.macros.carbohydrate_g, per100: food?.per_100g.carbohydrate_g, unit: 'g' },
    { label: 'Fat', portion: meal.macros.fat_g, per100: food?.per_100g.fat_g, unit: 'g' },
  ];

  return (
    <>
      <header className="app-head">
        <button type="button" className="app-back" onClick={onBack}>
          <Icon name="chevron-left" size={16} />
          Today
        </button>
        <p className="app-title" role="heading" aria-level={3}>
          {meal.dish_name}
        </p>
        {food ? <p className="app-kicker">{food.name_en}</p> : null}
      </header>

      <section className="app-card">
        <p className="app-kcal">
          <strong>{grams(meal.grams)}</strong> g
        </p>
        <p className="app-qualifier" data-tone="measure">
          {meal.identified_by === 'manual'
            ? 'mass typed in by hand'
            : 'measured by the load cell — never estimated from the photo'}
        </p>
      </section>

      <div className="app-table" role="table" aria-label="Nutrients">
        <div role="row" className="app-table-head">
          <span role="columnheader" />
          <span role="columnheader">This portion</span>
          <span role="columnheader">Per 100 g</span>
        </div>
        {rows.map((row) => (
          <div role="row" key={row.label}>
            <span role="rowheader">{row.label}</span>
            <span role="cell">
              {row.unit === 'kcal' ? kcal(row.portion) : grams(row.portion)} {row.unit}
            </span>
            <span role="cell">{row.per100 === undefined ? '—' : `${row.per100} ${row.unit}`}</span>
          </div>
        ))}
      </div>

      {meal.nutrition_estimated ? (
        <section className="app-note">
          <p className="app-note-title">Estimate, not a measurement</p>
          <p>
            The per-100 g values come from a recipe breakdown, not a laboratory. Confidence:{' '}
            {food?.confidence ?? 'medium'}.
          </p>
          {food ? <p className="app-citation">{food.citation}</p> : null}
        </section>
      ) : null}

      <p className="app-fineprint">
        Dish identified by:{' '}
        {meal.identified_by === 'manual' ? 'you (manual entry)' : `${meal.identified_by} recogniser`}
      </p>

      <button type="button" className="app-danger" onClick={onDelete}>
        <Icon name="trash" size={15} />
        Delete this meal
      </button>
    </>
  );
}

function History({ db, today }: { db: Db; today: string }) {
  const days = useMemo(() => {
    const dates = [...new Set(db.meals.map((meal) => meal.eaten_on))].sort().reverse();
    return dates.map((date) => dailyTotals(db, date));
  }, [db]);

  return (
    <>
      <header className="app-head">
        <p className="app-title" role="heading" aria-level={3}>
          History
        </p>
      </header>
      {days.length === 0 ? (
        <p className="app-empty">No days recorded yet.</p>
      ) : (
        <div className="app-list">
          {days.map((day) => (
            <div key={day.date} className="app-meal" data-static="true">
              <span className="app-meal-name">{dayLabel(day.date, today)}</span>
              <span className="app-meal-kcal">{kcal(day.totals.kcal)} kcal</span>
              <span className="app-meal-meta">
                {day.meal_count} {day.meal_count === 1 ? 'meal' : 'meals'}
                {day.contains_estimates ? ' · includes estimates' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="app-fineprint">
        Earlier days appear here once they exist. The simulation starts with an empty database,
        exactly as a freshly started backend does.
      </p>
    </>
  );
}

function ManualEntry({
  scaleGrams,
  onSubmit,
  onDone,
}: {
  scaleGrams: number | null;
  onSubmit: (dishKey: string, grams: number) => ApiResponse<MealCreated>;
  onDone: () => void;
}) {
  const [query, setQuery] = useState('');
  const [dishKey, setDishKey] = useState<string | null>(null);
  const [mass, setMass] = useState('');
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return FOODS;
    return FOODS.filter((food) =>
      [food.name_fr, food.name_en, food.key, ...food.aliases].some((text) =>
        text.toLowerCase().includes(needle),
      ),
    );
  }, [query]);

  function submit() {
    if (!dishKey) return;
    const value = Number(mass);
    if (mass.trim() === '' || Number.isNaN(value)) {
      setError('Enter the mass in grams, as shown on the scale.');
      return;
    }
    const response = onSubmit(dishKey, value);
    if (response.ok) {
      onDone();
      return;
    }
    // Show the backend's own words: they name the likely cause.
    const { detail } = response.body;
    setError(typeof detail === 'string' ? detail : detail.detail);
  }

  return (
    <>
      <header className="app-head">
        <p className="app-title" role="heading" aria-level={3}>
          Add a meal
        </p>
        <p className="app-kicker">For when the recogniser doesn&apos;t know the dish</p>
      </header>

      <label className="app-field">
        <span>Dish</span>
        <span className="app-search">
          <Icon name="search" size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="couscous, brik, lablabi…"
          />
        </span>
      </label>

      <div className="app-picker" role="listbox" aria-label="Dishes">
        {matches.length === 0 ? (
          <p className="app-empty">No dish in the table matches.</p>
        ) : (
          matches.map((food) => (
            <button
              key={food.key}
              type="button"
              role="option"
              aria-selected={dishKey === food.key}
              className="app-option"
              onClick={() => {
                setDishKey(food.key);
                setError(null);
              }}
            >
              <span>{food.name_fr}</span>
              <small>
                {food.name_en} · {food.per_100g.kcal} kcal / 100 g
              </small>
            </button>
          ))
        )}
      </div>

      <label className="app-field">
        <span>Mass (g)</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={mass}
          onChange={(event) => {
            setMass(event.target.value);
            setError(null);
          }}
          placeholder="read it off the scale"
        />
      </label>
      {scaleGrams !== null ? (
        <button type="button" className="app-link" onClick={() => setMass(scaleGrams.toFixed(1))}>
          Copy the scale&apos;s display ({scaleGrams.toFixed(1)} g)
        </button>
      ) : null}

      {error ? (
        <p className="app-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="button" className="app-primary" disabled={!dishKey} onClick={submit}>
        Log this meal
      </button>
    </>
  );
}

function Settings() {
  return (
    <>
      <header className="app-head">
        <p className="app-title" role="heading" aria-level={3}>
          Settings
        </p>
      </header>
      <label className="app-field">
        <span>Backend URL</span>
        <input type="text" value="simulated — runs in this browser" readOnly />
      </label>
      <p className="app-fineprint">
        In the real app this is the laptop&apos;s address on the phone hotspot, and it can be changed
        here without rebuilding: the address moves every time the hotspot restarts.
      </p>
      <div className="app-table" role="table" aria-label="About">
        <div role="row">
          <span role="rowheader">Recogniser</span>
          <span role="cell">simulated</span>
        </div>
        <div role="row">
          <span role="rowheader">Food table</span>
          <span role="cell">
            v{TABLE_VERSION} · {FOODS.length} dishes
          </span>
        </div>
      </div>
    </>
  );
}

export function Phone({
  db,
  today,
  scaleGrams,
  freshId,
  onManual,
  onDelete,
}: {
  /** What the app last fetched — a snapshot, not the backend's live state. */
  db: Db;
  /** The UTC date the backend files meals under; null until mounted. */
  today: string | null;
  /** The number on the scale's display right now, when it is a real reading. */
  scaleGrams: number | null;
  /** The meal that has just arrived, so it can draw the eye. */
  freshId: number | null;
  onManual: (dishKey: string, grams: number) => ApiResponse<MealCreated>;
  onDelete: (id: number) => void;
}) {
  const [tab, setTab] = useState<Tab>('today');
  const [openId, setOpenId] = useState<number | null>(null);

  const meals = useMemo(() => (today ? listMeals(db, today) : []), [db, today]);
  const open = openId === null ? null : (db.meals.find((meal) => meal.id === openId) ?? null);

  return (
    <div className="phone" role="group" aria-label="Simulated phone app">
      <div className="phone-speaker" aria-hidden="true" />
      <div className="phone-screen">
        {!today ? null : open ? (
          <MealDetail
            meal={open}
            onBack={() => setOpenId(null)}
            onDelete={() => {
              onDelete(open.id);
              setOpenId(null);
            }}
          />
        ) : tab === 'today' ? (
          <Today meals={meals} db={db} today={today} freshId={freshId} onOpen={setOpenId} />
        ) : tab === 'history' ? (
          <History db={db} today={today} />
        ) : tab === 'add' ? (
          <ManualEntry scaleGrams={scaleGrams} onSubmit={onManual} onDone={() => setTab('today')} />
        ) : (
          <Settings />
        )}
      </div>
      <nav className="phone-tabs" aria-label="App sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={tab === item.id && !open ? 'page' : undefined}
            onClick={() => {
              setTab(item.id);
              setOpenId(null);
            }}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
