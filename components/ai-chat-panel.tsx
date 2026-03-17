"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const quickQuestions = [
  "NVDA outlook?",
  "TSMC vs Intel?",
  "Memory trends",
  "EDA market",
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your AI assistant for semiconductor industry analysis. Ask me about companies, market trends, or technical comparisons.",
  },
];

export function AiChatPanel({ newsContext }: { newsContext: string[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    const outgoing = input;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: outgoing,
          newsContext: newsContext ?? [],
        }),
      });

      if (!res.ok) throw new Error("chat request failed");
      const text = (await res.text()).trim();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: text || "No response.",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I couldn’t reach the AI service. Check that your Groq key is set and the server is running.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <aside className="w-72 shrink-0 border-l border-[#1e1e1e] bg-[#111111] flex flex-col hidden xl:flex">
      {/* Header */}
      <div className="p-4 border-b border-[#1e1e1e]">
        <h2 className="font-semibold text-foreground">Ask AI</h2>
        <p className="text-xs text-[#555555] mt-0.5">Semiconductor Intelligence</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  message.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-[#1e1e1e] text-[#666666]"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
              </div>
              <div
                className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                  message.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-[#1a1a1a] text-foreground border border-[#222222]"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e1e1e] text-[#666666]">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-lg px-3 py-2 text-sm bg-[#1a1a1a] border border-[#222222]">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#444444] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-[#444444] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-[#444444] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Quick Questions */}
      <div className="px-4 py-3 border-t border-[#1e1e1e]">
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((question) => (
            <button
              key={question}
              onClick={() => handleQuickQuestion(question)}
              className="px-2.5 py-1 text-xs rounded bg-[#1e1e1e] text-[#555555] hover:text-foreground hover:bg-[#222222] transition-all duration-400"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#1e1e1e]">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about semiconductors..."
            className="flex-1 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm text-foreground placeholder:text-[#444444] focus:outline-none focus:border-[#333333] transition-all duration-400"
          />
          <Button 
            type="submit"
            size="icon" 
            className="bg-foreground hover:bg-foreground/90 text-background"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
