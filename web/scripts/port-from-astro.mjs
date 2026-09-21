/**
 * One-shot port of the Starlight content into Next.js MDX pages.
 *
 * Kept in the repo rather than run and deleted, so the transformation is
 * auditable — if a page reads oddly, this file says why.
 *
 *   node scripts/port-from-astro.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('../site/src/content/docs');
const DEST = path.resolve('app');

/** `src/content/docs/<x>.md` -> `app/<x>/page.mdx` */
const ROUTES = {
  'deliverables/index.md': 'deliverables',
  'deliverables/backend.md': 'deliverables/backend',
  'deliverables/food-table.md': 'deliverables/food-table',
  'deliverables/firmware.md': 'deliverables/firmware',
  'deliverables/app.md': 'deliverables/app',
  'project/component-request.md': 'project/component-request',
  'project/architecture.md': 'project/architecture',
  'project/wiring.md': 'project/wiring',
  'project/risks.md': 'project/risks',
  'reference/decisions.md': 'reference/decisions',
  'reference/accuracy.md': 'reference/accuracy',
  'reference/vision-apis.md': 'reference/vision-apis',
};

/** Pull `title:` and `description:` out of the Starlight frontmatter. */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { attrs: {}, body: raw };

  const attrs = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(title|description):\s*(.+)$/);
    if (kv) attrs[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return { attrs, body: raw.slice(match[0].length) };
}

/**
 * Starlight `:::type[Title]` asides -> our <Callout> component.
 * Blank lines inside the tags are required, or MDX treats the contents as raw
 * HTML instead of markdown.
 */
function convertAsides(body) {
  return body.replace(
    /^:::(note|tip|caution|danger)(?:\[([^\]]*)\])?\r?\n([\s\S]*?)^:::\s*$/gm,
    (_all, type, title, inner) => {
      const titleAttr = title ? ` title=${JSON.stringify(title)}` : '';
      // Trailing newline matters: without a blank line after the closing tag,
      // a heading on the next line is swallowed into the JSX block.
      return `<Callout type="${type}"${titleAttr}>\n\n${inner.trim()}\n\n</Callout>\n`;
    },
  );
}

/** The GitHub Pages base path is gone on Vercel; links live at the root. */
function fixLinks(body) {
  return body
    .replace(/\/smart-food-scale\/([^)\s"']*)/g, (_all, rest) => {
      const trimmed = rest.replace(/\/$/, '');
      return trimmed ? `/${trimmed}` : '/';
    })
    .replace(/\]\(\/\)/g, '](/)');
}

function escapeForJs(value) {
  return JSON.stringify(value);
}

let written = 0;
for (const [source, route] of Object.entries(ROUTES)) {
  const raw = fs.readFileSync(path.join(SRC, source), 'utf8');
  const { attrs, body } = parseFrontmatter(raw);

  const content = fixLinks(convertAsides(body)).trim();
  const usesCallout = content.includes('<Callout');

  const out = [
    `import { Callout } from '@/components/Callout';`,
    ``,
    `export const metadata = {`,
    `  title: ${escapeForJs(attrs.title ?? route)},`,
    `  description: ${escapeForJs(attrs.description ?? '')},`,
    `};`,
    ``,
    `# ${attrs.title ?? route}`,
    ``,
    content,
    ``,
  ].join('\n');

  // Drop the import when the page has no callouts, so lint stays quiet.
  const final = usesCallout ? out : out.replace(/^import \{ Callout \}.*\n\n/, '');

  const dir = path.join(DEST, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.mdx'), final, 'utf8');
  written += 1;
  console.log(`  ${source}  ->  app/${route}/page.mdx`);
}

console.log(`\n${written} pages ported.`);
