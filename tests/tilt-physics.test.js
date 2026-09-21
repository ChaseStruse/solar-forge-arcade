import test from "node:test";
import assert from "node:assert/strict";
import { clashResult, rivalControls, roundWinner, wrapX } from "../frontend/tilt-physics.js";

test("riders wrap cleanly around both arena edges", () => {
  assert.equal(wrapX(-28), 827);
  assert.equal(wrapX(828), -27);
  assert.equal(wrapX(400), 400);
});

test("the higher rider wins a close clash", () => {
  assert.equal(clashResult({ x: 200, y: 180 }, { x: 230, y: 205 }), "player");
  assert.equal(clashResult({ x: 200, y: 230 }, { x: 230, y: 190 }), null);
  assert.equal(clashResult({ x: 200, y: 200 }, { x: 228, y: 204 }), "draw");
});

test("clashes account for the wrapped arena seam", () => {
  assert.equal(clashResult({ x: 790, y: 160 }, { x: 12, y: 185 }), "player");
});

test("the rival steers toward the player and flaps for altitude", () => {
  const controls = rivalControls({ x: 500, y: 300, vy: 20 }, { x: 350, y: 210 }, []);
  assert.deepEqual(controls, { direction: -1, flap: true });
});

test("the first duelist to five points wins", () => {
  assert.equal(roundWinner({ player: 4, rival: 3 }), null);
  assert.equal(roundWinner({ player: 5, rival: 3 }), "player");
  assert.equal(roundWinner({ player: 2, rival: 5 }), "rival");
});
