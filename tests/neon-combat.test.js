import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, action, step, segmentHits, FLOOR } from '../frontend/neon-combat.js';
const ready = () => { const g = createGame(); g.intermission = 0; g.wave = 1; g.remaining = 1; g.spawnTime = 99; return g; };
const enemy = (x, extra = {}) => ({ x, y: FLOOR, hp: 50, maxHp: 50, kind: 'brawler', facing: -1, cooldown: 99, windup: 0, stun: 0, ...extra });
test('melee respects facing, reach, height, and cooldown', () => {
  const g = ready(); g.enemies = [enemy(220), enemy(180), enemy(260), enemy(220, { y: 180 })];
  assert.equal(action(g, 'punch'), true);
  assert.deepEqual(g.enemies.map(e => e.hp), [32, 50, 50, 50]);
  assert.equal(action(g, 'kick'), false);
});
test('double jump is limited and restored on landing', () => {
  const g = ready(); assert.ok(action(g, 'jump')); step(g, .02);
  assert.ok(action(g, 'jump')); assert.equal(action(g, 'jump'), false);
  for (let i = 0; i < 100; i++) step(g, .02);
  assert.equal(g.player.y, FLOOR); assert.ok(action(g, 'jump'));
});
test('bullet time slows threats more than the player and consumes focus', () => {
  const normal = ready(), slow = ready();
  for (const g of [normal, slow]) g.bullets.push({ x: 40, y: 100, vx: 100, vy: 0, friendly: false });
  step(normal, .04, { move: 1 }); step(slow, .04, { move: 1, slow: true });
  assert.ok(slow.bullets[0].x - 40 < (normal.bullets[0].x - 40) * .3);
  assert.ok(slow.player.x - 200 > (normal.player.x - 200) * .7);
  assert.ok(slow.player.focus < 100);
  slow.player.focus = 0; step(slow, .04, { slow: true }); assert.equal(slow.slow, false);
});
test('swept bullets hit across an entire body and reject vertical misses', () => {
  assert.ok(segmentHits(0, 215, 400, 215, enemy(200)));
  assert.equal(segmentHits(0, 180, 400, 180, enemy(200)), false);
});
test('dodge avoids bullets; taking damage gives a recovery window', () => {
  const g = ready();
  const shot = () => g.bullets.push({ x: g.player.x - 10, y: 215, vx: 300, vy: 0, friendly: false });
  action(g, 'dodge'); shot(); step(g, .04); assert.equal(g.player.hp, 100);
  g.player.dodge = 0; g.bullets = []; shot(); step(g, .04); assert.equal(g.player.hp, 88);
  shot(); step(g, .04); assert.equal(g.player.hp, 88);
});
test('kills reward combos and final wave ends with a health bonus', () => {
  const g = ready(); g.wave = 5; g.remaining = 0; g.enemies = [enemy(220, { hp: 1 })];
  g.player.focus = 20; action(g, 'kick'); assert.equal(g.score, 100); assert.equal(g.player.focus, 38);
  step(g, .02); assert.equal(g.status, 'won'); assert.equal(g.score, 1100);
});
test('empty ammo cannot fire and recharges; death stops simulation', () => {
  const g = ready(); g.player.ammo = 0; assert.equal(action(g, 'shoot'), false);
  for (let i = 0; i < 50; i++) step(g, .04);
  assert.ok(action(g, 'shoot'));
  g.player.hp = 1; g.bullets = [{ x: 190, y: 215, vx: 300, vy: 0, friendly: false }];
  step(g, .04); assert.equal(g.status, 'lost');
  const x = g.player.x; step(g, .04, { move: 1 }); assert.equal(g.player.x, x);
});
test('waves spawn the expected enemies and clear into a healing break', () => {
  const g = createGame();
  for (let i = 0; i < 40; i++) step(g, .04);
  assert.equal(g.wave, 1); assert.equal(g.enemies.length, 1); assert.equal(g.remaining, 2);
  g.player.hp = 50; g.remaining = 0; g.enemies = []; step(g, .04);
  assert.equal(g.player.hp, 68); assert.equal(g.intermission, 2);
});
