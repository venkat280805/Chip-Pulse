export const runtime = "nodejs";

type NewsApiArticle = {
  source?: { name?: string | null } | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  publishedAt?: string | null;
};

type NewsApiResponse = {
  status: "ok" | "error";
  articles?: NewsApiArticle[];
  message?: string;
};

function companyInitialFromName(name: string) {
  const letter = name.trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(letter) ? letter : "N";
}

function detectCategory(title: string): string {
  const t = title.toLowerCase();
  if (/\b(tsmc|intel|samsung)\b/i.test(t)) return "Foundry";
  if (/\b(nvidia|amd|broadcom)\b/i.test(t)) return "AI Chips";
  if (/\b(micron|sk hynix)\b/i.test(t)) return "Memory";
  if (/\b(synopsys|cadence|asml)\b/i.test(t)) return "EDA Tools";
  if (/\b(nxp|qualcomm|infineon)\b/i.test(t)) return "Automotive";
  return "AI Chips";
}

const POSITIVE_WORDS = [
  "beats",
  "surge",
  "soars",
  "record",
  "growth",
  "strong",
  "rally",
  "upgrade",
  "profit",
  "wins",
  "breakthrough",
  "launch",
  "announces",
  "raises",
  "expands",
];

const NEGATIVE_WORDS = [
  "misses",
  "falls",
  "plunge",
  "weak",
  "downgrade",
  "loss",
  "warning",
  "warns",
  "shortage",
  "delay",
  "cuts",
  "slump",
  "investigation",
  "recall",
  "decline",
];

function detectSentiment(title: string): "bullish" | "bearish" {
  const t = title.toLowerCase();
  const pos = POSITIVE_WORDS.some((w) => t.includes(w));
  const neg = NEGATIVE_WORDS.some((w) => t.includes(w));
  if (pos && !neg) return "bullish";
  if (neg && !pos) return "bearish";
  return "bullish";
}

function splitDescriptionToBullets(description: string | null | undefined): string[] {
  const base = (description ?? "").replace(/\s+/g, " ").trim();
  if (!base) {
    return ["Latest semiconductor headline", "Open the full article for details", "Stay tuned for updates"];
  }
  const sentences = base
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length >= 3) return sentences.slice(0, 3);
  if (sentences.length === 2) return [sentences[0], sentences[1], "Read the full article for more context"];
  if (sentences.length === 1) return [sentences[0], "Read the full article for more context", "More details may be available at the source"];
  return ["Read the full article for details", "More context available at the source", "Stay tuned for updates"];
}

function formatRelativeTimestamp(iso: string | null | undefined) {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  const diffMs = Date.now() - t;
  const diffMin = Math.max(0, Math.floor(diffMs / 60_000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

export async function GET() {
  const key = process.env.NEWS_API_KEY ?? process.env.NEXT_PUBLIC_NEWS_API_KEY;
  if (!key) return Response.json({ articles: [] }, { headers: { "Cache-Control": "no-store" } });

  const res = await fetch(
    `https://newsapi.org/v2/everything?q=semiconductor+chips+TSMC+NVIDIA+Intel&sortBy=publishedAt&language=en&pageSize=20&apiKey=${key}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return Response.json({ articles: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const json = (await res.json()) as NewsApiResponse;
  const mapped = (json.articles ?? [])
    .map((a) => {
      const headline = (a.title ?? "").trim();
      const url = (a.url ?? "").trim();
      if (!headline || !url) return null;
      const company = (a.source?.name ?? "News").trim() || "News";
      return {
        id: url,
        company,
        companyInitial: companyInitialFromName(company),
        category: detectCategory(headline),
        headline,
        summary: splitDescriptionToBullets(a.description),
        sentiment: detectSentiment(headline),
        timestamp: formatRelativeTimestamp(a.publishedAt),
        url,
      };
    })
    .filter(Boolean)
    .slice(0, 20);

  return Response.json({ articles: mapped }, { headers: { "Cache-Control": "no-store" } });
}

