import test from "node:test";
import assert from "node:assert/strict";
import { canTarget, segmentHitsCircle, selectThreat } from "../frontend/targeting.js";

const forge = { x: 400, y: 280 };
const leftTower = { x: 250, y: 280 };
const rightTower = { x: 550, y: 280 };
const forgeRadius = 39.6;

test("each tower can target nearby enemies on its side, but not through the forge", () => {
  assert.equal(canTarget(leftTower, { x: 150, y: 280 }, forge, forgeRadius, 168.75), true);
  assert.equal(canTarget(rightTower, { x: 650, y: 280 }, forge, forgeRadius, 168.75), true);
  assert.equal(canTarget(leftTower, { x: 500, y: 280 }, forge, forgeRadius, 400), false);
  assert.equal(canTarget(rightTower, { x: 300, y: 280 }, forge, forgeRadius, 400), false);
});

test("range limits targets and the forge blocks projectile segments", () => {
  assert.equal(canTarget(leftTower, { x: 50, y: 280 }, forge, forgeRadius, 168.75), false);
  assert.equal(canTarget(leftTower, { x: 50, y: 280 }, forge, forgeRadius, 221.25), true);
  assert.equal(segmentHitsCircle({ x: 340, y: 280 }, { x: 460, y: 280 }, forge, forgeRadius), true);
  assert.equal(segmentHitsCircle({ x: 340, y: 220 }, { x: 460, y: 220 }, forge, forgeRadius), false);
});

test("towers prioritize approaching threats and ignore dead or obscured enemies", () => {
  const nearby = { x: 220, y: 280, speed: 30, health: 2 };
  const urgent = { x: 330, y: 280, speed: 60, health: 2 };
  const hidden = { x: 460, y: 280, speed: 100, health: 2 };
  assert.equal(selectThreat([nearby, hidden, urgent], leftTower, forge, forgeRadius, 300), urgent);
  urgent.health = 0;
  assert.equal(selectThreat([nearby, urgent], leftTower, forge, forgeRadius, 300), nearby);
});
