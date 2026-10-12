import type { ReactNode } from 'react';
import { ART_BENCH } from './art/bench';
import { ART_BOARDS } from './art/boards';
import { ART_PARTS } from './art/parts';
import { ART_REFERENCE } from './art/reference';
import './request.css';

/**
 * A line drawing of one part, keyed by id. Drawings live in ./art/*.tsx as the
 * inner content of a 120 × 90 SVG; this wrapper supplies the element, the
 * accessible name, and a plain placeholder for an id nobody has drawn yet.
 */
const ART: Record<string, ReactNode> = {
  ...ART_REFERENCE,
  ...ART_BOARDS,
  ...ART_PARTS,
  ...ART_BENCH,
};

export const ART_IDS = Object.keys(ART);

export function PartArt({ id, title }: { id: string; title: string }) {
  return (
    <svg className="part-art" viewBox="0 0 120 90" role="img" aria-label={title}>
      {ART[id] ?? (
        <>
          <rect className="wash" x="20" y="20" width="80" height="50" rx="4" />
          <path className="ln-faint" d="M20 20l80 50M100 20 20 70" />
        </>
      )}
    </svg>
  );
}
