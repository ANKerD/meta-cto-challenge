import { DatabaseSync } from "node:sqlite";
import { embed, MODEL } from "./embeddings";

export async function searchTickets(query: string, archived: boolean) {
  const queryVector = await embed(query);
  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  try {
    const rows = db.prepare(`
      SELECT t.id, e.embedding
      FROM tickets t
      LEFT JOIN ticket_embeddings e ON e.ticket_id = t.id AND e.model = ?
      LEFT JOIN ticket_index_queue q ON q.ticket_id = t.id
      WHERE (t.status = 'archived') = ? AND q.ticket_id IS NULL AND e.embedding IS NOT NULL
    `).all(MODEL, archived ? 1 : 0);
    const total = db.prepare("SELECT count(*) AS count FROM tickets WHERE (status = 'archived') = ?").get(archived ? 1 : 0);
    const ranked = rows.map((row) => {
      const vector: unknown = JSON.parse(String(row.embedding));
      if (!Array.isArray(vector) || vector.length !== queryVector.length || !vector.every((value) => typeof value === "number" && Number.isFinite(value))) {
        throw new Error("Invalid ticket embedding");
      }
      const score = queryVector.reduce((sum, value, index) => sum + value * vector[index], 0);
      return { id: Number(row.id), score };
    });
    ranked.sort((a, b) => b.score - a.score || b.id - a.id);
    return { ids: ranked.map((row) => row.id), pending: Number(total?.count ?? 0) - ranked.length };
  } finally {
    db.close();
  }
}
