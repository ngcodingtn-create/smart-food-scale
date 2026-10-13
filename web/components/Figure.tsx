import type { ReactNode } from 'react';
import './figure.css';

/**
 * Captioned drawings, for the pages that explain with pictures. A <Figure> holds
 * one <svg className="fig">; a <FigureGrid> lays them two across on a wide
 * screen and one per row on a phone. Palette and sizing rules: ./figure.css.
 */
export function FigureGrid({ children }: { children: ReactNode }) {
  return <div className="figure-grid">{children}</div>;
}

export function Figure({
  title,
  caption,
  tall = false,
  children,
}: {
  title: string;
  caption?: ReactNode;
  /** Spans two rows of the grid: for a drawing much taller than its neighbours. */
  tall?: boolean;
  children: ReactNode;
}) {
  return (
    <figure className={tall ? 'figure-card figure-tall' : 'figure-card'}>
      {children}
      <figcaption>
        <strong>{title}</strong>
        {caption}
      </figcaption>
    </figure>
  );
}

/** What the line styles in the drawings mean. */
export function FigureKey({ items }: { items: { kind: 'dim' | 'est' | 'force'; label: string }[] }) {
  return (
    <p className="figure-key">
      {items.map((item) => (
        <span key={item.label}>
          <i data-kind={item.kind} aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </p>
  );
}
