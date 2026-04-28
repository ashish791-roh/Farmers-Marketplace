"use client";

import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import Link from "next/link";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Dairy", "Organic", "Grains", "Other"];
const CATEGORY_ICONS: Record<string, string> = {
  All: "🛒", Vegetables: "🥦", Fruits: "🍎", Dairy: "🥛", Organic: "🌿", Grains: "🌾", Other: "📦",
};

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filtered = activeCategory === "All"
    ? products
    : products.filter((p) => p.category === activeCategory);

  return (
    <>
      <Navbar />

      <main className="p-6 md:p-10 max-w-7xl mx-auto">

        {/* HERO SECTION */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-3xl p-10 mb-10 flex flex-col md:flex-row items-center justify-between shadow-lg"
        >
          <div>
            <h2 className="text-4xl font-bold">
              Fresh & Organic 🌿
            </h2>
            <p className="mt-3 text-lg">
              Directly from farmers to your home
            </p>
            <button
             onClick={() => {
               const section = document.getElementById("products-section");
               section?.scrollIntoView({ behavior: "smooth" });
             }}
             className="bg-white text-green-700 px-6 py-3 rounded-xl font-semibold shadow cursor-pointer hover:shadow-lg transition"
           >
             Shop Now
           </button>
          </div>

          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e"
            alt="Fresh Products"
            className="w-72 mt-6 md:mt-0 rounded-xl shadow hover:scale-105 transition duration-300"
          />
        </motion.div>

        {/* CATEGORIES */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">
            Categories
          </h2>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`min-w-[110px] flex flex-col items-center gap-1 shadow-sm hover:shadow-xl hover:scale-105 transition duration-300 rounded-xl p-4 text-center cursor-pointer border-2 ${
                  activeCategory === cat
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "bg-white border-transparent"
                }`}
              >
                <span style={{ fontSize: 22 }}>{CATEGORY_ICONS[cat]}</span>
                <p className="mt-1 font-medium text-sm">{cat}</p>
              </button>
            ))}
          </div>
        </div>

        {/*  PRODUCTS */}
        <div id="products-section" className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              {activeCategory === "All" ? "Popular Products" : activeCategory}
            </h2>
            <Link href="/products" className="text-green-600 hover:underline text-sm font-medium">
              View All →
            </Link>
          </div>

          {products.length === 0 ? (
            <p className="text-gray-400 text-center py-20">No products available yet.</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No products in this category yet.</p>
              <button onClick={() => setActiveCategory("All")} className="mt-3 text-green-600 hover:underline text-sm">
                Show all products
              </button>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {filtered.slice(0, 8).map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  image={p.image}
                />
              ))}
            </motion.div>
          )}

          {filtered.length > 8 && (
            <div className="text-center mt-10">
              <Link href="/products" className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition shadow">
                View All Products
              </Link>
            </div>
          )}
        </div>

      </main>
    </>
  );
}