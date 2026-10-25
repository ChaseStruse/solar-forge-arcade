// Solar Puck: browser-local air hockey on the 400 × 280 playfield. Sol defends
// the left goal and Nova (the AI) defends the right.
import { adaptSkill, aimError, clamp, createBrain, extrapolate, intercept, perceive, predictCrossingX, reflect, resetPerception, think } from './npc-brain.js';

export const RINK = { left: 30, right: 370, top: 48, bottom: 252, mid: 200, goalTop: 120, goalBottom: 180 };
export const PUCK_RADIUS = 7;
export const MALLET_RADIUS = 13;
export const WIN_SCORE = 7;
export const POSSESSION_SECONDS = 7;
const MAX_PUCK = 520, KEY_SPEED = 250, DRAG_SPEED = 430, SMASH_SECONDS = .2;
const centerY = (RINK.top + RINK.bottom) / 2;

export function createPuck(random = Math.random) {
  const g = { scores: [0, 0], phase: 'serve', wait: .9, events: [], random, winner: -1, rally: 0, bestRally: 0,
    smash: 0, smashCooldown: 0, lastHit: -1, message: 'FACE-OFF',
    brain: createBrain({ skill: .62, reaction: [.06, .2], random }),
    mallets: [{ x: 80, y: centerY, vx: 0, vy: 0 }, { x: 320, y: centerY, vx: 0, vy: 0 }],
    puck: { x: 140, y: centerY, vx: 0, vy: 0 } };
  return g;
}

export function puckAction(g) {
  if (g.phase !== 'play' || g.smashCooldown > 0) return false;
  g.smash = SMASH_SECONDS; g.smashCooldown = .9; g.events.push('power');
  return true;
}

function limits(team) {
  const r = MALLET_RADIUS;
  return team === 0 ? { left: RINK.left + r, right: RINK.mid - r, top: RINK.top + r, bottom: RINK.bottom - r }
    : { left: RINK.mid + r, right: RINK.right - r, top: RINK.top + r, bottom: RINK.bottom - r };
}

function steer(mallet, team, target, speed, dt) {
  const box = limits(team), oldX = mallet.x, oldY = mallet.y;
  const tx = clamp(target.x, box.left, box.right), ty = clamp(target.y, box.top, box.bottom);
  const dx = tx - mallet.x, dy = ty - mallet.y, length = Math.hypot(dx, dy);
  const scale = length ? Math.min(1, speed * dt / length) : 0;
  mallet.x += dx * scale; mallet.y += dy * scale;
  mallet.vx = dt > 0 ? (mallet.x - oldX) / dt : 0; mallet.vy = dt > 0 ? (mallet.y - oldY) / dt : 0;
}

/** Infinite-mass mallet: reflect the puck's velocity relative to the mallet. */
export function strike(puck, mallet, boost = 1) {
  const dx = puck.x - mallet.x, dy = puck.y - mallet.y, distance = Math.hypot(dx, dy), reach = PUCK_RADIUS + MALLET_RADIUS;
  if (distance >= reach) return false;
  const nx = distance > 1e-6 ? dx / distance : 1, ny = distance > 1e-6 ? dy / distance : 0;
  puck.x = mallet.x + nx * reach; puck.y = mallet.y + ny * reach;
  const approach = (puck.vx - mallet.vx) * nx + (puck.vy - mallet.vy) * ny;
  if (approach >= 0) return false;
  puck.vx -= (1 + .9) * approach * nx * boost; puck.vy -= (1 + .9) * approach * ny * boost;
  const speed = Math.hypot(puck.vx, puck.vy), cap = MAX_PUCK * (boost > 1 ? 1.15 : 1);
  if (speed > cap) { puck.vx *= cap / speed; puck.vy *= cap / speed; }
  return true;
}

function inMouth(y) { return y > RINK.goalTop && y < RINK.goalBottom; }

function goal(g, team) {
  g.scores[team]++; g.phase = 'point'; g.wait = 1.1; g.rally = 0;
  g.events.push(team === 0 ? 'score' : 'miss');
  g.message = team === 0 ? 'SOL SCORES!' : 'NOVA SCORES';
  adaptSkill(g.brain, g.scores[1], g.scores[0], { step: .06, min: .28, max: .92 });
  resetPerception(g.brain);
  if (g.scores[team] >= WIN_SCORE) { g.phase = 'over'; g.winner = team; g.events.push('win'); }
  // The side that conceded gets the puck on its own half.
  g.serveTo = 1 - team;
}

function movePuck(g, d) {
  const p = g.puck, r = PUCK_RADIUS;
  p.x += p.vx * d; p.y += p.vy * d;
  if (p.y < RINK.top + r) { p.y = RINK.top + r; p.vy = Math.abs(p.vy) * .92; g.events.push('bounce'); }
  if (p.y > RINK.bottom - r) { p.y = RINK.bottom - r; p.vy = -Math.abs(p.vy) * .92; g.events.push('bounce'); }
  if (p.x < RINK.left + r) {
    if (inMouth(p.y)) { if (p.x < RINK.left - r) goal(g, 1); }
    else { p.x = RINK.left + r; p.vx = Math.abs(p.vx) * .92; g.events.push('bounce'); }
  }
  if (p.x > RINK.right - r) {
    if (inMouth(p.y)) { if (p.x > RINK.right + r) goal(g, 0); }
    else { p.x = RINK.right - r; p.vx = -Math.abs(p.vx) * .92; g.events.push('bounce'); }
  }
}

/**
 * Nova's plan for this frame: a point to move toward and a speed. It reads a
 * delayed view of the puck, then defends, attacks, or guards.
 */
export function novaPlan(g, dt) {
  const brain = g.brain, me = g.mallets[1], sol = g.mallets[0];
  const seen = perceive(brain, dt, () => ({ ...g.puck, aimError: aimError(brain, 30) }));
  const bounds = { left: RINK.left + PUCK_RADIUS, right: RINK.right - PUCK_RADIUS, top: RINK.top + PUCK_RADIUS, bottom: RINK.bottom - PUCK_RADIUS };
  const puck = extrapolate(seen, brain.age);
  puck.y = reflect(puck.y, bounds.top, bounds.bottom);
  const speed = 215 + 115 * brain.skill;
  const home = { x: RINK.right - 42, y: centerY };
  const puckSpeed = Math.hypot(puck.vx, puck.vy);
  const leaving = puck.vx < -40 && puckSpeed > 140;
  const attackable = puckSpeed < 200 + 80 * brain.skill;
  const goalSide = me.x > puck.x + 10;

  // Threat: the puck will cross Nova's goal line inside the mouth (rail
  // banks included). Block it unless a safe, slow puck can be attacked.
  const goalLine = puck.vx > 40 ? predictCrossingX(puck, RINK.right - PUCK_RADIUS, bounds) : null;
  const threat = goalLine && goalLine.y > RINK.goalTop - 14 && goalLine.y < RINK.goalBottom + 14;
  if (threat && !(attackable && goalSide && puck.x > RINK.mid)) {
    const guardX = RINK.right - 30;
    const deep = puck.x > guardX - 6;
    const crossing = deep ? goalLine : predictCrossingX(puck, guardX, bounds);
    // Meet it off-centre so the block deflects away from Sol instead of
    // returning a predictable straight line.
    if (brain.mode !== 'defend') brain.deflect = (sol.y > centerY ? 1 : -1) * (3 + 5 * brain.skill) + aimError(brain, 4);
    think(brain, 'defend', dt);
    return { x: deep ? RINK.right - 16 : guardX - 6, y: clamp(crossing.y + brain.deflect, RINK.goalTop - 16, RINK.goalBottom + 16), speed: speed * 1.1 };
  }

  if (puck.x > RINK.mid - 4 && !leaving && attackable) {
    think(brain, 'attack', dt);
    const meet = intercept(me, speed * .8, puck, .5);
    meet.x = clamp(reflect(meet.x, bounds.left, bounds.right), RINK.mid - 6, bounds.right);
    meet.y = reflect(meet.y, bounds.top, bounds.bottom);
    const reach = MALLET_RADIUS + PUCK_RADIUS;
    // Pinned against Nova's back wall: sweep it out from the side instead.
    if (meet.x > RINK.right - 24) {
      const side = meet.y < centerY ? 1 : -1;
      return { x: meet.x - 6, y: meet.y + side * reach * .8, speed };
    }
    // Get goal-side of the puck first, circling wide so it is never knocked
    // toward Nova's own net.
    if (me.x < meet.x + 8) {
      const side = me.y < meet.y ? -1 : 1, wide = Math.abs(me.y - meet.y) < reach + 6;
      return wide ? { x: me.x, y: meet.y + side * (reach + 14), speed } : { x: meet.x + reach + 10, y: meet.y + side * (reach + 8), speed };
    }
    const aim = chooseShot(meet, sol, puck.aimError);
    const ux = aim.x - meet.x, uy = aim.y - meet.y, length = Math.hypot(ux, uy) || 1;
    const behind = { x: meet.x - ux / length * (reach + 6), y: meet.y - uy / length * (reach + 6) };
    if (Math.hypot(me.x - behind.x, me.y - behind.y) < 9) {
      return { x: meet.x + ux / length * 45, y: meet.y + uy / length * 45, speed: speed * 1.2 };
    }
    return { ...behind, speed };
  }

  // Puck on Sol's half: guard the line from the puck to the goal, shading
  // further forward when sharper.
  think(brain, 'guard', dt);
  const depth = 46 + 40 * brain.skill;
  const gx = RINK.right, gy = centerY, dx = puck.x - gx, dy = puck.y - gy, length = Math.hypot(dx, dy) || 1;
  return { x: Math.min(home.x, gx + dx / length * depth), y: gy + dy / length * depth, speed: speed * .85 };
}

/** Pick the straight or banked line to Sol's goal that passes furthest from Sol's mallet. */
export function chooseShot(from, sol, error = 0) {
  const goalX = RINK.left - 10, top = RINK.top + PUCK_RADIUS, bottom = RINK.bottom - PUCK_RADIUS;
  const options = [
    { x: goalX, y: centerY + error },
    { x: goalX, y: 2 * top - (centerY + error) },    // bank off the top rail
    { x: goalX, y: 2 * bottom - (centerY + error) }, // bank off the bottom rail
  ];
  let best = options[0], bestGap = -Infinity;
  for (const option of options) {
    // Unfold the bank to measure the gap against Sol's mirrored mallet position.
    const mirror = option.y < top ? { x: sol.x, y: 2 * top - sol.y } : option.y > bottom ? { x: sol.x, y: 2 * bottom - sol.y } : sol;
    const gap = distanceToSegment(mirror, from, option) - (option === options[0] ? 0 : 12);
    if (gap > bestGap) { bestGap = gap; best = option; }
  }
  return best;
}

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy || 1;
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / length, 0, 1);
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

export function stepPuck(g, elapsed, input = {}) {
  if (g.phase === 'over') return;
  const dt = clamp(elapsed, 0, .04);
  g.smash = Math.max(0, g.smash - dt); g.smashCooldown = Math.max(0, g.smashCooldown - dt);
  if (g.phase === 'point' || g.phase === 'serve') {
    g.wait -= dt;
    if (g.phase === 'point' && g.wait <= 0) {
      g.phase = 'serve'; g.wait = .6;
      g.puck = { x: g.serveTo === 1 ? 260 : 140, y: centerY, vx: 0, vy: 0 };
      g.mallets[0] = { x: 80, y: centerY, vx: 0, vy: 0 }; g.mallets[1] = { x: 320, y: centerY, vx: 0, vy: 0 };
      g.message = g.serveTo === 1 ? 'NOVA\'S PUCK' : 'YOUR PUCK';
    } else if (g.phase === 'serve' && g.wait <= 0) { g.phase = 'play'; g.message = 'PUCK LIVE'; }
    if (g.phase !== 'play') return;
  }
  const sol = g.mallets[0], nova = g.mallets[1];
  const plan = novaPlan(g, dt);
  const steps = Math.max(1, Math.ceil(dt / .004)), d = dt / steps;
  const solSpeed = (input.target ? DRAG_SPEED : KEY_SPEED) * (g.smash > 0 ? 1.6 : 1);
  for (let i = 0; i < steps && g.phase === 'play'; i++) {
    if (input.target) steer(sol, 0, input.target, solSpeed, d);
    else {
      const dx = input.x || 0, dy = input.y || 0, norm = Math.hypot(dx, dy) || 1;
      steer(sol, 0, { x: sol.x + dx / norm * 50, y: sol.y + dy / norm * 50 }, dx || dy ? solSpeed : 0, d);
    }
    steer(nova, 1, plan, plan.speed, d);
    movePuck(g, d);
    if (g.phase !== 'play') break;
    for (const [team, mallet] of [[0, sol], [1, nova]]) {
      if (strike(g.puck, mallet, team === 0 && g.smash > 0 ? 1.25 : 1)) {
        if (g.lastHit !== team) { g.rally++; g.bestRally = Math.max(g.bestRally, g.rally); }
        g.lastHit = team; g.events.push(team === 0 && g.smash > 0 ? 'power' : 'hit');
        if (team === 0 && g.smash > 0) { g.smash = 0; g.message = 'SMASH!'; }
      }
    }
  }
  // Seven-second rule: a puck held on one half goes to the other side.
  const half = g.puck.x < RINK.mid ? 0 : 1;
  g.sideTime = half === g.side ? (g.sideTime || 0) + dt : 0; g.side = half;
  if (g.phase === 'play' && g.sideTime > POSSESSION_SECONDS) {
    g.phase = 'point'; g.wait = .5; g.serveTo = 1 - half; g.sideTime = 0;
    g.message = half === 0 ? 'SEVEN SECONDS / NOVA\'S PUCK' : 'SEVEN SECONDS / YOUR PUCK';
    g.events.push('miss');
  }
  const drag = Math.exp(-.28 * dt);
  g.puck.vx *= drag; g.puck.vy *= drag;
}
