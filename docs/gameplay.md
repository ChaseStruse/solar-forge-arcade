# Protect the Forge! gameplay

Press **Start shift** to begin. One stationary tower sits left of the forge and another sits right. Each automatically fires toward the closest enemy within its dashed range circle. The forge blocks line of sight: a tower cannot target an enemy behind it, and a projectile dissipates if its path would cross the forge. Enemies enter from outside the playfield and move toward the forge. Each one that reaches it removes one shield point. The shift ends at zero shield.

Defeated enemies give **Sparks**. Spend them on:

| Upgrade | Effect | First cost |
| --- | --- | ---: |
| Attack Power | More damage per shot from both towers | 10 Sparks |
| Attack Speed | Less time between shots for both towers | 12 Sparks |
| Firing Range | Larger targeting radius for both towers | 8 Sparks |

Costs increase with each purchase. Attack Speed reaches its limit at level 10; the button then displays MAX and no longer spends Sparks. A new wave begins every 18 seconds, increasing enemy durability, speed, and frequency. The game pauses when its browser tab is hidden.

## Wave 10: Cinder Titan

Wave 10 is a dedicated boss round. Regular enemies stop spawning while the Cinder Titan approaches the forge. It has 180 health and moves slowly, giving upgraded towers time to bring it down. If it reaches the forge, the shift ends.

Defeating it grants 30 Sparks and pauses the game for one permanent reward choice:

- **Add a turret:** a third stationary tower appears above the forge.
- **Forge hearts:** maximum shield rises by three, and three shield points are restored.
- **Twin shot:** choose the left or right tower to fire two bullets per volley.

The game resumes after a reward is chosen. This boss and reward are offered once per shift.

The current prototype is intentionally hands off: it asks the player to choose upgrades, not steer the tower. Balancing and additional enemy types can follow after playtesting.

## Solar Blitz: pass reaction time

When Nova throws, a reaction window slows the ball and AI to 25% speed for up to **1.2 real seconds**. Your selected defender moves at 65% speed, giving you time to react without making the interception automatic. Press **Z** to select the defender nearest the pass destination, then use arrows or WASD to move into the ball. A gold square marks the destination; a Z marker identifies the suggested defender. The field HUD shows the remaining reaction time.

The window ends immediately on a catch, interception, or incomplete pass. It cannot be renewed by switching defenders. Runs do not trigger slow motion. Space is an offensive directional dash only; defense has no automatic tackle, dash, or enlarged collision radius. The cabinet touch controls follow the same rules.

Player AI defenders keep permanent man assignments: #2 guards #2 and #3 guards #3, even when the quarterback scrambles, a pass is airborne, or the other receiver catches it. When you switch away from #1, he marks the opposing quarterback. Only the assigned defender follows a receiver who has caught the ball; the other defenders stay on their men. Manual control overrides coverage until you switch away. Nova checks for clear passing lanes rather than throwing directly into stationary defenders. Tests cover manual interceptions versus idle defense, slow-motion timing and cleanup, offensive controls, and the opponent's ability to score against an idle player.


Both teams draw two distinct routes per play from **go, slant, out, curl, post, and cross**. Receivers follow their assigned route through its cuts and settle at the endpoint; routes reroll on a new play. Your offense shows dashed route previews and route names before the snap. Passes lead the receiver along the actual route, including upcoming cuts, and routes mirror with the direction of attack while staying inside the field.

Man coverage has a human reaction lag: player AI markers update their read every 0.28–0.34 game seconds and cover at 126 pixels per second, just below a receiver's 130. They keep their assigned man but can lose a step on a cut. Manual movement remains immediate. Nova lets routes develop for at least 0.65 seconds, then considers receivers with more than 34 pixels of separation and a clear passing lane. It can still run if no suitable throw opens up.
