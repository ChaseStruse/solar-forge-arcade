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
