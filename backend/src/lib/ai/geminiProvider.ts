import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import type { AIProvider, AskAIOptions } from "./types.js";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required when AI_PROVIDER=gemini");
    }
    this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  async ask(prompt: string, options: AskAIOptions = {}): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: env.AI_MODEL,
      systemInstruction: options.systemPrompt,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        responseMimeType: options.jsonMode ? "application/json" : "text/plain",
      },
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}