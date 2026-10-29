import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { exampleSQL } from "../scripts/example-data.mjs";
test("learning data is complete and can be added twice without changing real records", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      await readFile(new URL("../server/schema.sql", import.meta.url), "utf8"),
    );
    await db.query(
      "INSERT INTO abk_users(id,email,name,role) VALUES('11111111-1111-4111-8111-111111111111','admin@abk.example','Real admin','admin')",
    );
    await db.query(
      "INSERT INTO abk_clients(id,name,email) VALUES('22222222-2222-4222-8222-222222222222','Existing client','existing@client.example')",
    );
    const sql = await exampleSQL();
    await db.exec(sql);
    await db.exec(sql);
    for (const [table, total] of [
      ["abk_projects", 3],
      ["abk_tasks", 7],
      ["abk_messages", 4],
      ["abk_documents", 2],
      ["abk_requests", 2],
      ["abk_ledger", 4],
      ["abk_events", 2],
      ["abk_clients", 4],
    ])
      assert.equal(
        Number(
          (await db.query(`SELECT count(*) AS n FROM ${table}`)).rows[0].n,
        ),
        total,
      );
    assert.equal(
      (await db.query("SELECT name FROM abk_users WHERE role='admin'")).rows[0]
        .name,
      "Real admin",
    );
    assert.equal(
      Buffer.from(
        (await db.query("SELECT bytes FROM abk_documents LIMIT 1")).rows[0]
          .bytes,
      )
        .subarray(0, 5)
        .toString(),
      "%PDF-",
    );
    assert.equal(
      Number(
        (await db.query("SELECT count(*) n FROM abk_message_documents")).rows[0]
          .n,
      ),
      1,
    );
  } finally {
    await db.close();
  }
});
