'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';

/**
 * Copies the code block it sits in. It finds the <pre> through the DOM rather
 * than taking the text as a prop, so the block itself stays server-rendered.
 */
export function CopyButton() {
  const button = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    const pre = button.current?.closest('.codeblock')?.querySelector('pre');
    if (!pre) return;

    try {
      await navigator.clipboard.writeText(pre.textContent ?? '');
    } catch {
      // No Clipboard API: the page is on plain http over the LAN (how the
      // phone reaches a dev machine), or permission was refused. Select the
      // block and use the old command instead.
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(pre);
      selection?.removeAllRanges();
      selection?.addRange(range);
      const ok = document.execCommand('copy');
      selection?.removeAllRanges();
      if (!ok) return;
    }
    setCopied(true);
  }

  return (
    <button
      ref={button}
      type="button"
      className="codeblock-copy"
      data-copied={copied}
      onClick={copy}
    >
      <Icon name={copied ? 'check' : 'copy'} size={14} />
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}
