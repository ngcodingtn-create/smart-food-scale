'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type Heading = { id: string; text: string; level: 2 | 3 };

/** A heading that has scrolled above this line (px from the top) is being read. */
const READING_LINE = 120;

/**
 * "On this page", shown beside the article on wide screens.
 *
 * The outline is read from the rendered headings rather than passed in: pages
 * are plain .mdx files, and rehype-slug has already given every heading an id.
 * The wrapper renders even when empty so the article does not shift sideways
 * once the outline arrives.
 */
export function Toc() {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // `[id]` skips headings written as JSX inside a component (card titles).
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('#content .prose :is(h2, h3)[id]'),
    );
    setHeadings(
      nodes.map((node) => ({
        id: node.id,
        text: node.textContent ?? '',
        level: node.tagName === 'H2' ? 2 : 3,
      })),
    );
    setActive(null);
    if (nodes.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const node of nodes) {
        if (node.getBoundingClientRect().top > READING_LINE) break;
        current = node.id;
      }
      // A short last section never reaches the line; at the bottom it wins anyway.
      const atBottom =
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atBottom ? nodes[nodes.length - 1].id : current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <div className="toc">
      {headings.length > 1 ? (
        <nav aria-label="On this page">
          <p className="toc-title label">On this page</p>
          <ul className="toc-list">
            {headings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className="toc-link"
                  data-level={heading.level}
                  aria-current={active === heading.id ? 'location' : undefined}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
