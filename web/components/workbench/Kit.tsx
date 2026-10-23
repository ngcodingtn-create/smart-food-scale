import { PartArt } from '@/components/request/PartArt';
import { PARTS } from '@/components/request/bom';
import { KIT, type KitStatus } from './kit';
import { KitPhoto } from './KitPhoto';
import './workbench.css';

const STATUS: Record<KitStatus, string> = {
  have: 'You have it',
  buy: 'To buy',
  check: 'Check you have it',
  skip: 'Not needed',
};

const part = (prefix: string) => {
  const found = PARTS.find((item) => item.name.startsWith(prefix));
  if (!found) throw new Error(`No part in bom.ts starts with "${prefix}". Check components/workbench/kit.ts.`);
  return found;
};

/** How many of each status, for the line above the cards. */
export function KitCounts() {
  const count = (status: KitStatus) => KIT.filter((item) => item.status === status).length;
  const photos = KIT.filter((item) => item.photo).length;
  return (
    <p className="kit-counts">
      <span><strong>{count('have')}</strong> in hand</span>
      <span><strong>{count('buy')}</strong> to buy</span>
      <span><strong>{count('check')}</strong> to check</span>
      <span><strong>{photos}</strong> of {KIT.length} photographed</span>
    </p>
  );
}

export function Kit() {
  return (
    <ul className="kit">
      {KIT.map((item) => {
        const info = part(item.bom);
        return (
          <li key={item.id} className="kit-card" data-status={item.status} id={item.id}>
            <div className="kit-pictures">
              <figure className="kit-drawing">
                <PartArt id={info.art} title={info.name} />
                <figcaption>Drawing</figcaption>
              </figure>
              <KitPhoto id={item.id} name={info.name} photo={item.photo} />
            </div>
            <div className="kit-text">
              <p className="kit-head">
                {item.line ? <span className="kit-line">{item.line}</span> : null}
                <strong>{info.name}</strong>
                <em>× {item.qty}</em>
              </p>
              <p className="kit-status">{STATUS[item.status]}</p>
              <p className="kit-role">{info.role}</p>
              <p className="kit-where">{info.where}</p>
              {item.why ? <p className="kit-why">{item.why}</p> : info.note ? <p className="kit-why">{info.note}</p> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
