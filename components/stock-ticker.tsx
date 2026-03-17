"use client";

import { useEffect, useMemo, useState } from "react";

const SYMBOLS = ["NVDA", "TSM", "INTC", "AMD", "QCOM", "MU", "ASML", "AVGO", "TXN"] as const;
type SymbolType = (typeof SYMBOLS)[number];

type TickerItem = {
  symbol: SymbolType;
  price: number;
  changePct: number;
  positive: boolean;
};

const FALLBACK: TickerItem[] = [
  { symbol: "NVDA", price: 875.32, changePct: 2.45, positive: true },
  { symbol: "TSM", price: 142.87, changePct: 1.23, positive: true },
  { symbol: "INTC", price: 43.21, changePct: -0.87, positive: false },
  { symbol: "AMD", price: 178.54, changePct: 3.12, positive: true },
  { symbol: "QCOM", price: 167.89, changePct: -0.34, positive: false },
  { symbol: "MU", price: 98.76, changePct: 1.56, positive: true },
  { symbol: "ASML", price: 987.65, changePct: 0.89, positive: true },
  { symbol: "AVGO", price: 1234.56, changePct: 1.78, positive: true },
  { symbol: "TXN", price: 172.34, changePct: -0.45, positive: false },
];

const CACHE_KEY = "chippulse-last-quotes";

type FinnhubQuote = {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
};

export function StockTicker() {
  const [quotes, setQuotes] = useState<TickerItem[]>(() => {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return FALLBACK;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return FALLBACK;

      const items: TickerItem[] = [];
      for (const row of parsed) {
        if (
          row &&
          typeof row === "object" &&
          "symbol" in row &&
          "price" in row &&
          "changePct" in row
        ) {
          const symbol = (row as any).symbol;
          const price = Number((row as any).price);
          const changePct = Number((row as any).changePct);
          if ((SYMBOLS as readonly string[]).includes(symbol) && Number.isFinite(price) && Number.isFinite(changePct)) {
            items.push({
              symbol: symbol as SymbolType,
              price,
              changePct,
              positive: changePct >= 0,
            });
          }
        }
      }
      if (items.length === SYMBOLS.length) {
        items.sort((a, b) => SYMBOLS.indexOf(a.symbol) - SYMBOLS.indexOf(b.symbol));
        return items;
      }
      return FALLBACK;
    } catch {
      return FALLBACK;
    }
  });

  useEffect(() => {
    let mounted = true;

    const fetchOnce = async () => {
      try {
        const results = await Promise.all(
          SYMBOLS.map(async (symbol) => {
            const res = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.NEXT_PUBLIC_FINNHUB_KEY}`,
              { cache: "no-store" }
            );
            if (!res.ok) throw new Error("quote fetch failed");
            const data = (await res.json()) as FinnhubQuote;
            if (!Number.isFinite(data.c) || !Number.isFinite(data.o)) throw new Error("bad quote payload");

            const changePct =
              data.o !== 0 ? ((data.c - data.o) / data.o) * 100 : 0;

            if (!Number.isFinite(changePct)) throw new Error("bad quote payload");
            return {
              symbol,
              price: data.c,
              changePct,
              positive: changePct >= 0,
            } satisfies TickerItem;
          })
        );

        if (!mounted) return;
        setQuotes(results);
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(results));
        } catch {
          // ignore storage errors
        }
      } catch {
        if (!mounted) return;
        // fallback to dummy data silently
        setQuotes((prev) => (prev?.length ? prev : FALLBACK));
      }
    };

    fetchOnce();
    const interval = window.setInterval(fetchOnce, 60_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const doubled = useMemo(() => [...quotes, ...quotes], [quotes]);

  return (
    <div className="overflow-hidden border-y border-[#1e1e1e] bg-[#111111]">
      <div className="flex items-center gap-3 px-6">
        <div className="flex items-center gap-2 py-2.5 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-positive opacity-80" />
          <span className="text-[11px] tracking-[0.12em] uppercase text-[#666666]">Live</span>
        </div>
        <div className="animate-ticker flex whitespace-nowrap py-2.5">
          {doubled.map((stock, index) => (
          <div
            key={`${stock.symbol}-${index}`}
            className="mx-6 flex items-center gap-2"
          >
            <span className="text-sm font-medium text-foreground">
              {stock.symbol}
            </span>
            <span className="text-sm text-muted-foreground">
              ${stock.price.toFixed(2)}
            </span>
            <span
              className={`text-sm font-medium ${
                stock.positive ? "text-positive" : "text-negative"
              }`}
            >
              {stock.positive ? "+" : ""}
              {stock.changePct.toFixed(2)}%
            </span>
          </div>
          ))}
        </div>
      </div>
    </div>
  );
}
