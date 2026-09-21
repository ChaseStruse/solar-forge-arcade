import { BALL_RADIUS, COURT_HEIGHT, COURT_WIDTH, FLOOR_Y, NET_TOP, NET_X, PLAYER_RADIUS, hitNet, hitPlayer, matchWinner, pointWinner, rivalControls, tryJump } from "./volley-physics.js";

const canvas = document.querySelector("#volley-game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#volley-overlay");
const startButton = document.querySelector("#volley-start");
const playerScore = document.querySelector("#volley-player-score");
const rivalScore = document.querySelector("#volley-rival-score");
const statusNode = document.querySelector("#volley-status");
const keys = { left: false, right: false };
const confettiColors = ["#dafa78", "#ff9a7f", "#82ead7", "#ffd487"];
let previousTime = 0;
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
  state.serving = server;
  state.ball = {
    x: server === "player" ? 210 : 590,
    y: 150,
    vx: server === "player" ? 150 : -150,
    vy: -35,
  };
  state.serveDelay = 1.05;
  state.status = server === "player" ? "SOL SERVES" : "NOVA SERVES";
}

function jump(player) {
  if (!state.running || state.serveDelay > 0) return;
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
    document.querySelector("#volley-overlay-title").innerHTML = champion === "player" ? "SOL WINS<br />THE MATCH!" : "NOVA TAKES<br />THE MATCH";
    document.querySelector("#volley-overlay-copy").textContent = champion === "player" ? "Five points and one very bright victory. The court is yours." : "Nova reached five first. The court is ready for your rematch.";
    startButton.innerHTML = 'PLAY AGAIN <span aria-hidden="true">↗</span>';
    setTimeout(() => { overlay.hidden = false; }, 550);
    return;
  }
  resetRally(winner);
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
  const ai = rivalControls(state.rival, state.ball);
  if (ai.jump && state.serveDelay <= 0) jump(state.rival);
  updatePlayer(state.player, Number(keys.right) - Number(keys.left), 38, NET_X - PLAYER_RADIUS - 12, dt);
  updatePlayer(state.rival, ai.direction, NET_X + PLAYER_RADIUS + 12, COURT_WIDTH - 38, dt);

  if (state.serveDelay <= 0) {
    const ball = state.ball;
    ball.vy = Math.min(650, ball.vy + 630 * dt);
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.x < BALL_RADIUS) { ball.x = BALL_RADIUS; ball.vx = Math.abs(ball.vx) * .86; }
    if (ball.x > COURT_WIDTH - BALL_RADIUS) { ball.x = COURT_WIDTH - BALL_RADIUS; ball.vx = -Math.abs(ball.vx) * .86; }
    if (ball.y < BALL_RADIUS) { ball.y = BALL_RADIUS; ball.vy = Math.abs(ball.vy); }
    hitNet(ball);
    if (hitPlayer(ball, state.player)) burst(ball.x, ball.y, 5);
    if (hitPlayer(ball, state.rival)) burst(ball.x, ball.y, 5);
    if (ball.y + BALL_RADIUS >= FLOOR_Y) awardPoint(pointWinner(ball.x));
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
  rect(0, 0, COURT_WIDTH, COURT_HEIGHT, "#151633");
  rect(0, 0, COURT_WIDTH, 285, "#25204a");
  rect(0, 285, COURT_WIDTH, 203, "#d46f68");
  for (let y = 0; y < 285; y += 32) rect(0, y, COURT_WIDTH, 2, "#6f5d7d44");
  for (let x = 0; x < COURT_WIDTH; x += 64) rect(x, 285, 3, 203, "#ab555c55");
  rect(0, FLOOR_Y, COURT_WIDTH, 72, "#30203f");
  rect(0, FLOOR_Y, COURT_WIDTH, 7, "#ffd27f");
  rect(32, 453, 330, 4, "#f4b278");
  rect(438, 453, 330, 4, "#f4b278");
  rect(NET_X - 6, NET_TOP, 12, FLOOR_Y - NET_TOP, "#f7e7c2");
  rect(NET_X - 12, NET_TOP - 7, 24, 9, "#dafa78");
  ctx.strokeStyle = "#876c83";
  ctx.lineWidth = 2;
  for (let y = NET_TOP + 12; y < FLOOR_Y; y += 16) { ctx.beginPath(); ctx.moveTo(NET_X - 5, y); ctx.lineTo(NET_X + 5, y + 8); ctx.stroke(); }
  ctx.font = "700 12px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f8dbc8";
  ctx.fillText("SOL", 200, 526);
  ctx.fillText("NOVA", 600, 526);
  const sunX = 690;
  const sunY = 78;
  rect(sunX - 18, sunY - 18, 36, 36, "#ffd37d");
  rect(sunX - 6, sunY - 27, 12, 54, "#ffd37d");
  rect(sunX - 27, sunY - 6, 54, 12, "#ffd37d");
}

function drawPlayer(player, label) {
  const stretch = player.onGround ? 1 - player.squash * .12 : 1.07;
  const width = 54 * (player.onGround ? 1 + player.squash * .15 : .94);
  const height = 62 * stretch;
  const x = Math.round(player.x - width / 2);
  const y = Math.round(player.y - height / 2);
  rect(x + 5, y + 7, width, height, "#17152b");
  rect(x, y, width, height, player.color);
  rect(x + 8, y + 8, width - 16, 13, player.accent);
  rect(x + 11, y + 28, 9, 9, "#1d2540");
  rect(x + width - 20, y + 28, 9, 9, "#1d2540");
  rect(x + 17, y + 46, width - 34, 5, "#1d2540");
  ctx.fillStyle = player.accent;
  ctx.font = "700 10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, player.x, y - 10);
}

function drawBall() {
  const ball = state.ball;
  ctx.save();
  ctx.translate(Math.round(ball.x), Math.round(ball.y));
  ctx.rotate(state.time * 3);
  rect(-BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2, "#fff0b2");
  rect(-BALL_RADIUS, -4, BALL_RADIUS * 2, 8, "#ff817b");
  rect(-4, -BALL_RADIUS, 8, BALL_RADIUS * 2, "#73ead3");
  rect(-4, -4, 8, 8, "#fff0b2");
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
  ctx.fillText(`${state.score.player}  SOLAR VOLLEY  ${state.score.rival}`, COURT_WIDTH / 2, 32);
}

function frame(time) {
  const dt = previousTime ? Math.min((time - previousTime) / 1000, .025) : 0;
  previousTime = time;
  if (state.running && !document.hidden) update(dt);
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
