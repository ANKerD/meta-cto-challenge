import { pipeline } from "@huggingface/transformers";

let classifier: ReturnType<typeof pipeline<"text-classification">> | undefined;

export async function isPromptInjection(text: string) {
  if (Buffer.byteLength(text, "utf8") > 6000) throw new Error("Explanation is too long");
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
