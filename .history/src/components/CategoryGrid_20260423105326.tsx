"use client";

import Link from "next/link";

const categories = [
  {
    id: "vegetables",
    label: "Vegetables",
    emoji: "🥦",
    color: "from-green-400 to-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
  },
  {
    id: "fruits",
    label: "Fruits",
    emoji: "🍎",
    color: "from-orange-400 to-red-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
  },
  {
    id: "grains",
    label: "Grains",
    emoji: "🌾",
    color: "from-amber-400 to-yellow-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  {
    id: "dairy",
    label: "Dairy",
    emoji: "🥛",
    color: "from-sky-400 to-blue-500",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
  },
  {
    id: "spices",
    label: "Spices",
    emoji: "🌶️",
    color: "from-red-400 to-rose-600",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
  {
    id: "herbs",
    label: "Herbs",
    emoji: "🌿",
    color: "from-emerald-400 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  {
    id: "pulses",
    label: "Pulses",
    emoji: "🫘",
    color: "from-yellow-500 to-orange-500",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
  },
  {
    id: "organic",
    label: "Organic",
    emoji: "🌱",
    color: "from-lime-400 to-green-500",
    bg: "bg-lime-50",
    border: "border-lime-200",
    text: "text-lime-700",
  },
];

export default function CategoryGrid() {
  return (
    <section className="px-3 md:px-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-bold text-gray-800">
          Shop by Category
        </h2>
        <Link
          href="/products"
          className="text-green-600 text-xs font-semibold hover:underline"
        >
          See all →
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.id}`}
            className={`group flex flex-col items-center gap-1.5 p-2.5 md:p-3 rounded-2xl border ${cat.bg} ${cat.border} hover:shadow-md transition-all duration-200 active:scale-95`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Emoji circle */}
            <div
              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}
            >
              <span className="text-xl md:text-2xl">{cat.emoji}</span>
            </div>
            <span
              className={`text-[10px] md:text-xs font-semibold ${cat.text} text-center leading-tight`}
            >
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}