const port = Number(Bun.env.PORT ?? 3000);
const root = new URL("../frontend/", import.meta.url);

const files: Record<string, { path: string; type: string }> = {
  "/": { path: "index.html", type: "text/html; charset=utf-8" },
  "/assets/style.css": { path: "style.css", type: "text/css; charset=utf-8" },
  "/assets/combat.js": { path: "combat.js", type: "text/javascript; charset=utf-8" },
  "/assets/game.js": { path: "game.js", type: "text/javascript; charset=utf-8" },
  "/assets/targeting.js": { path: "targeting.js", type: "text/javascript; charset=utf-8" },
  "/assets/progression.js": { path: "progression.js", type: "text/javascript; charset=utf-8" },
  "/assets/htmx.min.js": { path: "htmx.min.js", type: "text/javascript; charset=utf-8" },
};

const guide = `
  <div class="help-content">
    <button class="help-close" type="button" aria-label="Close instructions" onclick="this.closest('#help-panel').replaceChildren()">×</button>
    <p class="eyebrow">FIELD MANUAL / 001</p>
    <h2>Keep the forge glowing.</h2>
    <p>Two towers guard the forge from opposite sides. They fire automatically at invaders in range, but the forge blocks their shots. Each enemy you melt drops <strong>Sparks</strong>.</p>
    <p>Spend Sparks on power, fire rate, and firing range for both towers. If an invader reaches the forge, the shield takes a hit. When it runs out, your shift is over.</p>
    <p>Wave 10 brings the Cinder Titan. Defeat it to choose a permanent power-up for this shift.</p>
    <p class="help-tip">Tip: the game begins when you press <strong>Start shift</strong>. It pauses when this tab is hidden.</p>
  </div>`;

Bun.serve({
  port,
  fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
    }

    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    if (url.pathname === "/fragments/guide") {
      return new Response(guide, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    const asset = files[url.pathname];
    if (!asset) return new Response("Not found", { status: 404 });

    return new Response(Bun.file(new URL(asset.path, root)), {
      headers: { "Content-Type": asset.type, "Cache-Control": "no-cache" },
    });
  },
});

console.log(`Solar Forge Arcade listening on http://localhost:${port}`);
