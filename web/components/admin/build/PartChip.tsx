import Link from 'next/link';
import { PARTS } from '@/components/request/bom';
import { KIT } from '@/components/workbench/kit';

/** A part, inline: the owner's own photo when there is one, and its name. */
export function PartChip({ id }: { id: string }) {
  const item = KIT.find((entry) => entry.id === id);
  if (!item) throw new Error(`No part "${id}" in kit.ts. Check components/admin/roadmap.ts.`);
  const part = PARTS.find((entry) => entry.name.startsWith(item.bom));
  const name = item.given ?? part?.name ?? id;
  return (
    <Link href={`/admin/parts#${item.id}`} className="part-chip" title={name}>
      {item.photo ? (
        <img src={`/workbench/kit/${item.photo}`} alt="" loading="lazy" />
      ) : (
        <span className="part-chip-blank" aria-hidden="true" />
      )}
      <span>{name}</span>
    </Link>
  );
}

/** A part as a card: the photo large enough to recognise on the desk. */
export function PartCard({ id }: { id: string }) {
  const item = KIT.find((entry) => entry.id === id);
  if (!item) throw new Error(`No part "${id}" in kit.ts. Check components/admin/roadmap.ts.`);
  const part = PARTS.find((entry) => entry.name.startsWith(item.bom));
  const name = item.given ?? part?.name ?? id;
  return (
    <Link href={`/admin/parts#${item.id}`} className="part-card">
      {item.photo ? (
        <img src={`/workbench/kit/${item.photo}`} alt="" loading="lazy" />
      ) : (
        <span className="part-card-blank" aria-hidden="true" />
      )}
      <span>{name}</span>
    </Link>
  );
}

export function PartCards({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <div className="part-cards">
      {ids.map((id) => (
        <PartCard key={id} id={id} />
      ))}
    </div>
  );
}

export function PartGroups({ groups }: { groups: { title: string; ids: string[] }[] }) {
  return (
    <div className="part-groups">
      {groups.map((group, index) => (
        <div key={group.title} className="part-group">
          <h3>
            <span className="part-group-number">{index + 1}</span>
            {group.title}
            <span className="part-group-count">{group.ids.length}</span>
          </h3>
          <PartCards ids={group.ids} />
        </div>
      ))}
    </div>
  );
}

export function PartChips({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <div className="part-chips">
      {ids.map((id) => (
        <PartChip key={id} id={id} />
      ))}
    </div>
  );
}
