"use client";

import Navbar from "@/components/Navbar";
import BannerCarousel from "@/components/BannerCarousel";
import CategoryGrid from "@/components/CategoryGrid";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import SmartRecommendations from "@/components/SmartRecommendations";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { Product } from "@/types";
import Link from "next/link";
import {
  ChevronRight,
  Zap,
  Leaf,
  Truck,
  ShieldCheck,
  ChevronLeft,
  Sprout,
  Star,
} from "lucide-react";

// ── Section header helper ─────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  href,
  accent,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        {accent && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-0.5 block">
            {accent}
          </span>
        )}
        <h2 className="text-lg md:text-xl font-extrabold text-gray-900 leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-xs font-semibold text-green-600 hover:text-green-700 transition shrink-0"
        >
          See all <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

// ── Horizontal scroll row with arrow buttons ──────────────────────────────────
function HScrollRow({ children }: { children: React.ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "right" ? 220 : -220, behavior: "smooth" });
  };

  return (
    <div className="relative group/scroll">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-gray-500 hover:text-green-600 opacity-0 group-hover/scroll:opacity-100 transition"
        aria-label="Scroll left"
      >
        <ChevronLeft size={18} />
      </button>

      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
      >
        {children}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-gray-500 hover:text-green-600 opacity-0 group-hover/scroll:opacity-100 transition"
        aria-label="Scroll right"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

// ── Trust badges row ──────────────────────────────────────────────────────────
function TrustBadges() {
  const items = [
    { icon: <Truck size={20} className="text-green-600" />, label: "Free Delivery", sub: "On orders above ₹499" },
    { icon: <ShieldCheck size={20} className="text-blue-600" />, label: "100% Organic", sub: "Certified fresh produce" },
    { icon: <Leaf size={20} className="text-emerald-600" />, label: "Farm Direct", sub: "No middlemen" },
    { icon: <Star size={20} className="text-amber-500" />, label: "Top Rated", sub: "4.8★ avg satisfaction" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm"
        >
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
            {item.icon}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 leading-tight">{item.label}</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Offer strip ───────────────────────────────────────────────────────────────
function OfferStrip() {
  const offers = [
    "🌿 Use code FARM10 for 10% off your first order",
    "🚚 Free delivery on orders above ₹499",
    "⚡ Flash sale every Friday — up to 50% OFF",
    "🥛 Fresh dairy delivered by 7 AM daily",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % offers.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-green-600 text-white text-center py-2 px-4 overflow-hidden">
      <motion.p
        key={idx}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -12, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="text-[11px] md:text-xs font-medium tracking-wide"
      >
        {offers[idx]}
      </motion.p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Derived product lists ── all existing logic preserved
  const filtered =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  // Best deals = cheapest products (or those with lowest price ratio)
  const bestDeals = [...products]
    .sort((a, b) => a.price - b.price)
    .slice(0, 10);

  // Fresh picks = latest 6 (by insertion order from Firestore)
  const freshPicks = products.slice(0, 6);

  // Vegetables spotlight
  const veggies = products
    .filter((p) => p.category === "Vegetables")
    .slice(0, 8);

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-3 md:px-6 pb-6 space-y-7">

        {/* ── BANNER CAROUSEL ──────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="pt-4"
        >
          <BannerCarousel />
        </motion.section>

        {/* ── TRUST BADGES ─────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <TrustBadges />
        </motion.section>

        {/* ── SMART RECOMMENDATIONS ────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
        >
          <SmartRecommendations allProducts={products} loading={loading} />
        </motion.section>

        {/* ── SHOP BY CATEGORY ─────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <SectionHeader
            title="Shop by Category"
            subtitle="Find exactly what you're looking for"
            href="/products"
          />
          <CategoryGrid
            variant="scroll"
            activeCategory={activeCategory === "All" ? "All Products" : activeCategory}
            onSelect={(label) => setActiveCategory(label)}
          />
        </motion.section>

        {/* ── BEST DEALS ───────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            accent="Limited time"
            title="⚡ Best Deals"
            subtitle="Lowest prices from our farmers"
            href="/products"
          />

          {loading ? (
            <HScrollRow>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shrink-0 w-40 md:w-48">
                  <ProductCardSkeleton />
                </div>
              ))}
            </HScrollRow>
          ) : bestDeals.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No products yet.</p>
          ) : (
            <HScrollRow>
              {bestDeals.map((p, i) => (
                <div key={p.id} className="shrink-0 w-40 md:w-48">
                  <ProductCard
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    image={p.image}
                    unit={p.unit}
                    category={p.category}
                    farmerVerified={p.farmerVerified}
                    farmerName={p.farmerName}
                    rating={p.avgRating ?? p.rating ?? 4.2}
                    reviewCount={p.reviewCount}
                    originalPrice={
                      // Simulate a discount for visual richness — every other product gets one
                      i % 2 === 0 && p.price > 30
                        ? Math.round(p.price * 1.25)
                        : undefined
                    }
                  />
                </div>
              ))}
            </HScrollRow>
          )}
        </section>

        {/* ── PROMO BANNER STRIP ───────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left promo */}
            <Link
              href="/products?category=Organic"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 p-5 flex items-center justify-between group hover:shadow-lg transition-shadow"
            >
              <div className="z-10">
                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest">
                  Certified
                </p>
                <h3 className="text-white font-extrabold text-lg leading-tight mt-0.5">
                  100% Organic
                </h3>
                <p className="text-emerald-200 text-xs mt-1">
                  No chemicals, no preservatives
                </p>
                <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition">
                  Shop Organic <ChevronRight size={12} />
                </span>
              </div>
              <div className="text-6xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                🌿
              </div>
              {/* Decorative circle */}
              <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5" />
            </Link>

            {/* Right promo */}
            <Link
              href="/products?category=Dairy"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 flex items-center justify-between group hover:shadow-lg transition-shadow"
            >
              <div className="z-10">
                <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">
                  Fresh daily
                </p>
                <h3 className="text-white font-extrabold text-lg leading-tight mt-0.5">
                  Pure Dairy
                </h3>
                <p className="text-blue-200 text-xs mt-1">
                  Delivered before 7 AM every day
                </p>
                <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition">
                  Order Now <ChevronRight size={12} />
                </span>
              </div>
              <div className="text-6xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                🥛
              </div>
              <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5" />
            </Link>
          </div>
        </section>

        {/* ── FRESH PICKS ──────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            accent="Handpicked"
            title="🌱 Fresh Picks"
            subtitle="Top selections from our verified farmers"
            href="/products"
          />

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : freshPicks.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No products yet.</p>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
            >
              {freshPicks.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  image={p.image}
                  unit={p.unit}
                  category={p.category}
                  farmerVerified={p.farmerVerified}
                  farmerName={p.farmerName}
                  rating={p.avgRating ?? p.rating ?? 4.2}
                  reviewCount={p.reviewCount}
                  isFeatured
                />
              ))}
            </motion.div>
          )}
        </section>

        {/* ── VEGETABLES SPOTLIGHT ─────────────────────────────────────── */}
        {(loading || veggies.length > 0) && (
          <section>
            <SectionHeader
              accent="Today's harvest"
              title="🥦 Fresh Vegetables"
              subtitle="Farm-picked this morning"
              href="/products?category=Vegetables"
            />

            {loading ? (
              <HScrollRow>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="shrink-0 w-40 md:w-48">
                    <ProductCardSkeleton />
                  </div>
                ))}
              </HScrollRow>
            ) : (
              <HScrollRow>
                {veggies.map((p) => (
                  <div key={p.id} className="shrink-0 w-40 md:w-48">
                    <ProductCard
                      id={p.id}
                      name={p.name}
                      price={p.price}
                      image={p.image}
                      unit={p.unit}
                      category={p.category}
                      farmerVerified={p.farmerVerified}
                      farmerName={p.farmerName}
                      rating={p.avgRating ?? p.rating ?? 4.2}
                      reviewCount={p.reviewCount}
                    />
                  </div>
                ))}
              </HScrollRow>
            )}
          </section>
        )}

        {/* ── CATEGORY FILTER + PRODUCT GRID ───────────────────────────── */}
        <section id="products-section">
          <SectionHeader
            title={activeCategory === "All" ? "All Products" : activeCategory}
            subtitle={
              activeCategory === "All"
                ? "Everything fresh from our farmers"
                : `Showing all ${activeCategory.toLowerCase()} products`
            }
            href="/products"
          />

          {/* Category filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide -mx-1 px-1">
            {["All", "Vegetables", "Fruits", "Dairy", "Organic", "Grains", "Other"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-green-600 text-white border-green-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                  }`}
                >
                  {{
                    All: "🛒",
                    Vegetables: "🥦",
                    Fruits: "🍎",
                    Dairy: "🥛",
                    Organic: "🌿",
                    Grains: "🌾",
                    Other: "📦",
                  }[cat]}{" "}
                  {cat}
                </button>
              )
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
              <Sprout size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-semibold">
                No products in {activeCategory} yet
              </p>
              <button
                onClick={() => setActiveCategory("All")}
                className="mt-3 text-sm text-green-600 hover:underline font-medium"
              >
                Show all products
              </button>
            </div>
          ) : (
            <>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
              >
                {filtered.slice(0, 8).map((p, i) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    image={p.image}
                    unit={p.unit}
                    category={p.category}
                    farmerVerified={p.farmerVerified}
                    farmerName={p.farmerName}
                    rating={p.avgRating ?? p.rating ?? 4.2}
                    reviewCount={p.reviewCount}
                    originalPrice={
                      i % 3 === 0 && p.price > 30
                        ? Math.round(p.price * 1.2)
                        : undefined
                    }
                  />
                ))}
              </motion.div>

              {filtered.length > 8 && (
                <div className="text-center mt-6">
                  <Link
                    href={
                      activeCategory === "All"
                        ? "/products"
                        : `/products?category=${activeCategory}`
                    }
                    className="inline-flex items-center gap-2 bg-white border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    View all {filtered.length} products{" "}
                    <ChevronRight size={16} />
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── FOOTER STRIP ─────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-green-700 to-emerald-800 rounded-2xl p-6 md:p-8 text-white text-center">
          <div className="text-3xl mb-3">🌾</div>
          <h3 className="text-xl font-extrabold mb-1">
            Supporting Local Farmers
          </h3>
          <p className="text-green-200 text-sm max-w-md mx-auto">
            Every purchase directly supports verified Indian farmers. Fresh
            produce, fair prices, zero middlemen.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 mt-5 bg-white text-green-700 font-bold px-6 py-2.5 rounded-xl hover:bg-green-50 transition shadow"
          >
            Start Shopping <ChevronRight size={15} />
          </Link>
        </section>

      </main>
    </>
  );
}