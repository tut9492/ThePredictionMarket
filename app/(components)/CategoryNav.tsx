"use client";

type CategoryKey = "ALL" | "POLITICS" | "SPORTS" | "CRYPTO" | "SOCIAL" | "DATA";

interface Category {
  id: CategoryKey;
  label: string;
  icon: string | null;
}

const CATEGORIES: Category[] = [
  { id: "ALL", label: "ALL", icon: null },
  { id: "POLITICS", label: "POLITICS", icon: "🗳️" },
  { id: "SPORTS", label: "SPORTS", icon: "🏀" },
  { id: "CRYPTO", label: "CRYPTO", icon: "₿" },
  { id: "SOCIAL", label: "SOCIAL", icon: "💬" },
  { id: "DATA", label: "DATA", icon: "📊" },
];

interface CategoryNavProps {
  selectedCategory: CategoryKey;
  onCategoryChange: (category: CategoryKey) => void;
}

export function CategoryNav({
  selectedCategory,
  onCategoryChange,
}: CategoryNavProps) {
  return (
    <div className="flex justify-center gap-3 mb-8 flex-wrap">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedCategory === cat.id
              ? "bg-black text-white shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          {cat.icon && <span className="mr-2">{cat.icon}</span>}
          {cat.label}
        </button>
      ))}
    </div>
  );
}



