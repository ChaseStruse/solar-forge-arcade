// Shared cabinet controls for Tennis and Pool; the simulations stay independent.
export const palette = { ink: '#0b1026', mint: '#7fffea', pink: '#ff86b5', gold: '#ffda91', cream: '#fff0ca' };
export function pixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
export function pixelText(ctx, copy, x, y, color = palette.cream, size = 8, align = 'left') {
  ctx.fillStyle = color; ctx.font = `bold ${size}px monospace`; ctx.textAlign = align; ctx.fillText(copy, Math.round(x), Math.round(y));
}
export function createSportsUI({ reset, press, release, clear }) {
  const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
  const overlay = document.querySelector('#sports-overlay'), start = document.querySelector('#sports-start');
  const pauseButton = document.querySelector('#sports-pause'), soundButton = document.querySelector('#sports-sound');
  const keys = new Set(), pointers = new Map();
  let active = false, paused = false, ended = false, sound = false, audio;
  ctx.imageSmoothingEnabled = false;
  const ui = {
    canvas, ctx, keys,
    get active() { return active; },
    held(key) { return keys.has(key) || [...pointers.values()].includes(key); },
    point(event) { const r = canvas.getBoundingClientRect(); return { x: (event.clientX-r.left)*400/r.width, y: (event.clientY-r.top)*280/r.height }; },
    status(copy) { const label = document.querySelector('#sports-status'); if (label.textContent !== copy) label.textContent = copy; },
    clear() { keys.clear(); pointers.clear(); clear(); document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('held')); },
    finish(heading, copy) {
      active = false; ended = true; paused = false; ui.clear(); pauseButton.disabled = true;
      document.querySelector('#sports-title').textContent = heading;
      document.querySelector('#sports-copy').textContent = copy; start.textContent = 'PLAY AGAIN ↗'; overlay.hidden = false;
    },
    tone(name) {
      if (!sound || !audio) return;
      const frequencies = { hit: 210, power: 550, bounce: 140, score: 740, miss: 85, shot: 170, pot: 620, win: 900 };
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = 'square'; osc.frequency.setValueAtTime(frequencies[name] || 300, audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(65, audio.currentTime + .1);
      gain.gain.setValueAtTime(.022, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .12);
      osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + .13);
    },
    loop(tick) {
      let previous = 0;
      function frame(now) { const dt = Math.min((now-previous)/1000 || 0,.04); previous = now; tick(active ? dt : 0); requestAnimationFrame(frame); }
      requestAnimationFrame(frame);
    },
  };
  function begin() {
    if (!paused || ended) reset();
    ui.clear(); active = true; paused = false; ended = false;
    overlay.hidden = true; pauseButton.disabled = false; pauseButton.textContent = 'PAUSE [P]'; canvas.focus({preventScroll:true});
  }
  function pause() {
    if (paused) { begin(); return; }
    if (!active) return;
    active = false; paused = true; ui.clear(); overlay.hidden = false;
    document.querySelector('#sports-title').textContent = 'TIME OUT';
    document.querySelector('#sports-copy').textContent = 'Your game is waiting. Take a breath.';
    start.textContent = 'RESUME ↗'; pauseButton.textContent = 'RESUME [P]';
  }
  function toggleSound() {
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume().catch(()=>{}); sound = !sound;
      soundButton.textContent = sound ? 'SOUND ON [M]' : 'SOUND OFF [M]'; soundButton.setAttribute('aria-pressed',String(sound));
      ui.tone('score');
    } catch { soundButton.textContent = 'SOUND UNAVAILABLE'; }
  }
  start.addEventListener('click',begin); pauseButton.addEventListener('click',pause); soundButton.addEventListener('click',toggleSound);
  window.addEventListener('keydown',event=>{
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(event.ctrlKey||event.metaKey||event.altKey||['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;
    if(event.target.tagName==='BUTTON' && (key===' '||key==='Enter'))return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','w','a','s','d','p','Escape'].includes(key))event.preventDefault();
    if(!event.repeat) {
      if(key==='p'||key==='Escape')pause(); else if(key==='m')toggleSound(); else if(active)press(key);
    }
    keys.add(key);
  });
  window.addEventListener('keyup',event=>{const key=event.key.length===1?event.key.toLowerCase():event.key;keys.delete(key);if(active)release(key);});
  for(const button of document.querySelectorAll('[data-control]')) {
    button.addEventListener('pointerdown',event=>{
      event.preventDefault();button.setPointerCapture(event.pointerId);pointers.set(event.pointerId,button.dataset.control);button.classList.add('held');
      if(active)press(button.dataset.control);
    });
    const up=event=>{const key=pointers.get(event.pointerId);pointers.delete(event.pointerId);button.classList.remove('held');if(key&&active)release(key);};
    button.addEventListener('pointerup',up);
    const cancel=event=>{if(!pointers.has(event.pointerId))return;pointers.delete(event.pointerId);button.classList.remove('held');clear();};
    button.addEventListener('pointercancel',cancel);button.addEventListener('lostpointercapture',cancel);
    // Keyboard activation of an on-screen control remains usable.
    button.addEventListener('click',event=>{if(event.detail===0&&active){press(button.dataset.control);release(button.dataset.control);}});
  }
  window.addEventListener('blur',()=>{if(active)pause();else ui.clear();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)pause();});
  return ui;
}
