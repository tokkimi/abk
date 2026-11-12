import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../api/gestion.mjs";
test("Vercel relay keeps only ABK cookies, enforces origin and forwards CSRF", async () => {
  const original = globalThis.fetch;
  process.env.ABK_BACKEND_URL = "https://backend.example/management";
  process.env.ABK_BACKEND_TOKEN = "test-only";
  process.env.APP_ORIGIN = "https://portal.example";
  const response = () => ({
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(n) {
      this.code = n;
      return this;
    },
    json(d) {
      this.data = d;
    },
    send(d) {
      this.data = d;
    },
  });
  try {
    let calls = 0;
    globalThis.fetch = async (url, options) => {
      calls++;
      assert.equal(new URL(url).search, "?action=bootstrap");
      assert.equal(options.headers.cookie, "abk_session=opaque");
      assert.equal(options.headers["x-csrf-token"], "csrf");
      assert.equal(options.headers["x-abk-backend-token"], "test-only");
      const headers = new Headers({ "content-type": "application/json" });
      headers.append(
        "set-cookie",
        "abk_session=new-opaque; Path=/; Secure; HttpOnly",
      );
      headers.append("set-cookie", "__cf_bm=third-party; Domain=supabase.co");
      return new Response('{"ok":true}', { status: 200, headers });
    };
    const res = response();
    await handler(
      {
        url: "/api/gestion?action=bootstrap",
        method: "GET",
        headers: {
          cookie: "unrelated=private; abk_session=opaque; another=value",
          "x-csrf-token": "csrf",
        },
      },
      res,
    );
    assert.equal(res.code, 200);
    assert.deepEqual(res.headers["Set-Cookie"], [
      "abk_session=new-opaque; Path=/; Secure; HttpOnly",
    ]);
    const bad = response();
    await handler(
      {
        url: "/api/gestion?action=logout",
        method: "POST",
        headers: { origin: "https://hostile.example" },
        body: {},
      },
      bad,
    );
    assert.equal(bad.code, 403);
    assert.equal(calls, 1);
    process.env.ABK_BACKEND_ORIGIN = 'https://old-backend-origin.example';
    globalThis.fetch = async (url, options) => {
      assert.equal(options.headers.origin, process.env.ABK_BACKEND_ORIGIN);
      assert.equal(options.headers['x-csrf-token'], 'csrf');
      return Response.json({link:'https://old-backend-origin.example/gestion/#invitation=example'});
    };
    const migrated = response();
    await handler({url:'/api/gestion?action=invite',method:'POST',headers:{origin:'https://portal.example','x-csrf-token':'csrf'},body:{}},migrated);
    assert.equal(migrated.data.link, 'https://portal.example/gestion/#invitation=example');
  } finally {
    globalThis.fetch = original;
    delete process.env.ABK_BACKEND_URL;
    delete process.env.ABK_BACKEND_TOKEN;
    delete process.env.APP_ORIGIN;
    delete process.env.ABK_BACKEND_ORIGIN;
  }
});
