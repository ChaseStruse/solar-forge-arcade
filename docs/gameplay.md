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

## Solar Blitz: defensive assist

On offense, Space keeps its directional dash. On defense, **Space — Stop the Ball** selects the defender nearest the projected ball position and automatically bursts toward it for 0.35 seconds. The burst has a slightly larger tackle and interception radius, and a shared 2.5-second cooldown so switching players cannot bypass the recharge. Use it when a runner or pass is close, rather than from across the field. Z selects the best-positioned defender without spending the burst.

A SPACE marker shows who will burst; the field HUD shows readiness and recharge time. The cabinet's touch BURST button uses the same action. Teammates now cover at 145 pixels per second (receivers run at 130) and lead runners instead of chasing their old position. Manual defense still matters: carriers run at 165, and opponents can score if the player stays idle.
