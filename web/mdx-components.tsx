import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { isValidElement } from 'react';
import { Callout } from '@/components/Callout';
import { Card, Cards } from '@/components/Cards';
import { CopyButton } from '@/components/CopyButton';

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

  // Every table gets a scroll box of its own, so a wide one slides sideways
  // on a phone instead of pushing the whole page wider than the screen.
  table: (props) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),

  // A fence with a language (```bash) is something a reader will run, so it
  // gets a title bar and a copy button. A bare fence is a diagram or a
  // directory tree and stays a plain panel. tabIndex makes the block, which
  // scrolls sideways, reachable from the keyboard.
  pre: ({ children, ...props }) => {
    const code = isValidElement<{ className?: string }>(children) ? children.props.className : '';
    const language = /language-([\w-]+)/.exec(code ?? '')?.[1];
    return (
      <div className="codeblock">
        {language ? (
          <div className="codeblock-bar">
            <span className="label">{language}</span>
            <CopyButton />
          </div>
        ) : null}
        <pre tabIndex={0} {...props}>
          {children}
        </pre>
      </div>
    );
  },

  Callout,
  Card,
  Cards,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
