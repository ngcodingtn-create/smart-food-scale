import { PartArt } from '@/components/request/PartArt';
import { PARTS } from '@/components/request/bom';
import { KIT } from './kit';
import { GIVEN_FR, MISSING, ON_SITE, URGENCY, type Ask } from './missing';
import '../figure.css';
import './workbench.css';

/**
 * The "still missing" sheet for the lab technician, in French. Which parts are
 * missing comes from kit.ts, the words from missing.ts, the drawings from the
 * component request's own art. See missing.ts.
 */

const kitItem = (id: string) => {
  const item = KIT.find((entry) => entry.id === id);
  if (!item) throw new Error(`No part "${id}" in kit.ts.`);
  return item;
};

const bomPart = (prefix: string) => {
  const part = PARTS.find((entry) => entry.name.startsWith(prefix));
  if (!part) throw new Error(`No part in bom.ts starts with "${prefix}".`);
  return part;
};

/** The sheet's number for a part: its place in the list, most urgent first. */
const numberOf = (kit: string) => MISSING.findIndex((ask) => ask.kit === kit) + 1;

/** One line per missing part, for a quick read and for the printed page. */
export function MissingTable() {
  return (
    <div className="table-wrap">
      <table className="missing-table">
        <thead>
          <tr>
            <th>N°</th>
            <th>Pièce</th>
            <th>Quantité</th>
            <th>Urgence</th>
            <th>Ligne</th>
          </tr>
        </thead>
        <tbody>
          {MISSING.map((ask) => {
            const line = kitItem(ask.kit).line;
            return (
              <tr key={ask.kit}>
                <td>{numberOf(ask.kit)}</td>
                <td>
                  <a href={`#${ask.kit}`}>{ask.name}</a>
                </td>
                <td>{ask.qty}</td>
                <td>
                  <span className="missing-urgency" data-urgency={ask.urgency}>
                    {URGENCY[ask.urgency].label}
                  </span>
                </td>
                <td>{line ?? '–'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** A box on the map: solid for a part received, dashed and numbered for one missing. */
function Box({ x, y, w, h, label, missing, small }: { x: number; y: number; w: number; h: number; label: string; missing?: string; small?: boolean }) {
  const n = missing ? numberOf(missing) : 0;
  return (
    <g>
      <rect className={missing ? 'miss' : 'body'} x={x} y={y} width={w} height={h} rx="5" />
      <text className={`t-strong${missing ? ' t-hot' : ''}${small ? ' t-small' : ''}`} x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle">
        {label}
      </text>
      {missing ? (
        <>
          <circle className="num" cx={x} cy={y} r="7.5" />
          <text className="num-t" x={x} y={y + 3.2}>
            {n}
          </text>
        </>
      ) : null}
    </g>
  );
}

/** Where each missing part goes: the two boards, what is already there, and the gaps. */
export function MissingMap() {
  return (
    <figure className="missing-map">
      <svg
        className="fig"
        viewBox="0 0 360 242"
        role="img"
        aria-label="Où va chaque pièce encore manquante : la microSD et les condensateurs de 1000 µF côté caméra, le chargeur sous les deux cartes."
      >
        <rect className="view" x="4" y="4" width="172" height="182" rx="10" />
        <text className="t-small t-strong" x="14" y="18">
          LA BALANCE : PÈSE L’ASSIETTE
        </text>
        <rect className="glow" x="184" y="4" width="172" height="182" rx="10" />
        <text className="t-small t-strong" x="194" y="18">
          LA CAMÉRA : PHOTOGRAPHIE
        </text>

        {/* the scale: load cell, then the amplifier, then the board */}
        <path className="ln-thin" d="M50 58V82M86 95H102" />
        <Box x={14} y={32} w={72} h={26} label="Cellule" />
        <Box x={14} y={82} w={72} h={26} label="HX711" />
        <rect className="pcb" x="102" y="70" width="64" height="48" rx="5" />
        <text className="t-strong" x="134" y="97" textAnchor="middle">
          NodeMCU
        </text>
        <path className="ln-thin" d="M134 118V138" />
        <Box x={102} y={138} w={70} h={22} label="BOUTON" small />

        {/* the camera */}
        <rect className="pcb" x="194" y="70" width="70" height="48" rx="5" />
        <text className="t-strong" x="229" y="97" textAnchor="middle">
          ESP32-CAM
        </text>
        <path className="ln-thin" d="M229 118V138M278 47C268 47 262 56 258 70M278 95H264" />
        <Box x={194} y={138} w={70} h={22} label="6 LED" />
        <Box x={278} y={36} w={68} h={22} label="microSD" missing="microsd" />
        <Box x={278} y={84} w={68} h={22} label="1000 µF" missing="cap-1000u" />

        {/* the radio link between the boards, and the supply under both */}
        <path className="hot-ln dash" d="M166 82H194" />
        <text className="t-small t-hot" x="180" y="64" textAnchor="middle">
          sans fil
        </text>
        <path className="ln-thin" d="M150 210H120V186M210 210H240V186" />
        <Box x={150} y={198} w={60} h={24} label="5 V, 2 A" missing="charger" />
        <text className="t-small" x="180" y="234" textAnchor="middle">
          plein : reçu · pointillé numéroté : manque
        </text>
      </svg>
    </figure>
  );
}

function Picture({ ask }: { ask: Ask }) {
  const { photo } = ask;
  const src = photo.kind === 'own' ? `/workbench/kit/${photo.file}` : `/workbench/missing/${photo.file}`;
  return (
    <figure className="missing-photo">
      <img src={src} alt={photo.caption} loading="lazy" />
      <figcaption>
        <span>{photo.caption}</span>
        {photo.kind === 'web' ? (
          <small>
            Photo :{' '}
            <a href={photo.source} target="_blank" rel="noreferrer noopener">
              {photo.author}
            </a>
            ,{' '}
            <a href={photo.licenceUrl} target="_blank" rel="noreferrer noopener">
              {photo.licence}
            </a>
            , réduite.
          </small>
        ) : (
          <small>Photo : la pièce reçue, sur notre table.</small>
        )}
      </figcaption>
    </figure>
  );
}

/** One card per missing part: number, urgency, drawing, photo, and what to look for. */
export function MissingCards() {
  return (
    <ol className="missing-cards">
      {MISSING.map((ask) => {
        const item = kitItem(ask.kit);
        const part = bomPart(item.bom);
        return (
          <li key={ask.kit} id={ask.kit} className="missing-card" data-urgency={ask.urgency}>
            <div className="missing-head">
              <span className="missing-n">{numberOf(ask.kit)}</span>
              <h3>{ask.name}</h3>
              <span className="missing-qty">× {ask.qty}</span>
            </div>
            <p className="missing-urgency-line">
              <span className="missing-urgency" data-urgency={ask.urgency}>
                {URGENCY[ask.urgency].label}
              </span>{' '}
              {URGENCY[ask.urgency].note}
            </p>
            <div className="missing-pictures">
              <figure className="missing-drawing">
                <PartArt id={part.art} title={`Dessin : ${ask.name}`} />
                <figcaption>Dessin</figcaption>
              </figure>
              <Picture ask={ask} />
            </div>
            <dl className="missing-facts">
              <dt>À quoi ça sert</dt>
              <dd>{ask.role}</dd>
              <dt>Comment la reconnaître</dt>
              <dd>{ask.looks}</dd>
              {ask.instead ? (
                <>
                  <dt>Ce qui convient aussi</dt>
                  <dd>{ask.instead}</dd>
                </>
              ) : null}
              <dt>Formulaire</dt>
              <dd>{item.line ? `Ligne ${item.line} du formulaire du 14 octobre.` : 'Pas sur le formulaire.'}</dd>
            </dl>
          </li>
        );
      })}
    </ol>
  );
}

/** Parts received in place of others, which we have made work: nothing to swap. */
export function NoSwap() {
  return (
    <ul className="missing-list">
      {Object.entries(GIVEN_FR).map(([id, text]) => (
        <li key={id}>{text}</li>
      ))}
    </ul>
  );
}

/** Instruments used in the lab itself. */
export function OnSite() {
  return (
    <ul className="missing-list">
      {ON_SITE.map((tool) => {
        bomPart(tool.bom);
        return (
          <li key={tool.bom}>
            <strong>{tool.name}</strong> : {tool.why}
          </li>
        );
      })}
    </ul>
  );
}

/** How many parts arrived, from kit.ts, for the opening line. */
export function receivedCount() {
  return KIT.filter((item) => item.status === 'have').length;
}
