import { createTennis, tennisAction, stepTennis, COURT } from './tennis-physics.js';
import { createSportsUI, pixelRect, pixelText, palette } from './retro-sports.js';

let game = createTennis(), pointer = null, pointerId = null;
const ui = createSportsUI({
  reset() { game = createTennis(); },
  press(key) { if(key===' ')tennisAction(game); if(['a','d','w','s','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key))pointer=null; },
  release() {}, clear() { pointer=null;pointerId=null; },
});
const { ctx, canvas } = ui, box = (...args)=>pixelRect(ctx,...args), text = (...args)=>pixelText(ctx,...args);
canvas.addEventListener('pointerdown',event=>{
  if(!ui.active)return; event.preventDefault();canvas.setPointerCapture(event.pointerId);pointerId=event.pointerId;pointer=ui.point(event);
  if(game.phase==='serve')tennisAction(game);
});
canvas.addEventListener('pointermove',event=>{if(pointerId===event.pointerId)pointer=ui.point(event);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>{if(pointerId===event.pointerId){pointerId=null;pointer=null;}});
function player(p, team) {
  const color=team===0?palette.mint:palette.pink;
  box(p.x-8,p.y+3,16,3,'#0d3039');
  box(p.x-3,p.y-15,6,6,palette.cream);box(p.x-4,p.y-16,8,2,color);
  box(p.x-5,p.y-8,10,9,color);box(p.x-4,p.y+1,3,4,palette.cream);box(p.x+1,p.y+1,3,4,palette.cream);
  const hand=p.swing>0?16:10;
  box(p.x+4,p.y-7,hand-3,2,color);box(p.x+hand,p.y-12,2,12,palette.gold);
  ctx.strokeStyle=palette.cream;ctx.lineWidth=1;ctx.strokeRect(Math.round(p.x+hand-3),Math.round(p.y-18),8,9);
}
function draw() {
  box(0,0,400,280,palette.ink);
  text('SOLAR TENNIS',200,17,palette.cream,12,'center');
  text(`SOL ${game.scores[0]}`,15,17,palette.mint,10);text(`NOVA ${game.scores[1]}`,385,17,palette.pink,10,'right');
  for(let x=20;x<390;x+=12){box(x,29,5,4,x%24?palette.pink:'#63598b');box(x,256,5,4,x%24?palette.mint:'#63598b');}
  box(43,37,314,214,'#263052');box(55,41,290,207,'#1a5c66');
  for(let y=44;y<244;y+=20)box(58,y,284,10,'#1d626b');
  ctx.strokeStyle='#b7e6d4';ctx.lineWidth=1;ctx.strokeRect(58.5,44.5,284,200);
  ctx.strokeRect(78.5,44.5,244,200);ctx.strokeRect(78.5,93.5,244,101);
  box(200,94,1,100,'#b7e6d4');box(195,44,10,1,palette.cream);box(195,244,10,1,palette.cream);
  // Net drawn as a pixel lattice, with a bright tape edge.
  box(49,COURT.net-7,302,12,'#0b2432');
  for(let x=50;x<350;x+=5)box(x,COURT.net-6,1,10,'#668696');
  box(49,COURT.net-7,302,2,palette.cream);box(49,COURT.net-2,302,1,'#668696');
  box(47,COURT.net-10,3,18,palette.gold);box(351,COURT.net-10,3,18,palette.gold);
  player(game.players[1],1);player(game.players[0],0);
  if(game.ball) {
    const b=game.ball;
    box(b.x-3,b.y,6,2,'#0b3440');
    box(b.x-b.vx*.016-1,b.y-b.z-b.vy*.016-1,3,3,b.power?'#ff929a':'#83a673');
    box(b.x-2,b.y-b.z-2,4,4,b.power?palette.gold:'#e2ff80');
  } else if(game.phase==='serve') {
    const p=game.players[game.server];box(p.x+13,p.y-10,4,4,'#e2ff80');
  }
  if(game.power>0){ctx.strokeStyle=palette.gold;ctx.strokeRect(Math.round(game.players[0].x-15),Math.round(game.players[0].y-20),30,29);}
  if(game.phase==='serve'||game.phase==='point') {
    box(73,112,254,22,'#0b1026e8');text(game.phase==='point'?game.message:game.server===0?'SPACE / TAP TO SERVE':'NOVA SERVING',200,126,palette.gold,8,'center');
  }
  text(`RALLY ${game.rally}  /  BEST ${game.bestRally}`,14,274,palette.mint,7);
  text(game.power>0?'POWER READY':game.powerCooldown>0?'POWER RECHARGING':'SPACE: POWER SHOT',386,274,palette.gold,7,'right');
}
ui.loop(dt=>{
  if(ui.active) {
    stepTennis(game,dt,{x:Number(ui.held('ArrowRight')||ui.held('d'))-Number(ui.held('ArrowLeft')||ui.held('a')),
      y:Number(ui.held('ArrowDown')||ui.held('s'))-Number(ui.held('ArrowUp')||ui.held('w')),target:pointer});
    if(game.phase==='over')ui.finish(game.winner===0?'SOL WINS!':'NOVA WINS!',`${game.scores[0]}–${game.scores[1]} · Longest rally: ${game.bestRally}. Ready for a rematch?`);
  }
  for(const event of game.events.splice(0))ui.tone(event);
  document.querySelector('#sports-left').textContent=game.scores[0];document.querySelector('#sports-right').textContent=game.scores[1];
  ui.status(game.message);draw();
});
