import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";

export interface AskAIOptions {
  systemPrompt?: string;
  temperature?: number;
  jsonMode?: boolean;
}

let geminiClient: GoogleGenerativeAI | undefined;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    if (!env.GEMINI_API_KEY) {
      throw new AppError(500, "AI_NOT_CONFIGURED", "AI is not configured");
    }
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return geminiClient;
}

async function askGemini(prompt: string, options: AskAIOptions): Promise<string> {
  const model = getGeminiClient().getGenerativeModel({
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

export async function askAI(prompt: string, options: AskAIOptions = {}): Promise<string> {
  try {
    switch (env.AI_PROVIDER) {
      case "gemini":
        return await askGemini(prompt, options);
      default:
        throw new AppError(500, "AI_NOT_CONFIGURED", "AI provider is not supported");
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error("AI request failed:", err);
    throw new AppError(502, "AI_REQUEST_FAILED", "The AI service is unavailable. Please try again.");
  }
}