"use server";

import { DatabaseSync } from "node:sqlite";

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

  return "";
}
