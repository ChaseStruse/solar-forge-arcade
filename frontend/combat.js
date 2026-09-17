/** Shared combat limits keep upgrade controls and simulation in agreement. */
export const MAX_ATTACK_SPEED_LEVEL = 10;

export function fireInterval(level) {
  return Math.max(0.16, 0.85 * Math.pow(0.83, level - 1));
}

/** Stop at the target instead of overshooting it during a long frame. */
export function advanceShot(shot, dt) {
  const dx = shot.target.x - shot.x;
  const dy = shot.target.y - shot.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return;
  const fraction = Math.min(1, 460 * dt / distance);
  shot.x += dx * fraction;
  shot.y += dy * fraction;
}
