/* The API in portfolio mode: products from the catalog file, the contact
   form, and checkout switched off. Email sending is replaced by fakes,
   so no Resend account is needed. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { loadCatalog } from "../catalog.js";
import { serve, postJson } from "./helpers.js";

const catalog = loadCatalog();

/* Records every call; `fail` makes it throw instead */
function fakeSender({ fail = false } = {}) {
  const calls = [];
  const send = async (contact) => {
    calls.push(contact);
    if (fail) throw new Error("Email provider is down");
  };
  send.calls = calls;
  return send;
}

async function withApp(options, fn) {
  const server = await serve(createApp(options));
  try {
    await fn(server.url);
  } finally {
    await server.close();
  }
}

const VALID_MESSAGE = {
  name: "Jane O’Brien",
  email: "Jane.Doe+art@Gmail.com",
  subject: "Artwork Enquiry",
  message: "Is this piece still available?",
  lang: "en",
  transferConsent: true,
};

/* ── Products ─────────────────────────────────────────────────────── */

test("GET /api/products serves the catalog, newest first", async () => {
  await withApp({}, async (url) => {
    const res = await fetch(`${url}/api/products`);
    assert.equal(res.status, 200);
    const products = await res.json();

    assert.equal(products.length, catalog.length);
    for (let i = 1; i < products.length; i++) {
      assert.ok(products[i - 1].year >= products[i].year, "products are not sorted by year");
    }
    // Same fields as the database query in shop mode, with defaults filled in
    for (const p of products) {
      assert.equal(typeof p.available, "boolean");
      assert.equal(typeof p.featured, "boolean");
      assert.ok("title_fa" in p && "description_fa" in p);
    }
  });
});

test("checkout answers 503 in portfolio mode", async () => {
  await withApp({}, async (url) => {
    const res = await postJson(`${url}/api/checkout/create-payment-intent`, {});
    assert.equal(res.status, 503);
  });
});

/* ── Contact form ─────────────────────────────────────────────────── */

test("a valid message is emailed to the artist, then confirmed to the visitor", async () => {
  const sendNotification = fakeSender();
  const sendConfirmation = fakeSender();

  await withApp({ contact: { sendNotification, sendConfirmation } }, async (url) => {
    const res = await postJson(`${url}/api/contact`, VALID_MESSAGE);
    assert.equal(res.status, 200);
  });

  assert.equal(sendNotification.calls.length, 1);
  assert.equal(sendConfirmation.calls.length, 1);
  const sent = sendNotification.calls[0];
  assert.equal(sent.email, "Jane.Doe+art@Gmail.com", "the address must reach the artist exactly as typed");
  assert.ok(sent.consentAt instanceof Date, "the email must record when consent was given");
});

test("the artwork is looked up from the catalog, not trusted from the browser", async () => {
  const sendNotification = fakeSender();
  const artwork = catalog[0];

  await withApp({ contact: { sendNotification, sendConfirmation: fakeSender() } }, async (url) => {
    await postJson(`${url}/api/contact`, { ...VALID_MESSAGE, productId: artwork.id });
    await postJson(`${url}/api/contact`, { ...VALID_MESSAGE, productId: "no-such-artwork" });
  });

  assert.equal(sendNotification.calls[0].product.title, artwork.title);
  assert.equal(sendNotification.calls[1].product, null, "an unknown id is ignored");
});

test("a message without consent to the transfer is refused and not sent", async () => {
  const sendNotification = fakeSender();

  await withApp({ contact: { sendNotification, sendConfirmation: fakeSender() } }, async (url) => {
    const res = await postJson(`${url}/api/contact`, { ...VALID_MESSAGE, transferConsent: false });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /Iran/);
  });

  assert.equal(sendNotification.calls.length, 0);
});

test("invalid fields are refused with a message for the form", async () => {
  await withApp({ contact: { sendNotification: fakeSender(), sendConfirmation: fakeSender() } }, async (url) => {
    const badEmail = await postJson(`${url}/api/contact`, { ...VALID_MESSAGE, email: "not-an-email" });
    assert.equal(badEmail.status, 400);
    assert.equal(badEmail.body.error, "Please enter a valid email address.");

    const badSubject = await postJson(`${url}/api/contact`, { ...VALID_MESSAGE, subject: "Free money" });
    assert.equal(badSubject.status, 400);
  });
});

test("if the artist's email fails, the visitor gets an error and no confirmation", async (t) => {
  t.mock.method(console, "error", () => {});
  const sendConfirmation = fakeSender();

  await withApp({ contact: { sendNotification: fakeSender({ fail: true }), sendConfirmation } }, async (url) => {
    const res = await postJson(`${url}/api/contact`, VALID_MESSAGE);
    assert.equal(res.status, 502);
  });

  assert.equal(sendConfirmation.calls.length, 0);
});

test("if only the visitor's confirmation fails, the message still counts as sent", async (t) => {
  t.mock.method(console, "error", () => {});

  await withApp({ contact: { sendNotification: fakeSender(), sendConfirmation: fakeSender({ fail: true }) } }, async (url) => {
    const res = await postJson(`${url}/api/contact`, VALID_MESSAGE);
    assert.equal(res.status, 200);
  });
});
