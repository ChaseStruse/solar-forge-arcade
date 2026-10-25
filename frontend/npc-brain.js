// Shared opponent intelligence. Every helper is DOM-free and deterministic for a
// given random source, so each game keeps its own rules while NPCs share how
// they perceive, predict, aim, and adapt.
export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

/**
 * A brain sees the world through delayed snapshots (human reaction time) and
 * carries a 0–1 skill that scales reaction, aim error, and positioning.
 */
export function createBrain({ skill = .6, reaction = [.12, .22], random = Math.random } = {}) {
  return { skill, baseSkill: skill, reaction, random, timer: 0, seen: null, age: 0, mode: 'idle', modeTime: 0 };
}

/**
 * Return the last observation; take a fresh one once the reaction timer
 * expires. `brain.age` is how stale the observation is, for extrapolation.
 */
export function perceive(brain, dt, observe) {
  brain.timer -= dt; brain.age += dt;
  if (!brain.seen || brain.timer <= 0) {
    brain.seen = observe(); brain.age = 0;
    const [fast, slow] = brain.reaction;
    // Sharper opponents refresh closer to their fastest reaction time.
    brain.timer = fast + (slow - fast) * (1 - brain.skill) * (.5 + brain.random() * .5);
  }
  return brain.seen;
}

/** Forget the current observation, e.g. after a point or a new play. */
export function resetPerception(brain) {
  brain.seen = null; brain.timer = 0; brain.age = 0;
}

/**
 * Project a stale observation forward along its own motion. Smooth flight is
 * predictable; only surprises such as a new hit wait for the next read.
 */
export function extrapolate(seen, age, gravity = 0) {
  const vx = seen.vx || 0, vy = seen.vy || 0;
  return { ...seen, x: seen.x + vx * age, y: seen.y + vy * age + gravity * age * age / 2, vy: vy + gravity * age };
}

/** Switch behaviour modes, tracking how long the current one has lasted. */
export function think(brain, mode, dt = 0) {
  if (brain.mode !== mode) { brain.mode = mode; brain.modeTime = 0; }
  else brain.modeTime += dt;
  return mode;
}

/**
 * Rubber-band skill toward the score: trailing opponents sharpen and leaders
 * ease off slightly, so matches stay close without becoming unwinnable.
 */
export function adaptSkill(brain, own, opponent, { step = .06, min = .25, max = .95 } = {}) {
  brain.skill = clamp(brain.baseSkill + (opponent - own) * step, min, max);
  return brain.skill;
}

/** Symmetric random error that shrinks as skill rises. */
export function aimError(brain, spread) {
  return (brain.random() * 2 - 1) * spread * (1 - brain.skill);
}

/** Reflect a coordinate inside [low, high], as a ball does off walls. */
export function reflect(value, low, high) {
  const span = high - low;
  if (span <= 0) return low;
  let offset = (value - low) % (2 * span);
  if (offset < 0) offset += 2 * span;
  return low + (offset > span ? 2 * span - offset : offset);
}

/** Straight-line motion with optional wall reflections on either axis. */
export function predictLinear(body, seconds, bounds = {}) {
  let x = body.x + (body.vx || 0) * seconds, y = body.y + (body.vy || 0) * seconds;
  if (bounds.left !== undefined) x = reflect(x, bounds.left, bounds.right);
  if (bounds.top !== undefined) y = reflect(y, bounds.top, bounds.bottom);
  return { x, y };
}

/**
 * When will a straight-moving body reach `lineX`, accounting for bounces off
 * the top and bottom walls? Returns null if it is moving away.
 */
export function predictCrossingX(body, lineX, bounds = {}) {
  const vx = body.vx || 0;
  if (Math.abs(vx) < 1e-6 || Math.sign(lineX - body.x) !== Math.sign(vx)) return null;
  const time = (lineX - body.x) / vx;
  return { time, ...predictLinear(body, time, { top: bounds.top, bottom: bounds.bottom }), x: lineX };
}

/**
 * Ballistic prediction (y grows downward). Finds when a falling body descends
 * through `contactY`, bouncing off side walls. Small steps keep wall rebounds
 * and drag-free arcs exact enough for game AI.
 */
export function predictBallistic(body, { gravity, contactY, left = -Infinity, right = Infinity, maxTime = 2, step = 1 / 120 }) {
  let { x, y } = body, vx = body.vx || 0, vy = body.vy || 0;
  for (let t = 0; t <= maxTime; t += step) {
    if (vy > 0 && y >= contactY) return { x, y, time: t };
    vy += gravity * step; x += vx * step; y += vy * step;
    if (x < left) { x = 2 * left - x; vx = -vx; }
    if (x > right) { x = 2 * right - x; vx = -vx; }
  }
  return { x, y, time: maxTime };
}

/**
 * Pursuit with lead: the earliest point where a chaser moving at `speed` can
 * meet a target travelling at constant velocity. Falls back to the target's
 * position a short horizon ahead when it cannot be caught.
 */
export function intercept(chaser, speed, target, horizon = 1.5) {
  const dx = target.x - chaser.x, dy = target.y - chaser.y;
  const vx = target.vx || 0, vy = target.vy || 0;
  const a = vx * vx + vy * vy - speed * speed;
  const b = 2 * (dx * vx + dy * vy);
  const c = dx * dx + dy * dy;
  let time;
  if (Math.abs(a) < 1e-6) time = b < 0 ? -c / b : NaN;
  else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const root = Math.sqrt(disc);
      time = [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter(t => t > 0).sort((p, q) => p - q)[0];
    }
  }
  if (!(time > 0)) time = horizon;
  time = Math.min(time, horizon);
  return { x: target.x + vx * time, y: target.y + vy * time, time };
}

/** Earliest point along a sampled path that the chaser can reach in time. */
export function reachablePoint(chaser, speed, pathAt, { maxTime = 1.5, step = 1 / 30, slack = 0 } = {}) {
  for (let t = step; t <= maxTime; t += step) {
    const point = pathAt(t);
    if (Math.hypot(point.x - chaser.x, point.y - chaser.y) <= speed * t + slack) return { ...point, time: t };
  }
  return null;
}

/** −1, 0 or 1 toward a target on one axis, with a dead zone to avoid jitter. */
export function axisToward(from, to, deadZone = 8) {
  return Math.abs(to - from) <= deadZone ? 0 : Math.sign(to - from);
}

/** Push away from crowded neighbours so groups spread out instead of stacking. */
export function separation(self, others, radius) {
  let x = 0, y = 0;
  for (const other of others) {
    if (other === self) continue;
    const dx = self.x - other.x, dy = (self.y ?? 0) - (other.y ?? 0), distance = Math.hypot(dx, dy);
    if (distance >= radius) continue;
    // Coincident neighbours split deterministically by identity order.
    const weight = (radius - distance) / radius;
    if (distance < 1e-6) { x += (others.indexOf(self) < others.indexOf(other) ? -1 : 1) * weight; continue; }
    x += dx / distance * weight; y += dy / distance * weight;
  }
  return { x, y };
}

/**
 * Head toward a goal while bending around danger zones (circles with a
 * radius and optional margin). Samples headings on either side of the goal
 * direction and scores each look-ahead point for progress minus how deep it
 * sits inside danger. `caution` (0–1) scales the fear; 0 walks straight.
 */
export function steerAround(agent, goal, dangers, caution = 1, { samples = 9, spread = Math.PI * .8, lookahead = 45 } = {}) {
  const toGoal = Math.atan2(goal.y - agent.y, goal.x - agent.x), start = Math.hypot(goal.x - agent.x, goal.y - agent.y);
  let best = { x: Math.cos(toGoal), y: Math.sin(toGoal) }, bestScore = -Infinity;
  if (caution <= 0) return best;
  for (let i = -samples; i <= samples; i++) {
    const angle = toGoal + i / samples * spread, hx = Math.cos(angle), hy = Math.sin(angle);
    const x = agent.x + hx * lookahead, y = agent.y + hy * lookahead;
    let danger = 0;
    for (const zone of dangers) {
      const edge = zone.radius + (zone.margin ?? 30), depth = (edge - Math.hypot(x - zone.x, y - zone.y)) / edge;
      if (depth > 0) danger += depth * (zone.weight ?? 1);
    }
    const score = (start - Math.hypot(goal.x - x, goal.y - y)) / lookahead - danger * caution * 4;
    if (score > bestScore) { bestScore = score; best = { x: hx, y: hy }; }
  }
  return best;
}
