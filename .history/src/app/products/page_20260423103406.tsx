"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  PackageOpen,
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
} from "lucide-react";

const CATEGORIES = [
  { label: "All", emoji: "🛒" },
  { label: "Vegetables", emoji: "🥦" },
  { label: "Fruits", emoji: "🍎" },
  { label: "Dairy", emoji: "🥛" },
  { label: "Organic", emoji: "🌿" },
  { label: "Grains", emoji: "🌾" },
  { label: "Other", emoji: "📦" },
];

const SORT_OPTIONS = [
  { label: "Relevance", value: "default" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "Name A → Z", value: "name_asc" },
];

// ── inner component (needs useSearchParams inside Suspense) ───────────────────
function ProductsContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(
    searchParams.get("category") ?? "All"
  );
  const [sort, setSort] = useState("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Sync URL params on mount
  useEffect(() => {
    const s = searchParams.get("search");
    const c = searchParams.get("category");
    if (s) setSearch(s);
    if (c) setCategory(c);
  }, [searchParams]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Filtering + sorting — all existing logic preserved ────────────────────
  const filtered = products
    .filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      const matchCat = category === "All" || p.category === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "name_asc") return a.name?.localeCompare(b.name);
      return 0;
    });

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setSort("default");
  };

  const hasActiveFilters =
    search !== "" || category !== "All" || sort !== "default";

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  return (
    <>
      <Navbar />

      {/* ── STICKY FILTER BAR ────────────────────────────────────────── */}
      <div className="sticky top-14 md:top-[105px] z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 flex items-center gap-2">

          {/* Search input */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                sort !== "default"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              <SlidersHorizontal size={13} />
              <span className="hidden sm:block">{activeSortLabel}</span>
              <span className="sm:hidden">Sort</span>
              <ChevronDown
                size={12}
                className={`transition-transform ${sortOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {sortOpen && (
                <>
                  {/* backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setSortOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSort(opt.value);
                          setSortOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition ${
                          sort === opt.value
                            ? "bg-green-50 text-green-700 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                        {sort === opt.value && (
                          <Check size={14} className="text-green-600" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* ── CATEGORY CHIPS (scrollable) ─────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-3 md:px-6 pb-2.5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setCategory(cat.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 ${
                  category === cat.label
                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700"
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-3 md:px-6 pt-4 pb-6">

        {/* Page header */}
        <div className="mb-4">
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">
            {category === "All" ? "All Products" : category}
          </h1>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              {search && (
                <span>
                  {" "}for{" "}
                  <span className="font-semibold text-gray-600">
                    "{search}"
                  </span>
                </span>
              )}
              {category !== "All" && ` in ${category}`}
            </p>
          )}
        </div>

        {/* ── SKELETON GRID ─────────────────────────────────────────── */}
        {loading && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              >
                <ProductCardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── EMPTY STATE ───────────────────────────────────────────── */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <PackageOpen size={52} className="mx-auto mb-4 text-gray-200" />
            <h2 className="text-lg font-bold text-gray-600 mb-1">
              No products found
            </h2>
            <p className="text-sm text-gray-400">
              Try adjusting your search or category filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-green-600 hover:underline font-semibold"
            >
              Clear all filters
            </button>
          </motion.div>
        )}

        {/* ── PRODUCT GRID ──────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            {filtered.map((p, i) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                image={p.image}
                unit={p.unit}
                category={p.category}
                originalPrice={
                  i % 3 === 0 && p.price > 30
                    ? Math.round(p.price * 1.2)
                    : undefined
                }
              />
            ))}
          </motion.div>
        )}
      </main>
    </>
  );
}

// ── Suspense wrapper (required for useSearchParams in App Router) ─────────────
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <div className="max-w-7xl mx-auto px-3 md:px-6 pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}