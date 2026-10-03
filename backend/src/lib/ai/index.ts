import { env } from "../../config/env.js";
import { GeminiProvider } from "./geminiProvider.js";
import type { AIProvider, AskAIOptions } from "./types.js";

let provider: AIProvider;

function getProvider(): AIProvider {
  if (!provider) {
    switch (env.AI_PROVIDER) {
      case "gemini":
        provider = new GeminiProvider();
        break;
      default:
        throw new Error(`Unsupported AI_PROVIDER: ${env.AI_PROVIDER}`);
    }
  }
  return provider;
}

export async function askAI(prompt: string, options?: AskAIOptions): Promise<string> {
  return getProvider().ask(prompt, options);
}

export type { AskAIOptions };