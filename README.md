# Solar Forge Arcade

A tiny retro arcade with **Protect the Forge!**, an idle tower defense game, and **Brick Breaker**, a keyboard controlled paddle game. A Bun server serves the pages and small HTML fragments. Both games run in the browser with Canvas.

## Run with Docker

```sh
docker compose -f docker/compose.yml up --build -d
```

Open <http://localhost:3000> to select a game. Protect the Forge is at <http://localhost:3000/protect-the-forge> and Brick Breaker is at <http://localhost:3000/brick-breaker>. When files change, run the `up --build -d` command again so Compose rebuilds and replaces the container. Check the container with `docker compose -f docker/compose.yml ps`, and stop it with `docker compose -f docker/compose.yml down`.

## Run with Bun

```sh
bun run backend/server.ts
```

Open <http://localhost:3000> to select a game. Set `PORT` to use another port.

The game uses no package dependencies. A local copy of htmx 4 powers the **How to Play** panel.

See [docs/architecture.md](docs/architecture.md) and [docs/gameplay.md](docs/gameplay.md) for the structure and game rules.

## Focused checks

Run `node --test tests/*.test.js` to check targeting, projectile movement, upgrade limits, and boss rewards. These tests use the built-in Node test runner and require no packages.
