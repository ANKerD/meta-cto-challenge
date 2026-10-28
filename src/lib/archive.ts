import { DatabaseSync } from "node:sqlite";

export function archiveDueTickets() {
  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  try {
    db.exec("BEGIN IMMEDIATE");
    try {
      const lastId = db.prepare("SELECT COALESCE(MAX(id), 0) AS id FROM ticket_updates").get()?.id;
      db.prepare(`UPDATE tickets SET status = 'archived'
        WHERE status IN ('closed', 'done') AND julianday(status_changed_at) <= julianday('now', '-7 days')`).run();
      db.prepare("UPDATE ticket_updates SET actor = 'System' WHERE id > ?").run(lastId ?? 0);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    db.close();
  }
}
