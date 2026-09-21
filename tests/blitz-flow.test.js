import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import * as rules from "../frontend/blitz-rules.js";

function game() {
  const context = new Proxy({}, { get: () => () => {}, set: () => true });
  const scope = { ...rules, Math,
    document: { querySelector: () => ({ getContext: () => context, addEventListener() {} }), addEventListener() {} },
    window: { addEventListener() {} }, requestAnimationFrame() {},
  };
  vm.createContext(scope);
  vm.runInContext(fs.readFileSync(new URL("../frontend/solar-blitz.js", import.meta.url), "utf8").replace(/^import .*;\n/, ""), scope);
  vm.runInContext("begin(); delay = 0;", scope);
  return code => vm.runInContext(code, scope);
}

test("a touchdown transfers possession; the third touchdown ends the match", () => {
  const run = game();
  run("carrier.x = 745; update(0)");
  assert.equal(run("scores[0]"), 1);
  assert.equal(run("offense"), 1);
  run("scores[0] = 2; setup(0, 700, true); delay = 0; carrier.x = 745; update(0)");
  assert.equal(run("running"), false);
});

test("passes switch player control and a defender can intercept", () => {
  const run = game();
  run("pass(1)");
  assert.equal(run("controlled.number"), 1);
  run("flight.age = .2; flight.x = 450; flight.y = 230; players[3].x = flight.x; players[3].y = flight.y; update(0)");
  assert.equal(run("offense"), 1);
  assert.equal(run("down"), 1);
});

test("defenders line up with receivers and hold coverage while one rushes", () => {
  const run = game();
  assert.equal(run("players[4].y"), run("players[1].y"));
  assert.equal(run("players[5].y"), run("players[2].y"));
  run("update(.1)");
  assert.ok(run("Math.abs(players[4].y - players[1].y)") < 2);
  assert.ok(run("Math.abs(players[5].y - players[2].y)") < 2);
  assert.ok(run("players[3].x") < 265);
});

test("AI can advance and score against an idle player", () => {
  const run = game();
  run("setup(1, 640, true); for(let i=0; i<30000 && !scores[1]; i++) update(1/60)");
  assert.ok(run("scores[1]") > 0);
});

test("defensive Space selects the nearest defender and tackles without directional input", () => {
  const run = game();
  run("setup(1, 400, true); delay = 0; aiPass = -10; carrier.x = 350; players[0].x = 100; players[0].y = 400; players[1].x = 285; players[1].y = 280; players[2].x = 700; action(' ')");
  assert.equal(run("controlled.number"), 1);
  assert.equal(run("tackleCooldown"), 2.5);
  run("for (let i = 0; i < 20 && delay === 0; i++) update(.025)");
  assert.equal(run("down"), 2);
  assert.equal(run("message"), "TACKLED!");
});

test("defensive burst cannot be refreshed by repeated presses or switching players", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; action(' '); update(.025)");
  const cooldown = run("tackleCooldown");
  const dash = run("controlled.dash");
  run("action('z'); action(' ')");
  assert.equal(run("tackleCooldown"), cooldown);
  assert.equal(run("Math.max(...players.map(p => p.dash))"), dash);
  run("tackleCooldown = 0; action(' ')");
  assert.equal(run("controlled.dash"), .35);
});

test("defensive burst gives a nearby defender an interception window", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; pass(1); flight.age = .2; flight.x = 400; flight.y = 280; flight.vx = 0; flight.vy = 0; players[0].x = 372; players[0].y = 280; action(' '); update(0)");
  assert.equal(run("offense"), 0);
  assert.equal(run("controlled"), run("carrier"));
  assert.equal(run("message"), "INTERCEPTION!");
});

test("player teammates keep up with receivers and anticipate a moving carrier", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; update(.025)");
  assert.ok(run("Math.hypot(players[1].vx, players[1].vy)") > 130);
  run("carrier.vx = -165; carrier.vy = 50");
  assert.ok(run("defensiveTarget().x") < run("carrier.x"));
  assert.ok(run("defensiveTarget().y") > run("carrier.y"));
});

test("offensive Space keeps manual dash behavior and defense cannot burst before the snap", () => {
  const run = game();
  run("action(' ')");
  assert.equal(run("controlled"), run("carrier"));
  assert.equal(run("controlled.dash"), .32);
  assert.equal(run("tackleCooldown"), 0);
  run("setup(1, 640, true); action(' ')");
  assert.equal(run("tackleCooldown"), 0);
  assert.equal(run("controlled.dash"), 0);
});
