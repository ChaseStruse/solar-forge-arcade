# Architecture

The application has these parts:

- `scripts/build.mjs` generates standalone and embedded HTML for Cloudflare Static Assets using `backend/routes.js`. Production needs no application server; the Bun server remains available for local development.
- `backend/server.ts` is a Bun HTTP server. It serves explicit static routes, and a health endpoint.
- `frontend/index.html`, `frontend/experiment.css`, and `frontend/experiment.js` render the 3D arcade cabinet and game picker. The game HTML files and `frontend/style.css` render standalone and embedded play views. A native HTML dialog displays tower defense instructions without a network request.
- `frontend/game.js` owns one local game session. Canvas renders the playfield and `requestAnimationFrame` advances simulation. `frontend/combat.js` supplies projectile movement and firing limits; `frontend/targeting.js` supplies range and line-of-sight rules; `frontend/progression.js` supplies boss and reward rules. No game update makes a network request.
- `frontend/brick-breaker.js` owns the Brick Breaker session, keyboard input, collisions, scoring, and level progression.
- `frontend/solar-volley.js` owns the Solar Volley canvas, input, match flow, effects, and AI opponent. `frontend/volley-physics.js` keeps its collisions, net rebounds, scoring, and AI positioning rules testable without the DOM.

The game runs entirely in memory. Reloading resets it, and Sparks are not shared between players. This allows production deployment as static files. A future leaderboard would need persistent storage and server side score validation.

The artwork is drawn with Canvas and CSS, with no image downloads. The cabinet loads Three.js and fonts from CDNs.

## HTTP routes

| Route | Purpose |
| --- | --- |
| `/` | Arcade game selector |
| `/protect-the-forge` | Protect the Forge page |
| `/brick-breaker` | Brick Breaker page |
| `/solar-volley` | Solar Volley page |
| `/assets/style.css` | Stylesheet |
| `/assets/game.js` | Game code |
| `/assets/brick-breaker.js` | Brick Breaker game code |
| `/assets/solar-volley.js` | Solar Volley game and AI code |
| `/assets/volley-physics.js` | Solar Volley physics and match rules |
| `/assets/combat.js` | Projectile movement and firing limits |
| `/assets/targeting.js` | Range and line-of-sight geometry |
| `/assets/progression.js` | Boss and reward rules |
| `/health` | Container health check |

The reward picker uses a native modal dialog to keep keyboard focus within the choices while the game is paused. The Docker base image is pinned by digest; update it deliberately when upgrading Bun.

## Neon Bullet

`frontend/neon-combat.js` owns browser-local combat, swept projectile collisions, focus, combos, and five-wave progression. `frontend/neon-bullet.js` renders the 400 × 280 Canvas, handles keyboard and touch input, pause/resume, optional synthesized audio, and local best scores. `/neon-bullet` serves the standalone game; `/games/neon-bullet` serves the cabinet view. Its CSS and both JavaScript modules are served under `/assets/`.

## Tennis and Pool

`tennis-physics.js` and `pool-physics.js` implement isolated browser-local simulations. The corresponding `solar-tennis.js` and `solar-pool.js` modules render 400 × 280 pixel playfields and collect input. `retro-sports.js` shares pause/resume, touch buttons, optional audio, and cabinet UI behavior. Both standalone and `/games/` routes use the same HTML, with embedded control relocation. No new dependencies or external artwork are required.

## Cabinet navigation

The home page has three UI states in `frontend/experiment.js`: attract view, in-screen game menu, and active game. Menu and gameplay share the close-up camera; returning from a game unloads the iframe and restores the selected card and page. The menu pages four games at a time and supports native buttons, arrow-key navigation, and Enter. Escape from an embedded game is accepted only from the current same-origin iframe. Dynamic Three.js imports allow renderer failures to fall back to the same menu without WebGL.

The cabinet reuses its static shadow map and skips WebGL/CSS3D renders once the camera settles. Camera movement, view changes, and resizing trigger fresh renders; embedded game animation remains independent.

`game-controls.js` supplies shared pause and touch input to the original five games; Tennis, Pool, and Neon retain their dedicated controls. Small-screen cabinet gameplay moves the iframe outside the transformed 3D monitor so touch targets remain full size.
