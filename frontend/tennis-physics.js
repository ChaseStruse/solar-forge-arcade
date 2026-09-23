export const COURT = { left: 58, right: 342, top: 44, bottom: 244, net: 144 };
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export function createTennis(random = Math.random) {
  return { players: [{ x: 200, y: 222, swing: 0 }, { x: 200, y: 66, swing: 0 }],
    ball: null, scores: [0, 0], server: 0, phase: 'serve', wait: 0, rally: 0, bestRally: 0,
    power: 0, powerCooldown: 0, aiRead: 0, aiTarget: 200, aim: 0, events: [], random,
    message: 'SPACE / TAP TO SERVE', winner: -1 };
}
export function hitTennis(g, team, power = false) {
  const b = g.ball, p = g.players[team], other = g.players[1 - team];
  const direction = team === 0 ? -1 : 1;
  const targetX = team === 0
    ? clamp(p.x + g.aim * (power ? 135 : 100), 76, 324)
    : clamp((other.x < 185 ? 300 : other.x > 215 ? 100 : g.random() < .5 ? 100 : 300) + (g.random() - .5) * 36, 76, 324);
  const targetY = team === 0 ? 64 + g.random() * 12 : 218 + g.random() * 14;
  const travelTime = power ? .55 : Math.max(.66, .86 - g.rally * .013);
  b.x = p.x; b.y = p.y + direction * 8; b.z = Math.max(9, b.z);
  b.vx = (targetX - b.x) / travelTime; b.vy = (targetY - b.y) / travelTime;
  b.vz = (160 * travelTime * travelTime - b.z) / travelTime;
  b.last = team; b.bounces = 0; b.targetX = targetX; b.targetY = targetY; b.power = power;
  p.swing = .19; g.rally++; g.bestRally = Math.max(g.bestRally, g.rally);
  g.aiRead = .16 + g.random() * .12;
  g.aiTarget = clamp(targetX + (g.random() - .5) * 42, 65, 335);
  g.events.push(power ? 'power' : 'hit');
  g.message = power ? 'POWER SHOT!' : 'KEEP THE RALLY ALIVE';
}
export function tennisAction(g) {
  if (g.phase === 'serve' && g.server === 0) serve(g);
  else if (g.phase === 'rally' && g.powerCooldown <= 0) {
    g.power = .34; g.powerCooldown = .8; g.message = 'POWER READY — MEET THE BALL';
  }
}
function serve(g) {
  const p = g.players[g.server];
  g.ball = { x: p.x, y: p.y, z: 10, vx: 0, vy: 0, vz: 0, last: g.server, bounces: 0 };
  g.phase = 'rally'; hitTennis(g, g.server); g.message = 'RALLY ON';
}
export function tennisPoint(g, team, reason) {
  if (g.phase !== 'rally') return;
  g.scores[team]++; g.events.push(team === 0 ? 'score' : 'miss');
  g.message = `${team === 0 ? 'SOL' : 'NOVA'} POINT / ${reason}`;
  g.ball = null; g.power = 0;
  if (g.scores[team] >= 7) { g.phase = 'over'; g.winner = team; }
  else { g.phase = 'point'; g.wait = 1.05; }
}
function movePlayer(p, x, y, speed, dt) {
  const dx = x - p.x, dy = y - p.y, length = Math.hypot(dx, dy);
  const scale = Math.min(1, speed * dt / (length || 1));
  p.x += dx * scale; p.y += dy * scale;
}
export function stepTennis(g, elapsed, input = {}) {
  if (g.phase === 'over') return;
  const dt = clamp(elapsed, 0, .04), p = g.players[0], ai = g.players[1];
  for (const player of g.players) player.swing = Math.max(0, player.swing - dt);
  g.power = Math.max(0, g.power - dt); g.powerCooldown = Math.max(0, g.powerCooldown - dt);
  if (g.phase === 'point') {
    g.wait -= dt;
    if (g.wait <= 0) {
      g.server = (g.scores[0] + g.scores[1]) % 2; g.phase = 'serve'; g.wait = .8;
      g.players[0].x = 200; g.players[0].y = 222; g.players[1].x = 200; g.players[1].y = 66;
      g.rally = 0; g.powerCooldown = 0;
      g.message = g.server === 0 ? 'SPACE / TAP TO SERVE' : 'NOVA SERVING';
    }
    return;
  }
  if (input.target) {
    movePlayer(p, clamp(input.target.x, 55, 345), clamp(input.target.y, 165, 250), 215, dt);
    g.aim = clamp((input.target.x - 200) / 110, -1, 1);
  } else {
    const dx = input.x || 0, dy = input.y || 0;
    const norm = Math.hypot(dx, dy) || 1;
    p.x = clamp(p.x + dx / norm * 195 * dt, 55, 345);
    p.y = clamp(p.y + dy / norm * 195 * dt, 165, 250);
    g.aim = dx;
  }
  if (g.phase === 'serve') {
    if (g.server === 1) { g.wait -= dt; if (g.wait <= 0) serve(g); }
    return;
  }
  const b = g.ball;
  g.aiRead -= dt;
  if (g.aiRead <= 0) movePlayer(ai, b.last === 0 ? g.aiTarget : 200, 68, 112 + Math.min(18, g.rally), dt);
  // Small substeps handle racket windows, net crossing, and bounces reliably.
  const steps = Math.max(1, Math.ceil(dt / .008));
  for (let i = 0; i < steps && g.phase === 'rally'; i++) {
    const d = dt / steps, oldY = b.y;
    b.x += b.vx * d; b.y += b.vy * d; b.vz -= 320 * d; b.z += b.vz * d;
    if ((oldY - COURT.net) * (b.y - COURT.net) <= 0 && b.z < 8) {
      tennisPoint(g, 1 - b.last, 'NET'); break;
    }
    if (b.z <= 0) {
      if (b.x < COURT.left || b.x > COURT.right || b.y < COURT.top || b.y > COURT.bottom) {
        tennisPoint(g, b.bounces ? b.last : 1 - b.last, b.bounces ? 'WINNER' : 'OUT'); break;
      }
      const side = b.y > COURT.net ? 0 : 1;
      if (side === b.last) { tennisPoint(g, 1 - b.last, 'SHORT BALL'); break; }
      b.bounces++;
      if (b.bounces >= 2) { tennisPoint(g, b.last, 'DOUBLE BOUNCE'); break; }
      b.z = 0; b.vz = 72; g.events.push('bounce');
    }
    const receiver = 1 - b.last, player = g.players[receiver];
    if (b.z < 27 && Math.hypot(b.x - player.x, b.y - player.y) < 25
      && (receiver === 0 ? b.y > 155 && b.vy > 0 : b.y < 133 && b.vy < 0)) {
      const powered = receiver === 0 && g.power > 0;
      hitTennis(g, receiver, powered); if (receiver === 0) g.power = 0;
    }
    if (g.phase === 'rally' && (b.y < -30 || b.y > 310 || b.x < -50 || b.x > 450)) {
      tennisPoint(g, b.bounces ? b.last : 1 - b.last, 'WINNER');
    }
  }
}
