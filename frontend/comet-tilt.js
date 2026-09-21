import { ARENA_HEIGHT, ARENA_WIDTH, RIDER_RADIUS, clashResult, platformTopAt, rivalControls, roundWinner, wrapX } from "./tilt-physics.js";

const canvas = document.querySelector("#tilt-game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#tilt-overlay");
const startButton = document.querySelector("#tilt-start");
const scoreNodes = {
  player: document.querySelector("#tilt-player-score"),
  rival: document.querySelector("#tilt-rival-score"),
};
const altitudeNode = document.querySelector("#tilt-altitude");
const edgeNode = document.querySelector("#tilt-edge");
const keys = { left: false, right: false };
const platforms = [
  { x: 0, y: 520, width: 800 },
  { x: 64, y: 390, width: 190 },
  { x: 546, y: 390, width: 190 },
  { x: 302, y: 294, width: 196 },
  { x: 105, y: 188, width: 160 },
  { x: 535, y: 188, width: 160 },
];
const stars = Array.from({ length: 60 }, (_, index) => ({
  x: (index * 137.4) % ARENA_WIDTH,
  y: 25 + (index * 83.7) % 455,
  radius: index % 9 === 0 ? 1.7 : .7,
  phase: index * .73,
}));

let previousTime = 0;
let game = createGame();

function createRider(x, y, color, accent, facing) {
  return { x, y, vx: 0, vy: 0, color, accent, facing, flapCooldown: 0, stun: 0, invulnerable: 0, wing: 0 };
}

function createGame() {
  return {
    running: false,
    player: createRider(180, 330, "#8cf1d8", "#dafa89", 1),
    rival: createRider(620, 330, "#ff887e", "#ffd08a", -1),
    score: { player: 0, rival: 0 },
    roundDelay: 0,
    banner: "",
    bannerColor: "#f9df9a",
    sparks: [],
    time: 0,
  };
}

function resetRiders() {
  game.player = createRider(175, 330, "#8cf1d8", "#dafa89", 1);
  game.rival = createRider(625, 330, "#ff887e", "#ffd08a", -1);
}

function flap(rider) {
  if (!game.running || game.roundDelay || rider.flapCooldown > 0 || rider.stun > 0) return;
  rider.vy = Math.min(rider.vy, 40) - 270;
  rider.flapCooldown = .16;
  rider.wing = 1;
  burst(rider.x - rider.facing * 18, rider.y + 17, rider.accent, 5);
}

function updateRider(rider, direction, dt) {
  rider.flapCooldown = Math.max(0, rider.flapCooldown - dt);
  rider.invulnerable = Math.max(0, rider.invulnerable - dt);
  rider.stun = Math.max(0, rider.stun - dt);
  rider.wing = Math.max(0, rider.wing - dt * 6);
  if (rider.stun <= 0 && direction) {
    rider.vx += direction * 630 * dt;
    rider.facing = direction;
  }
  rider.vx *= Math.pow(.055, dt);
  rider.vx = Math.max(-235, Math.min(235, rider.vx));
  rider.vy = Math.min(370, rider.vy + 510 * dt);
  rider.x = wrapX(rider.x + rider.vx * dt);
  rider.y += rider.vy * dt;
  const platformY = platformTopAt(rider, platforms);
  if (platformY !== null) {
    rider.y = platformY - RIDER_RADIUS;
    rider.vy = -45;
  }
  if (rider.y < 50) { rider.y = 50; rider.vy = Math.max(20, rider.vy); }
  if (rider.y > ARENA_HEIGHT + 45) {
    rider.y = 65;
    rider.vy = 45;
    rider.invulnerable = .7;
  }
}

function burst(x, y, color, count = 16) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 45 + Math.random() * 170;
    game.sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .45 + Math.random() * .5, color });
  }
}

function scorePoint(winner) {
  if (winner === "draw") {
    game.banner = "LANCES LOCKED!";
    game.bannerColor = "#f9df9a";
    game.player.vx *= -1.4;
    game.rival.vx *= -1.4;
    game.player.vy = game.rival.vy = -175;
    game.player.stun = game.rival.stun = .32;
    game.player.invulnerable = game.rival.invulnerable = .6;
    burst((game.player.x + game.rival.x) / 2, (game.player.y + game.rival.y) / 2, "#fff2b4", 12);
    return;
  }
  game.score[winner]++;
  game.banner = winner === "player" ? "SOL TAKES THE TILT!" : "NOVA STRIKES!";
  game.bannerColor = winner === "player" ? "#baf5ca" : "#ff9a8f";
  game.roundDelay = 1.35;
  burst(winner === "player" ? game.rival.x : game.player.x, winner === "player" ? game.rival.y : game.player.y, game.bannerColor, 30);
  updateHud();
}

function finish(winner) {
  game.running = false;
  document.querySelector("#tilt-overlay-title").innerHTML = winner === "player" ? "YOU RULE<br />THE COMET SKY" : "NOVA TAKES<br />THE CROWN";
  document.querySelector("#tilt-overlay-copy").textContent = winner === "player" ? "Five clean strikes. The high lanes belong to you." : "The rival pilot got the altitude edge. Call for a rematch.";
  startButton.innerHTML = 'REMATCH <span aria-hidden="true">↗</span>';
  overlay.hidden = false;
}

function updateHud() {
  scoreNodes.player.textContent = game.score.player;
  scoreNodes.rival.textContent = game.score.rival;
  const difference = Math.max(-150, Math.min(150, game.rival.y - game.player.y));
  altitudeNode.style.width = `${50 + difference / 3}%`;
  edgeNode.textContent = Math.abs(difference) < 12 ? "EVEN" : difference > 0 ? "YOU'RE ABOVE" : "NOVA'S ABOVE";
}

function update(dt) {
  game.time += dt;
  if (game.roundDelay > 0) {
    game.roundDelay -= dt;
    if (game.roundDelay <= 0) {
      const winner = roundWinner(game.score);
      if (winner) finish(winner);
      else { resetRiders(); game.banner = "NEXT TILT"; }
    }
  } else {
    const ai = rivalControls(game.rival, game.player, platforms);
    if (ai.flap && game.rival.flapCooldown <= 0) flap(game.rival);
    updateRider(game.player, Number(keys.right) - Number(keys.left), dt);
    updateRider(game.rival, ai.direction, dt);
    if (!game.player.invulnerable && !game.rival.invulnerable) {
      const result = clashResult(game.player, game.rival);
      if (result) scorePoint(result);
    }
  }
  for (const spark of game.sparks) {
    spark.life -= dt;
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.vy += 180 * dt;
  }
  game.sparks = game.sparks.filter((spark) => spark.life > 0);
  updateHud();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
  gradient.addColorStop(0, "#111630");
  gradient.addColorStop(.58, "#242047");
  gradient.addColorStop(1, "#4c294c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  ctx.fillStyle = "#8c73ad18";
  for (let x = -100; x < ARENA_WIDTH + 100; x += 95) {
    ctx.beginPath(); ctx.moveTo(x, ARENA_HEIGHT); ctx.lineTo(400, 160); ctx.lineTo(x + 48, ARENA_HEIGHT); ctx.fill();
  }
  for (const star of stars) {
    const alpha = .35 + Math.sin(game.time * 2 + star.phase) * .22;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = star.radius > 1 ? "#fff0b6" : "#a9daca";
    ctx.beginPath(); ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const sun = ctx.createRadialGradient(400, 245, 8, 400, 245, 115);
  sun.addColorStop(0, "#ffd68dcc"); sun.addColorStop(.38, "#e67e8299"); sun.addColorStop(1, "#7f4a7600");
  ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(400, 245, 115, 0, Math.PI * 2); ctx.fill();
}

function drawPlatforms() {
  for (const platform of platforms) {
    ctx.fillStyle = "#0b1024"; ctx.fillRect(platform.x + 5, platform.y + 8, platform.width, 16);
    ctx.fillStyle = "#715471"; ctx.fillRect(platform.x, platform.y, platform.width, 15);
    ctx.fillStyle = "#d3ee9d"; ctx.fillRect(platform.x + 5, platform.y + 2, platform.width - 10, 3);
    ctx.fillStyle = "#382d51";
    for (let x = platform.x + 13; x < platform.x + platform.width - 8; x += 25) ctx.fillRect(x, platform.y + 15, 10, 9);
  }
}

function drawRider(rider, label) {
  ctx.save();
  ctx.translate(rider.x, rider.y);
  ctx.scale(rider.facing, 1);
  if (rider.invulnerable && Math.floor(rider.invulnerable * 12) % 2) ctx.globalAlpha = .3;
  ctx.shadowColor = rider.color; ctx.shadowBlur = 16;
  ctx.fillStyle = rider.color;
  ctx.beginPath();
  ctx.moveTo(-32, 4); ctx.quadraticCurveTo(-5, -19 - rider.wing * 7, 29, 0); ctx.quadraticCurveTo(5, 4, -18, 19 + rider.wing * 4); ctx.quadraticCurveTo(-10, 7, -32, 4); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#17273b"; ctx.beginPath(); ctx.arc(18, -1, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff6c4"; ctx.beginPath(); ctx.arc(20, -2, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rider.accent; ctx.beginPath(); ctx.moveTo(-31, 3); ctx.lineTo(-48, -4); ctx.lineTo(-35, 11); ctx.fill();
  ctx.fillStyle = "#eee4c9"; ctx.fillRect(-3, -29, 8, 21);
  ctx.beginPath(); ctx.arc(1, -31, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rider.accent; ctx.beginPath(); ctx.arc(1, -34, 8, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = "#f7dfb1"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(5, -21); ctx.lineTo(44, -31); ctx.stroke();
  ctx.fillStyle = rider.accent; ctx.beginPath(); ctx.moveTo(44, -31); ctx.lineTo(34, -36); ctx.lineTo(37, -28); ctx.fill();
  ctx.restore();
  ctx.fillStyle = rider.accent; ctx.font = "700 10px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.fillText(label, rider.x, rider.y + 43);
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawRider(game.player, "SOL / YOU");
  drawRider(game.rival, "NOVA / AI");
  for (const spark of game.sparks) {
    ctx.globalAlpha = Math.min(1, spark.life * 2); ctx.fillStyle = spark.color;
    ctx.fillRect(spark.x, spark.y, 4, 4);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.font = "700 12px ui-monospace, monospace"; ctx.fillStyle = "#cbbbd5";
  ctx.fillText("FIRST TO 5  ·  STRIKE FROM ABOVE", 400, 28);
  if (game.banner) {
    ctx.font = "900 30px Trebuchet MS, sans-serif"; ctx.fillStyle = game.bannerColor;
    ctx.fillText(game.banner, 400, 78);
  }
}

function frame(time) {
  const dt = previousTime ? Math.min((time - previousTime) / 1000, .025) : 0;
  previousTime = time;
  if (game.running && !document.hidden) update(dt);
  else game.time += dt;
  draw();
  requestAnimationFrame(frame);
}

startButton.addEventListener("click", () => {
  game = createGame();
  game.running = true;
  game.banner = "TILT!";
  overlay.hidden = true;
  updateHud();
});
window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "w", "W"].includes(event.key) && game.running) event.preventDefault();
  if (event.key === "ArrowLeft") keys.left = true;
  if (event.key === "ArrowRight") keys.right = true;
  if (["ArrowUp", " ", "w", "W"].includes(event.key) && !event.repeat) flap(game.player);
});
window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") keys.left = false;
  if (event.key === "ArrowRight") keys.right = false;
});
window.addEventListener("blur", () => { keys.left = keys.right = false; });
document.addEventListener("visibilitychange", () => { previousTime = 0; keys.left = keys.right = false; });
updateHud();
requestAnimationFrame(frame);
