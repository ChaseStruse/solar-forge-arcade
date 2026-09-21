const breaker = document.querySelector("#breaker-game");
const volley = document.querySelector("#volley-game");
const basketball = document.querySelector("#basketball-game");
const panel = document.querySelector(".control-panel");
const help = document.createElement("p");
help.className = "cabinet-help";
help.textContent = basketball ? "Move with ← →. Double jump with Space. Press X to shoot at the right hoop. First to five!"
  : breaker
  ? "Move with ← → or the buttons below. Keep the ball bouncing!"
  : volley
    ? "Move with ← →. Tap jump twice for an aerial block! Landing restores both jumps. First to five wins."
    : "Your towers fire automatically. Spend Sparks on upgrades to keep the forge alive.";
panel.append(help);
if (breaker || volley || basketball) {
  const controls = document.createElement("div");
  controls.className = "touch-controls";
  const buttons = [["ArrowLeft","Move left","◀"],["ArrowRight","Move right","▶"]];
  if (volley) buttons.splice(1, 0, [" ","Jump","JUMP"]);
  if (basketball) buttons.push([" ","Jump","↑"], ["x","Shoot","X"]);
  for (const [key,label,copy] of buttons) {
    const button = document.createElement("button");
    button.type="button";button.textContent=copy;button.setAttribute("aria-label",label);
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
