# Solar Forge Arcade

A retro 3D arcade cabinet with **Protect the Forge!**, **Brick Breaker**, **Solar Volley**, **Solar Basketball**, **Solar Blitz**, **Neon Bullet**, **Solar Tennis**, and **Solar Pool**. A Bun server serves the cabinet, games, and game pages. The games run in the browser with Canvas, while Three.js renders the cabinet.

## Deploy to Cloudflare

Production is a static site: no Bun process, container, or Worker runtime code is required.

```sh
node scripts/build.mjs
npx wrangler@4.136.3 dev
# When ready to publish:
npx wrangler@4.136.3 deploy
```

`wrangler.jsonc` builds and deploys `dist/` using Workers Static Assets. For Cloudflare Pages, use `node scripts/build.mjs` as the build command and `dist` as the output directory. Only published routes and assets enter the build; experiments, tests, and server sources stay out. Clean game URLs and embedded cabinet views are generated from the same route manifest used locally. Unknown URLs return a 404 page.

Cloudflare serves and caches static files with ETags. Browser caches revalidate on reuse so edits to unversioned modules cannot leave players with stale game code. See [Cloudflare asset headers](https://developers.cloudflare.com/workers/static-assets/headers/). Three.js and fonts still require their external CDNs.

## Run with Docker

```sh
docker compose -f docker/compose.yml up --build -d
```

Open <http://localhost:3000>, press **Step Up & Play**, and choose a game on the cabinet screen. Use the page buttons for more games, or arrow keys and Enter. Escape returns a game to selection; **Step Back** returns to the full cabinet view. Each game is also available directly at `/protect-the-forge`, `/brick-breaker`, `/solar-volley`, `/solar-basketball`, `/solar-blitz`, `/neon-bullet`, `/solar-tennis`, or `/solar-pool`. When files change, run the `up --build -d` command again so Compose rebuilds and replaces the container. Check the container with `docker compose -f docker/compose.yml ps`, and stop it with `docker compose -f docker/compose.yml down`.

## Run with Bun

```sh
bun run backend/server.ts
```

Open <http://localhost:3000> to play. Set `PORT` to use another port. The 3D cabinet loads Three.js and fonts from CDNs. If the renderer cannot load, a flat cabinet menu keeps the games available.

The game uses no package dependencies. The **How to Play** panel uses a native HTML dialog.

See [docs/architecture.md](docs/architecture.md) and [docs/gameplay.md](docs/gameplay.md) for the structure and game rules.

## Focused checks

Run `node --test tests/*.test.js` to check targeting, projectile movement, upgrade limits, and boss rewards. These tests use the built-in Node test runner and require no packages.

See [Neon Bullet controls and rules](docs/neon-bullet.md) for the rooftop brawler.

See [Tennis and Pool controls](docs/tennis-and-pool.md) for quick matches and the eight-ball challenge.
