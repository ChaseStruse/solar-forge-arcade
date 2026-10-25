import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseShot, createPuck, novaPlan, puckAction, stepPuck, strike, RINK, POSSESSION_SECONDS, WIN_SCORE } from '../frontend/puck-physics.js';

const seeded = seed => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const live = (random = () => .5) => { const g = createPuck(random); stepPuck(g, .04); for (let i = 0; i < 30 && g.phase !== 'play'; i++) stepPuck(g, .04); return g; };

test('a mallet reflects the puck and adds its own motion', () => {
  const puck = { x: 115, y: 150, vx: -100, vy: 0 };
  assert.equal(strike(puck, { x: 100, y: 150, vx: 200, vy: 0 }), true);
  assert.ok(puck.vx > 300);
  assert.ok(puck.x >= 120);
  const away = { x: 115, y: 150, vx: 400, vy: 0 };
  assert.equal(strike(away, { x: 100, y: 150, vx: 0, vy: 0 }), false);
});

test('pucks rebound off rails and score only through the goal mouth', () => {
  const g = live(); g.mallets[1].y = 60;
  g.puck = { x: 365, y: 70, vx: 300, vy: 0 }; stepPuck(g, .02);
  assert.ok(g.puck.vx < 0); assert.deepEqual(g.scores, [0, 0]);
  const h = live(); h.mallets[1].y = 230;
  h.puck = { x: 368, y: 150, vx: 500, vy: 0 }; stepPuck(h, .04);
  assert.deepEqual(h.scores, [1, 0]); assert.equal(h.phase, 'point');
});

test('mallets stay on their own half', () => {
  const g = live();
  for (let i = 0; i < 100; i++) stepPuck(g, .02, { target: { x: 390, y: 0 } });
  assert.ok(g.mallets[0].x <= RINK.mid - 13); assert.ok(g.mallets[0].y >= RINK.top + 13);
  assert.ok(g.mallets[1].x >= RINK.mid + 13);
});

test('smash is a short, recharging boost', () => {
  const g = live();
  assert.equal(puckAction(g), true); assert.equal(puckAction(g), false);
  for (let i = 0; i < 30; i++) stepPuck(g, .04);
  assert.equal(g.smash, 0); assert.equal(puckAction(g), true);
});

test('Nova blocks a shot on goal at the crossing point, including rail banks', () => {
  const g = live(); g.brain.skill = 1;
  g.puck = { x: 220, y: 60, vx: 400, vy: -300 };
  const plan = novaPlan(g, 1);
  assert.equal(g.brain.mode, 'defend');
  assert.ok(plan.x > 320);
  assert.ok(plan.y > RINK.goalTop - 20 && plan.y < RINK.goalBottom + 20);
});

test('Nova circles goal-side before striking a slow puck', () => {
  const g = live(); g.brain.skill = 1;
  g.mallets[1] = { x: 240, y: 150, vx: 0, vy: 0 };
  g.puck = { x: 290, y: 150, vx: 0, vy: 0 };
  const plan = novaPlan(g, 1);
  assert.equal(g.brain.mode, 'attack');
  assert.notEqual(Math.round(plan.y), 150, 'never drives straight through the puck toward its own goal');
});

test('shot selection banks away from a mallet guarding the straight line', () => {
  const straight = chooseShot({ x: 300, y: 150 }, { x: 60, y: 40 });
  assert.equal(straight.y, 150);
  const bank = chooseShot({ x: 300, y: 150 }, { x: 80, y: 150 });
  assert.notEqual(bank.y, 150);
});

test('a puck held on one half for seven seconds goes to the other side', () => {
  const g = live();
  for (let i = 0; i < (POSSESSION_SECONDS + .5) * 50 && g.phase === 'play'; i++) stepPuck(g, .02);
  assert.equal(g.phase, 'point'); assert.equal(g.serveTo, 1);
  for (let i = 0; i < 60 && g.phase !== 'play'; i++) stepPuck(g, .02);
  assert.ok(g.puck.x > RINK.mid);
});

test('Nova finishes a match against an idle player and adapts its skill', () => {
  const g = createPuck(seeded(3));
  for (let i = 0; i < 60 * 600 && g.phase !== 'over'; i++) { stepPuck(g, 1 / 60); g.events = []; }
  assert.equal(g.phase, 'over'); assert.equal(g.winner, 1); assert.equal(g.scores[1], WIN_SCORE);
  assert.ok(g.brain.skill < g.brain.baseSkill, 'a leading Nova eases off');
});

test('a human-paced player can score against Nova', () => {
  let goals = 0;
  for (const seed of [1, 2, 3]) {
    const g = createPuck(seeded(seed)), seen = [];
    for (let i = 0; i < 60 * 240 && g.phase !== 'over'; i++) {
      seen.push({ ...g.puck }); const p = seen.length > 9 ? seen.shift() : seen[0], m = g.mallets[0];
      const t = p.x < RINK.mid ? { x: p.x - 10, y: p.y } : { x: 55, y: 150 + (p.y - 150) * .5 };
      stepPuck(g, 1 / 60, { x: Math.abs(t.x - m.x) > 3 ? Math.sign(t.x - m.x) : 0, y: Math.abs(t.y - m.y) > 3 ? Math.sign(t.y - m.y) : 0 });
      g.events = [];
    }
    goals += g.scores[0];
  }
  assert.ok(goals > 0);
});
