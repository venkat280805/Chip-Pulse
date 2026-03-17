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

type CompanyCount = { company: string; count: number };
type TopicCount = { topic: string; count: number };

type TrendsResponse = {
  companies: CompanyCount[];
  topics: TopicCount[];
  sentiment: { bullishPct: number; bearishPct: number; bullishCount: number; bearishCount: number };
  mostActiveCategory: { category: string; count: number } | null;
};

const COMPANY_KEYWORDS: Array<{ label: string; rx: RegExp }> = [
  { label: "TSMC", rx: /\btsmc\b/i },
  { label: "NVIDIA", rx: /\bnvidia\b/i },
  { label: "Intel", rx: /\bintel\b/i },
  { label: "AMD", rx: /\bamd\b/i },
  { label: "Qualcomm", rx: /\bqualcomm\b/i },
  { label: "Micron", rx: /\bmicron\b/i },
  { label: "ASML", rx: /\basml\b/i },
];

const TOPIC_KEYWORDS: Array<{ label: string; rx: RegExp }> = [
  { label: "AI Chips", rx: /\b(ai chips|gpu|gpus|accelerator|h100|b200|blackwell|inference|training)\b/i },
  { label: "EUV", rx: /\beuv\b/i },
  { label: "3nm", rx: /\b3\s?nm\b/i },
  { label: "Foundry", rx: /\b(foundry|fabs?|wafer|process node|2nm|n2|n3|gate-all-around|gaa)\b/i },
  { label: "Memory", rx: /\b(memory|dram|nand|hbm|hbm3|hbm3e)\b/i },
  { label: "Automotive", rx: /\b(automotive|ev|adas|vehicle|cars?)\b/i },
  { label: "VLSI", rx: /\b(vlsi|rtl|place and route|p&r|physical design|timing closure)\b/i },
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

function detectSentiment(text: string) {
  const t = text.toLowerCase();
  const pos = POSITIVE_WORDS.some((w) => t.includes(w));
  const neg = NEGATIVE_WORDS.some((w) => t.includes(w));
  if (neg && !pos) return "bearish" as const;
  return "bullish" as const;
}

function detectCategory(title: string): string {
  const t = title.toLowerCase();
  if (/\b(tsmc|intel|samsung)\b/i.test(t)) return "Foundry";
  if (/\b(nvidia|amd|broadcom)\b/i.test(t)) return "AI Chips";
  if (/\b(micron|sk hynix)\b/i.test(t)) return "Memory";
  if (/\b(synopsys|cadence|asml)\b/i.test(t)) return "EDA Tools";
  if (/\b(nxp|qualcomm|infineon)\b/i.test(t)) return "Automotive";
  return "Other";
}

function isThisWeek(publishedAt: string | null | undefined) {
  if (!publishedAt) return false;
  const t = Date.parse(publishedAt);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= 7 * 24 * 60 * 60 * 1000;
}

export async function GET() {
  const key = process.env.NEXT_PUBLIC_NEWS_API_KEY;
  if (!key) {
    return Response.json(
      {
        companies: COMPANY_KEYWORDS.map((c) => ({ company: c.label, count: 0 })),
        topics: TOPIC_KEYWORDS.map((t) => ({ topic: t.label, count: 0 })),
        sentiment: { bullishPct: 0, bearishPct: 0, bullishCount: 0, bearishCount: 0 },
        mostActiveCategory: null,
      } satisfies TrendsResponse,
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const res = await fetch(
    `https://newsapi.org/v2/everything?q=semiconductor+chips+TSMC+NVIDIA+Intel&sortBy=publishedAt&language=en&pageSize=20&apiKey=${key}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return Response.json(
      {
        companies: COMPANY_KEYWORDS.map((c) => ({ company: c.label, count: 0 })),
        topics: TOPIC_KEYWORDS.map((t) => ({ topic: t.label, count: 0 })),
        sentiment: { bullishPct: 0, bearishPct: 0, bullishCount: 0, bearishCount: 0 },
        mostActiveCategory: null,
      } satisfies TrendsResponse,
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const json = (await res.json()) as NewsApiResponse;
  const articles = Array.isArray(json.articles) ? json.articles : [];

  const texts = articles.map((a) => `${a.title ?? ""} ${a.description ?? ""}`.trim());
  const headlinesThisWeek = articles
    .filter((a) => isThisWeek(a.publishedAt))
    .map((a) => (a.title ?? "").trim())
    .filter(Boolean);

  const companies: CompanyCount[] = COMPANY_KEYWORDS.map((c) => ({
    company: c.label,
    count: articles.reduce((acc, a) => acc + (c.rx.test(a.title ?? "") ? 1 : 0), 0),
  }))
    .sort((a, b) => b.count - a.count);

  const topics: TopicCount[] = TOPIC_KEYWORDS.map((t) => ({
    topic: t.label,
    count: texts.reduce((acc, txt) => acc + (t.rx.test(txt) ? 1 : 0), 0),
  }))
    .sort((a, b) => b.count - a.count);

  let bullishCount = 0;
  let bearishCount = 0;
  for (const h of headlinesThisWeek) {
    const s = detectSentiment(h);
    if (s === "bearish") bearishCount += 1;
    else bullishCount += 1;
  }
  const totalSent = bullishCount + bearishCount;
  const bullishPct = totalSent ? Math.round((bullishCount / totalSent) * 100) : 0;
  const bearishPct = totalSent ? 100 - bullishPct : 0;

  const categoryCounts = new Map<string, number>();
  for (const a of articles.filter((x) => isThisWeek(x.publishedAt))) {
    const title = (a.title ?? "").trim();
    if (!title) continue;
    const cat = detectCategory(title);
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }
  const mostActiveCategory = (() => {
    let best: { category: string; count: number } | null = null;
    for (const [category, count] of categoryCounts.entries()) {
      if (!best || count > best.count) best = { category, count };
    }
    return best;
  })();

  return Response.json(
    {
      companies,
      topics,
      sentiment: { bullishPct, bearishPct, bullishCount, bearishCount },
      mostActiveCategory,
    } satisfies TrendsResponse,
    { headers: { "Cache-Control": "no-store" } }
  );
}

