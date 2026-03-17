export const runtime = "nodejs";

type NewsApiArticle = {
  title?: string | null;
  url?: string | null;
  publishedAt?: string | null;
  source?: { name?: string | null } | null;
};

type NewsApiResponse = {
  status: "ok" | "error";
  articles?: NewsApiArticle[];
  message?: string;
};

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: { role?: string; content?: string | null };
  }>;
  error?: { message?: string };
};

type InterviewQuestion = {
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  answer: string;
};

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function extractJsonArray(text: string) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function normalizeDifficulty(s: string): InterviewQuestion["difficulty"] {
  const t = s.trim().toLowerCase();
  if (t.startsWith("e")) return "Easy";
  if (t.startsWith("h")) return "Hard";
  return "Medium";
}

function coerceQuestions(raw: unknown): InterviewQuestion[] | null {
  if (!Array.isArray(raw)) return null;
  const items: InterviewQuestion[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const q = (row as any).question;
    const a = (row as any).answer;
    const d = (row as any).difficulty;
    if (typeof q !== "string" || typeof a !== "string") continue;
    items.push({
      question: q.trim(),
      answer: a.trim(),
      difficulty: normalizeDifficulty(typeof d === "string" ? d : "Medium"),
    });
  }
  return items.length ? items.slice(0, 5) : null;
}

async function fetchHeadlines(): Promise<string[]> {
  const newsKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;
  if (!newsKey) return [];

  const res = await fetch(
    `https://newsapi.org/v2/everything?q=semiconductor+chips+TSMC+NVIDIA+Intel&sortBy=publishedAt&language=en&pageSize=5&apiKey=${newsKey}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const json = (await res.json()) as NewsApiResponse;
  if (json.status !== "ok" || !Array.isArray(json.articles)) return [];
  return json.articles
    .map((a) => (a.title ?? "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

async function generateQuestions(headlines: string[]) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  const headlinesBlock = headlines.length
    ? headlines.map((h) => `- ${h}`).join("\n")
    : "- (no headlines available)";

  const prompt =
    "Based on these semiconductor news headlines, generate 5 likely ECE/VLSI interview questions a recruiter at TSMC, Intel or NVIDIA might ask, with brief answers.";

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are ChipPulse AI, a semiconductor industry analyst. Answer questions about chip industry news concisely and professionally.",
        },
        {
          role: "system",
          content:
            "Return ONLY valid JSON: an array of 5 objects with keys: difficulty (Easy|Medium|Hard), question, answer. No markdown, no extra text.",
        },
        { role: "system", content: `Headlines:\n${headlinesBlock}` },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!groqRes.ok) return null;
  const json = (await groqRes.json()) as GroqChatCompletionResponse;
  const content = json.choices?.[0]?.message?.content ?? "";
  const trimmed = content.toString().trim();
  if (!trimmed) return null;

  const parsedDirect = safeJsonParse<unknown>(trimmed);
  const coercedDirect = coerceQuestions(parsedDirect);
  if (coercedDirect) return coercedDirect;

  const extracted = extractJsonArray(trimmed);
  if (!extracted) return null;
  const parsedExtracted = safeJsonParse<unknown>(extracted);
  return coerceQuestions(parsedExtracted);
}

export async function POST() {
  const headlines = await fetchHeadlines();
  const questions = await generateQuestions(headlines);

  return Response.json(
    {
      headlines,
      questions: questions ?? [],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

