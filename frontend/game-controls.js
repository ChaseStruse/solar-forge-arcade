// Shared touch and pause controls for the original five Canvas games.
const canvas = document.querySelector('canvas');
const panel = document.querySelector('.control-panel');
const kind = canvas.id;
const layout = kind === 'game' ? [] : [
  ['ArrowLeft', 'LEFT', 'Move left'],
  ['ArrowRight', 'RIGHT', 'Move right'],
];
if (kind === 'volley-game' || kind === 'basketball-game') layout.push([' ', 'JUMP', 'Jump']);
if (kind === 'basketball-game') layout.push(['x', 'SHOOT', 'Shoot']);
if (kind === 'blitz-game') layout.push(['ArrowUp', 'UP', 'Move up'], ['ArrowDown', 'DOWN', 'Move down'],
  ['x', 'PASS X', 'Pass to X'], ['c', 'PASS C', 'Pass to C'], ['z', 'SWITCH', 'Switch defender'], [' ', 'DASH', 'Dash']);
const held = new Map();
const emit = (type, key) => window.dispatchEvent(new KeyboardEvent(type, { key, cancelable: true }));
const controls = document.createElement('div');
controls.className = 'game-touch-controls';
if (layout.length === 2) controls.classList.add('two-controls');
controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', 'Game controls');
for (const [key, label, description] of layout) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = label; button.setAttribute('aria-label', description);
  button.addEventListener('pointerdown', event => {
    if (document.documentElement.dataset.paused === 'true') return;
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    held.set(event.pointerId, { key, button }); button.classList.add('held'); emit('keydown', key);
  });
  const release = event => {
    const control = held.get(event.pointerId);
    if (!control) return;
    held.delete(event.pointerId);
    if (![...held.values()].some(value => value.key === key)) { button.classList.remove('held'); emit('keyup', key); }
  };
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, release);
  button.addEventListener('click', event => {
    if (event.detail === 0 && document.documentElement.dataset.paused !== 'true') { emit('keydown', key); emit('keyup', key); }
  });
  controls.append(button);
}
if (layout.length) panel.prepend(controls);
const pause = document.createElement('button');
pause.type = 'button'; pause.className = 'game-pause'; pause.textContent = 'PAUSE [P]'; pause.disabled = true;
pause.setAttribute('aria-pressed', 'false'); panel.prepend(pause);
const veil = document.createElement('button');
veil.type = 'button'; veil.className = 'game-pause-veil'; veil.textContent = 'PAUSED · TAP TO RESUME'; veil.hidden = true;
canvas.parentElement.append(veil);
let started = false;
function clear() {
  for (const { key, button } of held.values()) { emit('keyup', key); button.classList.remove('held'); }
  held.clear();
  for (const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','s','d','w',' ']) emit('keyup', key);
}
function setPaused(value) {
  if (!started) return;
  clear(); document.documentElement.dataset.paused = String(value);
  pause.textContent = value ? 'RESUME [P]' : 'PAUSE [P]'; pause.setAttribute('aria-pressed', String(value));
  veil.hidden = !value;
}
pause.addEventListener('click', () => setPaused(veil.hidden));
veil.addEventListener('click', () => setPaused(false));
document.querySelector('.screen-overlay .primary-button').addEventListener('click', () => {
  started = true; pause.disabled = false; setPaused(false);
});
window.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.toLowerCase() === 'p' && !event.repeat) { event.preventDefault(); setPaused(veil.hidden); }
  if (document.documentElement.dataset.paused === 'true' && event.key !== 'Escape') event.stopImmediatePropagation();
  // Let native buttons consume Space/Enter without also jumping or dashing.
  if (event.target.tagName === 'BUTTON' && [' ', 'Enter'].includes(event.key)) event.stopImmediatePropagation();
}, true);
document.querySelector('#help-panel')?.addEventListener('close', () => { if (started) setPaused(true); });
document.addEventListener('click', () => { if (document.querySelector('#help-panel')?.open) setPaused(true); });
window.addEventListener('blur', () => setPaused(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });

if (kind === 'breaker-game') {
  let pointer = null;
  const move = event => {
    const bounds = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new CustomEvent('paddle-aim', { detail: (event.clientX - bounds.left) * canvas.width / bounds.width }));
  };
  canvas.addEventListener('pointerdown', event => {
    event.preventDefault(); pointer = event.pointerId; canvas.setPointerCapture(pointer); move(event);
  });
  canvas.addEventListener('pointermove', event => { if (pointer === event.pointerId) move(event); });
  for (const name of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(name, () => { pointer = null; });
}
