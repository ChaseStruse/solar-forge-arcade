import test from 'node:test';
import assert from 'node:assert/strict';
import { createPool, collidePool, shootPool, stepPool, poolGuide } from '../frontend/pool-physics.js';
const settle = g => { for(let i=0;i<1500 && g.phase==='rolling';i++)stepPool(g,1/120); };
test('rack has seven colors and an 8-ball; one shot cannot be charged twice',()=>{
 const g=createPool(); assert.equal(g.balls.length,9);
 assert.equal(shootPool(g,0,1),true); assert.equal(shootPool(g,0,1),false); assert.equal(g.shots,19);
 settle(g); assert.notEqual(g.phase,'rolling');
 assert.ok(g.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)));
});
test('equal-mass impacts transfer velocity and separating balls do not bounce twice',()=>{
 const a={x:100,y:100,vx:100,vy:0},b={x:109,y:100,vx:0,vy:0};
 collidePool(a,b); assert.ok(b.vx>95); assert.ok(a.vx<5);
 const speed=b.vx;collidePool(a,b);assert.equal(b.vx,speed);
});
test('cushions reflect balls and guide stops at the first object',()=>{
 const g=createPool();const guide=poolGuide(g,0);assert.equal(guide.hit.id,1);assert.ok(guide.x<260);
 g.balls=[{id:0,x:36,y:130,vx:-100,vy:0},{id:8,x:250,y:180,vx:0,vy:0}];g.phase='rolling';
 stepPool(g,.04);assert.ok(g.balls[0].vx>0);assert.ok(g.balls[0].x>=35);
});
test('scratches cost one extra shot and respot the cue without overlapping',()=>{
 const g=createPool();shootPool(g,0,.5);Object.assign(g.balls[0],{x:30,y:62,vx:0,vy:0});
 stepPool(g,.01);settle(g);assert.equal(g.shots,18);assert.equal(g.phase,'aim');
 const cue=g.balls.find(b=>b.id===0);assert.ok(cue);
 assert.ok(g.balls.filter(b=>b!==cue).every(b=>Math.hypot(b.x-cue.x,b.y-cue.y)>=10));
});
test('colors score points; early 8 loses and a clean final 8 wins',()=>{
 const g=createPool();g.phase='rolling';Object.assign(g.balls.find(b=>b.id===1),{x:30,y:62});
 stepPool(g,.01);assert.equal(g.score,100);assert.equal(g.balls.some(b=>b.id===1),false);
 const early=createPool();early.phase='rolling';Object.assign(early.balls.find(b=>b.id===8),{x:30,y:62});
 stepPool(early,.01);assert.equal(early.phase,'over');assert.equal(early.winner,false);
 const win=createPool();win.balls=win.balls.filter(b=>b.id===0||b.id===8);win.phase='rolling';Object.assign(win.balls.find(b=>b.id===8),{x:200,y:62});
 stepPool(win,.01);assert.equal(win.phase,'over');assert.equal(win.winner,true);
});
test('scratching on the final 8 loses; the last empty shot ends the rack',()=>{
 const g=createPool();g.balls=g.balls.filter(b=>b.id===0||b.id===8);g.phase='rolling';
 g.balls[0].x=30;g.balls[0].y=62;g.balls[1].x=370;g.balls[1].y=62;
 stepPool(g,.01);assert.equal(g.winner,false);assert.equal(g.phase,'over');
 const last=createPool();last.shots=1;shootPool(last,Math.PI,.1);settle(last);assert.equal(last.phase,'over');
});

test('a clean color pot earns a continuation shot, but a scratch does not', () => {
  const g=createPool(); g.phase='rolling'; g.shots=0;
  g.balls=[{id:0,x:100,y:147,vx:0,vy:0},{id:1,x:30,y:62,vx:0,vy:0},{id:8,x:260,y:147,vx:0,vy:0}];
  stepPool(g,.01);
  assert.equal(g.shots,1); assert.equal(g.phase,'aim');
  const scratch=createPool();scratch.phase='rolling';scratch.shots=10;
  scratch.balls=[{id:0,x:30,y:62,vx:0,vy:0},{id:1,x:370,y:62,vx:0,vy:0},{id:8,x:260,y:147,vx:0,vy:0}];
  stepPool(scratch,.01);assert.equal(scratch.shots,9);
});
