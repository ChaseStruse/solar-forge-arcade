import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { files, embed } from '../backend/routes.js';

const source = new URL('../frontend/', import.meta.url);
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const [route, asset] of Object.entries(files)) {
  if (route !== '/' && route.endsWith('/')) continue;
  const path = route === '/' ? 'index.html' : route.slice(1) + (asset.type.startsWith('text/html') ? '.html' : '');
  const destination = new URL(path, output);
  await mkdir(new URL('./', destination), { recursive: true });
  const contents = await readFile(new URL(asset.path, source), 'utf8');
  await writeFile(destination, asset.embedded ? embed(contents) : contents);
}
await writeFile(new URL('health', output), '{"status":"ok"}');
await writeFile(new URL('404.html', output), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found · Solar Forge Arcade</title><h1>Game not found</h1><p><a href="/">Back to the arcade</a></p></html>');
await writeFile(new URL('_headers', output), `/*
  Cache-Control: public, max-age=0, must-revalidate
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/health
  Content-Type: application/json; charset=utf-8
`);
console.log('Built Cloudflare static assets in dist/');
