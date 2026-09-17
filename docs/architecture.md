# Architecture

The prototype has three small parts:

- `backend/server.ts` is a Bun HTTP server. It serves explicit static routes, a health endpoint, and the HTML help fragment.
- `frontend/index.html` and `frontend/style.css` render the arcade cabinet and upgrade controls. htmx 4 loads the help fragment on demand.
- `frontend/game.js` owns one local game session. Canvas renders the playfield and `requestAnimationFrame` advances simulation. `frontend/combat.js` supplies projectile movement and firing limits; `frontend/targeting.js` supplies range and line-of-sight rules; `frontend/progression.js` supplies boss and reward rules. No game update makes a network request.

The game runs entirely in memory. Reloading resets it, and Sparks are not shared between players. This keeps the first prototype fast and deployable as one container. A future leaderboard would need persistent storage and server side score validation.

The artwork is drawn with Canvas and CSS, with no image downloads. htmx 4 is vendored in `frontend/htmx.min.js`, so the page needs no external assets.

## HTTP routes

| Route | Purpose |
| --- | --- |
| `/` | Arcade page |
| `/assets/style.css` | Stylesheet |
| `/assets/game.js` | Game code |
| `/assets/combat.js` | Projectile movement and firing limits |
| `/assets/targeting.js` | Range and line-of-sight geometry |
| `/assets/progression.js` | Boss and reward rules |
| `/assets/htmx.min.js` | Vendored htmx 4 |
| `/fragments/guide` | htmx help panel |
| `/health` | Container health check |

The reward picker uses a native modal dialog to keep keyboard focus within the choices while the game is paused. The Docker base image is pinned by digest; update it deliberately when upgrading Bun.
