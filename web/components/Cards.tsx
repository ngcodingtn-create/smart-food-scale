import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icons';

/**
 * A grid of short, titled cards — two across, one on a phone. Both are
 * registered in mdx-components.tsx, so a page uses them without importing:
 *
 *   <Cards>
 *     <Card title="A phone app" icon="phone">
 *
 *     Markdown goes here, with a blank line either side.
 *
 *     </Card>
 *   </Cards>
 */
export function Cards({ children }: { children: ReactNode }) {
  return <div className="cards">{children}</div>;
}

export function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <section className="card">
      {icon ? (
        <span className="card-icon">
          <Icon name={icon} size={19} />
        </span>
      ) : null}
      <h3 className="card-title">{title}</h3>
      {/* A <div>, never a <p>: MDX wraps the markdown inside in its own <p>. */}
      <div className="card-body">{children}</div>
    </section>
  );
}
