# Neon Bullet

An original pixel-art rooftop brawler inspired by the rooftop combat and slow-motion premise of Bullet Time Fighting. All artwork is drawn locally with Canvas.

## Play

- A/D or left/right: move and face a target.
- W, up, or Space: jump (press again for a double jump).
- J: punch; K: kick; L: fire your pistol in the direction you face.
- S/down: dodge roll, briefly avoiding damage.
- Hold Shift: bullet time. Enemies and projectiles slow more than your fighter.
- P or Escape: pause; M: toggle sound.
- Touch controls provide the same actions.

Clear five increasingly difficult waves. Brawlers close in; gunners telegraph their shots. Kills refill focus and award points, with a short combo window for bonuses. Focus also regenerates outside bullet time. Pistol ammunition refills gradually; melee is always available. A cleared wave restores some health. A local best score persists when browser storage is available.

## Implementation plan

1. Add a testable combat simulation and the playable Canvas view.
2. Register standalone and cabinet routes and the sixth game selection.
3. Verify combat rules, browser gameplay, and Docker health.
