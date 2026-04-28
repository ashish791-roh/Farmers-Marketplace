"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ShoppingCart,
  Heart,
  Star,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  farmerId?: string;
  farmerName?: string;
  unit?: string;
  createdAt?: any;
}

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
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  wishlisted: boolean;
  onWishlist: (p: Product) => void;
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

  const rating = (3.5 + Math.random() * 1.4).toFixed(1);
  const reviews = Math.floor(Math.random() * 200 + 30);

  const handleCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 500);
    setAdding(true);
    onAddToCart(product);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <Link href={`/products/${product.id}`} className="block group">
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
          <img
            src={
              product.image ||
              "https://placehold.co/300x225/e8f5e9/2e7d32?text=🌱"
            }
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/300x225/e8f5e9/2e7d32?text=🌱";
            }}
          />
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
            <span className="text-gray-400 text-[10px]">({reviews})</span>
          </div>

          <div className="mt-1.5">
            <span className="text-green-700 font-extrabold text-base">
              ₹{product.price}
            </span>
            <span className="text-gray-400 text-[10px] ml-0.5">
              /{product.unit ?? "kg"}
            </span>
            {product.originalPrice && (
              <span className="text-gray-400 text-[10px] line-through ml-1.5">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {product.farmerName && (
            <p className="text-gray-400 text-[10px] mt-0.5 truncate">
              by {product.farmerName}
            </p>
          )}

          {/* Add to Cart */}
          <button
            onClick={handleCart}
            className="relative mt-2 w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-xl overflow-hidden transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5"
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
            <ShoppingCart size={13} />
            {adding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      {/* Drawer */}
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

        {/* Category */}
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

        {/* Price range */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
          Max Price: ₹{priceRange[1]}
        </p>
        <input
          type="range"
          min={0}
          max={1000}
          step={10}
          value={priceRange[1]}
          onChange={(e) => onPriceChange([priceRange[0], Number(e.target.value)])}
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

// ─── Inner Page (uses useSearchParams) ────────────────────────────────────────
function ProductsInner() {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch products
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, "products"), orderBy("createdAt", "desc"))
        );
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          originalPrice:
            doc.data().originalPrice ??
            Math.round(doc.data().price * (1.1 + Math.random() * 0.3)),
        })) as Product[];
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Wishlist helpers
  const isWishlisted = (id: string) =>
    wishlist?.some((w: any) => w.id === id) ?? false;

  const handleWishlist = (product: Product) => {
    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist ❤️");
    }
  };

  // Filter + Sort
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── Sticky Header (Navbar-free, self-contained) ─── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-green-700">
          <Link href="/" className="text-white flex-shrink-0">
            <ChevronLeft size={22} />
          </Link>
          {/* ── Single Search Bar ── */}
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
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 text-xs font-semibold"
            >
              Sort <ChevronDown size={12} />
            </button>
            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortDropdown(false)}
                />
                <div className="absolute left-0 top-8 z-20 bg-white rounded-xl shadow-xl border border-gray-100 min-w-[160px] overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                        sortBy === opt.value
                          ? "bg-green-50 text-green-700 font-bold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
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
          {loading ? "Loading..." : `${filtered.length} products found`}
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

      {/* Product grid */}
      <div className="px-3 md:px-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🌾</p>
            <h3 className="text-gray-700 font-bold text-lg">
              No products found
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your search or filters
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                wishlisted={isWishlisted(product.id)}
                onWishlist={handleWishlist}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
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

// ─── Page Export (Suspense wrapper for useSearchParams) ───────────────────────
export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>}>
      <ProductsInner />
    </Suspense>
  );
}