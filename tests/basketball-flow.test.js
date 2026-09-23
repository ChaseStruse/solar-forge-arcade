import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import * as physics from "../frontend/volley-physics.js";
import * as shooting from "../frontend/basketball-shooting.js";

test("scoring resets jump allowance and accepts two jumps during the inbound delay", () => {
  const scope = {
    ...physics, ...shooting, Math,
    document: { querySelector: () => ({ getContext: () => ({}), addEventListener() {} }), addEventListener() {} },
    window: { addEventListener() {} },
    requestAnimationFrame() {},
  };
  vm.createContext(scope);
  const code = fs.readFileSync(new URL("../frontend/solar-basketball.js", import.meta.url), "utf8").replace(/^import .*;\n/gm, "");
  vm.runInContext(code, scope);
  vm.runInContext('state.running = true; state.player.jumpsUsed = 2; awardPoint("player"); jump(state.player);', scope);
  assert.equal(vm.runInContext("state.player.jumpsUsed", scope), 1);
  assert.equal(vm.runInContext("state.player.vy", scope), -455);
  vm.runInContext("jump(state.player); jump(state.player);", scope);
  assert.equal(vm.runInContext("state.player.jumpsUsed", scope), 2);
});

test('Nova jumps before shooting and releases near the apex', () => {
  const scope = {
    ...physics, ...shooting, Math,
    document: { querySelector: () => ({ getContext: () => ({}), addEventListener() {} }), addEventListener() {} },
    window: { addEventListener() {} }, requestAnimationFrame() {},
  };
  vm.createContext(scope);
  vm.runInContext(fs.readFileSync(new URL('../frontend/solar-basketball.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, ''), scope);
  vm.runInContext('state.running=true; resetRally("rival"); state.serveDelay=0; state.rival.x=230; update(.016)', scope);
  assert.equal(vm.runInContext('owner', scope), 'rival');
  assert.equal(vm.runInContext('state.rival.onGround', scope), false);
  for (let i=0; i<40 && vm.runInContext('owner', scope)==='rival'; i++) vm.runInContext('update(.016)', scope);
  assert.equal(vm.runInContext('owner', scope), null);
  assert.ok(vm.runInContext('Math.abs(state.rival.vy)<65', scope));
});
