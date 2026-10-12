import { PartArt } from './PartArt';
import { PARTS, buyTotal, formatTnd, type Part, type Source } from './bom';
import './request.css';

/**
 * The component request's building blocks. Each reads ./bom.ts, so an MDX page
 * only says which slice of the list goes where.
 */

function qtyLabel(part: Part) {
  return part.unit ?? `× ${part.qty}`;
}

function PriceLine({ part }: { part: Part }) {
  if (part.price) {
    const total = part.qty * part.price.tnd;
    return (
      <p className="part-price">
        <strong>{formatTnd(total)}</strong>
        {part.qty > 1 ? <span> ({formatTnd(part.price.tnd)} each)</span> : null} at{' '}
        <a href={part.price.href} target="_blank" rel="noreferrer noopener">
          {part.price.shop}
        </a>
        {part.price.seen === 'listing' ? (
          <>
            {' '}
            <span className="part-seen">· listing price</span>
          </>
        ) : null}
      </p>
    );
  }
  if (part.fallback) {
    return (
      <p className="part-price">
        If the lab has none: {formatTnd(part.fallback.tnd)} at{' '}
        <a href={part.fallback.href} target="_blank" rel="noreferrer noopener">
          {part.fallback.shop}
        </a>
      </p>
    );
  }
  return null;
}

export function PartList({ source }: { source: Source }) {
  const parts = PARTS.filter((part) => part.source === source);
  return (
    <ul className="part-list" data-source={source}>
      {parts.map((part) => (
        <li className="part-card" key={`${part.art}-${part.name}`}>
          <div className="part-figure">
            <PartArt id={part.art} title={part.name} />
          </div>
          <div className="part-text">
            <p className="part-meta">
              <span>{part.where}</span>
              <span className="part-qty">{qtyLabel(part)}</span>
            </p>
            <h3 className="part-name">{part.name}</h3>
            <p className="part-role">{part.role}</p>
            {part.note ? <p className="part-note">{part.note}</p> : null}
            {part.changed ? <p className="part-changed">{part.changed}</p> : null}
            <PriceLine part={part} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The headline figures: what we ask to borrow, and what has to be bought. */
export function RequestSummary() {
  const lab = PARTS.filter((part) => part.source === 'lab');
  const buy = PARTS.filter((part) => part.source === 'buy');
  const devkit = PARTS.find((part) => part.art === 'devkit')?.fallback?.tnd ?? 0;
  return (
    <div className="request-summary">
      <section>
        <h3>Borrow from the lab</h3>
        <p className="request-figure">{lab.length} lines</p>
        <p>Parts every teaching lab keeps in drawers.</p>
      </section>
      <section>
        <h3>Buy</h3>
        <p className="request-figure">{formatTnd(buyTotal())}</p>
        <p>
          {buy.length} lines. {formatTnd(buyTotal() + devkit)} if the lab has no spare ESP32 DevKit.
        </p>
      </section>
      <section>
        <h3>Book</h3>
        <p className="request-figure">{PARTS.filter((part) => part.source === 'bench').length} lines</p>
        <p>Bench instruments, FabLab time, masses from the physics lab.</p>
      </section>
    </div>
  );
}

const SOURCE_LABEL: Record<Source, string> = {
  buy: 'Buy',
  lab: 'Borrow',
  bench: 'Book',
  alt: 'Alternative',
};

/** One row per line of the request, in the order a technician fills a tray. */
export function RequestTable() {
  const rows = PARTS.filter((part) => part.source !== 'alt');
  return (
    <div className="table-wrap">
      <table className="request-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Qty</th>
            <th>For</th>
            <th>Source</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((part, index) => (
            <tr key={`${part.art}-${part.name}`}>
              <td>{index + 1}</td>
              <td>{part.name}</td>
              <td>{part.unit ?? part.qty}</td>
              <td>{part.where}</td>
              <td>{SOURCE_LABEL[part.source]}</td>
              <td>{part.price ? formatTnd(part.qty * part.price.tnd) : '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5}>Total to buy</td>
            <td>{formatTnd(buyTotal())}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
