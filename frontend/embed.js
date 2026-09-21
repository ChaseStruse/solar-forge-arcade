const breaker = document.querySelector("#breaker-game");
const panel = document.querySelector(".control-panel");
const help = document.createElement("p");
help.className = "cabinet-help";
help.textContent = breaker
  ? "Move with ← → or the buttons below. Keep the ball bouncing!"
  : "Your towers fire automatically. Spend Sparks on upgrades to keep the forge alive.";
panel.append(help);
if (breaker) {
  const controls = document.createElement("div");
  controls.className = "touch-controls";
  for (const [key,label] of [["ArrowLeft","Move left"],["ArrowRight","Move right"]]) {
    const button = document.createElement("button");
    button.type="button";button.textContent=key==="ArrowLeft"?"◀":"▶";button.setAttribute("aria-label",label);
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
