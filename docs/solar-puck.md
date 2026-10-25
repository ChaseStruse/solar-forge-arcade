# Solar Puck

Neon air hockey against Nova, first to seven goals. Sol defends the left goal and Nova defends the right.

Move your mallet on your half with arrows or WASD. You can also move the mouse over the rink or drag with a finger. **Space** readies a short smash: the mallet moves faster and the next hit is harder, followed by a brief recharge. The puck rebounds off the rails and scores only through the goal mouth. After a goal, the side that conceded gets the puck. If a puck stays on one half for seven seconds, the other side gets it, so neither player can stall.

## Nova

`puck-physics.js` holds the simulation and Nova's planner, built on [the shared NPC brain](npc-brain.md):

- **Defend:** If a shot will cross Nova's goal line inside the mouth, including rail banks, Nova blocks it at the crossing point. The block is slightly off-center so the puck deflects away from Sol.
- **Attack:** Against a slow puck on its half, Nova first circles goal-side, so it never knocks the puck toward its own net. It then lines up behind the puck and drives through it. It chooses a straight shot or a top or bottom rail bank, whichever passes farthest from Sol's mallet.
- **Guard:** When the puck is on Sol's half or leaving fast, Nova stays on the line between the puck and its goal. It plays farther forward when its skill is higher.

Nova reacts to delayed reads of the puck. Its skill adapts to the score, which changes its speed, aim error, and guard depth.

The build test checks all routes. `tests/puck-physics.test.js` covers collisions, rails, goals, half limits, smash, blocking, goal-side approach, shot selection, the seven-second rule, and complete matches.
