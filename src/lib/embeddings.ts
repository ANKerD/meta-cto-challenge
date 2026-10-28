export const MODEL = "qwen3-embedding:0.6b";
export class EmbeddingUnavailable extends Error {}

export async function embed(text: string): Promise<number[]> {
  let response: Response;
  try { response = await fetch("http://127.0.0.1:11434/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input: text, truncate: false }),
    signal: AbortSignal.timeout(60_000),
  }); } catch { throw new EmbeddingUnavailable("Ollama is unavailable"); }
  if ([404, 502, 503, 504].includes(response.status)) throw new EmbeddingUnavailable(`Ollama embedding unavailable (${response.status})`);
  if (!response.ok) throw new Error(`Ollama embedding failed (${response.status})`);
  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null || !("embeddings" in data) || !Array.isArray(data.embeddings)) {
    throw new Error("Ollama returned invalid embeddings");
  }
  const vector: unknown = data.embeddings[0];
  if (!Array.isArray(vector) || vector.length === 0 || !vector.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("Ollama returned an invalid vector");
  }
  return vector;
}
