import { AnthropicProvider } from "./anthropic-provider";
import { GeminiProvider } from "./gemini-provider";
import { OpenAIProvider } from "./openai-provider";
import type { AIProvider } from "./provider";

export * from "./provider";

/**
 * AI_PROVIDER = anthropic (padrão) | openai | azure | gemini.
 * Retorna null quando a chave do provedor não está configurada — os casos de uso
 * caem para textos montados por regra, sem IA generativa.
 */
export function getAIProvider(): AIProvider | null {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY ? new AnthropicProvider() : null;
    case "openai":
      return process.env.OPENAI_API_KEY ? new OpenAIProvider("openai") : null;
    case "azure":
      return process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_DEPLOYMENT
        ? new OpenAIProvider("azure")
        : null;
    case "gemini":
      return process.env.GEMINI_API_KEY ? new GeminiProvider() : null;
    default:
      throw new Error(`AI_PROVIDER desconhecido: ${provider}`);
  }
}
