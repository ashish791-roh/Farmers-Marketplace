"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getStoredLocation, type LocationInfo } from "@/components/LocationModal";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import {
  MapPin,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// ── Region profile ──────────────────────────────────────────────────────────
interface RegionProfile {
  region: string;
  tagline: string;
  emoji: string;
  preferredCategories: string[]; // ordered by priority
  seasonalTags: string[];         // keywords to match in product names
  accentColor: string;            // Tailwind bg class for header
  accentText: string;
}

// ── City → Region mapping ───────────────────────────────────────────────────
const CITY_TO_REGION: Record<string, RegionProfile> = {
  "New Delhi": {
    region: "North India",
    tagline: "Mustard-fed harvests from Punjab & Haryana fields",
    emoji: "🌾",
    preferredCategories: ["Grains", "Vegetables", "Dairy", "Organic"],
    seasonalTags: ["wheat", "mustard", "spinach", "radish", "milk", "paneer", "potato", "onion"],
    accentColor: "from-amber-500 to-orange-500",
    accentText: "text-amber-600",
  },
  Mumbai: {
    region: "West India",
    tagline: "Coastal freshness — Konkan mangoes & tropical produce",
    emoji: "🥭",
    preferredCategories: ["Fruits", "Organic", "Vegetables", "Grains"],
    seasonalTags: ["mango", "coconut", "rice", "tomato", "banana", "guava", "papaya"],
    accentColor: "from-yellow-500 to-amber-500",
    accentText: "text-yellow-600",
  },
  Bangalore: {
    region: "South India",
    tagline: "Garden City picks — ragi, millets & garden-fresh greens",
    emoji: "🥬",
    preferredCategories: ["Organic", "Vegetables", "Grains", "Fruits"],
    seasonalTags: ["ragi", "millet", "beans", "carrot", "beetroot", "greens", "organic"],
    accentColor: "from-emerald-500 to-green-600",
    accentText: "text-emerald-600",
  },
  Chennai: {
    region: "South India",
    tagline: "Straight from Tamil Nadu fields — rice, turmeric & more",
    emoji: "🌿",
    preferredCategories: ["Grains", "Organic", "Vegetables", "Fruits"],
    seasonalTags: ["rice", "turmeric", "tamarind", "banana", "coconut", "brinjal", "drumstick"],
    accentColor: "from-green-600 to-teal-600",
    accentText: "text-green-700",
  },
  Hyderabad: {
    region: "Deccan Plateau",
    tagline: "Deccan bounty — jowar, groundnuts & tropical fruits",
    emoji: "🌽",
    preferredCategories: ["Grains", "Vegetables", "Fruits", "Organic"],
    seasonalTags: ["jowar", "groundnut", "mango", "papaya", "tomato", "chilli", "corn"],
    accentColor: "from-red-500 to-orange-500",
    accentText: "text-red-600",
  },
  Kolkata: {
    region: "East India",
    tagline: "Bengal's finest — mustard, hilsa & farm-fresh vegetables",
    emoji: "🐟",
    preferredCategories: ["Vegetables", "Grains", "Organic", "Dairy"],
    seasonalTags: ["mustard", "potato", "brinjal", "rice", "lentil", "jute", "green"],
    accentColor: "from-blue-500 to-indigo-600",
    accentText: "text-blue-600",
  },
  Pune: {
    region: "Western Maharashtra",
    tagline: "Sahyadri farms — strawberries, grapes & vine-ripened goodness",
    emoji: "🍇",
    preferredCategories: ["Fruits", "Organic", "Vegetables", "Dairy"],
    seasonalTags: ["grape", "strawberry", "sugarcane", "onion", "tomato", "milk"],
    accentColor: "from-purple-500 to-violet-600",
    accentText: "text-purple-600",
  },
  Ahmedabad: {
    region: "Gujarat",
    tagline: "Gujarat's heartland — groundnuts, cotton & dairy produce",
    emoji: "🥛",
    preferredCategories: ["Dairy", "Grains", "Vegetables", "Organic"],
    seasonalTags: ["milk", "ghee", "groundnut", "bajra", "castor", "cotton", "curd"],
    accentColor: "from-orange-500 to-red-500",
    accentText: "text-orange-600",
  },
  Jaipur: {
    region: "Rajasthan",
    tagline: "Desert blooms — bajra, guar & organic spices",
    emoji: "🌵",
    preferredCategories: ["Grains", "Organic", "Vegetables", "Dairy"],
    seasonalTags: ["bajra", "guar", "spice", "cumin", "coriander", "mustard", "desi"],
    accentColor: "from-pink-500 to-rose-600",
    accentText: "text-pink-600",
  },
  Lucknow: {
    region: "Uttar Pradesh",
    tagline: "Gangetic plains — sugarcane, wheat & Awadhi produce",
    emoji: "🍬",
    preferredCategories: ["Grains", "Vegetables", "Dairy", "Fruits"],
    seasonalTags: ["sugarcane", "wheat", "mango", "guava", "potato", "milk", "pea"],
    accentColor: "from-teal-500 to-cyan-600",
    accentText: "text-teal-600",
  },
  Chandigarh: {
    region: "Punjab",
    tagline: "Granary of India — wheat, basmati & fresh dairy",
    emoji: "🌾",
    preferredCategories: ["Grains", "Dairy", "Vegetables", "Organic"],
    seasonalTags: ["wheat", "basmati", "rice", "milk", "butter", "ghee", "potato"],
    accentColor: "from-amber-500 to-yellow-500",
    accentText: "text-amber-600",
  },
  Indore: {
    region: "Madhya Pradesh",
    tagline: "Heartland of India — soybean, wheat & fresh produce",
    emoji: "🌱",
    preferredCategories: ["Grains", "Organic", "Vegetables", "Fruits"],
    seasonalTags: ["soybean", "wheat", "garlic", "onion", "tomato", "orange", "banana"],
    accentColor: "from-lime-500 to-green-600",
    accentText: "text-lime-600",
  },
};

const DEFAULT_REGION: RegionProfile = {
  region: "India",
  tagline: "Fresh picks from farms across India",
  emoji: "🌿",
  preferredCategories: ["Vegetables", "Fruits", "Dairy", "Organic", "Grains"],
  seasonalTags: ["fresh", "organic", "natural"],
  accentColor: "from-green-500 to-emerald-600",
  accentText: "text-green-600",
};

// ── Score a product against a region profile ────────────────────────────────
function scoreProduct(product: any, profile: RegionProfile): number {
  let score = 0;
  const nameLower = (product.name || "").toLowerCase();
  const catLower = (product.category || "").toLowerCase();

  // Category match
  const catIndex = profile.preferredCategories.findIndex(
    (c) => c.toLowerCase() === catLower
  );
  if (catIndex !== -1) score += 10 - catIndex * 2; // top category = 10 pts

  // Seasonal tag match in name
  for (const tag of profile.seasonalTags) {
    if (nameLower.includes(tag)) score += 5;
  }

  // Slight randomness so it feels dynamic
  score += Math.random() * 2;

  return score;
}

// ── Props ───────────────────────────────────────────────────────────────────
interface Props {
  allProducts: any[];
  loading: boolean;
}

// ── Component ───────────────────────────────────────────────────────────────
export default function SmartRecommendations({ allProducts, loading }: Props) {
  const [location, setLocation] = useState<LocationInfo>({ city: "New Delhi", pincode: "110001" });
  const [recommended, setRecommended] = useState<any[]>([]);
  const [profile, setProfile] = useState<RegionProfile>(DEFAULT_REGION);
  const [refreshKey, setRefreshKey] = useState(0);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    setLocation(getStoredLocation());

    // Listen for location changes via storage event (cross-tab) or custom event
    const handleStorage = () => setLocation(getStoredLocation());
    window.addEventListener("storage", handleStorage);

    // Also poll — when user changes location in the same tab via modal
    const poll = setInterval(() => {
      const stored = getStoredLocation();
      setLocation((prev) =>
        prev.city !== stored.city ? stored : prev
      );
    }, 800);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(poll);
    };
  }, []);

  // Recompute recommendations when location or products change
  useEffect(() => {
    if (allProducts.length === 0) return;

    const regionProfile = CITY_TO_REGION[location.city] || DEFAULT_REGION;
    setProfile(regionProfile);

    // Score and sort
    const scored = allProducts
      .map((p) => ({ ...p, _score: scoreProduct(p, regionProfile) }))
      .sort((a, b) => b._score - a._score);

    // Take top 10, ensure category diversity (max 3 per category)
    const seen: Record<string, number> = {};
    const picks: any[] = [];
    for (const p of scored) {
      const cat = p.category || "Other";
      if ((seen[cat] || 0) >= 3) continue;
      seen[cat] = (seen[cat] || 0) + 1;
      picks.push(p);
      if (picks.length >= 10) break;
    }

    setRecommended(picks);
  }, [location.city, allProducts, refreshKey]);

  const handleRefresh = () => {
    setJustRefreshed(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setJustRefreshed(false), 1000);
    rowRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

  const scroll = (dir: "left" | "right") => {
    rowRef.current?.scrollBy({ left: dir === "right" ? 240 : -240, behavior: "smooth" });
  };

  if (!loading && allProducts.length === 0) return null;

  return (
    <section>
      {/* ── Header card ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.city}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
          className={`rounded-2xl bg-gradient-to-r ${profile.accentColor} p-4 mb-4 relative overflow-hidden`}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: `${60 + i * 30}px`,
                  height: `${60 + i * 30}px`,
                  top: `${-20 + i * 10}%`,
                  right: `${-5 + i * 8}%`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Location pill */}
              <div className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm rounded-full px-3 py-1 mb-2">
                <MapPin size={11} className="text-white shrink-0" />
                <span className="text-white text-[11px] font-bold tracking-wide">
                  {location.city}
                  {location.pincode ? ` · ${location.pincode}` : ""}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-0.5">
                <Sparkles size={15} className="text-white/90 shrink-0" />
                <h2 className="text-white font-extrabold text-base leading-tight">
                  Recommended Near You
                </h2>
              </div>

              <p className="text-white/80 text-[11px] font-medium leading-snug">
                {profile.emoji} {profile.tagline}
              </p>

              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">
                  {profile.region} picks
                </span>
                <span className="text-white/40 text-[10px]">·</span>
                <span className="text-white/60 text-[10px] font-medium">
                  {recommended.length} products matched
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Refresh */}
              <button
                onClick={handleRefresh}
                title="Refresh picks"
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
              >
                <motion.div
                  animate={justRefreshed ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <RefreshCw size={14} className="text-white" />
                </motion.div>
              </button>

              {/* See all */}
              <Link
                href={`/products?category=${profile.preferredCategories[0]}`}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
              >
                See all
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* Category pills */}
          <div className="relative z-10 flex gap-1.5 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
            {profile.preferredCategories.map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${cat}`}
                className="shrink-0 bg-white/20 hover:bg-white/35 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full transition whitespace-nowrap border border-white/20"
              >
                {cat}
              </Link>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Product scroll row ──────────────────────────────────────────── */}
      <div className="relative group/row">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-200 opacity-0 group-hover/row:opacity-100 transition"
        >
          <ChevronLeft size={18} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${location.city}-${refreshKey}`}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.3 }}
            ref={rowRef}
            className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
          >
            {loading
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className="shrink-0 w-40 md:w-48">
                    <ProductCardSkeleton />
                  </div>
                ))
              : recommended.map((p) => (
                  <div key={p.id} className="shrink-0 w-40 md:w-48">
                    <ProductCard
                      id={p.id}
                      name={p.name}
                      price={p.price}
                      image={p.image}
                      unit={p.unit}
                      category={p.category}
                      stock={p.stock}
                      originalPrice={
                        p.price > 40
                          ? Math.round(p.price * (1.15 + Math.random() * 0.15))
                          : undefined
                      }
                    />
                  </div>
                ))}
          </motion.div>
        </AnimatePresence>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-200 opacity-0 group-hover/row:opacity-100 transition"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── "Not your city?" nudge ──────────────────────────────────────── */}
      {!loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-[11px] text-gray-400 mt-3"
        >
          Showing picks for{" "}
          <span className={`font-semibold ${profile.accentText}`}>
            {location.city}
          </span>
          {" "}·{" "}
          <button
            onClick={() => {
              // Dispatch a custom event to open the location modal in Navbar
              window.dispatchEvent(new CustomEvent("farmx:openLocation"));
            }}
            className={`font-semibold ${profile.accentText} hover:underline`}
          >
            Change location
          </button>
        </motion.p>
      )}
    </section>
  );
}