import { createPuck, puckAction, stepPuck, RINK, PUCK_RADIUS, MALLET_RADIUS, WIN_SCORE } from './puck-physics.js';
import { createSportsUI, pixelRect, pixelText, palette } from './retro-sports.js';

let game = createPuck(), pointer = null, pointerId = null, trail = [];
const ui = createSportsUI({
  reset() { game = createPuck(); trail = []; },
  press(key) { if (key === ' ') puckAction(game); if (['a','d','w','s','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)) pointer = null; },
  release() {}, clear() { pointer = null; pointerId = null; },
});
const { ctx, canvas } = ui, box = (...args) => pixelRect(ctx, ...args), text = (...args) => pixelText(ctx, ...args);
canvas.addEventListener('pointerdown', event => {
  if (!ui.active) return; event.preventDefault(); canvas.setPointerCapture(event.pointerId); pointerId = event.pointerId; pointer = ui.point(event);
});
canvas.addEventListener('pointermove', event => { if (pointerId === event.pointerId || (ui.active && event.pointerType === 'mouse')) pointer = ui.point(event); });
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(name, event => { if (pointerId === event.pointerId) { pointerId = null; if (event.pointerType !== 'mouse') pointer = null; } });

// Chunky pixel discs keep the retro look without sprites.
function disc(x, y, r, color) {
  for (let dy = -r; dy <= r; dy += 2) {
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
    box(x - half, y + dy - 1, half * 2, 2, color);
  }
}
function mallet(m, team) {
  const color = team === 0 ? palette.mint : palette.pink;
  disc(m.x + 2, m.y + 3, MALLET_RADIUS, '#081a24');
  disc(m.x, m.y, MALLET_RADIUS, color);
  disc(m.x, m.y, MALLET_RADIUS - 4, team === 0 ? '#3cbfae' : '#c2537f');
  disc(m.x, m.y, 4, palette.cream);
}
function draw() {
  const { left, right, top, bottom, mid, goalTop, goalBottom } = RINK;
  box(0, 0, 400, 280, palette.ink);
  text('SOLAR PUCK', 200, 17, palette.cream, 12, 'center');
  text(`SOL ${game.scores[0]}`, 15, 17, palette.mint, 10); text(`NOVA ${game.scores[1]}`, 385, 17, palette.pink, 10, 'right');
  box(left - 8, top - 8, right - left + 16, bottom - top + 16, '#263052');
  box(left, top, right - left, bottom - top, '#14394a');
  for (let y = top + 4; y < bottom; y += 10) for (let x = left + 5; x < right; x += 10) box(x, y, 1, 1, '#1f5164');
  box(left, top - 2, right - left, 2, palette.mint); box(left, bottom, right - left, 2, palette.pink);
  box(mid, top, 1, bottom - top, '#ffda9188');
  ctx.strokeStyle = '#ffda9166'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(mid + .5, (top + bottom) / 2, 26, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#7fffea44'; ctx.beginPath(); ctx.arc(left, (top + bottom) / 2, 44, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.strokeStyle = '#ff86b544'; ctx.beginPath(); ctx.arc(right, (top + bottom) / 2, 44, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
  box(left - 8, goalTop, 8, goalBottom - goalTop, '#070b17'); box(right, goalTop, 8, goalBottom - goalTop, '#070b17');
  box(left - 2, goalTop - 3, 4, 3, palette.gold); box(left - 2, goalBottom, 4, 3, palette.gold);
  box(right - 2, goalTop - 3, 4, 3, palette.gold); box(right - 2, goalBottom, 4, 3, palette.gold);
  const p = game.puck, speed = Math.hypot(p.vx, p.vy);
  if (game.phase === 'play') { trail.push({ x: p.x, y: p.y }); if (trail.length > 6) trail.shift(); } else trail = [];
  trail.forEach((t, i) => { if (speed > 160) box(t.x - 2, t.y - 2, 4, 4, i % 2 ? '#ffda9155' : '#7fffea44'); });
  mallet(game.mallets[1], 1); mallet(game.mallets[0], 0);
  if (game.smash > 0) { ctx.strokeStyle = palette.gold; ctx.strokeRect(Math.round(game.mallets[0].x - 17), Math.round(game.mallets[0].y - 17), 34, 34); }
  disc(p.x + 1, p.y + 2, PUCK_RADIUS, '#081a24'); disc(p.x, p.y, PUCK_RADIUS, speed > 380 ? palette.gold : palette.cream);
  disc(p.x, p.y, 3, '#2a3355');
  if (game.phase === 'serve' || game.phase === 'point') {
    box(98, 128, 204, 22, '#0b1026e8'); text(game.message, 200, 142, palette.gold, 8, 'center');
  }
  text(`RALLY ${game.rally}  /  BEST ${game.bestRally}`, 14, 274, palette.mint, 8);
  text(game.smashCooldown > 0 ? 'SMASH RECHARGING' : 'SPACE: SMASH', 386, 274, palette.gold, 8, 'right');
}
ui.loop(dt => {
  if (ui.active) {
    stepPuck(game, dt, { x: Number(ui.held('ArrowRight') || ui.held('d')) - Number(ui.held('ArrowLeft') || ui.held('a')),
      y: Number(ui.held('ArrowDown') || ui.held('s')) - Number(ui.held('ArrowUp') || ui.held('w')), target: pointer });
    if (game.phase === 'over') ui.finish(game.winner === 0 ? 'SOL WINS!' : 'NOVA WINS!', `${game.scores[0]}–${game.scores[1]} · Longest rally: ${game.bestRally}. First to ${WIN_SCORE} again?`);
  }
  // Rail bounces are frequent; keep only the most important sound per frame.
  const events = game.events.splice(0), sound = ['win', 'score', 'miss', 'power', 'hit', 'bounce'].find(name => events.includes(name));
  if (sound) ui.tone(sound);
  document.querySelector('#sports-left').textContent = game.scores[0]; document.querySelector('#sports-right').textContent = game.scores[1];
  ui.status(game.message); draw();
});
