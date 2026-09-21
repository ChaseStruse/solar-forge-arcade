# Solar Forge Arcade

A retro 3D arcade cabinet with **Protect the Forge!**, **Brick Breaker**, **Solar Volley**, **Solar Basketball**, **Solar Blitz**, and **Neon Bullet**, an 8-bit rooftop brawler with bullet time. A Bun server serves the cabinet, games, and small HTML fragments. The games run in the browser with Canvas, while Three.js renders the cabinet.

## Run with Docker

```sh
docker compose -f docker/compose.yml up --build -d
```

Open <http://localhost:3000> to choose a game and play it in the 3D cabinet. Each game is also available directly at `/protect-the-forge`, `/brick-breaker`, `/solar-volley`, `/solar-basketball`, `/solar-blitz`, or `/neon-bullet`. When files change, run the `up --build -d` command again so Compose rebuilds and replaces the container. Check the container with `docker compose -f docker/compose.yml ps`, and stop it with `docker compose -f docker/compose.yml down`.

## Run with Bun

```sh
bun run backend/server.ts
```

Open <http://localhost:3000> to play. Set `PORT` to use another port. The cabinet currently needs an internet connection to load Three.js and display fonts from their CDNs.

The game uses no package dependencies. A local copy of htmx 4 powers the **How to Play** panel.

See [docs/architecture.md](docs/architecture.md) and [docs/gameplay.md](docs/gameplay.md) for the structure and game rules.

## Focused checks

Run `node --test tests/*.test.js` to check targeting, projectile movement, upgrade limits, and boss rewards. These tests use the built-in Node test runner and require no packages.

See [Neon Bullet controls and rules](docs/neon-bullet.md) for the rooftop brawler.
