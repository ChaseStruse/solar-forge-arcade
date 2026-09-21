const neon = document.querySelector("#neon-game");
const breaker = document.querySelector("#breaker-game");
const volley = document.querySelector("#volley-game");
const basketball = document.querySelector("#basketball-game");
const blitz = document.querySelector("#blitz-game");
const panel = document.querySelector(".control-panel");
const help = document.createElement("p");
help.className = "cabinet-help";
help.textContent = neon ? "Move with A/D. W jumps. J/K/L fight. Hold Shift for bullet time. P pauses; Escape exits."
  : blitz ? "Arrows move. X/C pass. Space dashes. Z switches defenders. Attack right! Four downs; first to 3 touchdowns."
  : basketball ? "Move with ← →. Double jump with Space. Press X at the top of your jump for your most accurate shot! Aim right. First to five!"
  : breaker
  ? "Move with ← → or the buttons below. Keep the ball bouncing!"
  : volley
    ? "Move with ← →. Tap jump twice for an aerial block! Landing restores both jumps. First to five wins."
    : "Your towers fire automatically. Spend Sparks on upgrades to keep the forge alive.";
panel.append(help);
if (neon) panel.append(document.querySelector(".neon-touch"));
if (breaker || volley || basketball || blitz) {
  const controls = document.createElement("div");
  controls.className = "touch-controls";
  const buttons = [["ArrowLeft","Move left","◀"],["ArrowRight","Move right","▶"]];
  if (volley) buttons.splice(1, 0, [" ","Jump","JUMP"]);
  if (basketball) buttons.push([" ","Jump","↑"], ["x","Shoot","X"]);
  if (blitz) {
    controls.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:5px";
    buttons.push(["ArrowUp","Move up","↑"],["ArrowDown","Move down","↓"],["x","Pass to X","X"],["c","Pass to C","C"],["z","Switch defender","Z"],[" ","Dash","DASH"]);
  }
  for (const [key,label,copy] of buttons) {
    const button = document.createElement("button");
    button.type="button";button.textContent=copy;button.setAttribute("aria-label",label);
    if (blitz) button.style.cssText = "padding:12px 4px;font-size:16px";
    const release=()=>window.dispatchEvent(new KeyboardEvent("keyup",{key}));
    button.addEventListener("pointerdown",event=>{
      event.preventDefault();button.setPointerCapture(event.pointerId);
      window.dispatchEvent(new KeyboardEvent("keydown",{key,cancelable:true}));
    });
    button.addEventListener("pointerup",release);button.addEventListener("pointercancel",release);button.addEventListener("lostpointercapture",release);
    controls.append(button);
  }
  panel.append(controls);
}
window.addEventListener("keydown",event=>{
  if(event.key==="Escape")parent.postMessage({type:"arcade-exit"},location.origin);
});
