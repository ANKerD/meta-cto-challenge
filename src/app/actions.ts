"use server";

import { DatabaseSync } from "node:sqlite";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ticketStatuses } from "@/lib/ticket-status";
import { embed, EmbeddingUnavailable, MODEL } from "@/lib/embeddings";
import { createHash } from "node:crypto";
import { DUPLICATE_REVIEW_THRESHOLD, type Match, type SubmissionResult } from "@/lib/submission-result";
import { reviewDuplicate, ReviewUnavailable, ReviewInputTooLong } from "@/lib/review-duplicate";
import { isPromptInjection } from "@/lib/injection-classifier";

class IndexUnavailable extends Error {}

type Candidate = Match & { id: number; description: string; contentHash: string };

function findMatches(db: DatabaseSync, vector: number[]): Candidate[] {
  const rows = db.prepare(`SELECT t.id, t.uuid, t.title, t.description, e.embedding, q.ticket_id AS pending
    FROM tickets t LEFT JOIN ticket_embeddings e ON e.ticket_id = t.id AND e.model = ?
    LEFT JOIN ticket_index_queue q ON q.ticket_id = t.id`).all(MODEL);
  const matches: Candidate[] = [];
  for (const row of rows) {
    if (row.pending !== null || row.embedding === null) throw new IndexUnavailable("Indexing incomplete");
    const existing: unknown = JSON.parse(String(row.embedding));
    if (!Array.isArray(existing) || existing.length !== vector.length || !existing.every((value) => typeof value === "number" && Number.isFinite(value))) throw new Error("Invalid ticket embedding");
    const score = vector.reduce((sum, value, index) => sum + value * existing[index], 0);
    if (score >= 0.35) matches.push({ id: Number(row.id), uuid: String(row.uuid), title: String(row.title), description: String(row.description), score, contentHash: createHash("sha256").update(JSON.stringify([row.title, row.description])).digest("hex") });
  }
  return matches.sort((a, b) => b.score - a.score || a.id - b.id);
}

function confirmationToken(kind: string, title: string, description: string, actor: string, matches: Candidate[], explanation = "") {
  return createHash("sha256").update(JSON.stringify([kind, title, description, actor, explanation, matches.map(({ id, contentHash }) => [id, contentHash]).sort((a, b) => Number(a[0]) - Number(b[0]))])).digest("hex");
}

export async function submitRequest(formData: FormData): Promise<SubmissionResult> {
  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  if (typeof rawTitle !== "string" || typeof rawDescription !== "string" || !rawTitle.trim() || !rawDescription.trim()) return { kind: "error", message: "Enter a title and description." };
  const actor = (await cookies()).get("user")?.value;
  if (!actor) return { kind: "error", message: "To submit a request, visit /login?user=your_name." };
  const title = rawTitle.trim(), description = rawDescription.trim();
  const rawExplanation = formData.get("explanation");
  const explanation = typeof rawExplanation === "string" ? rawExplanation.trim() : "";
  const confirmation = formData.get("confirmation");
  const allowUnavailable = process.env.DEDUP_ALLOW_OLLAMA_UNAVAILABLE === "true";
  let vector: number[] | null = null;
  try { vector = await embed(`${title}\n\n${description}`); }
  catch (error) {
    if (!(error instanceof EmbeddingUnavailable)) return { kind: "error", message: "Could not process the request for duplicate checking. Check its length and try again." };
    if (!allowUnavailable) return { kind: "error", message: "Duplicate checking is unavailable. Try again when Ollama is available." };
  }

  let snapshot: Candidate[] = [];
  if (vector) {
    const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
    try { snapshot = findMatches(db, vector); }
    catch { return { kind: "error", message: "Duplicate checking is unavailable while requests are being indexed. Try again shortly." }; }
    finally { db.close(); }
  }
  const suspected = snapshot.filter((match) => match.score >= DUPLICATE_REVIEW_THRESHOLD);
  const reviewToken = confirmationToken("review", title, description, actor, snapshot);
  let bypassReview = false;
  if (suspected.length) {
    const bypassToken = confirmationToken("unavailable-review", title, description, actor, snapshot, explanation);
    if (!explanation || (confirmation !== reviewToken && confirmation !== bypassToken)) return { kind: "duplicate_review", matches: snapshot, confirmation: reviewToken };
    if (Buffer.byteLength(explanation, "utf8") > 6000) return { kind: "error", message: "The explanation is too long. Shorten it and try again." };
    let flagged;
    try { flagged = await isPromptInjection(explanation); }
    catch { return { kind: "error", message: "The security check is unavailable. Please try again." }; }
    if (flagged) {
      try {
        const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
        try { db.prepare("INSERT INTO security_alerts (actor) VALUES (?)").run(actor); }
        finally { db.close(); }
      } catch { return { kind: "error", message: "The security check is unavailable. Please try again." }; }
      revalidatePath("/", "layout");
      return { kind: "rejected", matches: snapshot, confirmation: reviewToken, reason: "The explanation was flagged by the security check. Please revise it." };
    }
    try {
      const review = await reviewDuplicate({ title, description, explanation }, suspected.map(({ title, description }) => ({ title, description })));
      if (!review.allow) return { kind: "rejected", matches: snapshot, confirmation: reviewToken, reason: review.reason };
    } catch (error) {
      if (error instanceof ReviewInputTooLong) return { kind: "error", message: "The requests are too long to review together. Shorten your request or explanation and try again." };
      if (!(error instanceof ReviewUnavailable) || !allowUnavailable) return { kind: "error", message: "The duplicate review is unavailable. Please try again." };
      if (confirmation !== bypassToken) return { kind: "unavailable", message: "Duplicate review is disabled because Ollama is unavailable. Check existing requests carefully before creating this one.", confirmation: bypassToken };
      bypassReview = true;
    }
  }
  if (!vector) {
    const token = confirmationToken("unavailable", title, description, actor, []);
    if (confirmation !== token) return { kind: "unavailable", message: "Deduplication is disabled because Ollama is unavailable. Check for existing requests before creating this one.", confirmation: token };
  } else if (!suspected.length && snapshot.length) {
    const token = confirmationToken("related", title, description, actor, snapshot);
    if (confirmation !== token) return { kind: "related", matches: snapshot, confirmation: token };
  }

  try {
    const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
    try {
      db.exec("BEGIN IMMEDIATE");
      try {
        const current = vector ? findMatches(db, vector) : [];
        if (vector && confirmationToken("snapshot", title, description, actor, current) !== confirmationToken("snapshot", title, description, actor, snapshot)) {
          db.exec("ROLLBACK");
          const token = confirmationToken(current.some((m) => m.score >= DUPLICATE_REVIEW_THRESHOLD) ? "review" : "related", title, description, actor, current);
          if (current.some((m) => m.score >= DUPLICATE_REVIEW_THRESHOLD)) return { kind: "duplicate_review", matches: current, confirmation: token };
          if (current.length) return { kind: "related", matches: current, confirmation: token };
          return { kind: "error", message: "Existing requests changed. Please submit again." };
        }
        const lastUpdateId = db.prepare("SELECT COALESCE(MAX(id), 0) AS id FROM ticket_updates").get()?.id ?? 0;
        const result = db.prepare("INSERT INTO tickets (title, description) VALUES (?, ?)").run(title, description);
        const id = Number(result.lastInsertRowid);
        if (vector) {
          db.prepare("INSERT INTO ticket_embeddings (ticket_id, model, embedding) VALUES (?, ?, ?)").run(id, MODEL, JSON.stringify(vector));
          db.prepare("DELETE FROM ticket_index_queue WHERE ticket_id = ?").run(id);
          const link = db.prepare("INSERT OR IGNORE INTO ticket_relationships (ticket_id, related_ticket_id) VALUES (?, ?)");
          for (const match of current) link.run(Math.min(id, match.id), Math.max(id, match.id));
        }
        db.prepare("UPDATE ticket_updates SET actor = ? WHERE id > ?").run(actor, lastUpdateId);
        db.exec("COMMIT");
      } catch (error) { db.exec("ROLLBACK"); throw error; }
    } finally { db.close(); }
  } catch (error) {
    if (error instanceof IndexUnavailable) return { kind: "error", message: "Duplicate checking is unavailable while requests are being indexed. Try again shortly." };
    console.error("Request submission failed", error);
    return { kind: "error", message: "Could not submit the request. Please try again." };
  }
  revalidatePath("/", "layout");
  return vector && !bypassReview ? { kind: "created" } : { kind: "created", warning: "Deduplication was unavailable. Check for similar requests." };
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
