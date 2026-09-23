import { BALL_RADIUS, COURT_WIDTH, FLOOR_Y, PLAYER_RADIUS, matchWinner, tryJump } from "./volley-physics.js";
import { shotAccuracy, shotOffset } from "./basketball-shooting.js";

const canvas = document.querySelector("#basketball-game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#basketball-overlay");
const startButton = document.querySelector("#basketball-start");
const playerScore = document.querySelector("#basketball-player-score");
const rivalScore = document.querySelector("#basketball-rival-score");
const statusNode = document.querySelector("#basketball-status");
const keys = { left: false, right: false };
const confettiColors = ["#dafa78", "#ff9a7f", "#82ead7", "#ffd487"];
let previousTime = 0;
let owner = null;
let pickupDelay = 0;
let aiShotClock = 0;
let state = createMatch();

function createPlayer(x, color, accent) {
  return { x, y: FLOOR_Y - PLAYER_RADIUS, vx: 0, vy: 0, color, accent, onGround: true, jumpsUsed: 0, squash: 0 };
}

function createMatch() {
  return {
    running: false,
    score: { player: 0, rival: 0 },
    player: createPlayer(205, "#73ead3", "#dafa78"),
    rival: createPlayer(595, "#ff817b", "#ffd084"),
    ball: { x: 250, y: 150, vx: 145, vy: 0 },
    serveDelay: 0,
    serving: "player",
    status: "READY TO SERVE",
    particles: [],
    time: 0,
  };
}

function resetRally(server) {
  state.player = createPlayer(205, "#73ead3", "#dafa78");
  state.rival = createPlayer(595, "#ff817b", "#ffd084");
  owner = server;
  pickupDelay = 0;
  aiShotClock = 0;
  state.ball = { x: 400, y: 150, vx: 0, vy: 0 };
  state.serveDelay = 1;
  state.status = server === "player" ? "YOUR BALL / X TO SHOOT" : "NOVA'S BALL";
}

function shoot(side) {
  if (!state.running || state.serveDelay > 0 || owner !== side) return;
  const p = state[side];
  const target = (side === "player" ? 714 : 86) + shotOffset(p);
  const flight = .95;
  state.ball = { x: p.x, y: p.y - 42, vx: (target - p.x) / flight,
    vy: (260 - (p.y - 42) - .5 * 630 * flight * flight) / flight };
  owner = null;
  pickupDelay = .25;
  state.status = shotAccuracy(p) > .75 ? "APEX RELEASE!" : "SHOT UP / AIM FOR THE APEX";
}

function jump(player) {
  if (!state.running) return;
  if (tryJump(player) && player.jumpsUsed === 2) burst(player.x, player.y + PLAYER_RADIUS, 12);
}

function updatePlayer(player, direction, minX, maxX, dt) {
  const targetVelocity = direction * 270;
  player.vx += (targetVelocity - player.vx) * Math.min(1, dt * 12);
  player.x = Math.max(minX, Math.min(maxX, player.x + player.vx * dt));
  player.vy += 1080 * dt;
  player.y += player.vy * dt;
  player.squash = Math.max(0, player.squash - dt * 5);
  if (player.y >= FLOOR_Y - PLAYER_RADIUS) {
    if (!player.onGround && player.vy > 180) player.squash = .7;
    player.y = FLOOR_Y - PLAYER_RADIUS;
    player.vy = 0;
    player.onGround = true;
    player.jumpsUsed = 0;
  } else {
    player.onGround = false;
  }
}

function burst(x, y, count = 20) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x, y,
      vx: (Math.random() - .5) * 300,
      vy: -80 - Math.random() * 250,
      life: .5 + Math.random() * .7,
      color: confettiColors[i % confettiColors.length],
    });
  }
}

function awardPoint(winner) {
  state.score[winner]++;
  state.status = winner === "player" ? "POINT SOL!" : "POINT NOVA!";
  burst(state.ball.x, FLOOR_Y - 5, 28);
  updateHud();
  const champion = matchWinner(state.score);
  if (champion) {
    state.running = false;
    document.querySelector("#basketball-overlay-title").innerHTML = champion === "player" ? "SOL WINS<br />THE MATCH!" : "NOVA TAKES<br />THE MATCH";
    document.querySelector("#basketball-overlay-copy").textContent = champion === "player" ? "Five points and one very bright victory. The court is yours." : "Nova reached five first. The court is ready for your rematch.";
    startButton.innerHTML = 'PLAY AGAIN <span aria-hidden="true">↗</span>';
    setTimeout(() => { overlay.hidden = false; }, 550);
    return;
  }
  resetRally(winner === "player" ? "rival" : "player");
}

function updateHud() {
  playerScore.textContent = state.score.player;
  rivalScore.textContent = state.score.rival;
  statusNode.textContent = state.status;
}

function update(dt) {
  state.time += dt;
  if (state.serveDelay > 0) {
    state.serveDelay -= dt;
    if (state.serveDelay <= 0) state.status = "BALL LIVE";
  }
  pickupDelay = Math.max(0, pickupDelay - dt);
  const target = owner === "rival" ? 230 : owner === "player" ? Math.min(695, state.player.x + 65) : Math.max(38, Math.min(762, state.ball.x + state.ball.vx * .25));
  const direction = Math.abs(target - state.rival.x) > 12 ? Math.sign(target - state.rival.x) : 0;
  updatePlayer(state.player, Number(keys.right) - Number(keys.left), 38, 762, dt);
  updatePlayer(state.rival, direction, 38, 762, dt);
  if (owner === "rival" && state.serveDelay <= 0) {
    aiShotClock += dt;
    if (state.rival.x < 340 || aiShotClock > 2.5) {
      if (state.rival.onGround) jump(state.rival);
      else if (Math.abs(state.rival.vy) < 65) { shoot("rival"); aiShotClock = 0; }
    }
  } else if (owner === null && state.ball.x < 400 && Math.abs(state.ball.x - state.rival.x) < 60 && state.ball.y < state.rival.y - 50 && state.rival.onGround) jump(state.rival);
  if (owner) {
    const p = state[owner];
    state.ball.x = p.x + (owner === "player" ? 28 : -28);
    state.ball.y = p.y + (p.onGround ? Math.abs(Math.sin(state.time * 12)) * 16 : -12);
  } else if (state.serveDelay <= 0) {
    const ball = state.ball;
    const oldY = ball.y;
    ball.vy += 630 * dt;
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    if (ball.x < 14 || ball.x > 786) { ball.x = Math.max(14, Math.min(786, ball.x)); ball.vx *= -.75; }
    if (ball.y < 14) { ball.y = 14; ball.vy = Math.abs(ball.vy); }
    if (ball.vy > 0 && oldY < 260 && ball.y >= 260 && (Math.abs(ball.x - 86) < 27 || Math.abs(ball.x - 714) < 27)) {
      awardPoint(ball.x > 400 ? "player" : "rival");
    } else {
      for (const side of ["player", "rival"]) {
        const p = state[side];
        if (pickupDelay === 0 && Math.hypot(ball.x - p.x, ball.y - p.y) < 48) {
          owner = side; aiShotClock = 0;
          state.status = side === "player" ? "YOUR BALL / X TO SHOOT" : "NOVA'S BALL";
          break;
        }
      }
      if (ball.y + BALL_RADIUS >= FLOOR_Y) {
        ball.y = FLOOR_Y - BALL_RADIUS; ball.vy = -Math.abs(ball.vy) * .65; ball.vx *= .85;
      }
    }
  }

  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 520 * dt;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
  updateHud();
}

function rect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function drawCourt() {
  ctx.imageSmoothingEnabled = false;
  rect(0, 0, 800, 560, "#090b24");
  for (let i = 0; i < 55; i++) rect((i * 137) % 800, 65 + (i * 47) % 220, 2, 2, i % 3 ? "#535080" : "#ffd67b");
  for (let row = 0; row < 18; row++) {
    const y = 108 + row * 7;
    const half = Math.sqrt(Math.max(0, 64 * 64 - (y - 168) ** 2));
    rect(400 - half, y, half * 2, row < 9 ? 7 : 4, row < 6 ? "#ffcf72" : row < 12 ? "#ff7888" : "#d74caa");
  }
  for (let i = 0; i < 25; i++) {
    const h = 20 + (i * 37) % 73;
    rect(i * 34, 282 - h, 28, h, "#181635");
    for (let j = 0; j < h - 10; j += 14) rect(i * 34 + 8, 282 - h + j + 6, 4, 4, "#765289");
  }
  rect(0, 282, 800, 206, "#171233");
  ctx.strokeStyle = "#683679"; ctx.lineWidth = 2;
  for (let x = -800; x <= 1600; x += 100) {
    ctx.beginPath(); ctx.moveTo(400 + (x - 400) * .12, 282); ctx.lineTo(x, 488); ctx.stroke();
  }
  for (const y of [282, 300, 324, 355, 396, 448, 487]) rect(0, y, 800, 2, "#683679");
  rect(0, FLOOR_Y, 800, 72, "#0b1028");
  rect(0, FLOOR_Y, 400, 4, "#63f5ef");
  rect(400, FLOOR_Y, 400, 4, "#ff70b7");
  rect(0, FLOOR_Y + 8, 800, 2, "#533064");
  for (const x of [86, 714]) {
    const back = x < 400 ? x - 38 : x + 38;
    rect(back - 3, 182, 6, 92, "#bdf9ff");
    rect(back - 5, 274, 10, FLOOR_Y - 274, "#533d77");
    rect(x - 28, 258, 56, 4, "#ff9966");
    for (let row = 0; row < 4; row++) {
      const half = 25 - row * 4;
      rect(x - half, 265 + row * 8, half * 2, 2, "#dee9ef");
    }
  }
  ctx.font = "bold 14px monospace"; ctx.textAlign = "center";
  ctx.fillStyle = "#74f4e4"; ctx.fillText("1P  SOL", 160, 530);
  ctx.fillStyle = "#ff8abc"; ctx.fillText("CPU  NOVA", 640, 530);
  ctx.fillStyle = "#fff0ac"; ctx.fillText("FIRST TO 5", 400, 530);
}


function drawPlayer(player, label) {
  const x = Math.round(player.x - 24);
  const y = Math.round(player.y - 31);
  const step = player.onGround && Math.abs(player.vx) > 30 ? Math.round(Math.sin(state.time * 18)) * 4 : 0;
  const skin = "#ffd0a0";
  rect(player.x - 24, FLOOR_Y - 3, 48, 3, "#080b22");
  rect(x + 12, y, 24, 8, "#262044");
  rect(x + 8, y + 8, 32, 5, player.accent);
  rect(x + 12, y + 13, 24, 13, skin);
  rect(x + (player === state.player ? 29 : 15), y + 15, 4, 4, "#161529");
  rect(x + 8, y + 26, 32, 20, player.color);
  rect(x + 22, y + 30, 4, 10, "#ffffff");
  rect(x + 8, y + 46, 32, 6, "#322754");
  rect(x + 8, y + 52, 10, 7 + step, skin);
  rect(x + 30, y + 52, 10, 7 - step, skin);
  rect(x + 4, y + 59 + step, 14, 4, "#fff5d8");
  rect(x + 30, y + 59 - step, 14, 4, "#fff5d8");
  const armsY = player.onGround ? y + 28 : y + 6;
  rect(x, armsY, 8, 24, skin);
  rect(x + 40, armsY, 8, 24, skin);
  ctx.fillStyle = player.accent;
  ctx.font = "700 10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, player.x, y - 10);
  if (player === state.player) {
    if (owner === "player" && state.running && state.serveDelay <= 0 && shotAccuracy(player) > .75) {
      ctx.fillStyle = "#dafa78"; ctx.fillText("SHOOT!", player.x, y - 32);
    }
    for (let i = 0; i < 2; i++) rect(player.x - 11 + i * 13, y - 22, 9, 4, i < 2 - player.jumpsUsed ? "#7ffff0" : "#444064");
  }
}

function drawBall() {
  const ball = state.ball;
  ctx.save();
  ctx.translate(Math.round(ball.x), Math.round(ball.y));
  for (let y = -14; y < 14; y += 4) {
    for (let x = -14; x < 14; x += 4) {
      if (Math.hypot(x + 2, y + 2) > 14) continue;
      const seam = (x + y + Math.floor(state.time * 8) * 4) % 16;
      rect(x, y, 4, 4, seam === 0 ? "#743528" : "#ff9b48");
    }
  }
  ctx.restore();
}

function draw() {
  drawCourt();
  drawPlayer(state.player, "YOU");
  drawPlayer(state.rival, "AI");
  drawBall();
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.min(1, particle.life * 2);
    rect(particle.x, particle.y, 6, 6, particle.color);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#f9e2bd";
  ctx.font = "700 13px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("S O L A R   B A S K E T B A L L", COURT_WIDTH / 2, 26);
  ctx.font = "bold 28px monospace";
  ctx.fillStyle = "#76ffee"; ctx.fillText(String(state.score.player).padStart(2, "0"), 65, 42);
  ctx.fillStyle = "#ff82bb"; ctx.fillText(String(state.score.rival).padStart(2, "0"), 735, 42);
}

function frame(time) {
  const dt = previousTime ? Math.min((time - previousTime) / 1000, .025) : 0;
  previousTime = time;
  if (state.running && !document.hidden && document.documentElement.dataset.paused !== "true") update(dt);
  else state.time += dt;
  draw();
  requestAnimationFrame(frame);
}

startButton.addEventListener("click", () => {
  state = createMatch();
  state.running = true;
  resetRally("player");
  overlay.hidden = true;
  updateHud();
});
window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "w", "W"].includes(event.key) && state.running) event.preventDefault();
  if (event.key.toLowerCase() === "x" && !event.repeat) shoot("player");
  if (event.key === "ArrowLeft") keys.left = true;
  if (event.key === "ArrowRight") keys.right = true;
  if (["ArrowUp", " ", "w", "W"].includes(event.key) && !event.repeat) jump(state.player);
});
window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") keys.left = false;
  if (event.key === "ArrowRight") keys.right = false;
});
window.addEventListener("blur", () => { keys.left = keys.right = false; });
document.addEventListener("visibilitychange", () => { previousTime = 0; keys.left = keys.right = false; });
updateHud();
requestAnimationFrame(frame);
