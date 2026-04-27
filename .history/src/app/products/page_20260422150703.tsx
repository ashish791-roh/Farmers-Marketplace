"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, PackageOpen } from "lucide-react";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Dairy", "Organic", "Grains", "Other"];

const CATEGORY_ICONS: Record<string, string> = {
  All: "🛒",
  Vegetables: "🥦",
  Fruits: "🍎",
  Dairy: "🥛",
  Organic: "🌿",
  Grains: "🌾",
  Other: "📦",
};

const SORT_OPTIONS = [
  { label: "Default", value: "default" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name A–Z", value: "name_asc" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = products
    .filter((p) => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || p.category === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "name_asc") return a.name?.localeCompare(b.name);
      return 0;
    });

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">All Products</h1>
          <p className="text-gray-500 text-sm">Fresh produce directly from verified farmers</p>
        </div>

        {/* SEARCH + FILTER BAR */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CATEGORY CHIPS */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition border ${
                category === cat
                  ? "bg-green-600 text-white border-green-600 shadow"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700"
              }`}
            >
              <span style={{ fontSize: 14 }}>{CATEGORY_ICONS[cat]}</span>
              {cat}
            </button>
          ))}
        </div>

        {/* RESULTS COUNT */}
        {!loading && (
          <p className="text-sm text-gray-400 mb-4">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
            {search && ` for "${search}"`}
            {category !== "All" && ` in ${category}`}
          </p>
        )}

        {/* PRODUCTS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <PackageOpen size={56} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No products found</h2>
            <p className="text-gray-400">Try a different search term or category.</p>
            <button onClick={() => { setSearch(""); setCategory("All"); }} className="mt-4 text-green-600 hover:underline text-sm font-medium">
              Clear filters
            </button>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {filtered.map((p) => (
              <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} image={p.image} unit={p.unit} category={p.category} />
            ))}
          </motion.div>
        )}
      </main>
    </>
  );
}