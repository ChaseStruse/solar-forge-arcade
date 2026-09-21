const port = Number(Bun.env.PORT ?? 3100);
const experimentRoot = new URL("./", import.meta.url);
const frontendRoot = new URL("../../frontend/", import.meta.url);

const experimentFiles: Record<string, { file: string; type: string }> = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/experiment.css": { file: "experiment.css", type: "text/css; charset=utf-8" },
  "/experiment.js": { file: "experiment.js", type: "text/javascript; charset=utf-8" },
  "/embed.css": { file: "embed.css", type: "text/css; charset=utf-8" },
  "/embed.js": { file: "embed.js", type: "text/javascript; charset=utf-8" },
};

const gameFiles: Record<string, { file: string; type: string }> = {
  "/games/protect-the-forge": { file: "protect-the-forge.html", type: "text/html; charset=utf-8" },
  "/games/brick-breaker": { file: "brick-breaker.html", type: "text/html; charset=utf-8" },
  "/assets/style.css": { file: "style.css", type: "text/css; charset=utf-8" },
  "/assets/combat.js": { file: "combat.js", type: "text/javascript; charset=utf-8" },
  "/assets/game.js": { file: "game.js", type: "text/javascript; charset=utf-8" },
  "/assets/brick-breaker.js": { file: "brick-breaker.js", type: "text/javascript; charset=utf-8" },
  "/assets/targeting.js": { file: "targeting.js", type: "text/javascript; charset=utf-8" },
  "/assets/progression.js": { file: "progression.js", type: "text/javascript; charset=utf-8" },
  "/assets/htmx.min.js": { file: "htmx.min.js", type: "text/javascript; charset=utf-8" },
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

function fileResponse(entry: { file: string; type: string }, root: URL) {
  return new Response(Bun.file(new URL(entry.file, root)), {
    headers: { "Content-Type": entry.type, "Cache-Control": "no-cache" },
  });
}

Bun.serve({
  port,
  async fetch(request) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
    }

    const { pathname } = new URL(request.url);
    if (pathname === "/health") {
      return Response.json({ status: "ok", experiment: "three-arcade" });
    }
    if (pathname === "/fragments/guide") {
      return new Response(guide, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    const experiment = experimentFiles[pathname];
    if (experiment) return fileResponse(experiment, experimentRoot);

    const game = gameFiles[pathname];
    if (game?.type.startsWith("text/html")) {
      const html = await Bun.file(new URL(game.file, frontendRoot)).text();
      return new Response(html.replace("</head>", '<link rel="stylesheet" href="/embed.css"><script type="module" src="/embed.js"></script></head>'), {
        headers: { "Content-Type": game.type, "Cache-Control": "no-cache" },
      });
    }
    if (game) return fileResponse(game, frontendRoot);

    return new Response("Not found", { status: 404 });
  },
});

console.log(`3D Solar Forge cabinet available at http://localhost:${port}`);
