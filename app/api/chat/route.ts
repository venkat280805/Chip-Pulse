export const runtime = "nodejs";

type ChatRequestBody = {
  message?: string;
  newsContext?: string[] | string;
};

function normalizeHeadlines(newsContext: string[] | string | undefined) {
  if (typeof newsContext === "string") {
    return newsContext
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  if (Array.isArray(newsContext)) {
    return newsContext.map((x) => `${x ?? ""}`.trim()).filter(Boolean).slice(0, 20);
  }
  return [];
}

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: { role?: string; content?: string | null };
  }>;
  error?: { message?: string };
};

export async function POST(req: Request) {
  console.log(
    "[/api/chat] GROQ_API_KEY",
    process.env.GROQ_API_KEY
      ? `${process.env.GROQ_API_KEY.slice(0, 6)}… (len=${process.env.GROQ_API_KEY.length})`
      : "(missing)"
  );

  let body: ChatRequestBody | null = null;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const message = (body?.message ?? "").trim();
  if (!message) return new Response("Missing message", { status: 400 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return new Response("Missing GROQ_API_KEY", { status: 500 });

  const headlines = normalizeHeadlines(body?.newsContext);
  const headlinesBlock = headlines.length
    ? headlines.map((h) => `- ${h}`).join("\n")
    : "- (none provided)";

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are ChipPulse AI, a semiconductor industry analyst. Answer questions about chip industry news concisely and professionally.",
        },
        {
          role: "system",
          content: `Latest headlines:\n${headlinesBlock}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  if (!groqRes.ok) {
    let errText = "";
    try {
      errText = await groqRes.text();
    } catch {
      // ignore
    }
    console.error("[/api/chat] Groq error", groqRes.status, groqRes.statusText, errText.slice(0, 500));
    return new Response("Groq request failed", { status: 502 });
  }

  const json = (await groqRes.json()) as GroqChatCompletionResponse;
  const text = json.choices?.[0]?.message?.content?.toString().trim();
  if (!text) {
    return new Response(json.error?.message ?? "No response text", { status: 502 });
  }

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

