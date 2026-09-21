const port = Number(Bun.env.PORT ?? 3000);
const root = new URL("../frontend/", import.meta.url);

const files: Record<string, { path: string; type: string; embedded?: boolean }> = {
  "/": { path: "index.html", type: "text/html; charset=utf-8" },
  "/protect-the-forge": { path: "protect-the-forge.html", type: "text/html; charset=utf-8" },
  "/protect-the-forge/": { path: "protect-the-forge.html", type: "text/html; charset=utf-8" },
  "/brick-breaker": { path: "brick-breaker.html", type: "text/html; charset=utf-8" },
  "/brick-breaker/": { path: "brick-breaker.html", type: "text/html; charset=utf-8" },
  "/solar-volley": { path: "solar-volley.html", type: "text/html; charset=utf-8" },
  "/solar-volley/": { path: "solar-volley.html", type: "text/html; charset=utf-8" },
  "/games/protect-the-forge": { path: "protect-the-forge.html", type: "text/html; charset=utf-8", embedded: true },
  "/games/brick-breaker": { path: "brick-breaker.html", type: "text/html; charset=utf-8", embedded: true },
  "/games/solar-volley": { path: "solar-volley.html", type: "text/html; charset=utf-8", embedded: true },
  "/experiment.css": { path: "experiment.css", type: "text/css; charset=utf-8" },
  "/experiment.js": { path: "experiment.js", type: "text/javascript; charset=utf-8" },
  "/embed.css": { path: "embed.css", type: "text/css; charset=utf-8" },
  "/embed.js": { path: "embed.js", type: "text/javascript; charset=utf-8" },
  "/assets/style.css": { path: "style.css", type: "text/css; charset=utf-8" },
  "/assets/selector.css": { path: "selector.css", type: "text/css; charset=utf-8" },
  "/assets/combat.js": { path: "combat.js", type: "text/javascript; charset=utf-8" },
  "/assets/game.js": { path: "game.js", type: "text/javascript; charset=utf-8" },
  "/assets/brick-breaker.js": { path: "brick-breaker.js", type: "text/javascript; charset=utf-8" },
  "/assets/solar-volley.js": { path: "solar-volley.js", type: "text/javascript; charset=utf-8" },
  "/assets/volley-physics.js": { path: "volley-physics.js", type: "text/javascript; charset=utf-8" },
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
  async fetch(request) {
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

    if (asset.embedded) {
      const html = await Bun.file(new URL(asset.path, root)).text();
      return new Response(
        html.replace("</head>", '<link rel="stylesheet" href="/embed.css?v=4"><script type="module" src="/embed.js?v=4"></script></head>'),
        { headers: { "Content-Type": asset.type, "Cache-Control": "no-store" } },
      );
    }

    return new Response(Bun.file(new URL(asset.path, root)), {
      headers: { "Content-Type": asset.type, "Cache-Control": "no-store" },
    });
  },
});

console.log(`Solar Forge Arcade listening on http://localhost:${port}`);
