const canvas = document.querySelector("#breaker-game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#breaker-overlay");
const startButton = document.querySelector("#breaker-start");
const W = canvas.width;
const H = canvas.height;
const PADDLE_Y = 510;
const PADDLE_W = 112;
const PADDLE_H = 15;
const BALL_R = 8;
const BRICK_COLS = 10;
const BRICK_ROWS = 5;
const BRICK_W = 64;
const BRICK_H = 22;
const BRICK_GAP = 8;
const BRICK_X = (W - BRICK_COLS * (BRICK_W + BRICK_GAP) + BRICK_GAP) / 2;
const BRICK_COLORS = ["#ff7979", "#ffaf70", "#ffe084", "#a5eeae", "#81e8dc"];
const keys = { left: false, right: false };
let previousTime = 0;
let state = newGame();

function bricksForLevel() {
  return Array.from({ length: BRICK_ROWS * BRICK_COLS }, (_, index) => ({
    x: BRICK_X + (index % BRICK_COLS) * (BRICK_W + BRICK_GAP),
    y: 75 + Math.floor(index / BRICK_COLS) * (BRICK_H + BRICK_GAP),
    row: Math.floor(index / BRICK_COLS),
    active: true,
  }));
}

function resetBall() {
  const speedScale = Math.min(1.5, 1 + (state.level - 1) * 0.08);
  state.ball = { x: W / 2, y: PADDLE_Y - BALL_R - 3, vx: 190 * speedScale, vy: -300 * speedScale };
  state.paddleX = (W - PADDLE_W) / 2;
  state.serving = true;
  state.combo = 0;
}

function newGame() {
  const game = { running: false, score: 0, combo: 0, lives: 3, level: 1, paddleX: (W - PADDLE_W) / 2, bricks: bricksForLevel(), serving: true, serveTimer: 1 };
  game.ball = { x: W / 2, y: PADDLE_Y - BALL_R - 3, vx: 190, vy: -300 };
  return game;
}

function hud() {
  document.querySelector("#breaker-score").textContent = state.score;
  document.querySelector("#breaker-level").textContent = String(state.level).padStart(2, "0");
  document.querySelector("#breaker-lives").textContent = "♥ ".repeat(state.lives).trim();
}

function showEnd(title, copy) {
  state.running = false;
  keys.left = keys.right = false;
  document.querySelector("#breaker-overlay-title").innerHTML = title;
  document.querySelector("#breaker-overlay-copy").textContent = copy;
  startButton.innerHTML = 'PLAY AGAIN <span aria-hidden="true">↗</span>';
  overlay.hidden = false;
}

function update(dt) {
  const direction = Number(keys.right) - Number(keys.left);
  state.paddleX = Math.max(0, Math.min(W - PADDLE_W, state.paddleX + direction * 540 * dt));
  const ball = state.ball;
  if (state.serving) {
    ball.x = state.paddleX + PADDLE_W / 2;
    ball.y = PADDLE_Y - BALL_R - 3;
    state.serveTimer -= dt;
    if (state.serveTimer <= 0) state.serving = false;
    return;
  }

  const oldX = ball.x;
  const oldY = ball.y;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
  if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); }
  if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

  if (ball.vy > 0 && oldY + BALL_R <= PADDLE_Y && ball.y + BALL_R >= PADDLE_Y && ball.x >= state.paddleX - BALL_R && ball.x <= state.paddleX + PADDLE_W + BALL_R) {
    ball.y = PADDLE_Y - BALL_R;
    const hit = Math.max(-1, Math.min(1, (ball.x - state.paddleX - PADDLE_W / 2) / (PADDLE_W / 2)));
    const speed = Math.min(580, Math.hypot(ball.vx, ball.vy) + 7);
    state.combo = 0;
    ball.vx = speed * hit * 0.85;
    if (Math.abs(ball.vx) < 65) ball.vx = (Math.sign(ball.vx) || Math.sign(oldX - W / 2) || 1) * 65;
    ball.vy = -Math.sqrt(speed * speed - ball.vx * ball.vx);
  }

  for (const brick of state.bricks) {
    if (!brick.active || ball.x + BALL_R < brick.x || ball.x - BALL_R > brick.x + BRICK_W || ball.y + BALL_R < brick.y || ball.y - BALL_R > brick.y + BRICK_H) continue;
    brick.active = false;
    state.combo++;
    state.score += 10 * Math.min(5, state.combo);
    if (oldY + BALL_R <= brick.y || oldY - BALL_R >= brick.y + BRICK_H) ball.vy *= -1;
    else ball.vx *= -1;
    hud();
    break;
  }

  if (state.bricks.every((brick) => !brick.active)) {
    state.level++;
    state.lives = Math.min(5, state.lives + 1);
    state.bricks = bricksForLevel();
    resetBall();
    state.serveTimer = 1.2;
    hud();
  } else if (ball.y - BALL_R > H) {
    state.lives--;
    hud();
    if (state.lives === 0) showEnd("GAME OVER!<br />NICE RUN.", `You scored ${state.score} points and reached level ${state.level}.`);
    else { resetBall(); state.serveTimer = 1; }
  }
}

function draw() {
  ctx.fillStyle = "#11152d";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#222b4c";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (const brick of state.bricks) {
    if (!brick.active) continue;
    ctx.fillStyle = "#070b20";
    ctx.fillRect(brick.x + 3, brick.y + 4, BRICK_W, BRICK_H);
    ctx.fillStyle = BRICK_COLORS[brick.row];
    ctx.fillRect(brick.x, brick.y, BRICK_W, BRICK_H);
    ctx.fillStyle = "#ffffff55";
    ctx.fillRect(brick.x + 3, brick.y + 3, BRICK_W - 6, 3);
  }
  ctx.fillStyle = "#a1f0df";
  ctx.fillRect(state.paddleX, PADDLE_Y, PADDLE_W, PADDLE_H);
  ctx.fillStyle = "#e6fff6";
  ctx.fillRect(state.paddleX + 8, PADDLE_Y + 2, PADDLE_W - 16, 3);
  ctx.shadowColor = "#ffe18c";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#fff0ac";
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = "bold 19px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#fff0ac";
  if (state.serving && state.running) ctx.fillText("GET READY / " + Math.max(1, Math.ceil(state.serveTimer)), W / 2, 310);
  else if (state.combo > 1) ctx.fillText("BRICK STREAK ×" + Math.min(5, state.combo), W / 2, 35);
}

function frame(time) {
  const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.025) : 0;
  previousTime = time;
  if (state.running && !document.hidden) update(dt);
  draw();
  requestAnimationFrame(frame);
}

startButton.addEventListener("click", () => {
  state = newGame();
  state.running = true;
  overlay.hidden = true;
  hud();
});
window.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (state.running) event.preventDefault();
  keys[event.key === "ArrowLeft" ? "left" : "right"] = true;
});
window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") keys.left = false;
  if (event.key === "ArrowRight") keys.right = false;
});
window.addEventListener("blur", () => { keys.left = keys.right = false; });
document.addEventListener("visibilitychange", () => { previousTime = 0; keys.left = keys.right = false; });
hud();
requestAnimationFrame(frame);
