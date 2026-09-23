import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../frontend/experiment.js', import.meta.url), 'utf8');
const frame = source.slice(source.indexOf('  function frame(){'), source.indexOf('\n  frame();'));
const vector = { set() { return this; }, copy() { return this; }, lerp() { return this; }, addScaledVector() { return this; } };

test('cabinet renders transitions and resizes but skips settled and hidden frames', () => {
  let renders = 0;
  const scope = {
    clock: { getDelta: () => 1 / 60 }, requestAnimationFrame() {},
    document: { hidden: false }, mode: 'attract', dirty: true, renderedMode: undefined,
    progress: 0, angle: .43, targetAngle: .43, reducedMotion: { matches: false },
    THREE: { MathUtils: { lerp: (a,b,t) => a+(b-a)*t, degToRad: n => n*Math.PI/180 } },
    width: 1200, height: 800, home: vector, position: vector, playPosition: vector,
    target: vector, screenCenter: vector, screenNormal: vector,
    camera: { position: vector, lookAt() {} }, scene: {}, cssScene: {},
    renderer: { render() { renders++; } }, cssRenderer: { render() {} }, placeMenu() {},
  };
  vm.createContext(scope);
  vm.runInContext(frame, scope);
  scope.frame();
  assert.equal(renders, 1);
  scope.frame();
  assert.equal(renders, 1);
  scope.mode = 'menu';
  for (let i=0; i<120; i++) scope.frame();
  assert.equal(scope.progress, 1);
  const settled = renders;
  scope.frame();
  assert.equal(renders, settled);
  scope.dirty = true;
  scope.frame();
  assert.equal(renders, settled+1);
  scope.document.hidden = true;
  scope.mode = 'attract';
  scope.frame();
  assert.equal(renders, settled+1);
  scope.document.hidden = false;
  scope.reducedMotion.matches = true;
  scope.frame();
  assert.equal(scope.progress, 0);
  assert.equal(renders, settled+2);
});
