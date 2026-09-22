import { createPool, shootPool, stepPool, poolGuide, POCKETS } from './pool-physics.js';
import { createSportsUI, pixelRect, pixelText, palette } from './retro-sports.js';

let game=createPool(), angle=0, charging=false, charge=0, pointerId=null, best=0;
try { best=Number(localStorage.getItem('solar-pool-best'))||0; } catch { /* Saving is optional. */ }
function beginCharge(){if(game.phase==='aim'&&!charging){charging=true;charge=0;}}
function releaseShot(){if(charging){shootPool(game,angle,Math.min(1,.12+charge/1.1));charging=false;charge=0;}}
const ui=createSportsUI({reset(){game=createPool();angle=0;},press(key){if(key===' ')beginCharge();},release(key){if(key===' ')releaseShot();},clear(){charging=false;charge=0;pointerId=null;}});
const {ctx,canvas}=ui,box=(...args)=>pixelRect(ctx,...args),text=(...args)=>pixelText(ctx,...args);
const colors=['#fff0cf','#ffda83','#79aaff','#ff7f9b','#bc93ff','#ffaf75','#7ce5ad','#ed9acb','#13192e'];
function aim(event){const cue=game.balls.find(b=>b.id===0);if(!cue)return;const p=ui.point(event);if(Math.hypot(p.x-cue.x,p.y-cue.y)>5)angle=Math.atan2(p.y-cue.y,p.x-cue.x);}
canvas.addEventListener('pointerdown',event=>{
  if(!ui.active||game.phase!=='aim')return;event.preventDefault();canvas.setPointerCapture(event.pointerId);pointerId=event.pointerId;aim(event);beginCharge();
});
canvas.addEventListener('pointermove',event=>{if(ui.active&&game.phase==='aim'&&(pointerId===event.pointerId||event.pointerType==='mouse'))aim(event);});
canvas.addEventListener('pointerup',event=>{if(pointerId===event.pointerId){aim(event);releaseShot();pointerId=null;}});
for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>{if(pointerId===event.pointerId){charging=false;charge=0;pointerId=null;}});
function ball(b){
  box(b.x-4,b.y+3,10,3,'#092f32');
  box(b.x-3,b.y-5,6,10,colors[b.id]);box(b.x-5,b.y-3,10,6,colors[b.id]);
  if(b.id){box(b.x-2,b.y-3,5,6,'#fff0dc');text(String(b.id),b.x+.5,b.y+2,'#172032',5,'center');}
  else box(b.x-2,b.y-3,2,2,'#ffffff');
}
function line(x1,y1,x2,y2,color,spacing=3,size=1){
  const length=Math.hypot(x2-x1,y2-y1),steps=Math.max(1,Math.ceil(length/spacing));
  for(let i=0;i<=steps;i++)box(x1+(x2-x1)*i/steps,y1+(y2-y1)*i/steps,size,size,color);
}
function draw(){
  box(0,0,400,280,palette.ink);text('SOLAR POOL',200,18,palette.cream,12,'center');
  text(`SCORE ${game.score}`,15,35,palette.mint,8);text(`BEST ${best}`,385,35,palette.gold,8,'right');
  box(17,49,366,197,'#6b3e56');box(20,52,360,191,'#a46967');box(24,56,352,183,'#233b40');
  box(30,62,340,170,'#175756');
  for(let y=65;y<230;y+=8)for(let x=33;x<370;x+=8)box(x,y,1,1,'#206461');
  box(34,66,332,2,'#348779');box(34,227,332,2,'#0f3d44');
  for(const x of [72,114,156,244,286,328]){box(x,55,3,2,palette.gold);box(x,237,3,2,palette.gold);}
  for(const y of [102,147,192]){box(23,y,2,3,palette.gold);box(376,y,2,3,palette.gold);}
  box(115,144,1,6,'#3a8175');box(112,147,7,1,'#3a8175');
  for(const [x,y] of POCKETS){box(x-7,y-10,14,20,'#0a1124');box(x-10,y-7,20,14,'#0a1124');box(x-5,y-6,10,2,'#070b17');}
  const cue=game.balls.find(b=>b.id===0);
  if(game.phase==='aim'&&cue){
    const guide=poolGuide(game,angle);
    line(cue.x,cue.y,guide.x,guide.y,'#b2e4bc',5);
    ctx.strokeStyle=palette.cream;ctx.lineWidth=1;ctx.strokeRect(Math.round(guide.x-4),Math.round(guide.y-4),8,8);
    if(guide.hit){
      const dx=guide.hit.x-guide.x,dy=guide.hit.y-guide.y,n=Math.hypot(dx,dy)||1;
      line(guide.hit.x,guide.hit.y,guide.hit.x+dx/n*22,guide.hit.y+dy/n*22,palette.gold,3);
    }
    const pull=charging?Math.min(1,charge/1.1)*14:0;
    line(cue.x-Math.cos(angle)*(14+pull),cue.y-Math.sin(angle)*(14+pull),cue.x-Math.cos(angle)*(48+pull),cue.y-Math.sin(angle)*(48+pull),palette.gold,1,2);
    box(cue.x-Math.cos(angle)*(12+pull)-1,cue.y-Math.sin(angle)*(12+pull)-1,3,3,palette.mint);
  }
  for(const b of game.balls)ball(b);
  text(charging?'RELEASE TO SHOOT':game.phase==='rolling'?'ROLLING…':'AIM / HOLD / RELEASE',15,263,palette.mint,8);
  box(265,256,120,7,'#27314c');box(265,256,Math.round(120*(charging?Math.min(1,.12+charge/1.1):0)),7,palette.gold);
  text(`${game.shots} SHOTS LEFT`,385,276,palette.gold,7,'right');
  text('CLEAR COLORS. THEN THE 8.',15,276,'#a296b1',7);
}
ui.loop(dt=>{
  if(ui.active){
    if(game.phase==='aim'){
      angle+=(Number(ui.held('ArrowRight')||ui.held('d'))-Number(ui.held('ArrowLeft')||ui.held('a')))*1.4*dt;
      if(charging)charge+=dt;
    }
    stepPool(game,dt);
    if(game.phase==='over'){
      best=Math.max(best,game.score);try{localStorage.setItem('solar-pool-best',String(best));}catch{ /* Saving is optional. */ }
      ui.finish(game.winner?'RACK CLEARED!':game.message,`${game.score} points · Best ${best}. ${game.winner?'Smooth shooting. One more rack?':'Clear every color before the 8. Try another rack.'}`);
    }
  }
  for(const event of game.events.splice(0))ui.tone(event);
  document.querySelector('#sports-left').textContent=game.shots;
  document.querySelector('#sports-right').textContent=game.balls.filter(b=>b.id!==0).length;
  ui.status(charging?'RELEASE TO SHOOT':game.message);draw();
});
