export interface AskAIOptions {
  systemPrompt?: string;
  temperature?: number;
  jsonMode?: boolean;
}

export interface AIProvider {
  ask(prompt: string, options?: AskAIOptions): Promise<string>;
}