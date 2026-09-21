import { touchdown, nextDown, winner } from "./blitz-rules.js";

const canvas = document.querySelector("#blitz-game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#blitz-overlay");
const start = document.querySelector("#blitz-start");
const keys = new Set();
const colors = ["#75ffe2", "#ff7eb5"];
let scores, offense, down, spot, startSpot, players, carrier, flight, controlled;
let running = false, delay = 0, clock = 0, aiPass = 0, previous = 0, message = "FIRST TO 3 TOUCHDOWNS";
const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function setup(team, x, newPossession = false) {
  offense = team; spot = clamp(x, 90, 710); startSpot = spot;
  if (newPossession) down = 1;
  const dir = team === 0 ? 1 : -1;
  players = [];
  for (let t = 0; t < 2; t++) for (let i = 0; i < 3; i++) {
    const attacking = t === offense;
    players.push({ team: t, number: i, x: clamp(spot + (attacking ? (i ? 24 : -12) : 105) * dir, 78, 722),
      y: [280, 170, 390][i], cooldown: 0, dash: 0 });
  }
  carrier = players[team * 3]; flight = null; controlled = team === 0 ? carrier : players[0];
  delay = 1.1; clock = 0; aiPass = 0;
}
function begin() {
  scores = [0, 0]; running = true; message = "SOL BALL / ATTACK RIGHT";
  setup(0, 160, true); overlay.hidden = true; keys.clear();
}
function endPlay(incomplete = false) {
  const result = nextDown(down, incomplete, carrier?.x ?? spot, startSpot);
  const old = offense;
  setup(result.turnover ? 1 - old : old, result.spot, result.turnover);
  if (!result.turnover) down = result.down;
  message = result.turnover ? "TURNOVER ON DOWNS!" : incomplete ? "INCOMPLETE" : "TACKLED!";
}
function pass(number) {
  if (!running || delay > 0 || flight || !carrier) return;
  const target = players.find(p => p.team === offense && p.number === number && p !== carrier);
  if (!target) return;
  const length = distance(carrier, target);
  flight = { x: carrier.x, y: carrier.y, vx: (target.x - carrier.x) / Math.max(.1, length) * 440,
    vy: (target.y - carrier.y) / Math.max(.1, length) * 440, age: 0, thrower: carrier };
  carrier = null;
  if (offense === 0) controlled = target;
}
function action(key) {
  if (!running || delay > 0) return;
  if (key === " " && controlled.cooldown <= 0) { controlled.dash = .32; controlled.cooldown = 2.5; }
  if (key === "x" && offense === 0) pass(1);
  if (key === "c" && offense === 0) pass(2);
  if (key === "z" && offense !== 0) {
    const target = carrier ?? flight;
    const choices = players.filter(p => p.team === 0 && p !== controlled).sort((a,b) => distance(a,target)-distance(b,target));
    controlled = choices[0];
  }
}
function move(p, dx, dy, dt) {
  const norm = Math.hypot(dx, dy) || 1;
  const speed = p.dash > 0 ? 280 : p === controlled ? 155 : p === carrier ? 118 : 132;
  p.x = clamp(p.x + dx / norm * speed * dt, 30, 770);
  p.y = clamp(p.y + dy / norm * speed * dt, 105, 455);
}
function update(dt) {
  if (delay > 0) { delay -= dt; return; }
  clock += dt; aiPass += dt;
  const ball = carrier ?? flight;
  for (const p of players) {
    p.cooldown = Math.max(0, p.cooldown - dt); p.dash = Math.max(0, p.dash - dt);
    if (p === controlled) {
      const dx = Number(keys.has("ArrowRight") || keys.has("d")) - Number(keys.has("ArrowLeft") || keys.has("a"));
      const dy = Number(keys.has("ArrowDown") || keys.has("s")) - Number(keys.has("ArrowUp") || keys.has("w"));
      if (dx || dy) move(p, dx, dy, dt);
    } else if (p.team === offense) {
      const dir = offense === 0 ? 1 : -1;
      if (p === carrier) {
        const closest = players.filter(q => q.team !== offense).sort((a,b) => distance(p,a)-distance(p,b))[0];
        move(p, dir, distance(p,closest) < 95 ? (p.y < closest.y ? -.8 : .8) : Math.sin(clock * 2) * .3, dt);
      } else {
        const y = p.number === 1 ? 155 : 405;
        move(p, dir * 100, (y - p.y) * 2, dt);
      }
    } else move(p, ball.x - p.x, ball.y - p.y, dt);
  }
  if (offense === 1 && carrier && aiPass > 1.4 && carrier.number === 0) {
    const receivers = players.filter(p => p.team === 1 && p !== carrier);
    const openness = p => Math.min(...players.filter(q => q.team === 0).map(q => distance(p,q)));
    receivers.sort((a,b) => openness(b)-openness(a));
    pass(receivers[0].number); aiPass = 0;
  }
  if (flight) {
    flight.age += dt; flight.x += flight.vx * dt; flight.y += flight.vy * dt;
    const caught = players.find(p => p !== flight.thrower && distance(p,flight) < 21 && flight.age > .09);
    if (caught) {
      const interception = caught.team !== offense;
      carrier = caught; flight = null;
      if (interception) { offense = caught.team; down = 1; startSpot = caught.x; message = "INTERCEPTION!"; }
      if (offense === 0) controlled = carrier;
    } else if (flight.age > 1.8 || flight.x < 25 || flight.x > 775 || flight.y < 100 || flight.y > 460) { endPlay(true); return; }
  }
  if (carrier) {
    if (touchdown(offense, carrier.x)) {
      scores[offense]++;
      if (winner(scores) !== -1) {
        running = false; overlay.hidden = false;
        document.querySelector("#blitz-overlay-title").textContent = scores[0] === 3 ? "SOL WINS!" : "NOVA WINS!";
        start.textContent = "REMATCH"; return;
      }
      const next = 1 - offense;
      setup(next, next === 0 ? 160 : 640, true); message = "TOUCHDOWN!"; return;
    }
    if (players.some(p => p.team !== offense && distance(p,carrier) < 23)) { endPlay(); return; }
  }
  if (clock > 14) endPlay(true);
}
function box(x,y,w,h,c) { ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),w,h); }
function draw() {
  box(0,0,800,560,"#090d26");
  box(25,95,750,370,"#15253a");
  box(25,95,37,370,"#283450"); box(738,95,37,370,"#492745");
  for(let x=62;x<=738;x+=67.6) {
    box(x,95,2,370,"#42677a");
    for(let y=115;y<455;y+=24) box(x+30,y,7,2,"#42677a");
  }
  box(25,95,750,3,"#82f7e3"); box(25,463,750,3,"#ff81b9");
  box(startSpot,95,2,370,"#eac67b");
  for(const p of players) {
    if(p===controlled) { ctx.strokeStyle="#fff6ad";ctx.lineWidth=2;ctx.strokeRect(p.x-15,p.y-19,30,38); }
    box(p.x-10,p.y-15,20,11,colors[p.team]); box(p.x-7,p.y-7,14,6,"#ffd3a1");
    box(p.x-12,p.y,24,15,colors[p.team]); box(p.x-10,p.y+15,7,5,"#d9edee");box(p.x+3,p.y+15,7,5,"#d9edee");
    ctx.font="bold 10px monospace";ctx.textAlign="center";ctx.fillStyle="#10152b";ctx.fillText(p.number+1,p.x,p.y+11);
    if(p.team===0 && p!==carrier && offense===0 && p.number) {ctx.fillStyle="#fff4b5";ctx.fillText(p.number===1?"X":"C",p.x,p.y-23);}
  }
  const b=carrier?{x:carrier.x+12,y:carrier.y}:flight;
  if(b) {box(b.x-7,b.y-4,14,8,"#c88950");box(b.x-4,b.y-1,8,2,"#fff4d0");}
  ctx.textAlign="center";ctx.fillStyle="#fbe8b6";ctx.font="bold 23px monospace";
  ctx.fillText("SOLAR BLITZ",400,35);
  ctx.font="bold 17px monospace";ctx.fillStyle=colors[0];ctx.fillText("SOL "+scores[0],95,37);ctx.fillStyle=colors[1];ctx.fillText("NOVA "+scores[1],700,37);
  ctx.fillStyle="#c7dae9";ctx.font="bold 13px monospace";
  ctx.fillText(delay>0?message:(offense===0?"ATTACK RIGHT →":"← DEFEND YOUR END ZONE"),400,73);
  ctx.fillText("DOWN "+down+"/4    "+Math.max(0,Math.ceil(14-clock))+"s    DASH "+(controlled.cooldown>0?controlled.cooldown.toFixed(1)+"s":"READY"),400,501);
  ctx.font="12px monospace";ctx.fillText("MOVE: ARROWS / WASD   PASS: X / C   SWITCH: Z   DASH: SPACE",400,537);
  document.querySelector("#blitz-player-score").textContent=scores[0];
  document.querySelector("#blitz-rival-score").textContent=scores[1];
  document.querySelector("#blitz-status").textContent=(offense===0?"OFFENSE":"DEFENSE")+" / DOWN "+down;
}
function frame(t) {
  const dt=previous?Math.min((t-previous)/1000,.025):0;previous=t;
  if(running&&!document.hidden) update(dt);
  draw();requestAnimationFrame(frame);
}
start.addEventListener("click",begin);
window.addEventListener("keydown",e=>{
  const k=e.key.length===1?e.key.toLowerCase():e.key;
  if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," ","w","a","s","d","x","c","z"].includes(k)) {
    if(running)e.preventDefault();keys.add(k);if(!e.repeat)action(k);
  }
});
window.addEventListener("keyup",e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
window.addEventListener("blur",()=>keys.clear());
document.addEventListener("visibilitychange",()=>{keys.clear();previous=0;});
scores=[0,0];setup(0,160,true);requestAnimationFrame(frame);
