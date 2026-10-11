import { askAI } from "../../lib/ai.js";

export async function runTestPrompt(prompt: string): Promise<string> {
  return askAI(prompt);
}