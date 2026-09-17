/** Boss and reward rules stay separate from Canvas and DOM code. */
export function createTower(x, y, aim) {
  return { x, y, aim, fireClock: 0, bullets: 1 };
}

export function createBoss(center, side) {
  return {
    x: center.x + side * 365,
    y: center.y,
    radius: 29,
    speed: 9,
    health: 180,
    maxHealth: 180,
    boss: true,
  };
}

export function applyBossReward(game, reward, center, towerIndex) {
  if (reward === "turret") {
    if (game.towers.length !== 2) return false;
    game.towers.push(createTower(center.x, center.y - 150, -Math.PI / 2));
  } else if (reward === "health") {
    game.maxShield += 3;
    game.shield = Math.min(game.maxShield, game.shield + 3);
  } else if (reward === "twin") {
    if (towerIndex !== 0 && towerIndex !== 1) return false;
    game.towers[towerIndex].bullets = 2;
  } else {
    return false;
  }
  return true;
}
