"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "News", href: "/" },
  { label: "Companies", href: "/companies" },
  { label: "Trends", href: "/trends" },
  { label: "Interview Prep", href: "/interview-prep" },
];

export function Header({
  savedCount,
  savedOnly,
  onToggleSavedOnly,
}: {
  savedCount?: number;
  savedOnly?: boolean;
  onToggleSavedOnly?: () => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-b border-[#1a1a1a]">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-[-0.5px] text-foreground">
          ChipPulse
        </Link>
        
        <div className="hidden items-center gap-8 md:flex">
          <nav className="flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive =
                link.href !== "#" &&
                (pathname === link.href ||
                  (link.href !== "/" && pathname?.startsWith(link.href)));

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm transition-all duration-400 ${
                    isActive
                      ? "text-foreground"
                      : "text-[#444444] hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {typeof savedCount === "number" && onToggleSavedOnly && (
            <button
              type="button"
              onClick={onToggleSavedOnly}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all duration-300 ${
                savedOnly ? "bg-[#111111] text-foreground" : "text-[#444444] hover:text-foreground hover:bg-[#111111]"
              }`}
            >
              <span>Saved</span>
              <span
                className={`min-w-6 rounded-full px-2 py-0.5 text-xs ${
                  savedOnly ? "bg-[#1e1e1e] text-foreground" : "bg-[#1a1a1a] text-[#555555]"
                }`}
                aria-label={`${savedCount} saved articles`}
              >
                {savedCount}
              </span>
            </button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <nav className="border-t border-[#1a1a1a] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {typeof savedCount === "number" && onToggleSavedOnly && (
              <button
                type="button"
                onClick={() => {
                  onToggleSavedOnly();
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-all duration-300 ${
                  savedOnly ? "bg-[#111111] text-foreground" : "text-[#444444] hover:text-foreground hover:bg-[#111111]"
                }`}
              >
                <span>Saved</span>
                <span
                  className={`min-w-6 rounded-full px-2 py-0.5 text-xs ${
                    savedOnly ? "bg-[#1e1e1e] text-foreground" : "bg-[#1a1a1a] text-[#555555]"
                  }`}
                >
                  {savedCount}
                </span>
              </button>
            )}

            {navLinks.map((link) => {
              const isActive =
                link.href !== "#" &&
                (pathname === link.href ||
                  (link.href !== "/" && pathname?.startsWith(link.href)));

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm ${
                    isActive ? "text-foreground" : "text-[#444444]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
