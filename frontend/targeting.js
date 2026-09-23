/** Geometry shared by both towers. A target must be close enough and visible past the forge. */
export function segmentHitsCircle(start, end, center, radius) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const progress = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((center.x - start.x) * dx + (center.y - start.y) * dy) / lengthSquared,
  ));
  const nearestX = start.x + progress * dx;
  const nearestY = start.y + progress * dy;
  return (nearestX - center.x) ** 2 + (nearestY - center.y) ** 2 <= radius ** 2;
}

export function canTarget(tower, enemy, forge, forgeRadius, range) {
  return Math.hypot(enemy.x - tower.x, enemy.y - tower.y) <= range
    && !segmentHitsCircle(tower, enemy, forge, forgeRadius);
}

// Prefer the invader closest to reaching the forge, not merely the nearest tower.
export function selectThreat(enemies, tower, forge, forgeRadius, range) {
  let target = null, urgency = Infinity;
  for (const enemy of enemies) {
    if (enemy.health <= 0 || !canTarget(tower, enemy, forge, forgeRadius, range)) continue;
    const time = Math.max(0, Math.hypot(enemy.x - forge.x, enemy.y - forge.y) - forgeRadius) / Math.max(1, enemy.speed);
    if (time < urgency) { target = enemy; urgency = time; }
  }
  return target;
}
