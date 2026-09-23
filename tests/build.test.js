import test from 'node:test';
import assert from 'node:assert/strict';
import '../scripts/build.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { files } from '../backend/routes.js';

test('Cloudflare build preserves every route and local HTML/module dependency', () => {
  for (const [route, asset] of Object.entries(files)) {
    if (route !== '/' && route.endsWith('/')) continue;
    const path = route === '/' ? '/index.html' : route + (asset.type.startsWith('text/html') ? '.html' : '');
    const text = readFileSync(`dist${path}`, 'utf8');
    if (asset.embedded) {
      assert.match(text, /src="\/embed.js/);
      assert.match(text, /href="\/embed.css/);
    }
    for (const match of text.matchAll(/(?:src=|href=|from\s+)["']([^"']+)["']/g)) {
      const url = new URL(match[1], `https://arcade.test${path}`);
      if (url.origin !== 'https://arcade.test') continue;
      const local = `dist${url.pathname}`;
      assert.ok(existsSync(local) || existsSync(`${local}.html`), `${path} references missing ${url.pathname}`);
    }
  }
  assert.deepEqual(JSON.parse(readFileSync('dist/health', 'utf8')), { status: 'ok' });
  assert.ok(existsSync('dist/404.html'));
  assert.match(readFileSync('dist/_headers', 'utf8'), /must-revalidate/);
});
