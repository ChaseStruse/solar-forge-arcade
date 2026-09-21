import test from "node:test";
import assert from "node:assert/strict";
import { hitNet, hitPlayer, matchWinner, pointWinner, rivalControls, tryJump } from "../frontend/volley-physics.js";

test("double jump boosts a falling player, rejects a third jump, and resets on landing", () => {
  const player = { onGround: true, jumpsUsed: 0, vy: 0 };
  assert.equal(tryJump(player), true);
  player.vy = 100;
  assert.equal(tryJump(player), true);
  assert.equal(player.vy, -455);
  assert.equal(player.jumpsUsed, 2);
  assert.equal(tryJump(player), false);
  player.onGround = true;
  assert.equal(tryJump(player), true);
  assert.equal(player.jumpsUsed, 1);
});

test("a landing awards the point to the opposite side", () => {
  assert.equal(pointWinner(190), "rival");
  assert.equal(pointWinner(610), "player");
});

test("the first side to five points wins the match", () => {
  assert.equal(matchWinner({ player: 4, rival: 4 }), null);
  assert.equal(matchWinner({ player: 5, rival: 4 }), "player");
  assert.equal(matchWinner({ player: 3, rival: 5 }), "rival");
});

test("a player contact separates and launches the ball upward", () => {
  const ball = { x: 120, y: 180, vx: 20, vy: 150 };
  const player = { x: 120, y: 220, vx: 80, vy: -200 };
  assert.equal(hitPlayer(ball, player), true);
  assert.ok(ball.y < 180);
  assert.ok(ball.vy <= -235);
});

test("the net rejects balls from its face and top", () => {
  const face = { x: 390, y: 360, vx: 180, vy: 40 };
  assert.equal(hitNet(face), true);
  assert.ok(face.vx < 0);
  const top = { x: 400, y: 280, vx: 20, vy: 160 };
  assert.equal(hitNet(top), true);
  assert.ok(top.vy < 0);
});

test("the rival tracks balls on its side and jumps to meet them", () => {
  const controls = rivalControls({ x: 620, y: 450, onGround: true }, { x: 690, y: 330, vx: -40 });
  assert.deepEqual(controls, { direction: 1, jump: true });
  assert.equal(rivalControls({ x: 650, y: 450, onGround: true }, { x: 200, y: 200, vx: -40 }).direction, -1);
});
