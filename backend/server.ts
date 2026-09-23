const port = Number(Bun.env.PORT ?? 3000);
const root = new URL("../frontend/", import.meta.url);

const files: Record<string, { path: string; type: string; embedded?: boolean }> = {
  "/solar-tennis": { path: "solar-tennis.html", type: "text/html; charset=utf-8" },
  "/solar-tennis/": { path: "solar-tennis.html", type: "text/html; charset=utf-8" },
  "/games/solar-tennis": { path: "solar-tennis.html", type: "text/html; charset=utf-8", embedded: true },
  "/assets/solar-tennis.js": { path: "solar-tennis.js", type: "text/javascript; charset=utf-8" },
  "/assets/tennis-physics.js": { path: "tennis-physics.js", type: "text/javascript; charset=utf-8" },
  "/solar-pool": { path: "solar-pool.html", type: "text/html; charset=utf-8" },
  "/solar-pool/": { path: "solar-pool.html", type: "text/html; charset=utf-8" },
  "/games/solar-pool": { path: "solar-pool.html", type: "text/html; charset=utf-8", embedded: true },
  "/assets/solar-pool.js": { path: "solar-pool.js", type: "text/javascript; charset=utf-8" },
  "/assets/pool-physics.js": { path: "pool-physics.js", type: "text/javascript; charset=utf-8" },
  "/assets/retro-sports.js": { path: "retro-sports.js", type: "text/javascript; charset=utf-8" },
  "/assets/retro-sports.css": { path: "retro-sports.css", type: "text/css; charset=utf-8" },
  "/neon-bullet": { path: "neon-bullet.html", type: "text/html; charset=utf-8" },
  "/neon-bullet/": { path: "neon-bullet.html", type: "text/html; charset=utf-8" },
  "/games/neon-bullet": { path: "neon-bullet.html", type: "text/html; charset=utf-8", embedded: true },
  "/assets/neon-bullet.js": { path: "neon-bullet.js", type: "text/javascript; charset=utf-8" },
  "/assets/neon-combat.js": { path: "neon-combat.js", type: "text/javascript; charset=utf-8" },
  "/assets/neon-bullet.css": { path: "neon-bullet.css", type: "text/css; charset=utf-8" },
  "/solar-blitz": { path: "solar-blitz.html", type: "text/html; charset=utf-8" },
  "/games/solar-blitz": { path: "solar-blitz.html", type: "text/html; charset=utf-8", embedded: true },
  "/assets/solar-blitz.js": { path: "solar-blitz.js", type: "text/javascript; charset=utf-8" },
  "/assets/blitz-rules.js": { path: "blitz-rules.js", type: "text/javascript; charset=utf-8" },
  "/assets/basketball-shooting.js": { path: "basketball-shooting.js", type: "text/javascript; charset=utf-8" },
  "/solar-basketball": { path: "solar-basketball.html", type: "text/html; charset=utf-8" },
  "/games/solar-basketball": { path: "solar-basketball.html", type: "text/html; charset=utf-8", embedded: true },
  "/assets/solar-basketball.js": { path: "solar-basketball.js", type: "text/javascript; charset=utf-8" },
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
  "/assets/combat.js": { path: "combat.js", type: "text/javascript; charset=utf-8" },
  "/assets/game.js": { path: "game.js", type: "text/javascript; charset=utf-8" },
  "/assets/brick-breaker.js": { path: "brick-breaker.js", type: "text/javascript; charset=utf-8" },
  "/assets/solar-volley.js": { path: "solar-volley.js", type: "text/javascript; charset=utf-8" },
  "/assets/volley-physics.js": { path: "volley-physics.js", type: "text/javascript; charset=utf-8" },
  "/assets/targeting.js": { path: "targeting.js", type: "text/javascript; charset=utf-8" },
  "/assets/progression.js": { path: "progression.js", type: "text/javascript; charset=utf-8" },
};

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
