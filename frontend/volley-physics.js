import { aimError, axisToward, predictBallistic } from "./npc-brain.js";

export const COURT_WIDTH = 800;
export const COURT_HEIGHT = 560;
export const FLOOR_Y = 488;
export const NET_X = COURT_WIDTH / 2;
export const NET_TOP = 285;
export const BALL_RADIUS = 14;
export const PLAYER_RADIUS = 31;

export function tryJump(player) {
  const used = player.onGround ? 0 : player.jumpsUsed;
  if (used >= 2) return false;
  player.jumpsUsed = used + 1;
  player.vy = -455;
  player.onGround = false;
  player.squash = 1;
  return true;
}

export function pointWinner(ballX) {
  return ballX < NET_X ? "rival" : "player";
}

export function matchWinner(score, target = 5) {
  if (score.player >= target) return "player";
  if (score.rival >= target) return "rival";
  return null;
}

export function hitPlayer(ball, player) {
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const minDistance = BALL_RADIUS + PLAYER_RADIUS;
  const distance = Math.hypot(dx, dy);
  if (distance >= minDistance || distance === 0) return false;

  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = minDistance - distance;
  ball.x += nx * overlap;
  ball.y += ny * overlap;
  const playerBoost = Math.abs(player.vx) * .32 + Math.max(0, -player.vy) * .4;
  const speed = Math.max(410, Math.min(590, Math.hypot(ball.vx, ball.vy) + playerBoost));
  ball.vx = nx * speed + player.vx * .35;
  ball.vy = Math.min(-235, ny * speed + player.vy * .18);
  return true;
}

export function hitNet(ball) {
  const halfWidth = 9;
  if (ball.y + BALL_RADIUS < NET_TOP || ball.x + BALL_RADIUS < NET_X - halfWidth || ball.x - BALL_RADIUS > NET_X + halfWidth) return false;
  if (ball.y < NET_TOP && ball.vy > 0) {
    ball.y = NET_TOP - BALL_RADIUS;
    ball.vy = -Math.abs(ball.vy) * .72;
  } else if (ball.x < NET_X) {
    ball.x = NET_X - halfWidth - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx) * .78;
  } else {
    ball.x = NET_X + halfWidth + BALL_RADIUS;
    ball.vx = Math.abs(ball.vx) * .78;
  }
  return true;
}

// Contact geometry decides the return: standing further behind the ball sends
// it flatter. Simulate each candidate launch (mirroring hitPlayer) and keep the
// one that clears the net and lands furthest from Sol.
export function placementOffset(rival, opponent, brain = null) {
  const contactY = rival.y - 40;
  let best = 12, bestScore = -Infinity;
  for (let offset = 4; offset <= 36; offset += 4) {
    const nx = -offset / (BALL_RADIUS + PLAYER_RADIUS), ny = -Math.sqrt(1 - nx * nx), speed = 470;
    const launch = { x: rival.x + nx * 45, y: contactY, vx: nx * speed, vy: Math.min(-235, ny * speed) };
    const atNet = (launch.x - NET_X) / -launch.vx, netY = launch.y + launch.vy * atNet + 315 * atNet * atNet;
    if (netY > NET_TOP - BALL_RADIUS - 6) continue;
    const landing = predictBallistic(launch, { gravity: 630, contactY: FLOOR_Y - BALL_RADIUS, left: BALL_RADIUS, maxTime: 3 });
    if (landing.x >= NET_X) continue;
    // Distance Sol must cover per second of hang time; prefer quick, wide shots.
    const score = Math.abs(landing.x - opponent.x) / Math.max(.35, landing.time) + (brain ? aimError(brain, 60) : 0);
    if (score > bestScore) { bestScore = score; best = offset; }
  }
  return best;
}

// Nova reads the arc (including back-wall rebounds), stands behind the ball so
// contact sends it toward Sol, and picks a flatter or loftier return based on
// where Sol is standing. `seen` may be a delayed observation from a brain.
export function rivalControls(rival, ball, opponent = null, brain = null) {
  const homeX = opponent && opponent.x > NET_X - 120 ? 585 : 615;
  const ballOnRivalSide = ball.x > NET_X;
  const vy = ball.vy || 0;
  const arc = predictBallistic({ x: ball.x, y: ball.y, vx: ball.vx, vy }, {
    gravity: 630, contactY: rival.y - 60, right: COURT_WIDTH - BALL_RADIUS, maxTime: 1.6 });
  const landing = arc.x + (ball.error || 0);
  const offset = opponent ? placementOffset(rival, opponent, brain) : 12;
  const incoming = !ballOnRivalSide && (ball.vx || 0) > 0 && landing > NET_X;
  let targetX = homeX;
  if (ballOnRivalSide || incoming) targetX = Math.max(NET_X + 52, Math.min(COURT_WIDTH - 42, landing + offset));
  else if (opponent && opponent.x > NET_X - 110 && ball.x > NET_X - 150) targetX = NET_X + 58; // shadow a spike at the net
  const direction = axisToward(rival.x, targetX, brain ? 6 : 10);
  const ballApproaching = ballOnRivalSide && Math.abs(ball.x - rival.x) < 100 && vy > -120 && ball.y < rival.y + 45 && ball.y > rival.y - 175;
  const blockAtNet = rival.x < NET_X + 115 && ball.x > NET_X - 30 && ball.x < NET_X + 95 && ball.y < NET_TOP + 80;
  // A rising jump reaches the arc ~0.3 s later; leave early for high balls.
  const highBall = arc.time < .42 && Math.abs(arc.x - rival.x) < 48 && ball.y < rival.y - 140;
  const groundJump = rival.onGround && (ballApproaching || blockAtNet || highBall);
  // Spend the second jump only while falling under a ball that is still above.
  const airJump = !rival.onGround && rival.jumpsUsed === 1 && rival.vy > 60
    && ball.y < rival.y - 50 && Math.abs(ball.x - rival.x) < 42;
  return { direction, jump: groundJump || airJump };
}
