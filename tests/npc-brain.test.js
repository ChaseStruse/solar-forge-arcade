import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptSkill, aimError, createBrain, extrapolate, intercept, perceive, predictBallistic, predictCrossingX, reachablePoint, reflect, separation, steerAround } from '../frontend/npc-brain.js';

test('perception holds a snapshot until the reaction timer expires, and tracks its age', () => {
  const brain = createBrain({ skill: .5, reaction: [.1, .3], random: () => 0 });
  let reads = 0;
  const observe = () => ({ reads: ++reads });
  assert.equal(perceive(brain, .016, observe).reads, 1);
  assert.equal(perceive(brain, .05, observe).reads, 1);
  assert.ok(Math.abs(brain.age - .05) < 1e-9);
  assert.equal(perceive(brain, .2, observe).reads, 2);
  assert.equal(brain.age, 0);
});

test('stale observations extrapolate along their motion, including gravity', () => {
  const seen = extrapolate({ x: 0, y: 0, vx: 100, vy: -50 }, .5, 200);
  assert.deepEqual([seen.x, seen.y, seen.vy], [50, 0, 50]);
});

test('skill rubber-bands toward the score within limits and scales aim error', () => {
  const brain = createBrain({ skill: .6, random: () => 1 });
  assert.equal(adaptSkill(brain, 0, 3, { step: .1 }), .9);
  assert.equal(adaptSkill(brain, 9, 0, { step: .1 }), .25);
  brain.skill = 1; assert.equal(aimError(brain, 40), 0);
  brain.skill = .5; assert.equal(aimError(brain, 40), 20);
});

test('reflection and wall-aware predictions fold motion back inside the bounds', () => {
  assert.equal(reflect(110, 0, 100), 90);
  assert.equal(reflect(-30, 0, 100), 30);
  const crossing = predictCrossingX({ x: 0, y: 50, vx: 100, vy: 100 }, 100, { top: 0, bottom: 100 });
  assert.equal(crossing.time, 1);
  assert.equal(crossing.y, 50);
  assert.equal(predictCrossingX({ x: 0, y: 0, vx: -10, vy: 0 }, 100), null);
  const arc = predictBallistic({ x: 0, y: 0, vx: 300, vy: 0 }, { gravity: 600, contactY: 300, right: 200 });
  assert.ok(arc.x < 200 && arc.x > 0, 'the arc rebounds from the right wall');
  assert.ok(Math.abs(arc.time - 1) < .02);
});

test('pursuit leads a moving target and reachable points respect chaser speed', () => {
  const lead = intercept({ x: 0, y: 0 }, 200, { x: 100, y: 0, vx: 0, vy: 100 });
  assert.ok(lead.y > 0 && Math.abs(Math.hypot(lead.x, lead.y) - 200 * lead.time) < 1e-6);
  const reachable = reachablePoint({ x: 0, y: 0 }, 50, t => ({ x: 100 - 100 * t, y: 0 }));
  assert.ok(reachable && reachable.time >= 2 / 3 - 1e-9 && reachable.time <= .7 + 1e-9);
  assert.equal(reachablePoint({ x: 0, y: 0 }, 1, t => ({ x: 500, y: t }), { maxTime: .5 }), null);
});

test('separation spreads neighbours and steering bends around danger zones', () => {
  const a = { x: 0, y: 0 }, b = { x: 5, y: 0 };
  assert.ok(separation(a, [a, b], 20).x < 0);
  const heading = steerAround({ x: 20, y: -100 }, { x: 0, y: 100 }, [{ x: 0, y: 0, radius: 80 }]);
  assert.ok(heading.x > .3, 'turns aside rather than driving through the danger');
  const calm = steerAround({ x: 0, y: -100 }, { x: 0, y: 100 }, [{ x: 0, y: 0, radius: 80 }], 0);
  assert.ok(Math.abs(calm.x) < 1e-9 && calm.y === 1, 'no caution walks straight at the goal');
});
