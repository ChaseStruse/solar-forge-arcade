# Shared NPC intelligence

`frontend/npc-brain.js` is a DOM-free toolkit that every AI opponent and enemy uses. Each game keeps its own rules; the module standardizes how NPCs **perceive**, **predict**, **decide**, and **adapt**.

| Helper | Purpose | Used by |
| --- | --- | --- |
| `createBrain`, `perceive`, `extrapolate` | Human reaction time: an NPC acts on snapshots refreshed every 60–220 ms (shorter when more skilled) and projects them forward along smooth motion. Only surprises, such as a fresh hit, wait for the next read. | Volley, Basketball, Puck |
| `adaptSkill`, `aimError` | A 0–1 skill rubber-bands toward the score: a trailing NPC sharpens and a leader eases off. Skill scales aim and read error. | Volley, Basketball, Tennis, Puck |
| `predictBallistic`, `predictLinear`, `predictCrossingX`, `reflect` | Trajectory prediction with gravity and wall or rail rebounds. | Volley, Puck |
| `intercept`, `reachablePoint` | Pursuit angles on a moving target, and the earliest point on a path an NPC can reach in time. | Blitz, Basketball, Puck |
| `steerAround`, `separation`, `axisToward` | Sampled-heading steering around danger zones, crowd spacing, and dead-zoned movement. | Forge, Neon, Volley, Basketball |
| `think` | Named behavior modes (`attack`, `defend`, `guard`, …) with time-in-mode. | Basketball, Puck |

## What each opponent does now

- **Solar Volley:** Nova simulates candidate return angles (mirroring `hitPlayer`) and places the ball where Sol is not. It also shadows net attacks, spends its second jump only when falling under a ball, and reacts to hits on a short delay.
- **Solar Basketball:** Nova runs defend, contest, rebound, and attack modes. It blocks only on the way up and never goaltends a descending ball. It drives and creates space before shooting, waits out a jumping blocker, and shoots only from a deliberate shooting jump.
- **Solar Blitz:** Nova's quarterback holds the pocket while routes develop, slides away from pressure, and ranks receivers by predicted separation at the catch point. This accounts for Sol's slow-motion switch. Ball carriers pick the lane that defenders reach last. Nova defenders take lagged pursuit angles and break on thrown balls.
- **Neon Bullet:** Gunners lead a moving player, more strongly in later waves, and fire faster when cornered. Brawlers split to both sides of the player. From wave 2, patient brawlers wait just outside punch range and punish a whiff. Enemies spread out instead of stacking.
- **Solar Tennis:** Nova reads a glowing power-shot racket and shades toward Sol's aim. It lunges harder against power shots and recovers to the middle of Sol's return angles. It hits behind a sprinting player, lobs a net rusher, angles short balls, and finds more pace as its skill rises.
- **Protect the Forge:** Runners, and more timidly scouts, steer around tower range circles through the gaps. Their time under fire falls by about 45%. Armored invaders and the boss still march straight. Tune with `CAUTION` in `game.js`.
- **Solar Puck:** See [solar-puck.md](solar-puck.md).

## Benchmarks

The old and new opponents faced the same scripted players with human-like reaction lag over seeded runs. These were development scripts, not part of the test suite.

| Game | Old Nova | New Nova |
| --- | --- | --- |
| Volley, 30 matches vs. a mirrored copy of the old AI | Won points 150–120 | Won points 132–18 |
| Basketball, 40 matches vs. a shooting and defending bot | 0 / 40 matches | 19 / 40 matches (169–175 points) |
| Tennis, 40 matches vs. a power-shot spammer | 0 points; every rally ended by the third shot | 85 points; average best rally 22 |
| Blitz offense, 60 drives vs. a rushing defender | 50 TDs, 10 interceptions thrown | 60 TDs, 0 interceptions thrown |
| Neon, 30 runs by the test-suite combat bot | Player hurt 90 times | Player hurt 120 times; still clears every wave |
