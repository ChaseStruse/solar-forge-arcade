import test from 'node:test';
import assert from 'node:assert/strict';
import { createTennis, tennisAction, hitTennis, stepTennis } from '../frontend/tennis-physics.js';
const ready = () => { const g = createTennis(() => .5); tennisAction(g); return g; };
test('player serves, nearby balls return automatically, and power is a timed action', () => {
  const g = ready(); assert.equal(g.phase, 'rally'); assert.equal(g.ball.last, 0);
  Object.assign(g.ball, { x: 200, y: 215, z: 10, vy: 120, vx: 0, last: 1 });
  tennisAction(g); stepTennis(g, .01);
  assert.equal(g.ball.last, 0); assert.equal(g.ball.power, true); assert.equal(g.power, 0);
  assert.ok(g.ball.vy < 0); assert.ok(g.powerCooldown > 0);
});
test('net faults and first-bounce out balls award the opponent a point', () => {
  const g = ready(); Object.assign(g.ball, { x: 200, y: 145, z: 1, vz: 0, vy: -250, vx: 0 });
  stepTennis(g, .02); assert.deepEqual(g.scores, [0,1]); assert.equal(g.phase, 'point');
  const out = ready(); Object.assign(out.ball, { x: 20, y: 70, z: .1, vz: -20 });
  stepTennis(out, .02); assert.deepEqual(out.scores, [0,1]);
});
test('a second bounce awards the hitter and seven points ends the match', () => {
  const g = ready(); g.scores[0] = 6;
  Object.assign(g.ball, { x: 80, y: 70, z: .1, vz: -30, vy: 0, vx: 0, bounces: 1 });
  stepTennis(g, .02); assert.equal(g.phase, 'over'); assert.equal(g.winner, 0);
  const scores = [...g.scores]; stepTennis(g, .04); assert.deepEqual(g.scores, scores);
});
test('serves alternate and AI serves without player input', () => {
  const g = ready(); Object.assign(g.ball, { x: 20, y: 70, z: 0, vz: -20 }); stepTennis(g, .02);
  for (let i=0;i<60;i++) stepTennis(g, .02);
  assert.equal(g.server, 1); assert.equal(g.phase, 'serve');
  for (let i=0;i<45;i++) stepTennis(g, .02);
  assert.equal(g.phase, 'rally'); assert.equal(g.ball.last, 1);
});
test('pointer movement remains on the player half and aiming changes shot direction', () => {
  const g = ready(); for(let i=0;i<100;i++)stepTennis(g,.02,{target:{x:500,y:0}});
  assert.ok(g.players[0].x <= 345); assert.ok(g.players[0].y >= 165);
  const h = ready(); h.aim = -1; hitTennis(h,0,true); assert.ok(h.ball.targetX < h.players[0].x);
});
test('a complete AI match progresses without deadlocking', () => {
  const g = createTennis(() => .6);
  for(let i=0;i<20000 && g.phase!=='over';i++) {
    if(g.phase==='serve' && g.server===0)tennisAction(g);
    stepTennis(g,1/60);
  }
  assert.equal(g.phase,'over'); assert.ok(g.scores.some(n=>n===7));
});

test('tracking returns and timing power shots can win a complete match', () => {
  const g = createTennis(() => .6);
  for (let i = 0; i < 20000 && g.phase !== 'over'; i++) {
    if (g.phase === 'serve' && g.server === 0) tennisAction(g);
    if (g.ball?.last === 1 && Math.abs(g.ball.y - g.players[0].y) < 50) tennisAction(g);
    stepTennis(g, 1 / 60, { target: { x: g.ball?.last === 1 ? g.ball.targetX : 200, y: 222 } });
  }
  assert.equal(g.winner, 0);
  assert.ok(g.bestRally >= 3);
});
