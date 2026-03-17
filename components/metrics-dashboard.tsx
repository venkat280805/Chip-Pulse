"use client";

import { TrendingUp, TrendingDown, AlertTriangle, Activity } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function stepSigned(maxAbs: number) {
  return randBetween(-maxAbs, maxAbs);
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 32;
  const padding = 2;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="#4ade80"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * (width - padding * 2);
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            fill="#4ade80"
          />
        );
      })}
    </svg>
  );
}

function BarChart({ data }: { data: { node: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count));
  
  return (
    <div className="flex items-end gap-3 h-10">
      {data.map((item) => (
        <div key={item.node} className="flex flex-col items-center gap-1">
          <div
            className="w-6 bg-white/80 rounded-sm"
            style={{ height: `${(item.count / max) * 100}%`, minHeight: 4 }}
          />
          <span className="text-[10px] text-[#555]">{item.node}</span>
        </div>
      ))}
    </div>
  );
}

export function MetricsDashboard() {
  const [fabSuccessRate, setFabSuccessRate] = useState(94.7);
  const [fabDelta, setFabDelta] = useState(0);
  const [equipmentUtil, setEquipmentUtil] = useState(87.3);
  const [backOrders, setBackOrders] = useState(1247);

  const [euvUtil, setEuvUtil] = useState(92);
  const [cvdUtil, setCvdUtil] = useState(78);
  const [etchStatus, setEtchStatus] = useState<"MAINTENANCE" | "ACTIVE">("MAINTENANCE");
  const [etchUtil, setEtchUtil] = useState(0);

  const [yieldTrend, setYieldTrend] = useState<number[]>([92, 94, 91, 95, 93, 96, 94]);
  const [nodes, setNodes] = useState([
    { node: "3nm", count: 2600 },
    { node: "5nm", count: 5200 },
    { node: "7nm", count: 3900 },
    { node: "14nm", count: 2400 },
    { node: "28nm", count: 1800 },
  ]);

  const lastFabRateRef = useRef(fabSuccessRate);
  const lastYieldAvgRef = useRef<number | null>(null);

  useEffect(() => {
    // Fab Success Rate: ±0.3% every 30s, bounded to realistic range
    const t = window.setInterval(() => {
      setFabSuccessRate((v) => {
        const next = clamp(Number((v + stepSigned(0.3)).toFixed(1)), 93.5, 96.5);
        return next;
      });
    }, 30_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const prev = lastFabRateRef.current;
    setFabDelta(Number((fabSuccessRate - prev).toFixed(1)));
    lastFabRateRef.current = fabSuccessRate;
  }, [fabSuccessRate]);

  useEffect(() => {
    // Equipment Utilization: ±1% every 45s, bounded
    const t = window.setInterval(() => {
      setEquipmentUtil((v) => clamp(Number((v + stepSigned(1)).toFixed(1)), 82, 92));
    }, 45_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    // Back Orders: ±5 units every 60s, bounded
    const t = window.setInterval(() => {
      setBackOrders((v) => clamp(Math.round(v + stepSigned(5)), 1100, 1500));
    }, 60_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    // ASML EUV Scanner: fluctuates 88-95 every 40s
    const t = window.setInterval(() => {
      setEuvUtil(Math.round(randBetween(88, 95)));
    }, 40_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    // Applied Materials CVD: fluctuates 72-82 every 50s
    const t = window.setInterval(() => {
      setCvdUtil(Math.round(randBetween(72, 82)));
    }, 50_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    // Lam Research Etch: starts MAINTENANCE with 0%, may become ACTIVE after 2 minutes
    if (etchStatus === "ACTIVE") return;

    let intervalId: number | null = null;

    const gateId = window.setTimeout(() => {
      let attempts = 0;
      intervalId = window.setInterval(() => {
        attempts += 1;
        setEtchStatus((cur) => {
          if (cur === "ACTIVE") return cur;
          // After the 2-minute gate, we "usually" recover quickly, but we cap the max wait
          // so it doesn't look stuck for long periods during a demo.
          const shouldRecover = Math.random() < 0.35 || attempts >= 4;
          if (shouldRecover) {
            setEtchUtil(Math.round(randBetween(76, 86)));
            return "ACTIVE";
          }
          return cur;
        });
      }, 20_000);
    }, 120_000);

    return () => {
      window.clearTimeout(gateId);
      if (intervalId != null) window.clearInterval(intervalId);
    };
  }, [etchStatus]);

  useEffect(() => {
    // If ACTIVE, nudge etch util slightly every 40s, keep realistic
    if (etchStatus !== "ACTIVE") return;
    const t = window.setInterval(() => {
      setEtchUtil((v) => clamp(Math.round(v + stepSigned(2)), 74, 90));
    }, 40_000);
    return () => window.clearInterval(t);
  }, [etchStatus]);

  useEffect(() => {
    // Yield Trend: add a new point every 60s, 92-97
    const t = window.setInterval(() => {
      const next = Number(randBetween(92, 97).toFixed(1));
      setYieldTrend((prev) => [...prev.slice(-6), next]);
    }, 60_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    // Node Distribution: small wafer count deltas every 90s
    const t = window.setInterval(() => {
      setNodes((prev) => {
        const next = prev.map((row) => {
          const delta = Math.round(stepSigned(120));
          const min = row.node === "14nm" ? 1200 : 1800;
          const max = row.node === "5nm" ? 5200 : 4200;
          return { ...row, count: clamp(row.count + delta, min, max) };
        });
        return next;
      });
    }, 90_000);
    return () => window.clearInterval(t);
  }, []);

  const yieldAvg = useMemo(() => {
    const avg = yieldTrend.reduce((a, b) => a + b, 0) / Math.max(1, yieldTrend.length);
    return Number(avg.toFixed(1));
  }, [yieldTrend]);

  const [yieldDelta, setYieldDelta] = useState(0);

  useEffect(() => {
    const prev = lastYieldAvgRef.current;
    if (prev == null) {
      lastYieldAvgRef.current = yieldAvg;
      setYieldDelta(0);
      return;
    }
    setYieldDelta(Number((yieldAvg - prev).toFixed(1)));
    lastYieldAvgRef.current = yieldAvg;
  }, [yieldAvg]);

  const totalWafers = useMemo(() => nodes.reduce((acc, n) => acc + n.count, 0), [nodes]);

  return (
    <div className="px-4 sm:px-6 py-5 border-b border-border">
      {/* Section Title */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[11px] font-medium text-[#444] uppercase tracking-[0.15em]">
          Fab Intelligence
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse" />
          <span className="text-[10px] tracking-[0.12em] uppercase text-[#666666]">
            Live
          </span>
        </div>
      </div>

      {/* Row 1 - Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {/* Process Node */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <p className="text-[11px] text-[#555] mb-2">Active Nodes</p>
          <p className="text-xl font-bold text-white">3nm / 5nm / 7nm</p>
        </div>

        {/* Fab Success Rate */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <p className="text-[11px] text-[#555] mb-2">Fab Success Rate</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-white">{fabSuccessRate.toFixed(1)}%</p>
            <div className={`flex items-center gap-1 ${fabDelta >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
              {fabDelta >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-xs">
                {fabDelta >= 0 ? "+" : ""}
                {fabDelta.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Back Orders */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <p className="text-[11px] text-[#555] mb-2">Back Orders Detected</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-white">{backOrders.toLocaleString()} units</p>
            <div className="flex items-center gap-1 text-[#f87171]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Equipment Utilization */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <p className="text-[11px] text-[#555] mb-2">Equipment Utilization</p>
          <p className="text-xl font-bold text-white mb-2">{equipmentUtil.toFixed(1)}%</p>
          <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${equipmentUtil}%` }} />
          </div>
        </div>
      </div>

      {/* Row 2 - Equipment Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        {/* ASML EUV Scanner */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">ASML EUV Scanner</p>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-[#0d2b0d] text-[#4ade80] rounded">
              ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#555]" />
            <span className="text-[#555] text-xs">Utilization</span>
            <span className="text-white font-medium text-sm ml-auto">{euvUtil}%</span>
          </div>
          <div className="w-full h-1 bg-[#222] rounded-full overflow-hidden mt-2">
            <div className="h-full bg-[#4ade80] rounded-full" style={{ width: `${euvUtil}%` }} />
          </div>
        </div>

        {/* Applied Materials CVD */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">Applied Materials CVD</p>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-[#0d2b0d] text-[#4ade80] rounded">
              ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#555]" />
            <span className="text-[#555] text-xs">Utilization</span>
            <span className="text-white font-medium text-sm ml-auto">{cvdUtil}%</span>
          </div>
          <div className="w-full h-1 bg-[#222] rounded-full overflow-hidden mt-2">
            <div className="h-full bg-[#4ade80] rounded-full" style={{ width: `${cvdUtil}%` }} />
          </div>
        </div>

        {/* Lam Research Etch */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">Lam Research Etch</p>
            {etchStatus === "ACTIVE" ? (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[#0d2b0d] text-[#4ade80] rounded">
                ACTIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[#2b1a00] text-[#f59e0b] rounded">
                MAINTENANCE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#555]" />
            <span className="text-[#555] text-xs">Utilization</span>
            <span className="text-white font-medium text-sm ml-auto">{etchStatus === "ACTIVE" ? `${etchUtil}%` : "0%"}</span>
          </div>
          <div className="w-full h-1 bg-[#222] rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full ${etchStatus === "ACTIVE" ? "bg-[#4ade80]" : "bg-[#f59e0b]"}`}
              style={{ width: `${etchStatus === "ACTIVE" ? etchUtil : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Row 3 - Process Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Yield Trend */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">Yield Trend</p>
            <span className="text-[10px] text-[#555]">Rolling</span>
          </div>
          <div className="flex items-center justify-between">
            <Sparkline data={yieldTrend} />
            <div className="text-right">
              <p className="text-lg font-bold text-white">{yieldAvg.toFixed(1)}%</p>
              <div className={`flex items-center gap-1 text-xs ${yieldDelta >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                {yieldDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>
                  {yieldDelta >= 0 ? "+" : ""}
                  {yieldDelta.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Node Distribution */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">Node Distribution</p>
            <span className="text-[10px] text-[#555]">Wafer count</span>
          </div>
          <div className="flex items-center justify-between">
            <BarChart data={nodes} />
            <div className="text-right">
              <p className="text-lg font-bold text-white">{totalWafers.toLocaleString()}</p>
              <p className="text-[10px] text-[#555]">Total wafers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
