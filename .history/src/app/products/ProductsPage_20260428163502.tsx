"use client";

import Image from "next/image";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import Link from "next/link";
import type { Product } from "@/types";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ShoppingCart,
  Heart,
  Star,
  ChevronLeft,
  ArrowUp,
  Loader2,
  CheckCircle2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "All",
  "Vegetables",
  "Fruits",
  "Grains",
  "Dairy",
  "Spices",
  "Herbs",
  "Pulses",
  "Organic",
];

const SORT_OPTIONS = [
  { label: "Relevance", value: "relevance" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest First", value: "newest" },
  { label: "Discount", value: "discount" },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="w-full pt-[75%] bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-2.5 bg-gray-200 rounded w-1/2" />
        <div className="h-2.5 bg-gray-200 rounded w-2/3" />
        <div className="h-8 bg-gray-200 rounded-xl w-full mt-2" />
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  onAddToCart,
  wishlisted,
  onWishlist,
  index,
  priority = false,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  wishlisted: boolean;
  onWishlist: (p: Product) => void;
  index: number;
  priority?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : null;

  const rating = product.avgRating?.toFixed(1) ?? product.rating?.toFixed(1) ?? "4.2";
  const reviews = product.reviewCount ?? undefined;

  const isOutOfStock = product.stock !== undefined && product.stock === 0;

  const handleCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isOutOfStock) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 500);
    setAdding(true);
    onAddToCart(product);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min((index % 8) * 0.05, 0.3),
        ease: "easeOut",
      }}
    >
      <Link href={`/product/${product.id}`} className="block group">
        <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] flex flex-col">
          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onWishlist(product);
            }}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <Heart
              size={13}
              className={
                wishlisted ? "fill-red-500 text-red-500" : "text-gray-300"
              }
            />
          </button>

          {/* Discount badge */}
          {discount && (
            <span className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
              -{discount}% OFF
            </span>
          )}

          {/* Image */}
          <div className="relative w-full pt-[75%] bg-gradient-to-br from-green-50 to-gray-100 overflow-hidden">
            <Image
              src={
                product.image ||
                "https://placehold.co/300x225/e8f5e9/2e7d32?text=🌱"
              }
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
                isOutOfStock ? "opacity-40 grayscale" : ""
              }`}
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/300x225/e8f5e9/2e7d32?text=🌱";
              }}
            />
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-gray-800/75 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide uppercase">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-2.5 flex flex-col flex-1">
            {product.category && (
              <span className="text-[9px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full w-fit mb-1 uppercase tracking-wide">
                {product.category}
              </span>
            )}

            <p className="text-gray-800 font-semibold text-sm leading-snug line-clamp-2 flex-1">
              {product.name}
            </p>

            <div className="flex items-center gap-1 mt-1">
              <span className="flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                {rating} <Star size={7} className="fill-white" />
              </span>
              <span className="text-gray-400 text-[10px]">{reviews !== undefined ? `(${reviews})` : "· Verified"}</span>
            </div>

            <div className="mt-1.5">
              <span className="text-green-700 font-extrabold text-base">
                ₹{product.price}
              </span>
              <span className="text-gray-400 text-[10px] ml-0.5">
                /{product.unit ?? "kg"}
              </span>
              <span className={`text-gray-400 text-[10px] line-through ml-1.5 ${product.originalPrice ? "visible" : "invisible"}`}>
                {product.originalPrice ? `₹${product.originalPrice}` : "⁠"}
              </span>
            </div>

            {/* Farmer row — single fixed-height line, never empty, never wraps */}
            <div className="h-[18px] flex items-center mt-0.5 overflow-hidden">
              {product.farmerVerified ? (
                <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full min-w-0">
                  <svg className="w-2 h-2 text-green-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">{product.farmerName ?? "Verified Farmer"}</span>
                </span>
              ) : product.farmerName ? (
                <p className="text-gray-400 text-[9px] truncate">🧑‍🌾 {product.farmerName}</p>
              ) : (
                <p className="text-gray-400 text-[9px]">🌿 Farm Fresh</p>
              )}
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleCart}
              disabled={adding || isOutOfStock}
              className={`relative mt-2 w-full text-white text-xs font-bold py-2 rounded-xl overflow-hidden transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 ${
                isOutOfStock
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {ripple && (
                <span
                  className="absolute rounded-full bg-white/30 animate-ping"
                  style={{
                    width: 60,
                    height: 60,
                    top: ripple.y - 30,
                    left: ripple.x - 30,
                    pointerEvents: "none",
                  }}
                />
              )}
              {isOutOfStock ? (
                "Out of Stock"
              ) : (
                <>
                  <ShoppingCart size={13} />
                  {adding ? "Adding..." : "Add to Cart"}
                </>
              )}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Filter Drawer (mobile) ───────────────────────────────────────────────────
function FilterDrawer({
  open,
  onClose,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
  priceRange: [number, number];
  onPriceChange: (r: [number, number]) => void;
  onReset: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-5 max-h-[75vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-base">Filters</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="text-green-600 text-sm font-semibold"
            >
              Reset
            </button>
            <button onClick={onClose}>
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
          Category
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                selectedCategory === cat
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
          Max Price: ₹{priceRange[1]}
        </p>
        <input
          type="range"
          min={0}
          max={1000}
          step={10}
          value={priceRange[1]}
          onChange={(e) =>
            onPriceChange([priceRange[0], Number(e.target.value)])
          }
          className="w-full accent-green-600 mb-5"
        />

        <button
          onClick={onClose}
          className="w-full bg-green-600 text-white font-bold py-3 rounded-xl"
        >
          Apply Filters
        </button>
      </div>
    </>
  );
}

// ─── Infinite scroll sentinel ─────────────────────────────────────────────────
function InfiniteScrollSentinel({
  onIntersect,
  enabled,
}: {
  onIntersect: () => void;
  enabled: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      // Fire when the sentinel enters the bottom 200 px of the viewport
      { rootMargin: "0px 0px 200px 0px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect, enabled]);

  return <div ref={ref} className="h-1 w-full" aria-hidden />;
}

// ─── Scroll-to-top button ─────────────────────────────────────────────────────
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-4 z-40 w-11 h-11 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── Loading spinner row ──────────────────────────────────────────────────────
function LoadingRow() {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-green-600">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm font-medium">Loading more products…</span>
    </div>
  );
}

// ─── End of results banner ────────────────────────────────────────────────────
function EndBanner({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2 py-8 text-center"
    >
      <CheckCircle2 size={28} className="text-green-400" />
      <p className="text-sm font-semibold text-gray-500">
        You've seen all {count} products 🌱
      </p>
      <p className="text-xs text-gray-400">
        Check back soon for fresh arrivals from our farmers
      </p>
    </motion.div>
  );
}

// ─── Page size ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 12;

// ─── Inner Page ───────────────────────────────────────────────────────────────
function ProductsInner() {
  const searchParams = useSearchParams();
  const { addToCart, cart } = useCart();
  const cartCount = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  // Prevent double-fires from the sentinel
  const isFetchingRef = useRef(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category")
      ? searchParams.get("category")!.charAt(0).toUpperCase() +
          searchParams.get("category")!.slice(1)
      : "All"
  );
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // ── Core fetch ────────────────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (existingCursor: QueryDocumentSnapshot<DocumentData> | null) => {
      try {
        const constraints: Parameters<typeof query>[1][] = [
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE),
        ];
        if (existingCursor) {
          constraints.push(startAfter(existingCursor));
        }

        const snap = await getDocs(
          query(collection(db, "products"), ...constraints)
        );

        const newDocs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          originalPrice: d.data().originalPrice ?? undefined,
          stock: d.data().stock,
        })) as Product[];

        setProducts((prev) =>
          existingCursor ? [...prev, ...newDocs] : newDocs
        );
        setHasMore(snap.docs.length === PAGE_SIZE);
        setCursor(snap.docs[snap.docs.length - 1] ?? null);
      } catch (err) {
        console.error("Products fetch error:", err);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setCursor(null);
      setHasMore(true);
      setProducts([]);
      isFetchingRef.current = false;
      await fetchPage(null);
      setLoading(false);
    };
    init();
  }, [fetchPage]);

  // ── Infinite scroll trigger ───────────────────────────────────────────────
  const handleSentinelIntersect = useCallback(async () => {
    // Guard: don't double-fire, don't fire if no more pages
    if (isFetchingRef.current || !hasMore || loadingMore) return;

    isFetchingRef.current = true;
    setLoadingMore(true);

    // We capture cursor inside this callback; it's stable because fetchPage
    // uses the function-update form of setProducts which doesn't need cursor
    // in its deps — but we do need cursor here to pass to fetchPage.
    // So we read it from a ref kept in sync below.
    await fetchPage(cursorRef.current);

    setLoadingMore(false);
    isFetchingRef.current = false;
  }, [hasMore, loadingMore, fetchPage]);

  // Keep a ref in sync so the callback above always reads the latest cursor
  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  // ── Cart / wishlist helpers ───────────────────────────────────────────────
  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  };

  const isWishlisted = (id: string) =>
    wishlist?.some((w) => w.id === id) ?? false;

  const handleWishlist = (product: Product) => {
    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist ❤️");
    }
  };

  // ── Filter + Sort (client-side on loaded products) ───────────────────────
  const filtered = products
    .filter((p) => {
      const matchSearch =
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCategory === "All" ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchPrice =
        p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchSearch && matchCat && matchPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "newest") {
        const ta =
          (a.createdAt as any)?.toMillis?.() ??
          (a.createdAt?.seconds != null ? a.createdAt.seconds * 1000 : 0);
        const tb =
          (b.createdAt as any)?.toMillis?.() ??
          (b.createdAt?.seconds != null ? b.createdAt.seconds * 1000 : 0);
        return tb - ta;
      }
      if (sortBy === "discount") {
        const da = a.originalPrice ? a.originalPrice - a.price : 0;
        const db_ = b.originalPrice ? b.originalPrice - b.price : 0;
        return db_ - da;
      }
      return 0;
    });

  const resetFilters = () => {
    setSelectedCategory("All");
    setPriceRange([0, 1000]);
    setSearch("");
  };

  const activeFiltersCount =
    (selectedCategory !== "All" ? 1 : 0) + (priceRange[1] < 1000 ? 1 : 0);

  // Sentinel is active only when: not initial loading, there are products,
  // and there are more pages to load
  // Use products.length (raw loaded count) so sentinel fires even when
  // active filters reduce the visible set to zero but more DB pages exist.
  const sentinelEnabled = !loading && hasMore && products.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-green-700">
          <Link href="/" className="text-white flex-shrink-0">
            <ChevronLeft size={22} />
          </Link>
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-2">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search vegetables, fruits, grains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
          <Link href="/cart" className="relative flex-shrink-0 text-white">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-orange-400 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center px-0.5">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Filter / Sort bar */}
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none">
          {/* Filter button */}
          <button
            onClick={() => setShowFilterDrawer(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold flex-shrink-0 transition-all ${
              activeFiltersCount > 0
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            <SlidersHorizontal size={12} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-white text-green-700 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <div className="relative flex-shrink-0">
            <button
              id="sort-btn"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                sortBy !== "relevance"
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort"}
              <ChevronDown size={12} />
            </button>
            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSortDropdown(false)}
                />
                <div
                  className="fixed left-3 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 min-w-[180px] overflow-hidden"
                  style={{
                    top: (() => {
                      if (typeof window === "undefined") return 100;
                      const btn = document.getElementById("sort-btn");
                      if (!btn) return 100;
                      return btn.getBoundingClientRect().bottom + 6;
                    })(),
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs font-medium transition-colors flex items-center justify-between ${
                        sortBy === opt.value
                          ? "bg-green-50 text-green-700 font-bold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                      {sortBy === opt.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Category pills */}
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 transition-all ${
                selectedCategory === cat
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {loading ? (
            "Loading…"
          ) : (
            <>
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              {hasMore ? "+" : ""} found
            </>
          )}
        </p>
        {(search || selectedCategory !== "All" || priceRange[1] < 1000) && (
          <button
            onClick={resetFilters}
            className="text-xs text-green-600 font-semibold flex items-center gap-1"
          >
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      {/* ── Product grid ──────────────────────────────────────────────────── */}
      <div className="px-3 md:px-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-8">
              {selectedCategory !== "All" && !search ? (
                <svg
                  width="180"
                  height="160"
                  viewBox="0 0 180 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="90" cy="82" r="68" fill="#fef2f2" />
                  <rect
                    x="55"
                    y="55"
                    width="70"
                    height="55"
                    rx="8"
                    fill="white"
                    stroke="#fca5a5"
                    strokeWidth="3"
                  />
                  <rect
                    x="55"
                    y="55"
                    width="70"
                    height="18"
                    rx="8"
                    fill="#fee2e2"
                  />
                  <line
                    x1="70"
                    y1="85"
                    x2="110"
                    y2="85"
                    stroke="#fca5a5"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <line
                    x1="70"
                    y1="96"
                    x2="95"
                    y2="96"
                    stroke="#fca5a5"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  width="180"
                  height="160"
                  viewBox="0 0 180 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="90" cy="82" r="68" fill="#f0fdf4" />
                  <circle
                    cx="82"
                    cy="74"
                    r="30"
                    fill="white"
                    stroke="#86efac"
                    strokeWidth="3"
                  />
                  <circle cx="82" cy="74" r="22" fill="#dcfce7" />
                  <text
                    x="82"
                    y="82"
                    textAnchor="middle"
                    fontSize="22"
                    fill="#34d399"
                    fontWeight="bold"
                  >
                    ?
                  </text>
                  <line
                    x1="105"
                    y1="97"
                    x2="122"
                    y2="114"
                    stroke="#86efac"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            {selectedCategory !== "All" && !search ? (
              <>
                <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                  🚫 Out of Stock
                </span>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedCategory} Unavailable
                </h3>
                <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
                  No{" "}
                  <span className="font-semibold text-gray-600">
                    {selectedCategory}
                  </span>{" "}
                  products are currently available. Check back soon or browse
                  other categories.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  No products found
                </h3>
                <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
                  We couldn't find what you're looking for. Try adjusting your
                  filters or browse all fresh produce.
                </p>
              </>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={resetFilters}
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-sm"
              >
                🔄 Clear Filters
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700 px-8 py-3 rounded-2xl font-semibold transition-all"
              >
                🌱 Browse All Products
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ── Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    onAddToCart={handleAddToCart}
                    wishlisted={isWishlisted(product.id)}
                    onWishlist={handleWishlist}
                    priority={i === 0}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* ── Loading more skeletons (appear below existing grid) ── */}
            {loadingMore && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductSkeleton key={`more-${i}`} />
                ))}
              </div>
            )}

            {/* ── Spinner row ── */}
            {loadingMore && <LoadingRow />}

            {/* ── Invisible sentinel — triggers next page when scrolled into view ── */}
            <InfiniteScrollSentinel
              onIntersect={handleSentinelIntersect}
              enabled={sentinelEnabled && !loadingMore}
            />

            {/* ── End of results banner ── */}
            {!hasMore && products.length > 0 && (
              <EndBanner count={products.length} />
            )}
          </>
        )}
      </div>

      {/* ── Scroll-to-top FAB ─────────────────────────────────────────────── */}
      <ScrollToTopButton />

      {/* ── Mobile Filter Drawer ──────────────────────────────────────────── */}
      <FilterDrawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        priceRange={priceRange}
        onPriceChange={setPriceRange}
        onReset={resetFilters}
      />

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
          Loading...
        </div>
      }
    >
      <ProductsInner />
    </Suspense>
  );
}