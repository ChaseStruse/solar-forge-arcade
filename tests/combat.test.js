import test from "node:test";
import assert from "node:assert/strict";
import { advanceShot, fireInterval, MAX_ATTACK_SPEED_LEVEL } from "../frontend/combat.js";

test("attack speed stops offering levels when the firing limit is reached", () => {
  assert.ok(fireInterval(MAX_ATTACK_SPEED_LEVEL - 1) > 0.16);
  assert.equal(fireInterval(MAX_ATTACK_SPEED_LEVEL), 0.16);
});

test("a long frame cannot carry a bullet past a nearby target", () => {
  const shot = { x: 0, y: 0, target: { x: 3, y: 4 } };
  advanceShot(shot, 0.05);
  assert.deepEqual([shot.x, shot.y], [3, 4]);
  advanceShot(shot, 0.05);
  assert.deepEqual([shot.x, shot.y], [3, 4]);
});
