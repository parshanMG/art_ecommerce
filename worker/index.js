/* ─────────────────────────────────────────────────────────────────────
   CLOUDFLARE WORKER — the live site
   Serves the built website (dist/) and the portfolio-mode API from one
   place, on one domain:

     GET  /api/products   the catalog (server/data/products.json)
     POST /api/contact    the contact form (server/contactForm.js)
     GET  /api/health     quick check that the API and email are set up
     /api/checkout, /api/webhooks/stripe   answer 503: the shop is off

   Everything else is a website file, or index.html for app routes like
   /about (wrangler.jsonc sets that up). The catalog, form checks and
   emails are the same code the Express server runs, so the two can't
   drift apart. Shop mode still needs the Express server and PostgreSQL.

   Settings come from the Worker's variables and secrets in Cloudflare
   (locally, .dev.vars): RESEND_API_KEY, EMAIL_FROM_ADDRESS,
   EMAIL_OWNER_ADDRESS. With nodejs_compat they appear in process.env,
   which is where services/email.js reads them.
───────────────────────────────────────────────────────────────────── */
import { listCatalogProducts } from "../server/catalog.js";
import { handleContact } from "../server/contactForm.js";

const MAX_BODY_BYTES = 100 * 1024; // the same limit as express.json()
const EMAIL_SETTINGS = ["RESEND_API_KEY", "EMAIL_FROM_ADDRESS", "EMAIL_OWNER_ADDRESS"];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function contact(request, env, deps) {
  /* At most 3 messages a minute from one address (CONTACT_LIMITER in
     wrangler.jsonc) */
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const { success } = await env.CONTACT_LIMITER.limit({ key: ip });
  if (!success) return json({ error: "Too many requests, please try again later." }, 429);

  if (Number(request.headers.get("Content-Length")) > MAX_BODY_BYTES) {
    return json({ error: "Your message is too long." }, 413);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const result = await handleContact(body, deps);
  return json(result.body, result.status);
}

/* `deps` is passed to handleContact — the tests swap in fake email senders */
export function createWorker(deps = {}) {
  return {
    async fetch(request, env) {
      const { pathname } = new URL(request.url);
      const { method } = request;

      try {
        if (pathname === "/api/products" && method === "GET") {
          return json(await listCatalogProducts());
        }
        if (pathname === "/api/contact" && method === "POST") {
          return await contact(request, env, deps);
        }
        if (pathname === "/api/health" && method === "GET") {
          return json({
            status: "ok",
            config: {
              mode: "portfolio",
              emailConfigured: EMAIL_SETTINGS.every((name) => process.env[name]?.trim()),
            },
          });
        }
        if (pathname.startsWith("/api/checkout") || pathname.startsWith("/api/webhooks/stripe")) {
          return json({ error: "Checkout is not available." }, 503);
        }
        if (pathname.startsWith("/api/")) {
          return json({ error: "Not found." }, 404);
        }
      } catch (err) {
        console.error(`[500] ${method} ${pathname}:`, err);
        return json({ error: "Internal server error" }, 500);
      }

      return env.ASSETS.fetch(request);
    },
  };
}

export default createWorker();
