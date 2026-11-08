/* The Cloudflare Worker that serves the live site (worker/index.js), run
   in Node with stand-ins for Cloudflare's website files and rate
   limiter. The form checks themselves are covered in api.test.js. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createWorker } from "../../worker/index.js";
import { loadCatalog } from "../catalog.js";

const catalog = loadCatalog();

function fakeEnv({ allow = true } = {}) {
  return {
    ASSETS: { fetch: async (request) => new Response(`asset ${new URL(request.url).pathname}`) },
    CONTACT_LIMITER: { limit: async () => ({ success: allow }) },
  };
}

function fakeSender() {
  const calls = [];
  const send = async (contact) => {
    calls.push(contact);
  };
  send.calls = calls;
  return send;
}

const VALID_MESSAGE = {
  name: "Jane O’Brien",
  email: "jane@example.com",
  subject: "Artwork Enquiry",
  message: "Is this piece still available?",
  transferConsent: true,
};

function post(path, body) {
  return new Request(`https://example.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("worker: /api/products serves the catalog", async () => {
  const res = await createWorker().fetch(new Request("https://example.com/api/products"), fakeEnv());
  assert.equal(res.status, 200);
  assert.equal((await res.json()).length, catalog.length);
});

test("worker: a valid message is emailed to the artist, then confirmed", async () => {
  const sendNotification = fakeSender();
  const sendConfirmation = fakeSender();
  const worker = createWorker({ sendNotification, sendConfirmation });

  const res = await worker.fetch(post("/api/contact", { ...VALID_MESSAGE, productId: catalog[0].id }), fakeEnv());
  assert.equal(res.status, 200);
  assert.equal(sendNotification.calls[0].product.title, catalog[0].title);
  assert.equal(sendConfirmation.calls.length, 1);
});

test("worker: over the rate limit, the message is refused and not sent", async () => {
  const sendNotification = fakeSender();
  const worker = createWorker({ sendNotification, sendConfirmation: fakeSender() });

  const res = await worker.fetch(post("/api/contact", VALID_MESSAGE), fakeEnv({ allow: false }));
  assert.equal(res.status, 429);
  assert.equal(sendNotification.calls.length, 0);
});

test("worker: a body that isn't JSON is refused", async () => {
  const res = await createWorker().fetch(post("/api/contact", "{oops"), fakeEnv());
  assert.equal(res.status, 400);
});

test("worker: checkout is off, unknown API paths are 404, pages go to the website files", async () => {
  const worker = createWorker();
  const checkout = await worker.fetch(post("/api/checkout/create-payment-intent", {}), fakeEnv());
  assert.equal(checkout.status, 503);

  const unknown = await worker.fetch(new Request("https://example.com/api/nope"), fakeEnv());
  assert.equal(unknown.status, 404);

  const page = await worker.fetch(new Request("https://example.com/about"), fakeEnv());
  assert.equal(await page.text(), "asset /about");
});
