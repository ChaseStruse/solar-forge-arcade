export const TABLE = { left: 30, right: 370, top: 62, bottom: 232, radius: 5 };
export const POCKETS = [[30,62],[200,62],[370,62],[30,232],[200,232],[370,232]];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export function createPool() {
  const balls = [{ id: 0, x: 105, y: 147, vx: 0, vy: 0 }];
  const layout = [[0,0],[1,-.5],[1,.5],[2,-1],[2,0],[2,1],[3,-.5],[3,.5]];
  const ids = [1,2,3,4,8,5,6,7];
  layout.forEach(([col,row], i) => balls.push({ id: ids[i], x: 260 + col * 9.2, y: 147 + row * 10.6, vx: 0, vy: 0 }));
  return { balls, phase: 'aim', shots: 20, score: 0, events: [], scratch: false,
    blackPocketed: false, blackLegal: false, shotPots: 0, message: 'BREAK THE RACK / CLEAR COLORS, THEN 8', winner: false };
}
export function shootPool(g, angle, power) {
  if (g.phase !== 'aim' || g.shots <= 0 || !Number.isFinite(angle) || !Number.isFinite(power)) return false;
  const cue = g.balls.find(b => b.id === 0);
  if (!cue) return false;
  const speed = 70 + clamp(power, 0, 1) * 280;
  cue.vx = Math.cos(angle) * speed; cue.vy = Math.sin(angle) * speed;
  g.shots--; g.phase = 'rolling'; g.scratch = false; g.blackPocketed = false; g.blackLegal = false; g.shotPots = 0;
  g.message = 'NICE AND EASY'; g.events.push('shot'); return true;
}
export function collidePool(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
  if (distance >= 10) return false;
  const nx = distance > .0001 ? dx / distance : 1, ny = distance > .0001 ? dy / distance : 0;
  const overlap = 10 - distance;
  a.x -= nx * overlap / 2; a.y -= ny * overlap / 2; b.x += nx * overlap / 2; b.y += ny * overlap / 2;
  const approach = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (approach <= 0) return false;
  const impulse = approach * .98;
  a.vx -= impulse * nx; a.vy -= impulse * ny; b.vx += impulse * nx; b.vy += impulse * ny;
  return approach > 15;
}
export function respotCue(g) {
  // Search a deterministic grid rather than placing the cue inside another ball.
  for (let x = 85; x <= 345; x += 15) for (let y = 82; y <= 212; y += 15) {
    if (g.balls.every(b => Math.hypot(b.x - x, b.y - y) >= 12)) {
      g.balls.push({ id: 0, x, y, vx: 0, vy: 0 }); return;
    }
  }
}
function finishShot(g) {
  if (g.blackPocketed) {
    g.winner = g.blackLegal && !g.scratch;
    g.phase = 'over'; g.message = g.winner ? 'RACK CLEARED!' : g.scratch ? 'SCRATCH ON THE 8' : '8-BALL TOO EARLY';
    if (g.winner) g.score += 500 + g.shots * 50;
    g.events.push(g.winner ? 'win' : 'miss'); return;
  }
  if (g.scratch) { g.shots = Math.max(0, g.shots - 1); respotCue(g); }
  if (g.shotPots > 0 && !g.scratch) g.shots = Math.min(20, g.shots + 1);
  if (g.shots === 0) { g.phase = 'over'; g.message = 'OUT OF SHOTS'; return; }
  g.phase = 'aim';
  const colors = g.balls.filter(b => b.id !== 0 && b.id !== 8).length;
  g.message = g.scratch ? 'SCRATCH / EXTRA SHOT LOST' : colors === 0 ? 'FINISH IT / SINK THE 8' : g.shotPots ? `${g.shotPots} POCKETED / +1 SHOT` : 'LINE UP YOUR NEXT SHOT';
}
export function stepPool(g, elapsed) {
  if (g.phase !== 'rolling') return;
  const dt = clamp(elapsed, 0, .04), steps = Math.max(1, Math.ceil(dt * 240)), d = dt / steps;
  for (let step = 0; step < steps; step++) {
    for (const b of g.balls) {
      b.x += b.vx * d; b.y += b.vy * d;
      if (POCKETS.some(([x,y]) => Math.hypot(b.x - x, b.y - y) < 10.5)) {
        b.potted = true;
        if (b.id === 0) g.scratch = true;
        else if (b.id === 8) {
          g.blackPocketed = true;
          g.blackLegal = !g.balls.some(q => q.id !== 0 && q.id !== 8 && !q.potted);
        } else { g.shotPots++; g.score += 100 + (g.shotPots - 1) * 25; }
        g.events.push(b.id === 0 ? 'miss' : 'pot'); continue;
      }
      if (b.x < 35) { b.x = 35; b.vx = Math.abs(b.vx) * .88; }
      if (b.x > 365) { b.x = 365; b.vx = -Math.abs(b.vx) * .88; }
      if (b.y < 67) { b.y = 67; b.vy = Math.abs(b.vy) * .88; }
      if (b.y > 227) { b.y = 227; b.vy = -Math.abs(b.vy) * .88; }
      const drag = Math.exp(-1.05 * d); b.vx *= drag; b.vy *= drag;
      if (Math.hypot(b.vx, b.vy) < 3) { b.vx = 0; b.vy = 0; }
    }
    g.balls = g.balls.filter(b => !b.potted);
    let clicked = false;
    for (let i = 0; i < g.balls.length; i++) for (let j = i + 1; j < g.balls.length; j++) {
      if (collidePool(g.balls[i], g.balls[j])) clicked = true;
    }
    if (clicked && !g.events.includes('hit')) g.events.push('hit');
  }
  if (g.balls.every(b => b.vx === 0 && b.vy === 0)) finishShot(g);
}
export function poolGuide(g, angle) {
  const cue = g.balls.find(b => b.id === 0);
  if (!cue) return null;
  const dx = Math.cos(angle), dy = Math.sin(angle);
  const railX = Math.abs(dx) < .00001 ? Infinity : ((dx > 0 ? 365 : 35) - cue.x) / dx;
  const railY = Math.abs(dy) < .00001 ? Infinity : ((dy > 0 ? 227 : 67) - cue.y) / dy;
  let length = Math.min(railX, railY), hit = null;
  for (const b of g.balls) {
    if (b.id === 0) continue;
    const x = b.x - cue.x, y = b.y - cue.y, along = x * dx + y * dy;
    const perpendicular = x * x + y * y - along * along;
    if (along < 0 || perpendicular > 100) continue;
    const contact = Math.max(0, along - Math.sqrt(Math.max(0, 100 - perpendicular)));
    if (contact < length) { length = contact; hit = b; }
  }
  return { x: cue.x + dx * length, y: cue.y + dy * length, hit, length };
}
