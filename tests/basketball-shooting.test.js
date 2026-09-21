import test from "node:test";
import assert from "node:assert/strict";
import { shotAccuracy, shotOffset } from "../frontend/basketball-shooting.js";

test("apex shots are more accurate than standing, rising, or falling shots", () => {
  assert.equal(shotAccuracy({ onGround: true, vy: 0 }), .25);
  const apex = shotAccuracy({ onGround: false, vy: 0 });
  assert.ok(apex > shotAccuracy({ onGround: false, vy: -300 }));
  assert.ok(apex > shotAccuracy({ onGround: false, vy: 300 }));
  assert.ok(apex < 1);
});

test("both good and poor timing can make or miss, with misses outside the hoop", () => {
  for (const player of [{ onGround: true, vy: 0 }, { onGround: false, vy: 0 }]) {
    assert.ok(Math.abs(shotOffset(player, () => .1)) < 27);
    assert.ok(Math.abs(shotOffset(player, () => .99)) > 27);
  }
});
