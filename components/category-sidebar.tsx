"use client";

const categories = [
  { id: "all", label: "All News" },
  { id: "foundry", label: "Foundry" },
  { id: "eda", label: "EDA Tools" },
  { id: "memory", label: "Memory" },
  { id: "automotive", label: "Automotive" },
  { id: "ai", label: "AI Chips" },
];

export function CategorySidebar({
  activeCategory,
  onCategoryChange,
  counts,
}: {
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  counts?: Partial<Record<string, number>>;
}) {

  return (
    <aside className="w-56 shrink-0 border-r border-[#1a1a1a] hidden lg:block animate-slide-in-left opacity-0" style={{ animationFillMode: 'forwards' }}>
      <div className="p-5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[#444444] mb-4">
          Categories
        </h2>
        <nav className="flex flex-col gap-1">
          {categories.map((category, index) => {
            const isActive = activeCategory === category.id;
            const count = counts?.[category.id] ?? 0;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`flex items-center justify-between px-3 py-2.5 text-sm transition-all duration-400 ${
                  isActive
                    ? "sidebar-active text-foreground bg-[#111111]"
                    : "text-[#444444] hover:text-foreground hover:bg-[#111111]"
                } stagger-${index + 1}`}
              >
                <span>{category.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  isActive ? "bg-[#1e1e1e] text-foreground" : "bg-[#1a1a1a] text-[#555555]"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
