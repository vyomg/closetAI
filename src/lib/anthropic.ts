import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new AIConfigError();
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return client;
}

export class AIConfigError extends Error {
  constructor() {
    super(
      "GEMINI_API_KEY is not set. Add it to your .env file to enable AI features."
    );
    this.name = "AIConfigError";
  }
}

export const GEMINI_MODEL = "gemini-3.1-flash-lite";

export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);

  if (start === -1) {
    throw new Error("No JSON found in AI response");
  }

  const trimmed = candidate.slice(start);
  return JSON.parse(trimmed) as T;
}