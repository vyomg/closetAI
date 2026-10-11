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

// Root-caused via live testing: a Gemini call occasionally fails with a
// genuine upstream 503 ("This model is currently experiencing high
// demand... usually temporary") — confirmed reproducible under concurrent
// load (e.g. multiple wardrobe photos uploaded at once, which the uploader
// fires in parallel). Google's own message says to retry, so callers on
// the critical "AI analysis failed, image is lost" path (clothing
// analysis, image cleanup) use this instead of calling the SDK directly —
// a short, bounded retry for exactly the error classes that are
// documented as transient, nothing else.
function isTransientGeminiError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const status = (err as { status?: number }).status;
  if (status === 503 || status === 429) return true;
  return /UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(err.message);
}

export async function withGeminiRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxRetries || !isTransientGeminiError(err)) throw err;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw lastErr;
}

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