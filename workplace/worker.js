export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/^\/+/, ""); // 去除前导斜杠
    const domain = env.DOMAIN || "example.com";
    const subDomains = (env.SUBDOMAINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const expectedToken = env.BEARER_TOKEN;

    // 获取 webs 对应的 port
    const get_port = async () => {
      const { results } = await env.LUCKY
        .prepare("SELECT port FROM stun WHERE name = ?")
        .bind("webs")
        .all();
      return results?.[0]?.port ?? null;
    };

    // 更新 webs 对应的 port
    const update_port = async (newPort) => {
      await env.LUCKY
        .prepare("UPDATE stun SET port = ? WHERE name = ?")
        .bind(newPort, "webs")
        .run();
    };

    // GET /
    if (url.pathname === "/") {
      const port = await get_port();
      return Response.json({ port });
    }else

    // POST /api/update_webs_port
    if (url.pathname === "/api/update_webs_port" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "");
      if (token !== expectedToken) {
        return new Response("Unauthorized", { status: 401 });
      }

      try {
        const body = await request.json();
        const newPort = body.port;
        if (!newPort || isNaN(Number(newPort))) {
          return new Response("Invalid port", { status: 400 });
        }

        await update_port(Number(newPort));
        return Response.json({ message: "Port updated", port: Number(newPort) });
      } catch (err) {
        return new Response("Invalid request body", { status: 400 });
      }
    }else

    // 路径在 subDomains 中 → 重定向
    if (subDomains.includes(pathname)) {
      const port = await get_port();
      if (!port) return new Response("Port not found", { status: 500 });

      const redirectUrl = `https://${pathname}.${domain}:${port}`;
      return Response.redirect(redirectUrl, 302);
    }

    return new Response("Not Found", { status: 404 });
  },
};
