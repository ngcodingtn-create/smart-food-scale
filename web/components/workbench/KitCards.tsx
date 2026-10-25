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
  swap: 'Wrong part: swap it',
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
  const swaps = KIT.filter((item) => item.status === 'swap').length;
  return (
    <p className="kit-counts">
      <span><strong>{count('have')}</strong> in hand</span>
      <span><strong>{count('buy')}</strong> to buy</span>
      <span><strong>{count('check')}</strong> to check</span>
      {swaps ? <span><strong>{swaps}</strong> wrong part</span> : null}
      <span><strong>{photos}</strong> of {KIT.length} photographed</span>
    </p>
  );
}

/** Every part, or only those with one status (the admin page's filter). */
export function Kit({ status }: { status?: KitStatus } = {}) {
  const items = status ? KIT.filter((item) => item.status === status) : KIT;
  return (
    <ul className="kit">
      {items.map((item) => {
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
                <strong>{item.given ?? info.name}</strong>
                <em>× {item.qty}</em>
              </p>
              <p className="kit-status">{STATUS[item.status]}</p>
              {item.given ? <p className="kit-role">In place of the {info.name} on the form.</p> : null}
              <p className="kit-role">{info.role}</p>
              <p className="kit-where">{info.where}</p>
              {item.why ? <p className="kit-why">{item.why}</p> : info.note ? <p className="kit-why">{info.note}</p> : null}
              {item.extra ? (
                <p className="kit-extra">
                  {item.extra.map((file) => (
                    <a key={file} href={`/workbench/kit/${file}`} target="_blank" rel="noreferrer noopener">
                      <img src={`/workbench/kit/${file}`} alt={file.replace('.jpg', '').replace('-', ' ')} loading="lazy" />
                    </a>
                  ))}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
