/**
 * Minimal OpenAI chat client used by Convex actions (server-side only).
 * The API key is read from Convex env by the caller and passed in — it never
 * reaches the client.
 */

const MODEL = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  text: string;
}

interface ChatOptions {
  apiKey: string;
  messages: ChatTurn[];
  /** Provide to force structured JSON output via json_schema. */
  json?: { name: string; schema: object };
  temperature?: number;
  maxTokens?: number;
}

export async function openaiChat(opts: ChatOptions): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 400,
    messages: opts.messages.map((m) => ({ role: m.role, content: m.text })),
  };
  if (opts.json) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: opts.json.name, strict: true, schema: opts.json.schema },
    };
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new Error("OpenAI: no content in response");
  }
  return text;
}
