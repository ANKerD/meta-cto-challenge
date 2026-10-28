"use server";

import { DatabaseSync } from "node:sqlite";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ticketStatuses } from "@/lib/ticket-status";

export async function submitRequest(formData: FormData): Promise<string> {
  const title = formData.get("title");
  const description = formData.get("description");

  if (typeof title !== "string" || typeof description !== "string" || !title.trim() || !description.trim()) {
    return "Enter a title and description.";
  }

  try {
    const db = new DatabaseSync("data.sqlite");
    try {
      db.prepare("INSERT INTO tickets (title, description) VALUES (?, ?)").run(title.trim(), description.trim());
    } finally {
      db.close();
    }
  } catch {
    return "Could not submit the request. Please try again.";
  }

  revalidatePath("/");
  return "";
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
  if (typeof uuid !== "string" || typeof status !== "string" || !ticketStatuses.some((value) => value === status)) {
    throw new Error("Invalid status.");
  }

  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  try {
    const result = db.prepare("UPDATE tickets SET status = ? WHERE uuid = ?").run(status, uuid);
    if (!result.changes) throw new Error("Request not found.");
  } finally {
    db.close();
  }
  revalidatePath("/", "layout");
}
