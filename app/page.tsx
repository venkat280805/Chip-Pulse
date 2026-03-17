"use client";

import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { StockTicker } from "@/components/stock-ticker";
import { MetricsDashboard } from "@/components/metrics-dashboard";
import { CategorySidebar } from "@/components/category-sidebar";
import { NewsCards } from "@/components/news-cards";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [newsHeadlines, setNewsHeadlines] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Partial<Record<string, number>>>({});
  const searchParams = useSearchParams();
  const companyFilter = searchParams.get("company") ?? "";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("chippulse-bookmarks");
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const ids = parsed.filter((x): x is string => typeof x === "string");
      setBookmarkedIds(new Set(ids));
    } catch {
      // ignore malformed localStorage
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "chippulse-bookmarks",
        JSON.stringify(Array.from(bookmarkedIds))
      );
    } catch {
      // ignore quota / storage errors
    }
  }, [bookmarkedIds]);

  const savedCount = bookmarkedIds.size;

  const toggleBookmark = (articleId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) next.delete(articleId);
      else next.add(articleId);
      return next;
    });
  };

  useEffect(() => {
    if (savedOnly && savedCount === 0) setSavedOnly(false);
  }, [savedOnly, savedCount]);

  const bookmarkedIdsArray = useMemo(() => Array.from(bookmarkedIds), [bookmarkedIds]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        savedCount={savedCount}
        savedOnly={savedOnly}
        onToggleSavedOnly={() => setSavedOnly((v) => !v)}
      />
      <HeroSection />
      <StockTicker />
      <MetricsDashboard />
      <div className="flex flex-1 min-h-0">
        <CategorySidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          counts={categoryCounts}
        />
        <main className="flex-1 min-w-0 overflow-auto">
          <NewsCards
            activeCategory={activeCategory}
            bookmarkedIds={bookmarkedIdsArray}
            savedOnly={savedOnly}
            onToggleBookmark={toggleBookmark}
            onHeadlinesChange={setNewsHeadlines}
            companyFilter={companyFilter}
            onCategoryCountsChange={setCategoryCounts}
          />
        </main>
        <AiChatPanel newsContext={newsHeadlines} />
      </div>
    </div>
  );
}
