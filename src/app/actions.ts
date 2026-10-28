"use server";

import { DatabaseSync } from "node:sqlite";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ticketStatuses } from "@/lib/ticket-status";
import { embed, MODEL } from "@/lib/embeddings";
import { createHash } from "node:crypto";
import type { Match, SubmissionResult } from "@/lib/submission-result";

export async function submitRequest(formData: FormData): Promise<SubmissionResult> {
  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  if (typeof rawTitle !== "string" || typeof rawDescription !== "string" || !rawTitle.trim() || !rawDescription.trim()) {
    return { kind: "error", message: "Enter a title and description." };
  }

  const actor = (await cookies()).get("user")?.value;
  if (!actor) return { kind: "error", message: "To submit a request, visit /login?user=your_name." };
  const title = rawTitle.trim();
  const description = rawDescription.trim();
  const confirmation = formData.get("confirmation");
  let vector: number[] | null = null;
  try {
    vector = await embed(`${title}\n\n${description}`);
  } catch {
    if (process.env.DEDUP_ALLOW_OLLAMA_UNAVAILABLE !== "true") {
      return { kind: "error", message: "Duplicate checking is unavailable. Try again when Ollama is available." };
    }
  }

  try {
    const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
    try {
      db.exec("BEGIN IMMEDIATE");
      try {
        const matches: (Match & { id: number; contentHash: string })[] = [];
        if (vector) {
          const rows = db.prepare(`SELECT t.id, t.uuid, t.title, t.description, e.embedding, q.ticket_id AS pending
            FROM tickets t LEFT JOIN ticket_embeddings e ON e.ticket_id = t.id AND e.model = ?
            LEFT JOIN ticket_index_queue q ON q.ticket_id = t.id`).all(MODEL);
          for (const row of rows) {
            if (row.pending !== null || row.embedding === null) {
              db.exec("ROLLBACK");
              return { kind: "error", message: "Duplicate checking is unavailable while requests are being indexed. Try again shortly." };
            }
            const existing: unknown = JSON.parse(String(row.embedding));
            if (!Array.isArray(existing) || existing.length !== vector.length || !existing.every((value) => typeof value === "number" && Number.isFinite(value))) {
              throw new Error("Invalid ticket embedding");
            }
            const score = vector.reduce((sum, value, index) => sum + value * existing[index], 0);
            if (score >= 0.35) matches.push({ id: Number(row.id), uuid: String(row.uuid), title: String(row.title), score, contentHash: createHash("sha256").update(JSON.stringify([row.title, row.description])).digest("hex") });
          }
          matches.sort((a, b) => b.score - a.score || a.id - b.id);
          const duplicates = matches.filter((match) => match.score >= 0.8);
          if (duplicates.length) {
            db.exec("ROLLBACK");
            return { kind: "duplicate", matches: duplicates };
          }
        }

        const token = createHash("sha256").update(JSON.stringify([title, description, actor, vector ? matches.map(({ id, contentHash }) => [id, contentHash]).sort((a, b) => Number(a[0]) - Number(b[0])) : "unavailable"])).digest("hex");
        if (confirmation !== token && (!vector || matches.length)) {
          db.exec("ROLLBACK");
          if (!vector) return { kind: "unavailable", message: "Deduplication is disabled because Ollama is unavailable. Check for existing requests before creating this one.", confirmation: token };
          return { kind: "related", matches, confirmation: token };
        }

        const lastUpdateId = db.prepare("SELECT COALESCE(MAX(id), 0) AS id FROM ticket_updates").get()?.id ?? 0;
        const result = db.prepare("INSERT INTO tickets (title, description) VALUES (?, ?)").run(title, description);
        const id = Number(result.lastInsertRowid);
        if (vector) {
          db.prepare("INSERT INTO ticket_embeddings (ticket_id, model, embedding) VALUES (?, ?, ?)").run(id, MODEL, JSON.stringify(vector));
          db.prepare("DELETE FROM ticket_index_queue WHERE ticket_id = ?").run(id);
          const link = db.prepare("INSERT OR IGNORE INTO ticket_relationships (ticket_id, related_ticket_id) VALUES (?, ?)");
          for (const match of matches) link.run(Math.min(id, match.id), Math.max(id, match.id));
        }
        db.prepare("UPDATE ticket_updates SET actor = ? WHERE id > ?").run(actor, lastUpdateId);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    } finally {
      db.close();
    }
  } catch (error) {
    console.error("Request submission failed", error);
    return { kind: "error", message: "Could not submit the request. Please try again." };
  }

  revalidatePath("/", "layout");
  return vector ? { kind: "created" } : { kind: "created", warning: "Deduplication was unavailable. Check for similar requests." };
}

export async function setVote(uuid: string, operation: "add" | "remove") {
  const username = (await cookies()).get("user")?.value;
  if (!username || typeof uuid !== "string" || (operation !== "add" && operation !== "remove")) return;

  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  try {
    if (operation === "add") {
      db.prepare("INSERT OR IGNORE INTO ticket_votes (ticket_id, username) SELECT id, ? FROM tickets WHERE uuid = ?").run(username, uuid);
    } else {
      db.prepare("DELETE FROM ticket_votes WHERE username = ? AND ticket_id = (SELECT id FROM tickets WHERE uuid = ?)").run(username, uuid);
    }
  } finally {
    db.close();
  }
  revalidatePath("/");
}

export async function updateStatus(uuid: string, formData: FormData) {
  const status = formData.get("status");
  if (typeof uuid !== "string" || typeof status !== "string" || status !== "unarchive" && !ticketStatuses.some((value) => value === status)) {
    throw new Error("Invalid status.");
  }

  const actor = (await cookies()).get("user")?.value;
  if (!actor) return "To change status, visit /login?user=your_name.";
  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  try {
    db.exec("BEGIN IMMEDIATE");
    try {
      const previousId = Number(db.prepare("SELECT COALESCE(MAX(id), 0) AS id FROM ticket_updates").get()?.id);
      const result = status === "unarchive"
        ? db.prepare("UPDATE tickets SET status = COALESCE(previous_status, 'open') WHERE uuid = ? AND status = 'archived'").run(uuid)
        : db.prepare("UPDATE tickets SET status = ? WHERE uuid = ?").run(status, uuid);
      if (!result.changes) throw new Error("Request not found.");
      db.prepare("UPDATE ticket_updates SET actor = ? WHERE ticket_id = (SELECT id FROM tickets WHERE uuid = ?) AND id > ?").run(actor, uuid, previousId);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    db.close();
  }
  revalidatePath("/", "layout");
  return "";
}
