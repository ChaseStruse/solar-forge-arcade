import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
function game() {
  const node={width:800,height:560,getContext:()=>({}),addEventListener(){}};
  const scope={Math,document:{querySelector:()=>node,addEventListener(){}},window:{addEventListener(){}},requestAnimationFrame(){}};
  vm.createContext(scope);
  vm.runInContext(readFileSync(new URL('../frontend/brick-breaker.js',import.meta.url),'utf8'),scope);
  return code=>vm.runInContext(code,scope);
}
test('center paddle hits cannot trap the ball in a vertical loop',()=>{
  const run=game();
  run('state.running=true;state.serving=false;state.combo=4;state.ball={x:400,y:499,vx:0,vy:300};update(.02)');
  assert.ok(run('Math.abs(state.ball.vx)>=65 && state.ball.vy<0'));
  assert.equal(run('state.combo'),0);
});
test('consecutive bricks reward streaks and clearing a level restores a life',()=>{
  const run=game();
  run('state.running=true;state.serving=false;state.combo=2;state.lives=2;state.bricks=[{x:390,y:100,row:0,active:true}];state.ball={x:400,y:90,vx:0,vy:300};update(.02)');
  assert.equal(run('state.score'),30);
  assert.equal(run('state.lives'),3);
  assert.equal(run('state.level'),2);
});
