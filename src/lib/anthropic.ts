import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AIConfigError();
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Thrown whenever an AI feature is invoked without an ANTHROPIC_API_KEY set.
// Routes catch this and return a clear, actionable error to the frontend
// instead of a stack trace.
export class AIConfigError extends Error {
  constructor() {
    super(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file to enable AI features (see .env.example)."
    );
    this.name = "AIConfigError";
  }
}

export const CLAUDE_MODEL = "claude-sonnet-5";

// Extracts the first top-level JSON object/array from a Claude text response,
// tolerating stray prose or markdown code fences around it.
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error("No JSON found in AI response");
  const trimmed = candidate.slice(start);
  return JSON.parse(trimmed) as T;
}
