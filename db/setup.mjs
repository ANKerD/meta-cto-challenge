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
  const updateColumns = db.prepare("PRAGMA table_info(ticket_updates)").all();
  if (!updateColumns.some((column) => column.name === "actor")) {
    db.exec("ALTER TABLE ticket_updates ADD COLUMN actor TEXT");
  }
  db.exec(`INSERT INTO ticket_updates (ticket_id, created_at, changes)
    SELECT t.id, t.created_at, json_object('created', json_object('new', 1))
    FROM tickets t WHERE NOT EXISTS (
      SELECT 1 FROM ticket_updates u WHERE u.ticket_id = t.id AND json_type(u.changes, '$.created') IS NOT NULL
    )`);
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
  const ticketColumns = db.prepare("PRAGMA table_info(tickets)").all();
  if (!ticketColumns.some((column) => column.name === "status_changed_at")) {
    db.exec(`ALTER TABLE tickets ADD COLUMN status_changed_at TEXT;
      UPDATE tickets SET status_changed_at = COALESCE(
        (SELECT created_at FROM ticket_updates WHERE ticket_id = tickets.id AND json_type(changes, '$.status') IS NOT NULL ORDER BY id DESC LIMIT 1),
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));`);
  }
  if (!ticketColumns.some((column) => column.name === "previous_status")) {
    db.exec("ALTER TABLE tickets ADD COLUMN previous_status TEXT");
  }
  db.exec(`CREATE TRIGGER IF NOT EXISTS ticket_status_time_insert AFTER INSERT ON tickets
    WHEN NEW.status_changed_at IS NULL BEGIN
      UPDATE tickets SET status_changed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
    END`);
  db.exec(`CREATE TRIGGER IF NOT EXISTS ticket_status_time AFTER UPDATE OF status ON tickets
    WHEN OLD.status IS NOT NEW.status BEGIN
      UPDATE tickets SET status_changed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        previous_status = CASE WHEN NEW.status = 'archived' THEN OLD.status ELSE NULL END WHERE id = NEW.id;
    END`);
} finally {
  db.close();
}
