"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";

type Sector = "Foundry" | "AI Chips" | "Memory" | "EDA";

type CompanyCardData = {
  name: string;
  symbol: string;
  sector: Sector;
  price: number | null;
  changePct: number | null;
  sentimentScore: number;
  latestHeadline: string | null;
};

type ApiResponse = { companies: CompanyCardData[] };

function sectorStyles(sector: Sector) {
  if (sector === "Foundry") return "bg-[#1a1a1a] text-[#bbbbbb]";
  if (sector === "AI Chips") return "bg-[#0b1b2f] text-[#93c5fd]";
  if (sector === "Memory") return "bg-[#1a2b1a] text-[#86efac]";
  return "bg-[#1a1a1a] text-[#bbbbbb]";
}

function initialFromName(name: string) {
  const letter = name.trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(letter) ? letter : "C";
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/companies", { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as ApiResponse;
        if (!mounted) return;
        setCompanies(Array.isArray(json.companies) ? json.companies : []);
      } catch {
        if (!mounted) return;
        setCompanies([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const grid = useMemo(() => companies, [companies]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="border-l-2 border-foreground pl-6 mb-6">
            <h1 className="text-2xl font-bold tracking-[-0.5px] text-foreground">
              Companies
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Stock moves and news sentiment across key semiconductor names.
            </p>
          </div>

          {loading ? (
            <div className="rounded-lg border border-[#222222] bg-[#141414] p-10 text-center text-sm text-[#666666]">
              Loading companies...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {grid.map((c) => {
                const positive = (c.changePct ?? 0) >= 0;
                const changeText =
                  c.changePct == null ? "—" : `${positive ? "+" : ""}${c.changePct.toFixed(2)}%`;
                const priceText = c.price == null ? "—" : `$${c.price.toFixed(2)}`;

                return (
                  <div
                    key={c.name}
                    className="bg-[#141414] rounded-lg border border-[#222222] p-5 transition-all duration-300 hover:border-[#333333]"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222222] text-[#666666] font-medium text-sm">
                          {initialFromName(c.name)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{c.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${sectorStyles(c.sector)}`}>
                              {c.sector}
                            </span>
                          </div>
                          <div className="text-xs text-[#555555] mt-0.5">
                            {c.symbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">{priceText}</div>
                        <div className={`text-xs font-medium ${positive ? "text-positive" : "text-negative"}`}>
                          {changeText}
                        </div>
                      </div>
                    </div>

                    {/* Sentiment */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-[#666666] mb-2">
                        <span>Sentiment score</span>
                        <span className="text-foreground">{c.sentimentScore}% bullish</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden border border-[#222222]">
                        <div className="h-full bg-positive" style={{ width: `${c.sentimentScore}%` }} />
                      </div>
                    </div>

                    {/* Latest headline */}
                    <div className="mb-5">
                      <div className="text-xs font-medium uppercase tracking-wider text-[#444444] mb-2">
                        Latest headline
                      </div>
                      <div className="text-sm text-[#bbbbbb] leading-snug">
                        {c.latestHeadline ?? "No recent headline found."}
                      </div>
                    </div>

                    <Link
                      href={`/?company=${encodeURIComponent(c.name)}`}
                      className="inline-flex items-center justify-center w-full rounded-lg bg-[#111111] border border-[#222222] text-foreground text-sm px-4 py-2 hover:bg-[#151515] transition-all duration-300"
                    >
                      View News
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

