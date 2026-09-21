/** Check a production build's route JS isolation and HTTP pages.
 * npm run build && npm start
 * npm run check:rig -- http://127.0.0.1:3000
 * Browser interaction / theme / WebGL checks are performed separately.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const root = path.resolve('.next');
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? files(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
const chunks = (await files(path.join(root, 'static', 'chunks'))).filter((file) => file.endsWith('.js'));
const engines = [];
for (const file of chunks) {
  const data = await readFile(file);
  if (data.includes(Buffer.from('THREE.WebGLRenderer'))) engines.push({
    url: `/_next/${path.relative(root, file).replaceAll('\\', '/')}`,
    bytes: data.length, gzip: gzipSync(data).length,
  });
}
assert(engines.length > 0, 'Could not identify the actual WebGL renderer chunks; update the check rather than silently passing.');
const htmlFiles = (await files(path.join(root, 'server', 'app'))).filter((file) => file.endsWith('.html') && !path.basename(file).startsWith('_'));
const rows = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const scripts = [...new Set([...html.matchAll(/<script\b[^>]*\bsrc="([^"]+\.js)"/g)].map((m) => m[1]))];
  const relative = path.relative(path.join(root, 'server', 'app'), file).replaceAll('\\', '/').replace(/\.html$/, '');
  const route = relative === 'index' ? '/' : `/${relative}`;
  for (const engine of engines) assert(!scripts.includes(engine.url), `Renderer in initial JS for ${route}: ${engine.url}`);
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, `${route} HTTP status`);
  const body = await response.text();
  assert(body.includes('<h1'), `${route} is missing its rendered content`);
  const bytes = (await Promise.all(scripts.map(async (src) => (await stat(path.join(root, src.replace('/_next/', '')))).size))).reduce((a, b) => a + b, 0);
  rows.push({ route, 'initial JS (KiB)': (bytes / 1024).toFixed(1), 'renderer in initial JS': 'no', HTTP: response.status });
  if (route === '/rig') {
    assert(body.includes('rig-assembly-description'), 'Missing server-rendered assembly equivalent');
    assert(body.includes('47 × 12 × 6') && body.includes('Estimate'), 'Missing dimensions/estimate labels');
    assert(body.includes('components101.com') && body.includes('omronfs.omron.com'), 'Missing source links');
  }
}
assert(rows.some((row) => row.route === '/rig'), 'Rig route was not generated.');
console.table(rows);
console.log('Dynamically loaded renderer chunks (none in initial route/shared JS):');
console.table(engines.map((engine) => ({ chunk: engine.url, 'raw KiB': (engine.bytes / 1024).toFixed(1), 'gzip KiB': (engine.gzip / 1024).toFixed(1) })));
console.log(`PASS: ${rows.length} routes, isolated WebGL bundle, server-rendered accessible content and sourced dimensions.`);
