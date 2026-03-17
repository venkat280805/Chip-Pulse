export const runtime = "nodejs";

type FinnhubQuote = {
  c: number; // current
  o: number; // open
};

type NewsApiArticle = {
  title?: string | null;
  publishedAt?: string | null;
};

type NewsApiResponse = {
  status: "ok" | "error";
  articles?: NewsApiArticle[];
};

type Sector = "Foundry" | "AI Chips" | "Memory" | "EDA";

type CompanyCardData = {
  name: string;
  symbol: string;
  sector: Sector;
  price: number | null;
  changePct: number | null;
  sentimentScore: number; // 0-100 bullish share
  latestHeadline: string | null;
};

const COMPANIES: Array<{
  name: string;
  symbol: string;
  sector: Sector;
  keywords: string[];
}> = [
  { name: "TSMC", symbol: "TSM", sector: "Foundry", keywords: ["TSMC"] },
  { name: "NVIDIA", symbol: "NVDA", sector: "AI Chips", keywords: ["NVIDIA"] },
  { name: "Intel", symbol: "INTC", sector: "Foundry", keywords: ["Intel"] },
  { name: "AMD", symbol: "AMD", sector: "AI Chips", keywords: ["AMD"] },
  { name: "Qualcomm", symbol: "QCOM", sector: "AI Chips", keywords: ["Qualcomm"] },
  { name: "Micron", symbol: "MU", sector: "Memory", keywords: ["Micron"] },
  { name: "ASML", symbol: "ASML", sector: "EDA", keywords: ["ASML"] },
  { name: "Synopsys", symbol: "SNPS", sector: "EDA", keywords: ["Synopsys"] },
  { name: "Samsung", symbol: "SSNLF", sector: "Foundry", keywords: ["Samsung"] },
  { name: "Broadcom", symbol: "AVGO", sector: "AI Chips", keywords: ["Broadcom"] },
];

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

function detectSentiment(title: string) {
  const t = title.toLowerCase();
  const pos = POSITIVE_WORDS.some((w) => t.includes(w));
  const neg = NEGATIVE_WORDS.some((w) => t.includes(w));
  if (neg && !pos) return "bearish" as const;
  return "bullish" as const;
}

function buildCompanyRegex(keywords: string[]) {
  const escaped = keywords
    .map((k) => k.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"))
    .join("|");
  return new RegExp(`\\b(${escaped})\\b`, "i");
}

async function fetchNewsArticles(): Promise<NewsApiArticle[]> {
  const key = process.env.NEXT_PUBLIC_NEWS_API_KEY;
  if (!key) return [];
  const res = await fetch(
    `https://newsapi.org/v2/everything?q=semiconductor+chips+TSMC+NVIDIA+Intel&sortBy=publishedAt&language=en&pageSize=20&apiKey=${key}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const json = (await res.json()) as NewsApiResponse;
  if (json.status !== "ok" || !Array.isArray(json.articles)) return [];
  return json.articles;
}

async function fetchQuote(symbol: string) {
  const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const q = (await res.json()) as FinnhubQuote;
  if (!Number.isFinite(q.c) || !Number.isFinite(q.o)) return null;
  const changePct = q.o !== 0 ? ((q.c - q.o) / q.o) * 100 : 0;
  if (!Number.isFinite(changePct)) return null;
  return { price: q.c, changePct };
}

export async function GET() {
  const [articles, quotes] = await Promise.all([
    fetchNewsArticles(),
    Promise.all(COMPANIES.map((c) => fetchQuote(c.symbol))),
  ]);

  const data: CompanyCardData[] = COMPANIES.map((c, idx) => {
    const rx = buildCompanyRegex(c.keywords);
    const mentions = articles
      .map((a) => (a.title ?? "").trim())
      .filter((t) => t && rx.test(t));

    const bullishMentions = mentions.filter((t) => detectSentiment(t) === "bullish").length;
    const sentimentScore = mentions.length ? Math.round((bullishMentions / mentions.length) * 100) : 0;
    const latestHeadline = mentions[0] ?? null;

    const q = quotes[idx];
    return {
      name: c.name,
      symbol: c.symbol,
      sector: c.sector,
      price: q?.price ?? null,
      changePct: q?.changePct ?? null,
      sentimentScore,
      latestHeadline,
    };
  });

  return Response.json({ companies: data }, { headers: { "Cache-Control": "no-store" } });
}

