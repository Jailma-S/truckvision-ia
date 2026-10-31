import type { AIProvider, GenerateInput } from "./provider";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  constructor(private readonly model = process.env.AI_MODEL || "gemini-2.5-pro") {}

  async generate({ system, prompt, size = "long" }: GenerateInput) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: size === "short" ? 1024 : 8000 },
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return { text: text.trim(), model: this.model };
  }
}
