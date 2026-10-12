/** Copy the food table out of the backend, for the /prototype simulator.
 *
 *   npm run sync:foods            rewrite lib/sim/food-table.json
 *   npm run sync:foods -- --check exit 1 if that file is stale (for CI)
 *
 * The backend owns the data: backend/data/tunisian_foods.json is the only place
 * a nutrient figure may be edited. The site is deployed from web/ alone, so it
 * cannot import that file at build time — hence a committed copy, and this
 * script to keep the copy honest.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, '../../backend/data/tunisian_foods.json');
const target = path.resolve(here, '../lib/sim/food-table.json');

const raw = JSON.parse(await readFile(source, 'utf8'));

const table = {
  _generated: 'By web/scripts/sync-food-table.mjs from backend/data/tunisian_foods.json. Do not edit.',
  version: raw._meta.version,
  compiled: raw._meta.compiled,
  foods: raw.foods.map((food) => ({
    key: food.key,
    name_fr: food.name_fr,
    name_en: food.name_en,
    aliases: food.aliases ?? [],
    category: food.category,
    description: food.description ?? '',
    per_100g: food.per_100g,
    typical_portion_g: food.typical_portion_g ?? null,
    estimated: food.estimated,
    confidence: food.confidence ?? 'medium',
    citation: food.source.citation,
  })),
};

const next = `${JSON.stringify(table, null, 2)}\n`;

if (process.argv.includes('--check')) {
  // Git may check the file out with CRLF on Windows; that is not staleness.
  const current = (await readFile(target, 'utf8').catch(() => '')).replaceAll('\r\n', '\n');
  if (current !== next) {
    console.error('lib/sim/food-table.json is out of date. Run: npm run sync:foods');
    process.exit(1);
  }
  console.log(`food table in sync: ${table.foods.length} dishes, v${table.version}`);
} else {
  await writeFile(target, next);
  console.log(`wrote ${path.relative(process.cwd(), target)}: ${table.foods.length} dishes, v${table.version}`);
}
