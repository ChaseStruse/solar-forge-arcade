const tennis = document.querySelector("#tennis-game");
const pool = document.querySelector("#pool-game");
const neon = document.querySelector("#neon-game");
const breaker = document.querySelector("#breaker-game");
const volley = document.querySelector("#volley-game");
const basketball = document.querySelector("#basketball-game");
const blitz = document.querySelector("#blitz-game");
const panel = document.querySelector(".control-panel");
const help = document.createElement("p");
help.className = "cabinet-help";
help.textContent = tennis ? "Arrows or drag to move. Returns are automatic. Space serves or readies a power shot; aim with left/right. First to 7. P pauses."
  : pool ? "Aim with pointer or arrows. Hold and release the table, Space, or SHOOT for power. Clear colors, then the 8. Scratches cost a shot. P pauses."
  : neon ? "Move with A/D. W jumps. J punches; L shoots. Hold Shift for bullet time; release when empty. P pauses; Escape exits."
  : blitz ? "Arrows move. X/C pass. Space dashes on offense. Nova throws trigger slow motion: Z switches to a defender near the pass destination; move into the ball to intercept. AI teammates stay in man coverage. Routes change each play. First to 3 TDs."
  : basketball ? "Move with ← →. Double jump with Space. Press X at the top of your jump for your most accurate shot! Aim right. First to five!"
  : breaker
  ? "Drag the paddle or use LEFT / RIGHT. Chain bricks for bonus points; clear a level to regain a life."
  : volley
    ? "Move with ← →. Tap jump twice for an aerial block! Landing restores both jumps. First to five wins."
    : "Spend your starting 10 Sparks on power or range. Mint runners are fast; purple invaders are armored.";
panel.append(help);
if (tennis || pool) panel.append(document.querySelector(".sports-controls"));
if (neon) panel.append(document.querySelector(".neon-touch"));
window.addEventListener("keydown",event=>{
  if(event.key==="Escape")parent.postMessage({type:"arcade-exit"},location.origin);
});
