"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/header";

type Difficulty = "Easy" | "Medium" | "Hard";

type InterviewQuestion = {
  difficulty: Difficulty;
  question: string;
  answer: string;
};

type ApiResponse = {
  headlines: string[];
  questions: InterviewQuestion[];
};

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const cls = useMemo(() => {
    if (difficulty === "Easy") return "bg-[#0d2b0d] text-positive";
    if (difficulty === "Hard") return "bg-[#2b0d0d] text-negative";
    return "bg-[#1a1a1a] text-[#bbbbbb]";
  }, [difficulty]);

  return (
    <span className={`text-[10px] font-medium px-2 py-1 rounded ${cls}`}>
      {difficulty}
    </span>
  );
}

export default function InterviewPrepPage() {
  const [loading, setLoading] = useState(true);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as ApiResponse;
      setHeadlines(Array.isArray(json.headlines) ? json.headlines : []);
      setQuestions(Array.isArray(json.questions) ? json.questions : []);
      setOpenIndex(0);
    } catch {
      setHeadlines([]);
      setQuestions([]);
      setOpenIndex(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="border-l-2 border-foreground pl-6">
              <h1 className="text-2xl font-bold tracking-[-0.5px] text-foreground">
                Interview Prep
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Fresh ECE/VLSI questions generated from today’s semiconductor headlines.
              </p>
            </div>

            <button
              type="button"
              onClick={load}
              className="shrink-0 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-all duration-300"
              disabled={loading}
            >
              {loading ? "Generating..." : "Regenerate Questions"}
            </button>
          </div>

          {/* Headlines */}
          <div className="rounded-lg border border-[#1a1a1a] bg-[#111111] p-5 mb-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-[#444444] mb-3">
              Today’s top headlines
            </h2>
            {headlines.length === 0 ? (
              <p className="text-sm text-[#666666]">
                {loading ? "Loading headlines..." : "No headlines available."}
              </p>
            ) : (
              <ul className="space-y-2">
                {headlines.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#bbbbbb]">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-[#444444] shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="rounded-lg border border-[#222222] bg-[#141414] p-8 text-center text-sm text-[#666666]">
                {loading ? "Generating questions..." : "No questions generated yet."}
              </div>
            ) : (
              questions.map((q, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-[#222222] bg-[#141414] overflow-hidden transition-all duration-300"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex((cur) => (cur === idx ? null : idx))}
                      className="w-full text-left px-5 py-4 hover:bg-[#151515] transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <DifficultyBadge difficulty={q.difficulty} />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground leading-snug">
                            {q.question}
                          </div>
                          <div className="text-xs text-[#555555] mt-1">
                            Click to {isOpen ? "hide" : "reveal"} answer
                          </div>
                        </div>
                        <div className="text-[#444444] text-sm pt-0.5 select-none">
                          {isOpen ? "−" : "+"}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5">
                        <div className="border-t border-[#222222] pt-4 text-sm text-[#bbbbbb] leading-relaxed">
                          {q.answer}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

