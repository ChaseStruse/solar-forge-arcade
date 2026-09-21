# Neon Bullet

An original pixel-art rooftop brawler inspired by the rooftop combat and slow-motion premise of Bullet Time Fighting. All artwork is drawn locally with Canvas.

## Play

- A/D or left/right: move and face a target.
- W, up, or Space: jump (press again for a double jump).
- J: punch; K: kick; L: fire your pistol in the direction you face.
- S/down: dodge roll, briefly avoiding damage.
- Hold Shift: bullet time. Enemies and projectiles slow more than your fighter.
- P: pause; M: toggle sound. Escape pauses standalone play and returns to game selection inside the cabinet.
- Touch controls provide the same actions.

Clear five increasingly difficult waves. Brawlers close in; gunners telegraph their shots. Kills refill focus and award points, with a short combo window for bonuses. Focus also regenerates outside bullet time. Pistol ammunition refills gradually; melee is always available. A cleared wave restores some health. A local best score persists when browser storage is available.

## Verification

Combat tests cover facing and range, double jumps, slow motion, swept projectile collisions, dodge immunity, damage recovery, ammunition, death, scoring, and wave transitions. An automated fighter also completes all five waves using normal movement and attack rules.

Browser checks cover standalone play, pause/resume, the embedded view, mobile layout, and selection from the 3D cabinet. Sound starts disabled and can be enabled with M or the sound button. Leaving the tab pauses the run.
