import { DatabaseSync } from "node:sqlite";
import { embed, MODEL } from "./embeddings";

let running = false;

export async function processIndexQueue() {
  if (running) return;
  running = true;
  try {
    const initial = new DatabaseSync("data.sqlite", { timeout: 5000 });
    try {
      initial.prepare(`INSERT OR IGNORE INTO ticket_index_queue (ticket_id, token)
        SELECT id, lower(hex(randomblob(16))) FROM tickets
        WHERE NOT EXISTS (SELECT 1 FROM ticket_embeddings WHERE ticket_id = tickets.id AND model = ?)`).run(MODEL);
    } finally {
      initial.close();
    }
    while (true) {
      const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
      let item;
      try {
        item = db.prepare(`SELECT q.ticket_id, q.token, t.title, t.description
          FROM ticket_index_queue q JOIN tickets t ON t.id = q.ticket_id WHERE q.retry_after <= unixepoch() ORDER BY q.ticket_id LIMIT 1`).get();
      } finally {
        db.close();
      }
      if (!item) return;
      let vector: number[];
      try {
        vector = await embed(`${item.title}\n\n${item.description}`);
      } catch (error) {
        const retry = new DatabaseSync("data.sqlite", { timeout: 5000 });
        try {
          retry.prepare("UPDATE ticket_index_queue SET retry_after = unixepoch() + 60 WHERE ticket_id = ? AND token = ?").run(item.ticket_id, item.token);
        } finally {
          retry.close();
        }
        console.error(`Indexing ticket ${item.ticket_id} failed; will retry`, error);
        continue;
      }
      const writer = new DatabaseSync("data.sqlite", { timeout: 5000 });
      try {
        writer.exec("BEGIN IMMEDIATE");
        try {
          const current = writer.prepare("SELECT token FROM ticket_index_queue WHERE ticket_id = ?").get(item.ticket_id);
          if (current?.token === item.token) {
            writer.prepare(`INSERT INTO ticket_embeddings (ticket_id, model, embedding) VALUES (?, ?, ?)
              ON CONFLICT(ticket_id) DO UPDATE SET model = excluded.model, embedding = excluded.embedding`)
              .run(item.ticket_id, MODEL, JSON.stringify(vector));
            writer.prepare("DELETE FROM ticket_index_queue WHERE ticket_id = ? AND token = ?").run(item.ticket_id, item.token);
          }
          writer.exec("COMMIT");
        } catch (error) {
          writer.exec("ROLLBACK");
          throw error;
        }
      } finally {
        writer.close();
      }
    }
  } finally {
    running = false;
  }
}
