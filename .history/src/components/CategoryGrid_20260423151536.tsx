"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Category = {
  label: string;
  emoji: string;
  href: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  ringColor: string;
  count?: number;
};

const CATEGORIES: Category[] = [
  {
    label: "Vegetables",
    emoji: "🥦",
    href: "/products?category=Vegetables",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-300",
    ringColor: "ring-green-400",
  },
  {
    label: "Fruits",
    emoji: "🍎",
    href: "/products?category=Fruits",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-300",
    ringColor: "ring-red-400",
  },
  {
    label: "Dairy",
    emoji: "🥛",
    href: "/products?category=Dairy",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    ringColor: "ring-blue-400",
  },
  {
    label: "Organic",
    emoji: "🌿",
    href: "/products?category=Organic",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-300",
    ringColor: "ring-emerald-400",
  },
  {
    label: "Grains",
    emoji: "🌾",
    href: "/products?category=Grains",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
    borderColor: "border-amber-300",
    ringColor: "ring-amber-400",
  },
  {
    label: "Other",
    emoji: "📦",
    href: "/products?category=Other",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
    borderColor: "border-purple-300",
    ringColor: "ring-purple-400",
  },
  {
    label: "All Products",
    emoji: "🛒",
    href: "/products",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
    ringColor: "ring-gray-400",
  },
];

type Props = {
  variant?: "scroll" | "grid";
  activeCategory?: string;
  onSelect?: (label: string) => void;
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.75, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export default function CategoryGrid({ variant = "scroll", activeCategory, onSelect }: Props) {

  // ── SCROLL VARIANT (home page): Flipkart-style circular pills ────────────
  if (variant === "scroll") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.label;
          return (
            <motion.div key={cat.label} variants={itemVariants} className="shrink-0">
              {onSelect ? (
                <button
                  onClick={() => onSelect(cat.label === "All Products" ? "All" : cat.label)}
                  className="flex flex-col items-center gap-2 group"
                >
                  {/* Circular icon — Flipkart style */}
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-200 border-2 ${
                      active
                        ? `${cat.bgColor} ${cat.borderColor} scale-110 shadow-md ring-2 ${cat.ringColor} ring-offset-1`
                        : `bg-white border-gray-100 shadow-sm group-hover:${cat.bgColor} group-hover:border-opacity-50 group-hover:scale-105`
                    }`}
                  >
                    {cat.emoji}
                  </div>
                  <span
                    className={`text-[11px] font-semibold leading-tight text-center whitespace-nowrap transition-colors ${
                      active ? cat.textColor : "text-gray-500 group-hover:" + cat.textColor
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              ) : (
                <Link href={cat.href} className="flex flex-col items-center gap-2 group">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-200 border-2 ${
                      active
                        ? `${cat.bgColor} ${cat.borderColor} scale-110 shadow-md`
                        : `bg-white border-gray-100 shadow-sm group-hover:scale-105`
                    }`}
                  >
                    {cat.emoji}
                  </div>
                  <span className={`text-[11px] font-semibold leading-tight text-center whitespace-nowrap ${active ? cat.textColor : "text-gray-500"}`}>
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

  // ── GRID VARIANT ─────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-4"
    >
      {CATEGORIES.map((cat) => {
        const active = activeCategory === cat.label;
        const Content = (
          <>
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all duration-200 group-hover:scale-110 ${
                active ? cat.bgColor : "bg-gray-50 group-hover:" + cat.bgColor
              }`}
            >
              {cat.emoji}
            </div>
            <div className="text-center">
              <p className={`text-xs font-semibold mt-2 leading-tight ${active ? cat.textColor : "text-gray-700"}`}>
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
              <button onClick={() => onSelect(cat.label === "All Products" ? "All" : cat.label)} className={`w-full ${cls}`}>
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
