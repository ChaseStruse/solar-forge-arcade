import test from "node:test";
import assert from "node:assert/strict";
import { applyBossReward, createBoss, createTower } from "../frontend/progression.js";

const center = { x: 400, y: 280 };

function game() {
  return {
    towers: [createTower(250, 280, Math.PI), createTower(550, 280, 0)],
    shield: 2,
    maxShield: 5,
  };
}

test("wave ten boss has much more health than a regular enemy", () => {
  const boss = createBoss(center, -1);
  assert.equal(boss.boss, true);
  assert.equal(boss.maxHealth, 180);
  assert.equal(boss.x, 35);
});

test("the three boss rewards change only the selected power", () => {
  const extraTurret = game();
  assert.equal(applyBossReward(extraTurret, "turret", center), true);
  assert.equal(extraTurret.towers.length, 3);
  assert.deepEqual([extraTurret.towers[2].x, extraTurret.towers[2].y], [400, 130]);

  const forgeHealth = game();
  assert.equal(applyBossReward(forgeHealth, "health", center), true);
  assert.deepEqual([forgeHealth.shield, forgeHealth.maxShield], [5, 8]);

  const twinShot = game();
  assert.equal(applyBossReward(twinShot, "twin", center, 1), true);
  assert.deepEqual(twinShot.towers.map((tower) => tower.bullets), [1, 2]);
  assert.equal(applyBossReward(twinShot, "twin", center), false);
});
