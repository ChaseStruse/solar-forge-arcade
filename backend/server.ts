import { files, embed } from "./routes.js";

const port = Number(Bun.env.PORT ?? 3000);
const root = new URL("../frontend/", import.meta.url);



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
        embed(html),
        { headers: { "Content-Type": asset.type, "Cache-Control": "no-store" } },
      );
    }

    return new Response(Bun.file(new URL(asset.path, root)), {
      headers: { "Content-Type": asset.type, "Cache-Control": "no-store" },
    });
  },
});

console.log(`Solar Forge Arcade listening on http://localhost:${port}`);
