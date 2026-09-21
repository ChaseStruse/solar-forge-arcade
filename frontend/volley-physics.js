export const COURT_WIDTH = 800;
export const COURT_HEIGHT = 560;
export const FLOOR_Y = 488;
export const NET_X = COURT_WIDTH / 2;
export const NET_TOP = 285;
export const BALL_RADIUS = 14;
export const PLAYER_RADIUS = 31;

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

export function rivalControls(rival, ball) {
  const homeX = 610;
  const ballOnRivalSide = ball.x > NET_X;
  const targetX = ballOnRivalSide ? Math.max(NET_X + 52, Math.min(COURT_WIDTH - 42, ball.x + ball.vx * .14)) : homeX;
  const direction = Math.abs(targetX - rival.x) < 10 ? 0 : Math.sign(targetX - rival.x);
  const ballApproaching = ballOnRivalSide && ball.y < rival.y + 45 && ball.y > rival.y - 175;
  const blockAtNet = ball.x > NET_X - 30 && ball.x < NET_X + 95 && ball.y < NET_TOP + 80;
  return { direction, jump: rival.onGround && (ballApproaching || blockAtNet) };
}
