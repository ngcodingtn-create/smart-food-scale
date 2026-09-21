import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { Callout } from '@/components/Callout';

/**
 * Components available to every .mdx page without importing them, plus
 * overrides for plain markdown elements.
 *
 * Required at the project root by @next/mdx in the App Router.
 *
 * Note the signature: Next 16 calls this with NO arguments. Earlier versions
 * passed the inherited components in as a parameter, and that older shape only
 * appears to work here because spreading `undefined` is a no-op.
 */
const components: MDXComponents = {
  // Internal links go through next/link for client-side navigation;
  // external ones stay plain anchors and open in a new tab.
  a: ({ href = '', children, ...props }) => {
    const internal = href.startsWith('/') && !href.startsWith('//');
    if (internal) {
      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" {...props}>
        {children}
      </a>
    );
  },
  Callout,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
