let THREE, CSS3DRenderer, CSS3DObject, RoundedBoxGeometry;
let screenCenter, screenRotation, screenNormal;

const mount = document.querySelector("#scene");
const status = document.querySelector("#load-status");
const monitorElement = document.querySelector("#monitor");
const gameFrame = document.querySelector("#game-screen");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function mountOnScreen(object, depth = 0) {
  object.position.set(0, 0, depth).applyQuaternion(screenRotation).add(screenCenter);
  object.quaternion.copy(screenRotation);
}
const games = {
  tennis: { name: "Solar Tennis", title: "SOLAR<br />TENNIS", description: "FAST FEET. CLEAN HITS. ONE MORE RALLY.", channel: "07", url: "/games/solar-tennis" },
  pool: { name: "Solar Pool", title: "SOLAR<br />POOL", description: "FIND YOUR ANGLE. CLEAR THE TABLE.", channel: "08", url: "/games/solar-pool" },
  neon: { name: "Neon Bullet", title: "NEON<br />BULLET", description: "OWN THE ROOFTOP. BEND THE SECONDS.", channel: "06", url: "/games/neon-bullet" },
  blitz: { name: "Solar Blitz", title: "SOLAR<br />BLITZ", description: "THREE A SIDE. FOUR DOWNS. ALL ACTION.", channel: "05", url: "/games/solar-blitz" },
  basketball: { name: "Solar Basketball", title: "SOLAR<br />BASKETBALL", description: "OWN THE COURT. SHOOT FOR THE SUN.", channel: "04", url: "/games/solar-basketball" },
  forge: { name: "Protect the Forge", title: "PROTECT<br />THE FORGE", description: "KEEP THE HEART OF THE ARCADE BURNING.", channel: "01", url: "/games/protect-the-forge" },
  breaker: { name: "Brick Breaker", title: "BRICK<br />BREAKER", description: "ONE PADDLE. INFINITE POSSIBILITIES.", channel: "02", url: "/games/brick-breaker" },
  volley: { name: "Solar Volley", title: "SOLAR<br />VOLLEY", description: "JUMP HIGH. GUARD THE NET. SERVE UP THE SUN.", channel: "03", url: "/games/solar-volley" },
};
let selected = "forge";
let mode = "attract";
let page = 0;
const choices = [...document.querySelectorAll(".game-choice")];
const pageSize = 4;
const pageCount = Math.ceil(choices.length / pageSize);
let ready = false;
let resizeFallback = () => {};

function createCabinet(renderer) {
  const cabinet = new THREE.Group();
  const material = (color, roughness = .45, metalness = .1) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const plum = material("#38293f");
  const black = material("#161923");
  const coral = material("#fc956a", .3, .3);
  const cream = material("#e9d3a0");
  const mint = material("#bae8b0", .28);
  const metal = material("#9babb4", .22, .85);
  const lit = (color) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .6 });
  function box(size, position, mat, radius = .035) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 3, radius), mat);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cabinet.add(mesh);
    return mesh;
  }
  function cylinder(radius, height, position, mat) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 32), mat);
    mesh.position.set(...position);
    mesh.castShadow = true;
    cabinet.add(mesh);
    return mesh;
  }
  function canvasTexture(width, height, draw) {
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    draw(canvas.getContext("2d"), width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  }
  function decal(texture, width, height, position, rotationY = 0) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false }));
    mesh.position.set(...position);
    mesh.rotation.y = rotationY;
    cabinet.add(mesh);
    return mesh;
  }

  // Side profile follows the silhouette of a real upright cabinet.
  // Shape x is depth, shape y is height; extrusion becomes cabinet width.
  const profile = [[-.95,.15],[1.02,.15],[1.02,2.25],[1.48,2.62],[1.48,2.88],[.97,3.02],[.97,5.05],[1.23,5.22],[1.23,6.15],[-.95,6.15]];
  const sideShape = new THREE.Shape();
  profile.forEach(([z,y],i) => i ? sideShape.lineTo(-z,y) : sideShape.moveTo(-z,y));
  sideShape.closePath();
  const panelGeometry = new THREE.ExtrudeGeometry(sideShape, { depth: .14, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .035, bevelThickness: .025 });
  for (const x of [-1.64,1.5]) {
    const panel = new THREE.Mesh(panelGeometry, plum);
    panel.rotation.y = Math.PI/2;
    panel.position.x = x;
    panel.castShadow = true;
    cabinet.add(panel);
    const line = profile.map(([z,y]) => new THREE.Vector3(x + (x < 0 ? -.026 : .166),y,z));
    line.push(line[0]);
    const edging = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(line,false,"catmullrom",0),100,.027,8,false),coral);
    cabinet.add(edging);
  }
  box([3.12,2.2,1.95],[0,1.26,0],plum);
  box([3.12,3.7,1.15],[0,4.18,-.375],black);
  box([3.3,.18,2.05],[0,.12,0],black);
  box([3.25,.07,1.95],[0,.22,0],lit("#76cdb2"));
  box([3.15,.98,2.13],[0,5.66,.08],plum);
  box([3.04,.80,.10],[0,5.67,1.20],coral);
  box([2.91,.65,.06],[0,5.67,1.265],black);
  const marquee = canvasTexture(1536,350,(ctx,w,h) => {
    ctx.fillStyle="#251d35";ctx.fillRect(0,0,w,h);
    const gradient=ctx.createLinearGradient(0,0,w,0);gradient.addColorStop(0,"#ffc879");gradient.addColorStop(.5,"#ffe9b1");gradient.addColorStop(1,"#ff9a78");
    ctx.textAlign="center";ctx.font="900 172px 'Barlow Condensed', sans-serif";ctx.fillStyle=gradient;
    ctx.shadowColor="#ff8c77";ctx.shadowBlur=16;ctx.fillText("SOLAR FORGE",w/2,194);ctx.shadowBlur=0;
    ctx.font="700 40px 'Space Mono', monospace";ctx.fillStyle="#d3ebad";ctx.fillText("★    A R C A D E    ★",w/2,275);
    ctx.strokeStyle="#b78561";ctx.lineWidth=3;ctx.strokeRect(15,15,w-30,h-30);
  });
  decal(marquee,2.86,.65,[0,5.67,1.303]);
  // The live DOM monitor and this bezel use the exact same world coordinates.
  mountOnScreen(box([3.13,2.43,.18],[0,0,0],black,.10), -.206);
  mountOnScreen(box([2.86,2.17,.08],[0,0,0],coral,.09), -.099);
  mountOnScreen(box([2.76,2.07,.08],[0,0,0],black,.09), -.05);
  for(let i=0;i<9;i++) box([.14,.035,.025],[-.72+i*.18,5.22,1.09],black,.01);
  box([3.35,.24,1.38],[0,2.72,1.28],plum,.07);
  box([3.35,.035,.055],[0,2.72,1.98],coral,.01);
  // Printed stripes and physical controls on the deck.
  for(let i=0;i<3;i++) box([3.09,.008,.07],[0,2.847,1.67+i*.085],[coral,cream,mint][i],.002);
  cylinder(.30,.035,[-.85,2.865,1.55],black);
  cylinder(.072,.30,[-.85,3.02,1.55],metal);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.18,32,24),coral);
  ball.position.set(-.85,3.21,1.55);cabinet.add(ball);
  for (let i=0;i<3;i++) {
    cylinder(.19,.04,[.32+i*.38,2.87,1.51-(i%2)*.13],black);
    cylinder(.145,.085,[.32+i*.38,2.92,1.51-(i%2)*.13],[mint,coral,cream][i]);
  }
  cylinder(.09,.045,[-.23,2.88,.9],cream);
  box([1.17,1.23,.075],[0,1.39,1.012],black,.055);
  box([1.04,1.10,.028],[0,1.39,1.064],material("#30303a"),.035);
  for(const x of [-.26,.26]) {
    box([.22,.37,.04],[x,1.55,1.09],metal,.025);
    box([.11,.24,.045],[x,1.55,1.116],lit("#ff916b"),.015);
    box([.028,.15,.048],[x,1.55,1.14],black,.005);
  }
  for(let i=0;i<5;i++)box([.53,.022,.028],[0,1.16-i*.065,1.09],black,.005);
  const badge=canvasTexture(512,180,(ctx,w,h)=>{
    ctx.textAlign="center";ctx.fillStyle="#edc49c";ctx.font="700 28px 'Space Mono',monospace";ctx.fillText("FORGE-VISION",w/2,65);
    ctx.font="900 68px 'Barlow Condensed',sans-serif";ctx.fillText("9000",w/2,139);
  });
  decal(badge,.9,.32,[0,2.27,1.025]);
  const art=canvasTexture(640,1400,(ctx,w,h)=>{
    ctx.fillStyle="#30243f";ctx.fillRect(0,0,w,h);
    ctx.save();ctx.beginPath();ctx.arc(w/2,470,245,0,Math.PI*2);ctx.clip();
    const gradient=ctx.createLinearGradient(0,220,0,720);gradient.addColorStop(0,"#ffe5a5");gradient.addColorStop(.45,"#ffae79");gradient.addColorStop(1,"#cc658b");ctx.fillStyle=gradient;ctx.fillRect(0,200,w,550);
    for(let y=460;y<750;y+=35){ctx.clearRect(0,y,w,7+(y-460)/25);}ctx.restore();
    for(let i=0;i<4;i++){ctx.strokeStyle=["#ffac79","#de7994","#ad749c","#7fcbb5"][i];ctx.lineWidth=26;ctx.beginPath();ctx.moveTo(45+i*42,1320);ctx.lineTo(45+i*42,930-i*25);ctx.lineTo(560,720-i*36);ctx.stroke();}
    ctx.fillStyle="#ffdbab";for(const [x,y] of [[110,160],[495,150],[525,900],[160,790]]){ctx.beginPath();ctx.moveTo(x,y-17);ctx.lineTo(x+5,y-5);ctx.lineTo(x+17,y);ctx.lineTo(x+5,y+5);ctx.lineTo(x,y+17);ctx.lineTo(x-5,y+5);ctx.lineTo(x-17,y);ctx.lineTo(x-5,y-5);ctx.closePath();ctx.fill();}
    ctx.textAlign="center";ctx.font="900 85px 'Barlow Condensed',sans-serif";ctx.fillText("SOLAR",w/2,415);ctx.fillStyle="#39263c";ctx.fillText("FORGE",w/2,505);
    ctx.font="700 22px 'Space Mono',monospace";ctx.fillStyle="#f8d1aa";ctx.fillText("PLAY BEYOND THE ORDINARY",w/2,1225);
  });
  decal(art,1.74,5.32,[1.682,3.20,0],Math.PI/2);
  decal(art,1.74,5.32,[-1.682,3.20,0],-Math.PI/2);
  return cabinet;
}

async function init() {
  [THREE, { CSS3DRenderer, CSS3DObject }, { RoundedBoxGeometry }] = await Promise.all([
    import('three'), import('three/addons/renderers/CSS3DRenderer.js'), import('three/addons/geometries/RoundedBoxGeometry.js'),
  ]);
  const screenTilt = -THREE.MathUtils.degToRad(20);
  screenCenter = new THREE.Vector3(0, 4.20, .93);
  screenRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), screenTilt);
  screenNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(screenRotation);
  // Wait for display fonts before baking the cabinet's printed artwork.
  await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,2500))]);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35,1,.1,80);
  const renderer = new THREE.WebGLRenderer({ antialias:true,alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.45;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  mount.append(renderer.domElement);
  const cssRenderer=new CSS3DRenderer();
  cssRenderer.domElement.className="css-scene";
  mount.append(cssRenderer.domElement);
  const cssScene=new THREE.Scene();
  const monitor=new CSS3DObject(monitorElement);
  monitorElement.hidden=false;
  mountOnScreen(monitor);
  monitor.scale.setScalar(2.58/960);
  cssScene.add(monitor);
  // Render menu typography at viewport resolution, outside the scaled CSS3D tree.
  const menu = document.querySelector("#game-menu");
  mount.append(menu);
  menu.classList.add("sharp-menu");
  const menuCorner = new THREE.Vector3();
  function placeMenu(){
    monitor.updateWorldMatrix(true, false);
    const project = (x,y) => {
      menuCorner.set(x,y,0).applyMatrix4(monitor.matrixWorld).project(camera);
      return {x:(menuCorner.x+1)*width/2,y:(1-menuCorner.y)*height/2};
    };
    const a=project(-480,360), b=project(480,-360);
    const newlyVisible=progress>.995 && menu.style.visibility!=="visible";
    Object.assign(menu.style,{left:Math.round(a.x)+"px",top:Math.round(a.y)+"px",
      width:Math.round(b.x-a.x)+"px",height:Math.round(b.y-a.y)+"px",
      visibility:progress>.995?"visible":"hidden"});
    if(newlyVisible)renderMenu(true);
  }
  scene.add(createCabinet(renderer));
  // Cut a transparent window through WebGL at the monitor plane. Keeping the
  // canvas above CSS3D lets physical objects (like the joystick) occlude the
  // screen correctly, while the iframe stays interactive underneath.
  const windowShape=new THREE.Shape();
  const hw=1.29,hh=.9675,r=.09;
  windowShape.moveTo(-hw+r,-hh);
  windowShape.lineTo(hw-r,-hh);windowShape.quadraticCurveTo(hw,-hh,hw,-hh+r);
  windowShape.lineTo(hw,hh-r);windowShape.quadraticCurveTo(hw,hh,hw-r,hh);
  windowShape.lineTo(-hw+r,hh);windowShape.quadraticCurveTo(-hw,hh,-hw,hh-r);
  windowShape.lineTo(-hw,-hh+r);windowShape.quadraticCurveTo(-hw,-hh,-hw+r,-hh);
  const screenWindow=new THREE.Mesh(new THREE.ShapeGeometry(windowShape),new THREE.MeshBasicMaterial({color:0x000000,opacity:0,blending:THREE.NoBlending}));
  mountOnScreen(screenWindow);scene.add(screenWindow);
  scene.add(new THREE.HemisphereLight("#ffded2","#71708f",2.5));
  const key=new THREE.DirectionalLight("#ffd5b4",3.5);key.position.set(3,8,7);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=8;key.shadow.camera.bottom=-4;
  key.shadow.normalBias=.03;scene.add(key);
  const rim=new THREE.DirectionalLight("#99d5df",3);rim.position.set(5,4,-3);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(5.8,96),new THREE.ShadowMaterial({opacity:.3}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;scene.add(floor);
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(2.65,2.85,.12,96),new THREE.MeshStandardMaterial({color:"#292330",roughness:.7}));
  plinth.position.y=-.07;plinth.receiveShadow=true;scene.add(plinth);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.71,.012,8,128),new THREE.MeshBasicMaterial({color:"#947184"}));ring.rotation.x=Math.PI/2;ring.position.y=-.035;scene.add(ring);
  let angle=.43;
  let targetAngle=.43;
  let progress=0;
  let drag=null;
  let width=1,height=1;
  const target=new THREE.Vector3();
  const position=new THREE.Vector3();
  function resize(){
    width=mount.clientWidth;height=mount.clientHeight;
    renderer.setSize(width,height);cssRenderer.setSize(width,height);
    camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(mount);
  resize();
  mount.addEventListener("pointerdown",event=>{
    if(mode!=="attract"||event.target.closest("button"))return;
    drag={x:event.clientX,angle:targetAngle};mount.setPointerCapture(event.pointerId);
  });
  mount.addEventListener("pointermove",event=>{
    if(!drag)return;
    targetAngle=THREE.MathUtils.clamp(drag.angle+(event.clientX-drag.x)*.005,-.58,.65);
  });
  const release=()=>{drag=null;};
  mount.addEventListener("pointerup",release);mount.addEventListener("pointercancel",release);
  document.querySelector("#reset-view").addEventListener("click",()=>{targetAngle=.43;});
  const clock=new THREE.Clock();
  function frame(){
    const dt=Math.min(clock.getDelta(),.05);
    const blend=reducedMotion.matches?1:1-Math.exp(-dt*7);
    progress=THREE.MathUtils.lerp(progress,mode!=="attract"?1:0,blend);
    angle=THREE.MathUtils.lerp(angle,targetAngle,blend);
    const aspect=width/height;
    const distance=Math.max(13.1,8.7/aspect);
    const home=new THREE.Vector3(Math.sin(angle)*distance,6.15,Math.cos(angle)*distance);
    const playDistance=Math.max(1.24/Math.tan(THREE.MathUtils.degToRad(17.5)),1.48/(Math.tan(THREE.MathUtils.degToRad(17.5))*aspect));
    position.copy(home).lerp(screenCenter.clone().addScaledVector(screenNormal,playDistance),progress);
    target.set(0,3.05,0).lerp(screenCenter,progress);
    camera.position.copy(position);camera.lookAt(target);
    renderer.render(scene,camera);
    cssRenderer.render(cssScene,camera);
    if(mode==="menu")placeMenu();
    requestAnimationFrame(frame);
  }
  frame();
  powerOn();
}

function powerOn(){
  ready=true;
  document.querySelector("#play-button").disabled=false;
  document.querySelector("#play-button").innerHTML='STEP UP & PLAY <span>↗</span>';
  document.querySelector("#screen-play").disabled=false;
  status.hidden=true;
}
function renderMenu(focus=false){
  choices.forEach((button,index)=>{
    button.hidden=Math.floor(index/pageSize)!==page;
    const active=button.dataset.game===selected;
    button.classList.toggle("active",active);
    button.setAttribute("aria-pressed",String(active));
    button.setAttribute("aria-label","Play "+games[button.dataset.game].name);
  });
  document.querySelector("#menu-page").textContent=String(page+1).padStart(2,"0")+" / "+String(pageCount).padStart(2,"0");
  if(focus) choices.find(button=>button.dataset.game===selected)?.focus({preventScroll:true});
}
function showMenu(){
  if(!ready)return;
  mode="menu";
  document.body.classList.add("play-mode");
  document.querySelector(".play-toolbar").hidden=false;
  document.querySelector("#exit-game").hidden=true;
  document.querySelector("#playing-title").textContent="CHOOSE YOUR GAME";
  document.querySelector("#attract-screen").hidden=true;
  document.querySelector("#game-menu").hidden=false;
  gameFrame.hidden=true;gameFrame.src="about:blank";
  page=Math.floor(choices.findIndex(button=>button.dataset.game===selected)/pageSize);
  renderMenu(true);resizeFallback();
}
function launch(key){
  if(!ready||mode!=="menu"||!games[key])return;
  selected=key;mode="game";
  document.querySelector("#game-menu").hidden=true;
  document.querySelector("#exit-game").hidden=false;
  document.querySelector("#playing-title").textContent=games[key].name.toUpperCase();
  gameFrame.title=games[key].name+" — playable arcade game";
  gameFrame.hidden=false;gameFrame.src=games[key].url;
}
function stepBack(){
  if(mode==="attract")return;
  mode="attract";
  document.body.classList.remove("play-mode");
  document.querySelector(".play-toolbar").hidden=true;
  document.querySelector("#attract-screen").hidden=false;
  document.querySelector("#game-menu").hidden=true;
  gameFrame.hidden=true;gameFrame.src="about:blank";
  document.querySelector("#play-button").focus({preventScroll:true});resizeFallback();
}
function exit(){
  if(mode==="game")showMenu();
  else if(mode==="menu")stepBack();
}
function turnPage(direction){
  page=(page+direction+pageCount)%pageCount;
  selected=choices[page*pageSize].dataset.game;
  renderMenu(true);
}
gameFrame.addEventListener("load",()=>{if(mode==="game")gameFrame.contentWindow.focus();});
choices.forEach(button=>button.addEventListener("click",()=>launch(button.dataset.game)));
document.querySelector("#play-button").addEventListener("click",showMenu);
document.querySelector("#screen-play").addEventListener("click",showMenu);
document.querySelector("#exit-game").addEventListener("click",showMenu);
document.querySelector("#step-back").addEventListener("click",stepBack);
document.querySelector("#previous-page").addEventListener("click",()=>turnPage(-1));
document.querySelector("#next-page").addEventListener("click",()=>turnPage(1));
addEventListener("keydown",event=>{
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==="Escape"){event.preventDefault();exit();return;}
  if(mode==="menu" && ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)){
    event.preventDefault();
    const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-2,ArrowDown:2}[event.key];
    const focused=choices.indexOf(document.activeElement);
    const index=focused>=0?focused:choices.findIndex(button=>button.dataset.game===selected);
    const next=(index+delta+choices.length)%choices.length;
    selected=choices[next].dataset.game;page=Math.floor(next/pageSize);renderMenu(true);
  }
  if(event.key==="Enter"&&event.target===document.body){
    event.preventDefault();if(mode==="attract")showMenu();else if(mode==="menu")launch(selected);
  }
});
addEventListener("message",event=>{
  if(event.origin===location.origin&&event.source===gameFrame.contentWindow&&event.data?.type==="arcade-exit"&&mode==="game")showMenu();
});
renderMenu();
init().catch(error=>{
  console.error(error);
  // Keep the same cabinet menu available when WebGL or the CDN is unavailable.
  document.body.classList.add("fallback-mode");
  monitorElement.hidden=false;monitorElement.removeAttribute("style");
  const menu=document.querySelector("#game-menu");
  menu.classList.add("sharp-menu");
  mount.replaceChildren(monitorElement,menu);
  resizeFallback=()=>{
    const reserve=mode==="attract"?130:24;
    const scale=Math.max(.15,Math.min((mount.clientWidth-24)/960,(mount.clientHeight-reserve)/720,1));
    document.body.style.setProperty("--fallback-scale",String(scale));
    Object.assign(menu.style,{left:Math.round((mount.clientWidth-960*scale)/2)+"px",
      top:Math.round((mount.clientHeight-720*scale)/2)+"px",width:Math.round(960*scale)+"px",
      height:Math.round(720*scale)+"px",visibility:"visible"});
  };
  new ResizeObserver(resizeFallback).observe(mount);resizeFallback();powerOn();
});
