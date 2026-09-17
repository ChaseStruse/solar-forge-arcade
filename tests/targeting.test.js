import test from "node:test";
import assert from "node:assert/strict";
import { canTarget, segmentHitsCircle } from "../frontend/targeting.js";

const forge = { x: 400, y: 280 };
const leftTower = { x: 250, y: 280 };
const rightTower = { x: 550, y: 280 };

test("each tower can target nearby enemies on its side, but not through the forge", () => {
  assert.equal(canTarget(leftTower, { x: 150, y: 280 }, forge, 44, 175), true);
  assert.equal(canTarget(rightTower, { x: 650, y: 280 }, forge, 44, 175), true);
  assert.equal(canTarget(leftTower, { x: 500, y: 280 }, forge, 44, 400), false);
  assert.equal(canTarget(rightTower, { x: 300, y: 280 }, forge, 44, 400), false);
});

test("range limits targets and the forge blocks projectile segments", () => {
  assert.equal(canTarget(leftTower, { x: 50, y: 280 }, forge, 44, 175), false);
  assert.equal(canTarget(leftTower, { x: 50, y: 280 }, forge, 44, 225), true);
  assert.equal(segmentHitsCircle({ x: 340, y: 280 }, { x: 460, y: 280 }, forge, 44), true);
  assert.equal(segmentHitsCircle({ x: 340, y: 220 }, { x: 460, y: 220 }, forge, 44), false);
});
