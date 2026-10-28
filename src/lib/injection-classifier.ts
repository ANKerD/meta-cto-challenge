import { pipeline } from "@huggingface/transformers";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";

let classifier: ReturnType<typeof pipeline<"text-classification">> | undefined;

export async function isPromptInjection(text: string) {
  if (Buffer.byteLength(text, "utf8") > 6000) throw new Error("Text is too long");
  classifier ??= pipeline("text-classification", "Horizon-Labs/prompt-injection-guard-small", { dtype: "q8", revision: "0e3774536debbcd71dbb8534ef71451b583853b8" });
  try {
    const result = await (await classifier)(text);
    if (result[0]?.label !== "SAFE" && result[0]?.label !== "INJECTION") throw new Error("Invalid classifier response");
    return result[0].label === "INJECTION";
  } catch (error) {
    classifier = undefined;
    throw error;
  }
}

export async function checkRequestText(text: string, actor: string) {
  if (!await isPromptInjection(text)) return false;
  const db = new DatabaseSync("data.sqlite", { timeout: 5000 });
  const fingerprint = createHash("sha256").update(JSON.stringify([actor, text])).digest("hex");
  try { db.prepare("INSERT OR IGNORE INTO security_alerts (actor, fingerprint) VALUES (?, ?)").run(actor, fingerprint); }
  finally { db.close(); }
  return true;
}
