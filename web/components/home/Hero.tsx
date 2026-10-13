import Link from 'next/link';
import { Icon } from '@/components/icons';

/**
 * The worked example under the headline. The numbers are real, not decoration:
 *
 *   143.2 g   the reading used throughout these docs — the architecture
 *             diagram, the OLED in the 3D rig.
 *   per 100 g the `couscous_tunisien_agneau` row of
 *             backend/data/tunisian_foods.json. That file flags the row as an
 *             estimate, so the figure does too.
 *
 * The result is computed here, the way the backend computes it, rather than
 * typed in — change an input and the output follows.
 */
const GRAMS = 143.2;
const CELL_CAPACITY_GRAMS = 3000;
const DISH = {
  name: 'Tunisian lamb couscous',
  per100g: { kcal: 167, protein: 7.5, carbohydrate: 14.7, fat: 8.6 },
};

const scaled = (per100g: number) => (per100g * GRAMS) / 100;

export function Hero() {
  return (
    <header className="hero">
      <p className="label">Smart Food Scale · University IoT project</p>

      <h1 className="hero-title">
        The camera answers <em className="what">what</em> the food is. The load cell answers{' '}
        <em className="how-much">how&nbsp;much</em> of it there is.
      </h1>

      <p className="hero-lead">
        An IoT kitchen scale that weighs a meal and returns its calories and macros. Photo-only
        apps have to guess the portion. This one measures it.
      </p>

      <div className="hero-actions">
        <Link href="/deliverables" className="btn btn-primary">
          See the deliverables
          <Icon name="arrow-right" size={16} />
        </Link>
        <Link href="/project/component-request" className="btn btn-secondary">
          Component request
        </Link>
        <Link href="/prototype" className="btn btn-quiet">
          Try the simulated prototype
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>

      <figure className="equation">
        <div className="equation-row">
          <div className="eq-cell eq-measure">
            <span className="eq-label label">How much · load cell</span>
            <span className="eq-value">
              {GRAMS.toFixed(1)}
              <small>g</small>
            </span>
            <div className="eq-ruler" aria-hidden="true">
              <i style={{ left: `${(GRAMS / CELL_CAPACITY_GRAMS) * 100}%` }} />
            </div>
            <div className="eq-ruler-ends" aria-hidden="true">
              <span>0</span>
              <span>3 kg cell</span>
            </div>
            <span className="eq-note">Node A tares, then takes a median-filtered weight.</span>
          </div>

          <div className="eq-op" aria-hidden="true">
            <span>×</span>
          </div>

          <div className="eq-cell eq-identity">
            <span className="eq-label label">What · camera</span>
            <span className="eq-value">
              {DISH.per100g.kcal}
              <small>kcal / 100 g</small>
            </span>
            <span className="eq-name">{DISH.name}</span>
            <span className="eq-note">
              <span className="eq-tag">Estimate</span>
              from our own food table.
            </span>
          </div>

          <div className="eq-op" aria-hidden="true">
            <span>=</span>
          </div>

          <div className="eq-cell eq-result">
            <span className="eq-label label">Logged meal</span>
            <span className="eq-value">
              {Math.round(scaled(DISH.per100g.kcal))}
              <small>kcal</small>
            </span>
            <dl className="eq-macros">
              <div>
                <dt>Protein</dt>
                <dd>{scaled(DISH.per100g.protein).toFixed(1)} g</dd>
              </div>
              <div>
                <dt>Carbohydrate</dt>
                <dd>{scaled(DISH.per100g.carbohydrate).toFixed(1)} g</dd>
              </div>
              <div>
                <dt>Fat</dt>
                <dd>{scaled(DISH.per100g.fat).toFixed(1)} g</dd>
              </div>
            </dl>
          </div>
        </div>

        <figcaption>
          A worked example of the backend&apos;s arithmetic: nutrients per 100 g, multiplied by the
          measured mass. The portion is never estimated from the photo. Per-100 g figures for
          Tunisian dishes are recipe-derived estimates, not lab measurements.
        </figcaption>
      </figure>
    </header>
  );
}
