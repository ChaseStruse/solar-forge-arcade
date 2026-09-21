export const ARENA_WIDTH = 800;
export const ARENA_HEIGHT = 560;
export const RIDER_RADIUS = 27;

export function wrapX(x, width = ARENA_WIDTH, margin = RIDER_RADIUS) {
  if (x < -margin) return width + margin;
  if (x > width + margin) return -margin;
  return x;
}

export function platformTopAt(rider, platforms) {
  const feet = rider.y + RIDER_RADIUS;
  let top = null;
  for (const platform of platforms) {
    const inside = rider.x > platform.x - RIDER_RADIUS * 0.55 && rider.x < platform.x + platform.width + RIDER_RADIUS * 0.55;
    const crossing = rider.vy >= 0 && feet >= platform.y && feet - rider.vy / 60 <= platform.y + 5;
    if (inside && crossing && (top === null || platform.y < top)) top = platform.y;
  }
  return top;
}

export function clashResult(player, rival) {
  const dx = Math.abs(player.x - rival.x);
  const normalizedDx = dx % ARENA_WIDTH;
  const wrappedDx = Math.min(normalizedDx, ARENA_WIDTH - normalizedDx);
  const dy = player.y - rival.y;
  if (wrappedDx > RIDER_RADIUS * 1.75 || Math.abs(dy) > RIDER_RADIUS * 1.35) return null;
  if (Math.abs(dy) < 8) return "draw";
  return dy < 0 ? "player" : "rival";
}

export function rivalControls(rival, player, platforms) {
  const direct = player.x - rival.x;
  const wrapped = Math.abs(direct) > ARENA_WIDTH / 2 ? -Math.sign(direct) * (ARENA_WIDTH - Math.abs(direct)) : direct;
  const wantsHeight = rival.y > player.y - 18;
  const dangerBelow = platforms.some((platform) => rival.x > platform.x && rival.x < platform.x + platform.width && platform.y > rival.y && platform.y - rival.y < 85);
  return {
    direction: Math.abs(wrapped) < 12 ? 0 : Math.sign(wrapped),
    flap: wantsHeight || (!dangerBelow && rival.vy > 90),
  };
}

export function roundWinner(score, target = 5) {
  if (score.player >= target) return "player";
  if (score.rival >= target) return "rival";
  return null;
}
