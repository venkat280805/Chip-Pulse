"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/header";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CompanyCount = { company: string; count: number };
type TopicCount = { topic: string; count: number };

type TrendsResponse = {
  companies: CompanyCount[];
  topics: TopicCount[];
  sentiment: {
    bullishPct: number;
    bearishPct: number;
    bullishCount: number;
    bearishCount: number;
  };
  mostActiveCategory: { category: string; count: number } | null;
};

function SectionShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#1a1a1a] bg-[#111111] p-5">
      <div className="mb-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[#444444]">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-[#666666] mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function TopicCard({ topic, count }: { topic: string; count: number }) {
  return (
    <div className="rounded-lg border border-[#222222] bg-[#141414] p-4 transition-all duration-300 hover:border-[#2a2a2a]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-foreground">{topic}</div>
        <span className="text-xs px-2 py-0.5 rounded bg-[#1a1a1a] text-[#bbbbbb]">
          {count}
        </span>
      </div>
      <div className="text-xs text-[#555555] mt-1">mentions</div>
    </div>
  );
}

function ProgressBar({
  bullishPct,
  bearishPct,
}: {
  bullishPct: number;
  bearishPct: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-[#666666] mb-2">
        <span>
          Bullish <span className="text-foreground">{bullishPct}%</span>
        </span>
        <span>
          Bearish <span className="text-foreground">{bearishPct}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden border border-[#222222]">
        <div className="h-full flex">
          <div
            className="h-full bg-positive"
            style={{ width: `${bullishPct}%` }}
          />
          <div
            className="h-full bg-negative"
            style={{ width: `${bearishPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trends", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as TrendsResponse;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const companyChartData = useMemo(() => {
    const items = data?.companies ?? [];
    return items.map((x) => ({ name: x.company, count: x.count }));
  }, [data]);

  const topics = data?.topics ?? [];
  const sentiment = data?.sentiment ?? {
    bullishPct: 0,
    bearishPct: 0,
    bullishCount: 0,
    bearishCount: 0,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="border-l-2 border-foreground pl-6 mb-6">
            <h1 className="text-2xl font-bold tracking-[-0.5px] text-foreground">
              Trends
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Insights derived from the latest semiconductor news coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {/* TOP COMPANIES */}
            <SectionShell
              title="Top Companies"
              subtitle="Mentions in headlines (latest 20 articles)"
            >
              <div className="h-[280px]">
                {loading ? (
                  <div className="h-full rounded-lg border border-[#222222] bg-[#141414] flex items-center justify-center text-sm text-[#666666]">
                    Loading chart...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={companyChartData}
                      layout="vertical"
                      margin={{ top: 8, right: 20, left: 20, bottom: 8 }}
                    >
                      <XAxis
                        type="number"
                        tick={{ fill: "#666666", fontSize: 12 }}
                        axisLine={{ stroke: "#222222" }}
                        tickLine={{ stroke: "#222222" }}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "#bbbbbb", fontSize: 12 }}
                        axisLine={{ stroke: "#222222" }}
                        tickLine={{ stroke: "#222222" }}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#111111",
                          border: "1px solid #222222",
                          borderRadius: 8,
                          color: "#ffffff",
                        }}
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#3b82f6"
                        background={{ fill: "#222222" }}
                        radius={[6, 6, 6, 6]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </SectionShell>

            {/* TRENDING TOPICS */}
            <SectionShell title="Trending Topics" subtitle="Keyword mentions across latest 20 articles">
              {loading ? (
                <div className="rounded-lg border border-[#222222] bg-[#141414] p-8 text-center text-sm text-[#666666]">
                  Loading topics...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {topics.map((t) => (
                    <TopicCard key={t.topic} topic={t.topic} count={t.count} />
                  ))}
                </div>
              )}
            </SectionShell>

            {/* SENTIMENT OVERVIEW */}
            <SectionShell title="Sentiment Overview" subtitle="Bullish vs Bearish headlines (this week)">
              {loading ? (
                <div className="rounded-lg border border-[#222222] bg-[#141414] p-8 text-center text-sm text-[#666666]">
                  Calculating sentiment...
                </div>
              ) : (
                <div className="space-y-3">
                  <ProgressBar bullishPct={sentiment.bullishPct} bearishPct={sentiment.bearishPct} />
                  <div className="text-xs text-[#555555]">
                    Based on {sentiment.bullishCount + sentiment.bearishCount} headlines from the last 7 days.
                  </div>
                </div>
              )}
            </SectionShell>

            {/* MOST ACTIVE CATEGORY */}
            <SectionShell title="Most Active Category" subtitle="Highest volume category (this week)">
              {loading ? (
                <div className="rounded-lg border border-[#222222] bg-[#141414] p-8 text-center text-sm text-[#666666]">
                  Analyzing categories...
                </div>
              ) : (
                <div className="rounded-lg border border-[#222222] bg-[#141414] p-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {data?.mostActiveCategory?.category ?? "—"}
                    </div>
                    <div className="text-xs text-[#555555] mt-1">
                      Most mentioned category across articles published this week
                    </div>
                  </div>
                  <div className="text-xs px-3 py-1 rounded bg-[#1a1a1a] text-[#bbbbbb]">
                    {data?.mostActiveCategory?.count ?? 0} articles
                  </div>
                </div>
              )}
            </SectionShell>
          </div>
        </div>
      </main>
    </div>
  );
}

