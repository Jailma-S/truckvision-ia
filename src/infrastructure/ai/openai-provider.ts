import OpenAI, { AzureOpenAI } from "openai";
import type { AIProvider, GenerateInput } from "./provider";

/** OpenAI e Azure OpenAI compartilham a mesma API de chat completions. */
export class OpenAIProvider implements AIProvider {
  readonly name: string;
  private client: OpenAI;
  private model: string;

  constructor(kind: "openai" | "azure") {
    this.name = kind;
    if (kind === "azure") {
      this.model = process.env.AZURE_OPENAI_DEPLOYMENT!;
      this.client = new AzureOpenAI({
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-10-21",
        deployment: this.model,
      });
    } else {
      this.model = process.env.AI_MODEL || "gpt-4o";
      this.client = new OpenAI();
    }
  }

  async generate({ system, prompt, size = "long" }: GenerateInput) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_completion_tokens: size === "short" ? 1024 : 8000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    });
    return { text: response.choices[0]?.message?.content?.trim() ?? "", model: response.model };
  }
}
