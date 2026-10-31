import Anthropic from "@anthropic-ai/sdk";
import { AIUnavailableError, type AIProvider, type GenerateInput } from "./provider";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private client = new Anthropic();

  constructor(private readonly model = process.env.AI_MODEL || "claude-opus-5-5") {}

  async generate({ system, prompt, size = "long" }: GenerateInput) {
    const response = await this.client.beta.messages.create({
      model: this.model,
      max_tokens: size === "short" ? 1024 : 16000,
      system,
      messages: [{ role: "user", content: prompt }],
      output_config: { effort: size === "short" ? "low" : "medium" },
      // Se o modelo principal recusar por política, a API refaz a chamada em um modelo de fallback.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    if (response.stop_reason === "refusal") {
      throw new AIUnavailableError("O modelo recusou a solicitação.");
    }
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    return { text, model: response.model };
  }
}
