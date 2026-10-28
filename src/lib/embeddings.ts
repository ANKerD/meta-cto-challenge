export const MODEL = "qwen3-embedding:0.6b";

export async function embed(text: string): Promise<number[]> {
  const response = await fetch("http://127.0.0.1:11434/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input: text }),
    signal: AbortSignal.timeout(60_000),
  });
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
