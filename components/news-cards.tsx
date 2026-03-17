"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { 
  Bookmark,
  ExternalLink,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewsArticle {
  id: string;
  company: string;
  companyInitial: string;
  category: string;
  headline: string;
  summary: string[];
  sentiment: "bullish" | "bearish";
  timestamp: string;
  url: string;
}

const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: "1",
    company: "NVIDIA",
    companyInitial: "N",
    category: "AI Chips",
    headline: "NVIDIA Announces Next-Gen Blackwell Ultra GPU with 2x Performance Gains",
    summary: [
      "New architecture delivers 2x improvement in AI training workloads",
      "Partnership with major cloud providers for immediate deployment",
      "Expected to drive $15B in additional datacenter revenue"
    ],
    sentiment: "bullish",
    timestamp: "2h ago",
    url: "#"
  },
  {
    id: "2",
    company: "TSMC",
    companyInitial: "T",
    category: "Foundry",
    headline: "TSMC Reports 2nm Chip Production Ahead of Schedule for Apple",
    summary: [
      "Mass production to begin Q3 2026, three months early",
      "30% power efficiency improvement over 3nm process",
      "Apple secures majority of initial production capacity"
    ],
    sentiment: "bullish",
    timestamp: "4h ago",
    url: "#"
  },
  {
    id: "3",
    company: "Intel",
    companyInitial: "I",
    category: "Foundry",
    headline: "Intel Foundry Services Loses Major Customer to Samsung",
    summary: [
      "Qualcomm shifts 50% of orders to Samsung for 3nm chips",
      "Questions raised about Intel 18A process readiness",
      "Stock down 8% in pre-market trading"
    ],
    sentiment: "bearish",
    timestamp: "5h ago",
    url: "#"
  },
  {
    id: "4",
    company: "Synopsys",
    companyInitial: "S",
    category: "EDA Tools",
    headline: "Synopsys AI-Powered Design Tools Cut Chip Development Time by 40%",
    summary: [
      "DSO.ai achieves breakthrough in automated place-and-route",
      "Early adopters report significant time-to-market improvements",
      "New licensing model expected to boost recurring revenue"
    ],
    sentiment: "bullish",
    timestamp: "6h ago",
    url: "#"
  },
  {
    id: "5",
    company: "Micron",
    companyInitial: "M",
    category: "Memory",
    headline: "Micron Warns of HBM Supply Shortage Amid AI Demand Surge",
    summary: [
      "HBM3E demand outpacing production capacity by 3:1",
      "Expanding Idaho fab with $15B investment",
      "Premium pricing expected to boost margins significantly"
    ],
    sentiment: "bullish",
    timestamp: "8h ago",
    url: "#"
  },
  {
    id: "6",
    company: "NXP",
    companyInitial: "N",
    category: "Automotive",
    headline: "NXP Secures $2B Contract for EV Battery Management Systems",
    summary: [
      "Multi-year agreement with top 3 global EV manufacturers",
      "New chips enable 20% faster charging capabilities",
      "Automotive segment revenue guidance raised for FY26"
    ],
    sentiment: "bullish",
    timestamp: "10h ago",
    url: "#"
  },
];

type NewsApiArticle = {
  source?: { id?: string | null; name?: string | null } | null;
  author?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
  content?: string | null;
};

type NewsApiResponse = {
  status: "ok" | "error";
  totalResults?: number;
  articles?: NewsApiArticle[];
  code?: string;
  message?: string;
};

function companyInitialFromName(name: string) {
  const letter = name.trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(letter) ? letter : "N";
}

function detectCategory(title: string): NewsArticle["category"] {
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

function detectSentiment(title: string): NewsArticle["sentiment"] {
  const t = title.toLowerCase();
  const pos = POSITIVE_WORDS.some((w) => t.includes(w));
  const neg = NEGATIVE_WORDS.some((w) => t.includes(w));
  if (pos && !neg) return "bullish";
  if (neg && !pos) return "bearish";
  // Tie-breaker: default bullish to keep UI lively
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
  if (sentences.length === 1) {
    const parts = sentences[0].split(/;|—|-|\|/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) return parts.slice(0, 3);
    if (parts.length === 2) return [parts[0], parts[1], "Read the full article for more context"];
    return [sentences[0], "Read the full article for more context", "More details may be available at the source"];
  }
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

function mapNewsApiArticle(a: NewsApiArticle): NewsArticle | null {
  const headline = (a.title ?? "").trim();
  const url = (a.url ?? "").trim();
  if (!headline || !url) return null;

  const company = (a.source?.name ?? "News").trim() || "News";
  return {
    id: url, // stable id for bookmarking/localStorage
    company,
    companyInitial: companyInitialFromName(company),
    category: detectCategory(headline),
    headline,
    summary: splitDescriptionToBullets(a.description),
    sentiment: detectSentiment(headline),
    timestamp: formatRelativeTimestamp(a.publishedAt),
    url,
  };
}

function NewsCard({
  article,
  index,
  bookmarked,
  onToggleBookmark,
}: {
  article: NewsArticle;
  index: number;
  bookmarked: boolean;
  onToggleBookmark: (articleId: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const isBullish = article.sentiment === "bullish";

  return (
    <article 
      ref={cardRef}
      className={`bg-[#141414] rounded-lg border border-[#222222] p-5 card-hover opacity-0 ${
        isVisible ? 'animate-fade-up' : ''
      }`}
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222222] text-[#666666] font-medium text-sm">
            {article.companyInitial}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{article.company}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1e1e1e] text-[#555555]">
              {article.category}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleBookmark(article.id)}
          className={`transition-all duration-300 ${
            bookmarked ? "text-foreground" : "text-[#444444] hover:text-foreground"
          }`}
        >
          <Bookmark
            className={`h-5 w-5 transition-all duration-200 ${
              bookmarked ? "scale-110" : "scale-100"
            }`}
            fill={bookmarked ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Headline */}
      <h3 className="text-[15px] font-bold text-foreground mb-3 leading-snug">
        {article.headline}
      </h3>

      {/* AI Summary */}
      <ul className="space-y-2 mb-4">
        {article.summary.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#666666]">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-[#444444] shrink-0" />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#222222]">
        <div className="flex items-center gap-3">
          <span 
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
              isBullish 
                ? "bg-positive-bg text-positive" 
                : "bg-negative-bg text-negative"
            }`}
          >
            {isBullish ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isBullish ? "Bullish" : "Bearish"}
          </span>
          <span className="text-xs text-[#444444]">
            {article.timestamp}
          </span>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-foreground hover:text-foreground hover:bg-[#1e1e1e] gap-1 h-8 px-3"
        >
          <a
            href={article.url && article.url !== "#" ? article.url : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={!article.url || article.url === "#" ? "pointer-events-none opacity-60" : undefined}
          >
            Read Full Article
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>
    </article>
  );
}

function resolveCategoryFilter(activeCategoryId: string): string | null {
  if (activeCategoryId === "all") return null;
  if (activeCategoryId === "foundry") return "Foundry";
  if (activeCategoryId === "eda") return "EDA Tools";
  if (activeCategoryId === "memory") return "Memory";
  if (activeCategoryId === "automotive") return "Automotive";
  if (activeCategoryId === "ai") return "AI Chips";
  return null;
}

export function NewsCards({
  activeCategory,
  bookmarkedIds,
  savedOnly,
  onToggleBookmark,
  onHeadlinesChange,
  companyFilter,
  onCategoryCountsChange,
}: {
  activeCategory: string;
  bookmarkedIds: string[];
  savedOnly: boolean;
  onToggleBookmark: (articleId: string) => void;
  onHeadlinesChange?: (headlines: string[]) => void;
  companyFilter?: string;
  onCategoryCountsChange?: (counts: Partial<Record<string, number>>) => void;
}) {
  const bookmarkedSet = useMemo(() => new Set(bookmarkedIds), [bookmarkedIds]);

  const [articles, setArticles] = useState<NewsArticle[]>(FALLBACK_NEWS);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    onHeadlinesChange?.(articles.map((a) => a.headline).slice(0, 20));
  }, [articles, onHeadlinesChange]);

  useEffect(() => {
    const counts: Partial<Record<string, number>> = {
      all: articles.length,
      foundry: 0,
      eda: 0,
      memory: 0,
      automotive: 0,
      ai: 0,
    };

    for (const a of articles) {
      if (a.category === "Foundry") counts.foundry = (counts.foundry ?? 0) + 1;
      else if (a.category === "EDA Tools") counts.eda = (counts.eda ?? 0) + 1;
      else if (a.category === "Memory") counts.memory = (counts.memory ?? 0) + 1;
      else if (a.category === "Automotive") counts.automotive = (counts.automotive ?? 0) + 1;
      else if (a.category === "AI Chips") counts.ai = (counts.ai ?? 0) + 1;
    }

    onCategoryCountsChange?.(counts);
  }, [articles, onCategoryCountsChange]);

  useEffect(() => {
    let mounted = true;

    const fetchOnce = async () => {
      try {
        const res = await fetch(`/api/news?page=1&pageSize=50`, { cache: "no-store" });
        if (!res.ok) throw new Error("news fetch failed");
        const json = (await res.json()) as { articles?: NewsArticle[] };
        const mapped = Array.isArray(json.articles) ? json.articles.slice(0, 20) : [];

        if (!mounted) return;
        if (mapped.length > 0) setArticles(mapped);
      } catch {
        if (!mounted) return;
        // fallback to dummy silently
        setArticles((prev) => (prev.length ? prev : FALLBACK_NEWS));
      }
    };

    fetchOnce();
    const interval = window.setInterval(fetchOnce, 5 * 60_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, savedOnly, companyFilter, bookmarkedIds]);

  const filteredArticles = useMemo(() => {
    const filterLabel = resolveCategoryFilter(activeCategory);
    let items = articles;
    if (savedOnly) {
      items = items.filter((a) => bookmarkedSet.has(a.id));
    }
    const company = (companyFilter ?? "").trim();
    if (company) {
      const rx = new RegExp(`\\b${company.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "i");
      items = items.filter((a) => rx.test(a.headline) || rx.test(a.company));
    }
    if (!filterLabel) return items;
    return items.filter((a) => a.category === filterLabel);
  }, [activeCategory, articles, bookmarkedSet, companyFilter, savedOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedArticles = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredArticles.slice(start, start + pageSize);
  }, [filteredArticles, safePage]);

  const [displayedArticles, setDisplayedArticles] = useState<NewsArticle[]>(() => pagedArticles);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    setIsFading(true);
    const t = window.setTimeout(() => {
      setDisplayedArticles(pagedArticles);
      setIsFading(false);
    }, 140);
    return () => window.clearTimeout(t);
  }, [pagedArticles]);

  return (
    <div className="p-6">
      {displayedArticles.length === 0 && !isFading ? (
        <div className="rounded-lg border border-[#222222] bg-[#141414] p-8 text-center text-sm text-[#666666] transition-opacity duration-300 opacity-100">
          {savedOnly
            ? "No saved articles"
            : (companyFilter ?? "").trim()
              ? "No articles for this company"
              : "No articles in this category"}
        </div>
      ) : (
        <>
          <div
            className={`grid grid-cols-1 xl:grid-cols-2 gap-4 transition-opacity duration-300 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            {displayedArticles.map((article, index) => (
              <NewsCard
                key={`${savedOnly ? "saved" : "all"}-${activeCategory}-${article.id}`}
                article={article}
                index={index}
                bookmarked={bookmarkedSet.has(article.id)}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>

          {/* Pagination */}
          {filteredArticles.length > pageSize && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="text-xs text-[#555555]">
                Page <span className="text-foreground">{safePage}</span> of{" "}
                <span className="text-foreground">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="rounded-md border border-[#222222] bg-[#111111] px-3 py-1.5 text-xs text-foreground disabled:opacity-40 disabled:pointer-events-none hover:bg-[#151515] transition-all duration-300"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="rounded-md border border-[#222222] bg-[#111111] px-3 py-1.5 text-xs text-foreground disabled:opacity-40 disabled:pointer-events-none hover:bg-[#151515] transition-all duration-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
