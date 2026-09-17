/** A deliberately small Canvas game. All distances use canvas pixels. */
import { canTarget, segmentHitsCircle } from "./targeting.js";

const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const overlay = document.querySelector("#screen-overlay");
const startButton = document.querySelector("#start-button");
const center = { x: canvas.width / 2, y: canvas.height / 2 };
const TAU = Math.PI * 2;
const FORGE_SCALE = 0.9;
const FORGE_RADIUS = 44 * FORGE_SCALE;
const RANGE_SCALE = 0.75;
const TOWER_OFFSET = 150;

const upgrades = {
  power: { base: 10, step: 8 },
  rate: { base: 12, step: 10 },
  range: { base: 8, step: 7 },
};

let game = createGame();
let previousTime = 0;

function createGame() {
  return {
    running: false,
    elapsed: 0,
    spawnClock: 0,
    towers: [
      { x: center.x - TOWER_OFFSET, y: center.y, fireClock: 0, aim: Math.PI },
      { x: center.x + TOWER_OFFSET, y: center.y, fireClock: 0, aim: 0 },
    ],
    wave: 1,
    shield: 5,
    sparks: 0,
    levels: { power: 1, rate: 1, range: 1 },
    enemies: [],
    shots: [],
    particles: [],
  };
}

function upgradeCost(name) {
  const { base, step } = upgrades[name];
  return base + (game.levels[name] - 1) * step;
}

function updateHud() {
  document.querySelector("#sparks").textContent = game.sparks;
  document.querySelector("#wave").textContent = String(game.wave).padStart(2, "0");
  document.querySelector("#shield").textContent = "♥ ".repeat(game.shield).trim() || "EMPTY";

  for (const name of Object.keys(upgrades)) {
    const cost = upgradeCost(name);
    document.querySelector(`#${name}-cost`).textContent = `✦ ${cost}`;
    document.querySelector(`#${name}-level`).textContent = `LV ${game.levels[name]}`;
    document.querySelector(`[data-upgrade="${name}"]`).disabled = !game.running || game.sparks < cost;
  }
}

function spawnEnemy() {
  const angle = Math.random() * TAU;
  const radius = 430;
  const maxHealth = 2 + Math.floor((game.wave - 1) / 2);
  game.enemies.push({
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
    radius: 12 + Math.random() * 4,
    speed: 33 + game.wave * 5 + Math.random() * 9,
    health: maxHealth,
    maxHealth,
    phase: Math.random() * TAU,
  });
}

function firingRange() {
  return (225 + (game.levels.range - 1) * 35) * RANGE_SCALE;
}

function fireShot(tower) {
  let target = null;
  let closest = Infinity;

  for (const enemy of game.enemies) {
    const distance = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
    if (distance < closest && canTarget(tower, enemy, center, FORGE_RADIUS, firingRange())) {
      closest = distance;
      target = enemy;
    }
  }

  if (!target) return false;
  tower.aim = Math.atan2(target.y - tower.y, target.x - tower.x);
  game.shots.push({ x: tower.x, y: tower.y, target, life: 1.4 });
  burst(tower.x, tower.y, "#ffe075", 3);
  return true;
}

function burst(x, y, color, count) {
  for (let index = 0; index < count; index++) {
    const angle = Math.random() * TAU;
    const speed = 30 + Math.random() * 95;
    game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.45, color });
  }
}

function update(dt) {
  game.elapsed += dt;
  const nextWave = Math.floor(game.elapsed / 18) + 1;
  if (nextWave !== game.wave) {
    game.wave = nextWave;
    updateHud();
  }

  game.spawnClock += dt;

  const spawnInterval = Math.max(0.42, 1.55 - game.wave * 0.09);
  while (game.spawnClock >= spawnInterval) {
    game.spawnClock -= spawnInterval;
    spawnEnemy();
  }

  const fireInterval = Math.max(0.16, 0.85 * Math.pow(0.83, game.levels.rate - 1));
  for (const tower of game.towers) {
    tower.fireClock = Math.min(fireInterval, tower.fireClock + dt);
    if (tower.fireClock >= fireInterval && fireShot(tower)) tower.fireClock = 0;
  }

  for (const enemy of game.enemies) {
    const direction = Math.atan2(center.y - enemy.y, center.x - enemy.x);
    enemy.x += Math.cos(direction) * enemy.speed * dt;
    enemy.y += Math.sin(direction) * enemy.speed * dt;
    enemy.phase += dt * 4;
    if (Math.hypot(enemy.x - center.x, enemy.y - center.y) < 43 * FORGE_SCALE) {
      enemy.health = 0;
      game.shield = Math.max(0, game.shield - 1);
      burst(enemy.x, enemy.y, "#ff688b", 12);
      updateHud();
    }
  }

  for (const shot of game.shots) {
    if (shot.target.health <= 0) {
      shot.life = 0;
      continue;
    }
    if (segmentHitsCircle(shot, shot.target, center, FORGE_RADIUS)) {
      shot.life = 0;
      continue;
    }
    const before = { x: shot.x, y: shot.y };
    const direction = Math.atan2(shot.target.y - shot.y, shot.target.x - shot.x);
    shot.x += Math.cos(direction) * 460 * dt;
    shot.y += Math.sin(direction) * 460 * dt;
    shot.life -= dt;
    if (shot.life <= 0) continue;
    if (segmentHitsCircle(before, shot, center, FORGE_RADIUS)) {
      shot.life = 0;
      continue;
    }

    for (const enemy of game.enemies) {
      if (enemy.health > 0 && segmentHitsCircle(before, shot, enemy, enemy.radius + 5)) {
        shot.life = 0;
        enemy.health -= game.levels.power;
        burst(shot.x, shot.y, "#8bf7e5", 4);
        if (enemy.health <= 0) {
          game.sparks += 3 + Math.floor(game.wave / 3);
          burst(enemy.x, enemy.y, "#ffe075", 10);
          updateHud();
        }
        break;
      }
    }
  }

  game.enemies = game.enemies.filter((enemy) => enemy.health > 0);
  game.shots = game.shots.filter((shot) => shot.life > 0);
  for (const particle of game.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  }
  game.particles = game.particles.filter((particle) => particle.life > 0);

  if (game.shield === 0) endGame();
}

function draw(time) {
  const { width, height } = canvas;
  context.fillStyle = "#11152d";
  context.fillRect(0, 0, width, height);

  // The grid, stars, and rings give depth without image downloads.
  context.strokeStyle = "#222b4c";
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
  }
  for (let index = 0; index < 32; index++) {
    const x = (index * 197 + 67) % width;
    const y = (index * 127 + 49) % height;
    context.fillStyle = index % 3 === 0 ? "#f8da91" : "#6b78a6";
    context.fillRect(x, y, index % 5 === 0 ? 3 : 2, index % 5 === 0 ? 3 : 2);
  }

  // Each dashed circle shows exactly how far that tower can currently fire.
  context.setLineDash([5, 8]);
  context.strokeStyle = "#79e8d54d";
  context.lineWidth = 1.5;
  for (const tower of game.towers) {
    context.beginPath(); context.arc(tower.x, tower.y, firingRange(), 0, TAU); context.stroke();
  }
  context.setLineDash([]);

  context.save();
  context.translate(center.x, center.y);
  context.scale(FORGE_SCALE, FORGE_SCALE);
  const pulse = Math.sin(time * 0.002) * 3;
  context.fillStyle = "#ff8b5b22";
  context.beginPath(); context.arc(0, 0, 69 + pulse, 0, TAU); context.fill();
  context.strokeStyle = "#ffae67";
  context.lineWidth = 3;
  context.beginPath(); context.arc(0, 0, 44, 0, TAU); context.stroke();
  context.fillStyle = "#36223e";
  context.beginPath(); context.arc(0, 0, 40, 0, TAU); context.fill();
  context.fillStyle = "#ff6d67";
  context.beginPath(); context.moveTo(0, -31); context.lineTo(24, 15); context.lineTo(0, 30); context.lineTo(-24, 15); context.closePath(); context.fill();
  context.fillStyle = "#ffe078";
  context.beginPath(); context.moveTo(0, -23); context.lineTo(13, 12); context.lineTo(0, 23); context.lineTo(-13, 12); context.closePath(); context.fill();
  context.fillStyle = "#fff4bb";
  context.beginPath(); context.arc(0, 5, 7 + pulse / 3, 0, TAU); context.fill();
  context.restore();

  for (const enemy of game.enemies) {
    context.save();
    context.translate(enemy.x, enemy.y);
    context.rotate(Math.atan2(center.y - enemy.y, center.x - enemy.x));
    context.fillStyle = "#fd6a91";
    context.beginPath(); context.moveTo(16, 0); context.lineTo(-9, -12); context.lineTo(-5, 0); context.lineTo(-9, 12); context.closePath(); context.fill();
    context.fillStyle = "#ffcf92";
    context.fillRect(-6, -3, 6, 6);
    context.restore();
  }

  for (const tower of game.towers) {
    context.save();
    context.translate(tower.x, tower.y);
    context.fillStyle = "#254d60";
    context.beginPath(); context.arc(0, 0, 20, 0, TAU); context.fill();
    context.strokeStyle = "#7df1dc";
    context.lineWidth = 3;
    context.beginPath(); context.arc(0, 0, 20, 0, TAU); context.stroke();
    context.rotate(tower.aim);
    context.fillStyle = "#7df1dc";
    context.fillRect(2, -6, 25, 12);
    context.fillStyle = "#fdf1c2";
    context.beginPath(); context.arc(0, 0, 8, 0, TAU); context.fill();
    context.restore();
  }

  for (const shot of game.shots) {
    context.fillStyle = "#ffe887";
    context.shadowColor = "#ffdc5e";
    context.shadowBlur = 13;
    context.beginPath(); context.arc(shot.x, shot.y, 4, 0, TAU); context.fill();
  }
  context.shadowBlur = 0;
  for (const particle of game.particles) {
    context.globalAlpha = Math.min(1, particle.life * 2.2);
    context.fillStyle = particle.color;
    context.fillRect(particle.x, particle.y, 4, 4);
  }
  context.globalAlpha = 1;
}

function endGame() {
  game.running = false;
  document.querySelector("#overlay-title").innerHTML = "FORGE DOWN!<br />NICE TRY.";
  document.querySelector("#overlay-copy").textContent = `You reached wave ${game.wave}. The forge is ready for another shift.`;
  startButton.innerHTML = 'TRY AGAIN <span aria-hidden="true">↗</span>';
  overlay.hidden = false;
  updateHud();
}

function frame(time) {
  const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
  previousTime = time;
  if (game.running && !document.hidden) update(dt);
  draw(time);
  requestAnimationFrame(frame);
}

startButton.addEventListener("click", () => {
  game = createGame();
  game.running = true;
  overlay.hidden = true;
  updateHud();
});

document.querySelectorAll("[data-upgrade]").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.upgrade;
    const cost = upgradeCost(name);
    if (!game.running || game.sparks < cost) return;
    game.sparks -= cost;
    game.levels[name] += 1;
    updateHud();
  });
});

document.addEventListener("visibilitychange", () => { previousTime = 0; });
updateHud();
requestAnimationFrame(frame);
