export interface GenerateInput {
  system: string;
  prompt: string;
  /** Resposta curta (classificação) vs. texto longo (briefing). */
  size?: "short" | "long";
}

export interface GenerateOutput {
  text: string;
  model: string;
}

export interface AIProvider {
  readonly name: string;
  generate(input: GenerateInput): Promise<GenerateOutput>;
}

export class AIUnavailableError extends Error {}
