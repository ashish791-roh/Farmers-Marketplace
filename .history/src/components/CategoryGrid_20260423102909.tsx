"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Category = {
  label: string;
  emoji: string;
  href: string;
  bgColor: string;      // Tailwind bg class for the icon circle
  textColor: string;    // Tailwind text class
  borderColor: string;  // Tailwind ring/border class
  count?: number;       // optional product count
};

const CATEGORIES: Category[] = [
  {
    label: "Vegetables",
    emoji: "🥦",
    href: "/products?category=Vegetables",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  {
    label: "Fruits",
    emoji: "🍎",
    href: "/products?category=Fruits",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-200",
  },
  {
    label: "Dairy",
    emoji: "🥛",
    href: "/products?category=Dairy",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    label: "Organic",
    emoji: "🌿",
    href: "/products?category=Organic",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  {
    label: "Grains",
    emoji: "🌾",
    href: "/products?category=Grains",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
  },
  {
    label: "Other",
    emoji: "📦",
    href: "/products?category=Other",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
  {
    label: "All Products",
    emoji: "🛒",
    href: "/products",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
  },
];

type Props = {
  /** compact = horizontal scroll row (home page), grid = full grid layout */
  variant?: "scroll" | "grid";
  activeCategory?: string;
  onSelect?: (label: string) => void;
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
};

export default function CategoryGrid({
  variant = "scroll",
  activeCategory,
  onSelect,
}: Props) {
  if (variant === "scroll") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.label;
          return (
            <motion.div key={cat.label} variants={itemVariants}>
              {onSelect ? (
                <button
                  onClick={() => onSelect(cat.label === "All Products" ? "All" : cat.label)}
                  className={`flex flex-col items-center gap-2 min-w-[72px] p-3 rounded-2xl border-2 transition-all duration-200 ${
                    active
                      ? `${cat.bgColor} ${cat.borderColor} ${cat.textColor} shadow-md scale-105`
                      : "bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${
                      active ? "bg-white/60" : cat.bgColor
                    }`}
                  >
                    {cat.emoji}
                  </div>
                  <span className="text-[10px] font-semibold leading-tight text-center whitespace-nowrap">
                    {cat.label}
                  </span>
                </button>
              ) : (
                <Link
                  href={cat.href}
                  className={`flex flex-col items-center gap-2 min-w-[72px] p-3 rounded-2xl border-2 transition-all duration-200 ${
                    active
                      ? `${cat.bgColor} ${cat.borderColor} ${cat.textColor} shadow-md scale-105`
                      : "bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${cat.bgColor}`}
                  >
                    {cat.emoji}
                  </div>
                  <span className="text-[10px] font-semibold leading-tight text-center whitespace-nowrap">
                    {cat.label}
                  </span>
                </Link>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    );
  }

  // ── Grid variant ───────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3"
    >
      {CATEGORIES.map((cat) => {
        const active = activeCategory === cat.label;
        const Content = (
          <>
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-110 duration-200 ${cat.bgColor}`}
            >
              {cat.emoji}
            </div>
            <div className="text-center">
              <p
                className={`text-xs font-semibold mt-2 leading-tight ${
                  active ? cat.textColor : "text-gray-700"
                }`}
              >
                {cat.label}
              </p>
              {cat.count !== undefined && (
                <p className="text-[10px] text-gray-400 mt-0.5">{cat.count} items</p>
              )}
            </div>
          </>
        );

        const cls = `group flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
          active
            ? `${cat.bgColor} ${cat.borderColor} shadow-md`
            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
        }`;

        return (
          <motion.div key={cat.label} variants={itemVariants} whileTap={{ scale: 0.94 }}>
            {onSelect ? (
              <button
                onClick={() => onSelect(cat.label === "All Products" ? "All" : cat.label)}
                className={`w-full ${cls}`}
              >
                {Content}
              </button>
            ) : (
              <Link href={cat.href} className={cls}>
                {Content}
              </Link>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}