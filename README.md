# Solar Forge Arcade

A tiny retro arcade, beginning with **Protect the Forge!**, an idle tower defense game. A Bun server serves the page and small HTML fragments. The game itself runs in the browser with Canvas.

## Run with Docker

```sh
docker compose -f docker/compose.yml up --build -d
```

Open <http://localhost:3000>. Check the container with `docker compose -f docker/compose.yml ps`, and stop it with `docker compose -f docker/compose.yml down`.

## Run with Bun

```sh
bun run backend/server.ts
```

Open <http://localhost:3000>. Set `PORT` to use another port.

The game uses no package dependencies. A local copy of htmx 4 powers the **How to Play** panel.

See [docs/architecture.md](docs/architecture.md) and [docs/gameplay.md](docs/gameplay.md) for the structure and game rules.

## Focused checks

Run `node --test tests/*.test.js` to check targeting, projectile movement, upgrade limits, and boss rewards. These tests use the built-in Node test runner and require no packages.
