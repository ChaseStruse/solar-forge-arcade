import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import * as rules from "../frontend/blitz-rules.js";

function game(seed = 42) {
  const randomMath = Object.create(Math);
  randomMath.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const context = new Proxy({}, { get: () => () => {}, set: () => true });
  const scope = { ...rules, Math: randomMath,
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

test("cover defenders run slightly slower than receivers while manual pursuit still leads the carrier", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; update(.025)");
  const coverageSpeed = run("Math.hypot(players[1].vx, players[1].vy)");
  assert.ok(coverageSpeed >= 120 && coverageSpeed < 130);
  run("carrier.vx = -165; carrier.vy = 50");
  assert.ok(run("defensiveTarget().x") < run("carrier.x"));
  assert.ok(run("defensiveTarget().y") > run("carrier.y"));
});

test("Space no longer selects, moves, or dashes a defender", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; const initialDefender = controlled; const initialX = controlled.x; action(' '); update(.025)");
  assert.equal(run("controlled === initialDefender"), true);
  assert.equal(run("controlled.x"), run("initialX"));
  assert.equal(run("controlled.dash"), 0);
  assert.equal(run("down"), 1);
  assert.equal(run("reactionTime"), 0);
});

test("only an opposing pass starts reaction time and control stays with the player", () => {
  const run = game();
  run("pass(1)"); assert.equal(run("reactionTime"), 0);
  run("setup(1, 640, true); delay = 0; const original = controlled; pass(1)");
  assert.equal(run("reactionTime"), 1.2);
  assert.equal(run("controlled === original"), true);
  run("const target = bestDefender(); action('z')");
  assert.equal(run("controlled === target"), true);
  assert.equal(run("reactionTime"), 1.2);
});

test("slow motion affects the ball and AI while manual movement stays responsive", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; pass(1); const ballX = flight.x; const ballVx = flight.vx; const defenderX = controlled.x; const receiverX = players[4].x; keys.add('ArrowRight'); update(.1)");
  assert.ok(Math.abs(run("flight.x - ballX") - run("ballVx * .025")) < .00001);
  assert.ok(Math.abs(run("controlled.x - defenderX") - 175 * .065) < .00001);
  assert.ok(Math.abs(run("players[4].x - receiverX")) <= 130 * .025 + .00001);
  assert.ok(Math.abs(run("clock") - .025) < .00001);
  assert.ok(Math.abs(run("reactionTime") - 1.1) < .00001);
});

test("reaction time expires once and switching cannot restart it", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; pass(1); flight.x = 400; flight.y = 110; flight.vx = 100; flight.vy = 0; for (const p of players) { p.x = 700; p.y = 440; } for (let i = 0; i < 60; i++) update(.02)");
  assert.equal(run("reactionTime"), 0);
  run("const oldX = flight.x; action('z'); update(.02)");
  assert.equal(run("reactionTime"), 0);
  assert.ok(Math.abs(run("flight.x - oldX") - 2) < .00001);
});

test("the player must move into the passing lane to intercept", () => {
  const prepare = run => run("setup(1, 640, true); delay = 0; pass(1); flight.x = 400; flight.y = 280; flight.vx = 440; flight.vy = 0; flight.age = .2; flight.targetX = 600; flight.targetY = 280; players[0].x = 100; players[0].y = 440; players[1].x = 460; players[1].y = 310; players[2].x = 100; players[2].y = 110; action('z')");
  const active = game(); prepare(active);
  assert.equal(active("controlled.number"), 1);
  active("for (let i = 0; i < 60 && offense === 1; i++) { if (controlled.y > 282) keys.add('ArrowUp'); else keys.clear(); update(1/60); }");
  assert.equal(active("offense"), 0);
  assert.equal(active("reactionTime"), 0);
  assert.equal(active("message"), "INTERCEPTION!");
  const idle = game(); prepare(idle);
  idle("for (let i = 0; i < 60; i++) update(1/60)");
  assert.equal(idle("offense"), 1);
});

test("catches and incompletions end slow motion immediately; new plays reset it", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; pass(1); flight.age = .2; players[4].x = flight.x; players[4].y = flight.y; update(0)");
  assert.equal(run("reactionTime"), 0);
  assert.equal(run("carrier.number"), 1);
  run("setup(1, 640, true); delay = 0; pass(1); flight.x = 800; update(0)");
  assert.equal(run("reactionTime"), 0);
  assert.equal(run("down"), 2);
  run("delay = 0; pass(1); setup(0, 160, true)");
  assert.equal(run("reactionTime"), 0);
});

test("offensive Space retains its directional dash", () => {
  const run = game(); run("action(' ')");
  assert.equal(run("controlled === carrier"), true);
  assert.equal(run("controlled.dash"), .32);
});

test("Nova avoids a passing lane already occupied by an idle defender", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; for (const p of players.filter(p => p.team === 0)) { p.x = 50; p.y = 450; } const aim = passDestination(players[4]); players[0].x = (carrier.x + aim.x) / 2; players[0].y = (carrier.y + aim.y) / 2");
  assert.equal(run("passingLaneClear(players[4])"), false);
  run("players[0].y = 450");
  assert.equal(run("passingLaneClear(players[4])"), true);
});

test("player cover defenders keep their man through scrambles, throws, and another receiver's catch", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; aiPass = -100; carrier.x = 300; players[1].x = 520; players[1].y = 280; players[4].x = 600; players[4].y = 150; update(.025)");
  assert.ok(run("players[1].vx") > 0, 'move toward the assigned receiver, away from the scrambling QB');
  assert.ok(run("players[1].vy") < 0);
  run("pass(2); update(.025)");
  assert.ok(run("players[1].vx") > 0, 'do not chase the pass to the other receiver');
  assert.ok(run("players[1].vy") < 0);
  run("carrier = players[5]; flight = null; reactionTime = 0; carrier.x = 300; carrier.y = 280; update(.025)");
  assert.ok(run("players[1].vx") > 0, 'stay with the same man after the other receiver catches');
  assert.equal(run("coverageTarget(players[2]).x"), run("carrier.x"), 'the carrier\'s own marker may tackle him');
});

test("manual control can leave coverage and the same assignment resumes after switching away", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; aiPass = -100; controlled = players[1]; players[1].x = 520; players[4].x = 600; keys.add('ArrowLeft'); update(.025)");
  assert.ok(run("players[1].vx") < 0);
  run("keys.clear(); controlled = players[0]; update(.025)");
  assert.ok(run("players[1].vx") > 0);
});

test("each play assigns two distinct randomized routes, and routes survive the throw", () => {
  const run = game();
  const seen = new Set();
  for (let i = 0; i < 24; i++) {
    run("setup(1, 640, true)");
    const pair = run("players.filter(p => p.team === offense && p !== carrier).map(p => p.route.name)");
    assert.notEqual(pair[0], pair[1]);
    pair.forEach(name => seen.add(name));
  }
  assert.equal(seen.size, rules.ROUTE_NAMES.length);
  run("delay = 0; const originalRoute = players[4].route; pass(1); update(.025)");
  assert.equal(run("players[4].route === originalRoute"), true);
});

test("pass leading follows a receiver's cut instead of always throwing straight ahead", () => {
  const run = game();
  run("players[1].x = 260; players[1].y = 150; players[1].route = createRoute('CROSS', 220, 150, 1); const predicted = passDestination(players[1]); pass(1)");
  assert.ok(run("flight.targetY") > 150);
  assert.equal(run("flight.targetY"), run("predicted.y"));
  assert.equal(run("players[1].route.index"), 0, 'prediction must not advance the real receiver');
});

test("Nova receivers can catch route-led passes on every route type", () => {
  for (const name of rules.ROUTE_NAMES) {
    const run = game();
    run(`setup(1, 640, true); delay = 0; players[4].route = createRoute('${name}', players[4].x, players[4].y, -1); for (const p of players.filter(p => p.team === 0)) { p.x = 50; p.y = 455; } pass(1); for (let i = 0; i < 300 && flight; i++) update(1/60)`);
    assert.equal(run("carrier?.number"), 1, name);
    assert.equal(run("offense"), 1, name);
    assert.equal(run("delay"), 0, name);
  }
});


test("man coverage reacts late to cuts without switching assignments", () => {
  const run = game();
  run("setup(1, 640, true); delay = 0; const observed = trackedCoverageTarget(players[1], 0); players[4].y = 240; carrier.y = 400; const delayed = trackedCoverageTarget(players[1], .1)");
  assert.equal(run("delayed.y"), 150);
  run("const reacted = trackedCoverageTarget(players[1], .2)");
  assert.equal(run("reacted.y"), 240);
  assert.notEqual(run("reacted.y"), run("carrier.y"));
  run("controlled = players[1]; update(.025)");
  assert.equal(run("controlled.coverageAim"), null, 'manual control discards stale tracking');
  run("setup(1, 640, true)");
  assert.equal(run("players[1].coverageAim"), null, 'new plays reset the observation');
});

test("Nova regularly attempts passes against normal man coverage across randomized plays", () => {
  let passingPlays = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const run = game(seed);
    run("setup(1, 640, true); delay = 0; let thrownAt = null; const originalPass = pass; pass = function(number) { originalPass(number); if (flight && offense === 1) thrownAt = clock; }; for (let i = 0; i < 1500 && offense === 1 && down === 1 && delay === 0 && thrownAt === null; i++) update(1/60)");
    const thrownAt = run("thrownAt");
    if (thrownAt !== null) {
      passingPlays++;
      assert.ok(thrownAt >= .65, 'give routes time to develop before the first read');
    }
  }
  assert.ok(passingPlays >= 36, `expected passing opportunities in most plays, got ${passingPlays}/60`);
});
