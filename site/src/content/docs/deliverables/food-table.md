---
title: Tunisian food table
description: 18 dishes that exist in no other food database, with every figure sourced and every estimate flagged.
sidebar:
  order: 2
---

:::tip[Why this is the interesting part]
Couscous, lablabi, brik, ojja and mloukhia are **not in USDA FoodData Central, not in
Nutritionix, and not in any commercial food-recognition API's label set.** A
recogniser trained on Western meals cannot name them, and a nutrient database built
on Western meals cannot cost them.

Without this table the device cannot log a Tunisian meal at all.
:::

## What's in it

18 dishes, in `backend/data/tunisian_foods.json`. Each carries kcal, protein,
carbohydrate and fat **per 100 g**, a typical portion, a citation, a confidence
rating, and a flag saying whether the figure was estimated.

| Dish | kcal | Protein | Carbs | Fat | Confidence |
| --- | ---: | ---: | ---: | ---: | --- |
| Couscous tunisien à l'agneau | 167 | 7.5 | 14.7 | 8.6 | medium |
| Couscous au poisson | 155 | 8.5 | 15.5 | 6.5 | medium |
| Lablabi | 186 | 6.6 | 23.8 | 7.3 | medium |
| Brik à l'œuf | 290 | 12.0 | 17.0 | 19.0 | low |
| Ojja aux merguez | 162 | 7.2 | 2.7 | 13.7 | medium |
| Mloukhia | 177 | 9.5 | 4.5 | 13.5 | low |
| Chorba frik | 69 | 3.8 | 8.5 | 2.2 | medium |
| Salade mechouia | 120 | 4.5 | 6.0 | 8.8 | medium |
| Slata tounsia | 95 | 4.0 | 5.0 | 6.5 | medium |
| Tajine tunisien | 196 | 15.5 | 4.0 | 13.0 | medium |
| Kafteji | 168 | 4.2 | 12.0 | 11.5 | low |
| Marqa jelbana | 128 | 7.0 | 9.5 | 6.8 | medium |
| Kamounia | 158 | 14.0 | 3.5 | 9.8 | medium |
| Fricassé | 315 | 10.5 | 28.0 | 18.0 | low |
| Harissa | 205 | 3.5 | 12.0 | 16.0 | medium |
| Makroudh | 385 | 4.5 | 58.0 | 15.0 | medium |
| Bambalouni | 333 | 5.5 | 44.0 | 15.0 | low |
| Assidat zgougou | 240 | 5.0 | 28.0 | 12.0 | low |

*All values per 100 g as served.*

## How the numbers were produced

:::caution[These are estimates, and they say so]
**Every row is an estimate computed by us, not a laboratory measurement and not a
database extract.** No published composition table exists for these dishes. Treat them
as good-faith working numbers for a prototype, and say that in the report.
:::

The method, per dish:

1. Write the recipe as **mass fractions of its cooked components**.
2. Take per-100 g values for each component from generic ingredient references —
   cooked chickpeas, cooked semolina, lamb stewing meat, olive oil, hen egg.
3. Combine by mass fraction to get the plated dish per 100 g.
4. **Check the result against the Atwater factors** — 4 kcal/g protein, 4 kcal/g
   carbohydrate, 9 kcal/g fat.

Worked example, couscous à l'agneau: 55 % cooked semolina, 20 % lamb, 20 % vegetables
in sauce, 5 % olive oil → 167 kcal / 7.5 P / 14.7 C / 8.6 F per 100 g.

## Where it's weakest

We rate three dishes **low confidence** for reasons worth knowing:

- **Fried dishes** (brik, fricassé, kafteji, bambalouni) — absorbed frying oil
  dominates the fat figure and was assumed, not measured. Oil temperature and frying
  time move it substantially.
- **Mloukhia** — the olive oil fraction is unusually high and varies enormously by
  household.
- **Assidat zgougou** — no per-100 g reference for Aleppo pine seed
  (*Pinus halepensis*) was found, so its contribution was approximated from other
  pine nuts.

Also unmeasured across the board: **moisture content**. Stew water content drives the
per-100 g figure directly and varies by cook.

## The gate that stops invented numbers

Seven automated tests run against this file. They can't check a figure is *right* —
nothing can, without a lab — but they check every row is internally honest:

| Test | What it catches |
| --- | --- |
| Atwater consistency (±8 %) | A row whose stated energy disagrees with its own macros |
| Citation present | A row someone added without saying where it came from |
| Estimates flagged | A derived figure presented as if measured |
| Macros ≤ 100 g per 100 g | A physically impossible row |
| Required dishes present | Silent loss of the five the brief calls out |
| Unique keys | Duplicate entries diverging over time |
| Caveat in the header | The warning being stripped when the file is copied |

The Atwater check is the load-bearing one. **Inventing four mutually consistent
numbers is much harder than inventing one**, so a fabricated row usually fails it.

## Improving a row

Replace the figures with a measured or published value, set `source.kind` to
`literature` or `measured`, cite it, and set `estimated` to `false`. The tests
enforce that an improved row can't silently break the table.

Adding a dish here **automatically extends what the recogniser can identify** — the
candidate list is generated from this file. No retraining, no vendor ticket.
