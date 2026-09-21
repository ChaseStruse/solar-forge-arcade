import { createGame, action, step, FLOOR, clamp } from './neon-combat.js';

const canvas = document.querySelector('#neon-game');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#neon-overlay');
const title = document.querySelector('#neon-title');
const copy = document.querySelector('#neon-copy');
const start = document.querySelector('#neon-start');
const pauseButton = document.querySelector('#neon-pause');
const soundButton = document.querySelector('#neon-sound');
const scoreLabel = document.querySelector('#neon-score');
const bestLabel = document.querySelector('#neon-best');
const statusLabel = document.querySelector('#neon-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const keys = new Set();
const touchKeys = new Map();
const bindings = { w: 'jump', ArrowUp: 'jump', ' ': 'jump', s: 'dodge', ArrowDown: 'dodge', j: 'punch', k: 'kick', l: 'shoot' };
let game = createGame(), mode = 'ready', previous = 0, best = 0, sound = false, audio, shake = 0;
try { best = Number(localStorage.getItem('neon-bullet-best')) || 0; } catch { /* Storage is optional. */ }
bestLabel.textContent = best;
ctx.imageSmoothingEnabled = false;
function tone(name) {
  if (!sound || !audio) return;
  const frequencies = { swing: 150, hit: 90, shot: 440, enemyShot: 220, hurt: 55, jump: 330, dodge: 190, kill: 660, wave: 880 };
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  oscillator.type = 'square'; oscillator.frequency.setValueAtTime(frequencies[name] || 200, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(40, audio.currentTime + .1);
  gain.gain.setValueAtTime(.025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .12);
  oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .13);
}
function toggleSound() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {}); sound = !sound;
    soundButton.textContent = sound ? 'SOUND ON [M]' : 'SOUND OFF [M]';
    soundButton.setAttribute('aria-pressed', String(sound)); tone('wave');
  } catch { soundButton.textContent = 'SOUND UNAVAILABLE'; }
}
function clearInput() {
  keys.clear(); touchKeys.clear();
  document.querySelectorAll('.neon-touch button').forEach(button => button.classList.remove('held'));
}
function showOverlay(heading, description, button) {
  title.textContent = heading; copy.textContent = description; start.textContent = button; overlay.hidden = false;
}
function begin() {
  if (mode === 'paused') { mode = 'playing'; }
  else { game = createGame(); mode = 'playing'; }
  clearInput(); overlay.hidden = true; pauseButton.disabled = false; pauseButton.textContent = 'PAUSE [P]';
  canvas.focus({ preventScroll: true }); previous = performance.now();
}
function pause() {
  if (mode === 'paused') { begin(); return; }
  if (mode !== 'playing') return;
  mode = 'paused'; clearInput(); pauseButton.textContent = 'RESUME [P]';
  showOverlay('TIME OUT', 'Catch your breath. Your rooftop will wait.', 'RESUME RUN ↗');
}
function finish() {
  mode = game.status; clearInput(); pauseButton.disabled = true;
  best = Math.max(best, game.score); bestLabel.textContent = best;
  try { localStorage.setItem('neon-bullet-best', String(best)); } catch { /* Continue without saving. */ }
  showOverlay(mode === 'won' ? 'ROOFTOP SECURED' : 'END OF THE LINE',
    `${game.score.toLocaleString()} points · Wave ${game.wave}/5. ${mode === 'won' ? 'The night belongs to you.' : 'Use rolls and bullet time to escape a crossfire.'}`, 'PLAY AGAIN ↗');
}
function held(key) { return keys.has(key) || [...touchKeys.values()].includes(key); }
function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function text(value, x, y, color = '#e9e3cd', size = 8, align = 'left') {
  ctx.fillStyle = color; ctx.font = `bold ${size}px monospace`; ctx.textAlign = align; ctx.fillText(value, Math.round(x), Math.round(y));
}
function skyline() {
  rect(0, 0, 400, 280, '#0b1026');
  for (let i = 0; i < 36; i++) rect((i * 79 + 13) % 400, (i * 37 + 11) % 160, 1, 1, i % 3 ? '#3b4767' : '#8c7496');
  rect(289, 43, 34, 34, '#f4ab98'); rect(283, 49, 46, 22, '#f4ab98');
  for (let y = 60; y < 78; y += 5) rect(282, y, 48, 2, '#35213f');
  for (let i = 0; i < 15; i++) {
    const x = i * 29 - 5, top = 103 + (i * 31) % 66;
    rect(x, top, 25, 130, '#171b37');
    rect(x + 5, top - 6, 2, 6, '#171b37');
    for (let y = top + 8; y < 217; y += 12) for (let j = 0; j < 3; j++) if ((i + j + y) % 4) rect(x + 4 + j * 7, y, 2, 4, '#413055');
  }
  for (let i = 0; i < 8; i++) {
    const x = i * 61 - 13, top = 157 + (i * 17) % 33;
    rect(x, top, 45, 76, '#20243f');
    for (let y = top + 7; y < 225; y += 11) for (let j = 0; j < 4; j++) rect(x + 6 + j * 9, y, 3, 4, (i + j) % 3 ? '#4e3b5c' : '#997178');
  }
  // Rooftop fixtures and the illuminated arcade sign.
  rect(23, 172, 50, 24, '#11172c'); rect(25, 174, 46, 20, '#483052'); text('FORGE', 48, 187, '#ff8eae', 10, 'center');
  rect(29, 196, 3, 30, '#354050'); rect(63, 196, 3, 30, '#354050');
  rect(331, 204, 34, 23, '#344054'); rect(335, 201, 26, 3, '#566174');
  for (let x = 336; x < 362; x += 5) rect(x, 209, 2, 12, '#17243a');
  rect(0, 226, 400, 6, '#41546b'); rect(0, 226, 400, 2, '#85adbd');
  rect(0, FLOOR, 400, 48, '#1a2138'); rect(0, FLOOR, 400, 2, '#e48c90');
  for (let i = 0; i < 20; i++) { rect(i * 23, 247, 17, 1, '#34314b'); rect(i * 23 + 10, 264, 17, 1, '#34314b'); }
  text('SECTOR 06', 16, 269, '#6b6888', 7); text('SOLAR FORGE SYSTEMS', 385, 269, '#6b6888', 7, 'right');
}
function fighter(p, isPlayer = false, ghost = false) {
  const x = Math.round(p.x), y = Math.round(p.y), dir = p.facing;
  const suit = isPlayer ? '#6debd5' : p.kind === 'gunner' ? '#c286ee' : '#ed7598';
  if (!ghost) rect(x - 10, FLOOR + 2, 20, 2, '#090d1f');
  if (isPlayer && p.invulnerable > 0 && Math.floor(game.time * 18) % 2 && !ghost) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  if (isPlayer && p.dodge > 0) {
    rect(-10, -12, 17, 9, suit); rect(6, -10, 6, 6, '#fbe2c2'); rect(-13, -5, 8, 4, '#22344a');
  } else {
    const walk = (isPlayer ? held('a') || held('d') || held('ArrowLeft') || held('ArrowRight') : p.windup <= 0) && p.y === FLOOR;
    const stride = walk ? Math.round(Math.sin(game.time * 15) * 3) : 0;
    rect(-5, -12, 4, 10 + stride, '#31435b'); rect(2, -12, 4, 10 - stride, '#31435b');
    rect(-7, -3 + stride, 7, 3, suit); rect(2, -3 - stride, 8, 3, suit);
    rect(-6, -23, 13, 12, suit); rect(-4, -23, 6, 13, isPlayer ? '#284659' : '#412d54');
    rect(-4, -31, 10, 9, '#f9c5aa'); rect(-5, -33, 12, 4, '#111b32'); rect(1, -28, 6, 2, isPlayer ? '#d7fff0' : '#1b2336');
    rect(-8, -21, 4, 10, suit);
    const attack = isPlayer && p.poseTime > 0 ? p.pose : p.windup > 0 ? p.attack : '';
    if (attack === 'kick') { rect(3, -13, 23, 5, suit); rect(23, -14, 5, 7, '#f4e3ca'); }
    if (attack === 'punch') { rect(5, -23, 17, 4, suit); rect(20, -24, 5, 6, '#f9c5aa'); }
    else if (attack === 'shoot' || p.kind === 'gunner') { rect(5, -22, 10, 4, suit); rect(12, -23, 10, 4, '#c6d8dc'); rect(13, -19, 3, 4, '#506078'); }
    else rect(6, -21, 4, 9, suit);
  }
  ctx.restore();
  if (!isPlayer && !ghost) {
    rect(x - 10, y - 39, 20, 2, '#35253e'); rect(x - 10, y - 39, Math.ceil(20 * p.hp / p.maxHp), 2, suit);
    if (p.windup > 0) text('!', x, y - 44, '#ffe58e', 12, 'center');
  }
}
function bar(x, y, width, amount, color, label) {
  text(label, x, y - 4, color, 6); rect(x, y, width, 4, '#30334c'); rect(x, y, Math.round(width * clamp(amount, 0, 1)), 4, color);
}
function draw() {
  ctx.save();
  if (shake > 0 && !reducedMotion) ctx.translate(Math.round(Math.sin(game.time * 91) * shake), 0);
  skyline();
  if (game.slow) {
    rect(0, 35, 400, 191, '#60ddda0b');
    if (!reducedMotion) {
      ctx.globalAlpha = .22;
      fighter({ ...game.player, x: game.player.x - game.player.facing * 14 }, true, true);
      ctx.globalAlpha = 1;
    }
    text('B U L L E T   T I M E', 200, 61, '#7fffea', 8, 'center');
  }
  for (const e of game.enemies) fighter(e);
  fighter(game.player, true);
  for (const b of game.bullets) {
    const color = b.friendly ? '#8bffe5' : '#ffcb77';
    rect(b.x - Math.sign(b.vx) * 9, b.y, 9, 1, b.friendly ? '#397c84' : '#96634a'); rect(b.x - 2, b.y - 1, 4, 2, color);
  }
  for (const e of game.effects) {
    const age = 1 - e.life / e.maxLife;
    if (e.text) text(e.text, e.x, e.y - age * 14, e.color, 8, 'center');
    else for (let i = 0; i < 6; i++) rect(e.x + Math.cos(i * Math.PI / 3) * age * 20, e.y + Math.sin(i * Math.PI / 3) * age * 16, 3, 3, e.color);
  }
  ctx.restore();
  rect(0, 0, 400, 34, '#090f23');
  bar(12, 22, 92, game.player.hp / 100, '#ff86a4', 'HEALTH');
  bar(119, 22, 92, game.player.focus / 100, '#7fffea', 'FOCUS / SHIFT');
  text('AMMO', 228, 18, '#ffdc88', 6);
  for (let i = 0; i < 6; i++) rect(228 + i * 7, 22, 4, 5, i < Math.floor(game.player.ammo) ? '#ffdc88' : '#34324b');
  text(`WAVE ${Math.max(1, game.wave)}/5`, 385, 23, '#f3e3ca', 9, 'right');
  if (game.combo > 1) text(`${game.combo} HIT CHAIN`, 385, 46, '#ffdc88', 8, 'right');
  if (game.intermission > 0 && mode === 'playing') {
    rect(65, 101, 270, 48, '#0b1026e8');
    text(game.wave ? 'WAVE CLEAR / +18 HEALTH' : 'WELCOME TO THE NIGHT SHIFT', 200, 119, '#7fffea', 10, 'center');
    text(`WAVE ${game.wave + 1} INCOMING`, 200, 137, '#f5ddbb', 8, 'center');
  }
}
function frame(now) {
  const dt = Math.min((now - previous) / 1000 || 0, .04); previous = now;
  if (mode === 'playing') {
    step(game, dt, { move: Number(held('d') || held('ArrowRight')) - Number(held('a') || held('ArrowLeft')), slow: held('Shift') });
    // Holding an attack repeats at its own cooldown, useful on touch screens.
    for (const [key, name] of [['j', 'punch'], ['k', 'kick'], ['l', 'shoot']]) if (held(key)) action(game, name);
    if (game.status !== 'playing') finish();
    const message = game.status === 'won' ? 'ROOFTOP SECURED' : game.status === 'lost' ? 'RUN COMPLETE' : game.intermission > 0 ? 'NEXT WAVE INCOMING' : `WAVE ${game.wave} / ${game.remaining + game.enemies.length} HOSTILES`;
    if (statusLabel.textContent !== message) statusLabel.textContent = message;
    scoreLabel.textContent = String(game.score).padStart(6, '0');
  }
  for (const event of game.events.splice(0)) { tone(event); if (event === 'hurt') shake = 3; else if (event === 'hit') shake = 1.5; }
  shake = Math.max(0, shake - dt * 14);
  draw(); requestAnimationFrame(frame);
}
start.addEventListener('click', begin);
pauseButton.addEventListener('click', pause);
soundButton.addEventListener('click', toggleSound);
window.addEventListener('keydown', event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.tagName === 'BUTTON' && (key === ' ' || key === 'Enter')) return;
  if (bindings[key] || ['a', 'd', 'ArrowLeft', 'ArrowRight', 'Shift', 'p', 'Escape'].includes(key)) event.preventDefault();
  if (!event.repeat) {
    if (key === 'p' || key === 'Escape') pause();
    else if (key === 'm') toggleSound();
    else if (mode === 'playing' && bindings[key]) action(game, bindings[key]);
  }
  keys.add(key);
});
window.addEventListener('keyup', event => keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
window.addEventListener('blur', () => { clearInput(); if (mode === 'playing') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); if (mode === 'playing') pause(); } });
for (const button of document.querySelectorAll('.neon-touch button')) {
  button.addEventListener('pointerdown', event => {
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    touchKeys.set(event.pointerId, button.dataset.key); button.classList.add('held');
    if (mode === 'playing' && bindings[button.dataset.key]) action(game, bindings[button.dataset.key]);
  });
  const release = event => { touchKeys.delete(event.pointerId); button.classList.remove('held'); };
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, release);
}
requestAnimationFrame(frame);
