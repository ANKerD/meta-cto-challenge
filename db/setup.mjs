import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

const db = new DatabaseSync("data.sqlite");
const schema = readFileSync(new URL("schema.sql", import.meta.url), "utf8");

try {
  const hasTables = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' LIMIT 1").get();
  if (!hasTables) {
    db.exec(readFileSync(new URL("seed.sql", import.meta.url), "utf8"));
    db.exec("PRAGMA foreign_keys = ON");
  }
  db.exec(schema);
  const columns = db.prepare("PRAGMA table_info(tickets)").all();
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'tickets'").get();
  const hasUuid = columns.some((column) => column.name === "uuid");

  if (!hasUuid || !table.sql.includes("AUTOINCREMENT")) {
    db.exec("PRAGMA foreign_keys = OFF; BEGIN IMMEDIATE");
    try {
      const createTickets = schema.match(/CREATE TABLE IF NOT EXISTS tickets \([\s\S]*?\n\);/)[0];
      db.exec(createTickets.replace("IF NOT EXISTS tickets", "tickets_new"));
      const fields = `id, ${hasUuid ? "uuid, " : ""}title, description, created_at, status`;
      db.exec(`INSERT INTO tickets_new (${fields}) SELECT ${fields} FROM tickets`);
      db.exec("DROP VIEW IF EXISTS related_tickets; DROP TABLE tickets; ALTER TABLE tickets_new RENAME TO tickets");
      db.exec(schema.replace(/^BEGIN;\s*/, "").replace(/\s*COMMIT;\s*$/, ""));
      if (db.prepare("PRAGMA foreign_key_check").get()) throw new Error("Foreign key check failed");
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    } finally {
      db.exec("PRAGMA foreign_keys = ON");
    }
  }
} finally {
  db.close();
}
