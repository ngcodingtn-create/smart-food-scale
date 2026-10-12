/**
 * A <script> that the browser runs synchronously while parsing the HTML —
 * before first paint, and before any of Next's own JavaScript has loaded.
 *
 * `next/script` cannot do this: even `strategy="beforeInteractive"` only
 * queues the code for Next's async bundle to run later, which is after the
 * first paint.
 *
 * The `type` switch is the pattern from Next's own guide
 * (node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md).
 * The server emits real JavaScript; on the client the tag is inert
 * `text/plain`, so React does not warn that a script it renders will never
 * execute. `suppressHydrationWarning` covers the deliberate mismatch.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
