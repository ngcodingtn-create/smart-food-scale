/**
 * The backend, re-implemented in the browser for the /prototype simulator.
 *
 * This is a mirror, not a design. Everything here follows backend/app/ line by
 * line — the limits in config.py, the checks and their wording in
 * routers/meals.py, the arithmetic in nutrition/base.py, the response shapes
 * in schemas.py — so that what the simulator shows is what the real service
 * returns. If the backend changes, change this to match; never the reverse.
 *
 * One part is NOT a mirror: recognition. The real service ships only a stub
 * that hashes the image bytes. The simulator has no image, so `recognise`
 * below is told what is on the plate and whether to "know" it. It says so in
 * every result it returns.
 */
import table from './food-table.json';

export type Macros = {
  kcal: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
};

export type Food = {
  key: string;
  name_fr: string;
  name_en: string;
  aliases: string[];
  category: string;
  description: string;
  per_100g: Macros;
  typical_portion_g: number | null;
  estimated: boolean;
  confidence: string;
  citation: string;
};

export const FOODS: Food[] = table.foods;
export const TABLE_VERSION = table.version;

const BY_KEY = new Map(FOODS.map((food) => [food.key, food]));
export const findFood = (key: string) => BY_KEY.get(key);

/** backend/app/config.py */
export const LIMITS = {
  min_grams: 0.5,
  max_grams: 5000,
  max_image_bytes: 8 * 1024 * 1024,
} as const;

// --- shapes: backend/app/schemas.py -----------------------------------------

export type RecognitionInfo = {
  identified_by: string;
  confidence: number | null;
  candidates_considered: number;
  detail: string | null;
};

export type NutritionInfo = {
  source: string;
  citation: string;
  estimated: boolean;
  confidence: string;
  per_100g: Macros;
};

export type MealOut = {
  id: number;
  eaten_on: string;
  created_at: string;
  dish_key: string;
  dish_name: string;
  grams: number;
  macros: Macros;
  identified_by: string;
  confidence: number | null;
  nutrition_source: string;
  nutrition_estimated: boolean;
  note: string | null;
};

export type MealCreated = {
  meal: MealOut;
  recognition: RecognitionInfo;
  nutrition: NutritionInfo;
};

export type DailyTotals = {
  date: string;
  meal_count: number;
  totals: Macros;
  contains_estimates: boolean;
};

export type UnknownDishDetail = {
  detail: string;
  recognition: RecognitionInfo;
  known_dishes: string[];
};

export type ApiResponse<T> =
  | { ok: true; status: number; body: T }
  | { ok: false; status: number; body: { detail: string | UnknownDishDetail } };

/** The simulator's whole database: what SQLite holds in the real service. */
export type Db = { meals: MealOut[]; nextId: number };
export const EMPTY_DB: Db = { meals: [], nextId: 1 };

// --- arithmetic: backend/app/nutrition/base.py -------------------------------

// Python's round(x, 2). JavaScript rounds exact halves up where Python rounds
// them to even, so the two can differ in the last digit on an exact tie — which
// needs a product ending in precisely ...5 at the third decimal.
const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** `Macros.scaled`: the line the whole project exists to make honest. */
export function scaled(per100g: Macros, grams: number): Macros {
  const factor = grams / 100;
  return {
    kcal: round2(per100g.kcal * factor),
    protein_g: round2(per100g.protein_g * factor),
    carbohydrate_g: round2(per100g.carbohydrate_g * factor),
    fat_g: round2(per100g.fat_g * factor),
  };
}

// How Python prints a float inside an f-string: 5000.0, not 5000.
const pyFloat = (value: number) => (Number.isInteger(value) ? value.toFixed(1) : String(value));

/** Today's date as the backend sees it: UTC, YYYY-MM-DD. */
export const utcToday = (now: Date = new Date()) => now.toISOString().slice(0, 10);

// --- recognition (simulated — see the note at the top) -----------------------

export type Frame = {
  /** The dish actually on the plate, or null for an empty plate. */
  subject: string | null;
  /** The scenario switch: false makes the recogniser decline. */
  recognisable: boolean;
};

function recognise(frame: Frame): RecognitionInfo & { dish_key: string | null } {
  const base = { identified_by: 'simulated', candidates_considered: FOODS.length };

  if (frame.subject === null) {
    return { ...base, dish_key: null, confidence: null, detail: 'nothing on the plate to identify' };
  }
  if (!frame.recognisable) {
    return {
      ...base,
      dish_key: null,
      confidence: null,
      detail: 'simulated: no confident match among the candidate dishes',
    };
  }
  return {
    ...base,
    dish_key: frame.subject,
    // No number is reported: a made-up confidence would be exactly the false
    // precision this project is built against.
    confidence: null,
    detail: 'simulated: returns the dish that was placed on the plate — not real recognition',
  };
}

// --- endpoints: backend/app/routers/meals.py ---------------------------------

export type MealRequest = {
  grams: number;
  /** Present on a device upload; absent on manual entry from the app. */
  frame?: Frame;
  /** "Skip recognition and use this dish" — the app's manual fallback. */
  dish_key?: string;
};

/** POST /meals */
export function postMeal(db: Db, request: MealRequest, now: Date = new Date()): { db: Db; response: ApiResponse<MealCreated> } {
  const { grams } = request;
  const reject = (detail: string | UnknownDishDetail) =>
    ({ db, response: { ok: false as const, status: 422, body: { detail } } });

  // _validate_grams
  if (grams < LIMITS.min_grams) {
    return reject(
      `grams must be at least ${pyFloat(LIMITS.min_grams)} g — got ${pyFloat(grams)}. ` +
        'A non-positive mass usually means the scale was not tared, or the plate was lifted during the reading.',
    );
  }
  if (grams > LIMITS.max_grams) {
    return reject(
      `grams must be at most ${pyFloat(LIMITS.max_grams)} g — got ${pyFloat(grams)}. ` +
        'This is past the range of a 3 kg cell and reads as a sensor fault rather than a real plate of food.',
    );
  }

  // Identify
  const result = request.dish_key
    ? {
        dish_key: request.dish_key,
        identified_by: 'manual',
        confidence: 1,
        candidates_considered: FOODS.length,
        detail: 'dish supplied by the client',
      }
    : recognise(request.frame ?? { subject: null, recognisable: false });

  const { dish_key, ...recognition } = result;
  const known_dishes = FOODS.map((food) => food.key);

  if (dish_key === null) {
    // Unknown is a legitimate outcome, not a server error.
    return reject({ detail: 'Dish could not be identified.', recognition, known_dishes });
  }

  // Look up nutrients
  const record = findFood(dish_key);
  if (!record) {
    return reject({
      detail: `No nutrient data for dish '${dish_key}'. Add it to backend/data/tunisian_foods.json, or enable USDA.`,
      recognition,
      known_dishes,
    });
  }

  // Scale by the MEASURED mass, then persist
  const meal: MealOut = {
    id: db.nextId,
    eaten_on: utcToday(now),
    created_at: now.toISOString(),
    dish_key: record.key,
    dish_name: record.name_fr,
    grams,
    macros: scaled(record.per_100g, grams),
    identified_by: recognition.identified_by,
    confidence: recognition.confidence,
    nutrition_source: 'local',
    nutrition_estimated: record.estimated,
    note: null,
  };

  return {
    db: { meals: [...db.meals, meal], nextId: db.nextId + 1 },
    response: {
      ok: true,
      status: 201,
      body: {
        meal,
        recognition,
        nutrition: {
          source: 'local',
          citation: record.citation,
          estimated: record.estimated,
          confidence: record.confidence,
          per_100g: record.per_100g,
        },
      },
    },
  };
}

/** GET /meals?date= — newest first, as the backend orders them. */
export function listMeals(db: Db, date?: string): MealOut[] {
  return db.meals
    .filter((meal) => !date || meal.eaten_on === date)
    .sort((a, b) => b.eaten_on.localeCompare(a.eaten_on) || b.created_at.localeCompare(a.created_at) || b.id - a.id);
}

/** GET /meals/totals?date= */
export function dailyTotals(db: Db, date: string): DailyTotals {
  const meals = db.meals.filter((meal) => meal.eaten_on === date);
  const sum = (pick: (macros: Macros) => number) => round2(meals.reduce((total, meal) => total + pick(meal.macros), 0));
  return {
    date,
    meal_count: meals.length,
    totals: {
      kcal: sum((m) => m.kcal),
      protein_g: sum((m) => m.protein_g),
      carbohydrate_g: sum((m) => m.carbohydrate_g),
      fat_g: sum((m) => m.fat_g),
    },
    contains_estimates: meals.some((meal) => meal.nutrition_estimated),
  };
}

/** DELETE /meals/{id} */
export function deleteMeal(db: Db, id: number): { db: Db; response: ApiResponse<null> } {
  if (!db.meals.some((meal) => meal.id === id)) {
    return { db, response: { ok: false, status: 404, body: { detail: `No meal ${id}.` } } };
  }
  return {
    db: { ...db, meals: db.meals.filter((meal) => meal.id !== id) },
    response: { ok: true, status: 204, body: null },
  };
}
