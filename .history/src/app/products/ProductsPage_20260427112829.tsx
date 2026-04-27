"use client";

import Image from "next/image";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
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
  farmerVerified?: boolean;
  unit?: string;
  stock?: number;
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
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? "opacity-40 grayscale" : ""}`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/300x225/e8f5e9/2e7d32?text=🌱";
            }}
          />
          {/* Out of stock overlay */}
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

          {product.farmerVerified && (
            <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full w-fit mt-0.5">
              <svg className="w-2 h-2 text-green-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified Farmer
            </span>
          )}

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

// ─── Pagination config ────────────────────────────────────────────────────────
const PAGE_SIZE = 12; // products per page

// ─── Inner Page (uses useSearchParams) ────────────────────────────────────────
function ProductsInner() {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // cursor holds the last Firestore document snapshot for startAfter()
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

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

  // ── Core fetch: loads one page. Pass existingCursor=null for first page. ──
  const fetchPage = useCallback(
    async (existingCursor: QueryDocumentSnapshot<DocumentData> | null) => {
      try {
        // Build the base query — always order by createdAt desc for stable
        // cursor-based pagination. Client-side sorting handles the rest.
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

        const newDocs = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          originalPrice:
            doc.data().originalPrice ??
            Math.round(doc.data().price * (1.1 + Math.random() * 0.3)),
          stock: doc.data().stock,
        })) as Product[];

        setProducts((prev) =>
          existingCursor ? [...prev, ...newDocs] : newDocs
        );

        // If we got fewer docs than PAGE_SIZE, there are no more pages
        setHasMore(snap.docs.length === PAGE_SIZE);

        // Save the last doc as the next cursor
        const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
        setCursor(lastDoc);
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
      await fetchPage(null);
      setLoading(false);
    };
    init();
  }, [fetchPage]);

  // Load more handler (called by "Load More" button)
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPage(cursor);
    setLoadingMore(false);
  };

  // Cart helper — maps Product to CartItem (adds required quantity field)
  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  };

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
          {loading
            ? "Loading..."
            : `${filtered.length} products${hasMore ? "+" : ""} found`}
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
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {/* Illustration */}
            <div className="relative mb-8">
              {/* Out of stock: show empty box icon; search miss: show ? icon */}
              {selectedCategory !== "All" && !search ? (
                <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="90" cy="82" r="68" fill="#fef2f2"/>
                  <rect x="55" y="55" width="70" height="55" rx="8" fill="white" stroke="#fca5a5" strokeWidth="3"/>
                  <rect x="55" y="55" width="70" height="18" rx="8" fill="#fee2e2"/>
                  <line x1="70" y1="85" x2="110" y2="85" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="70" y1="96" x2="95" y2="96" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="38" cy="55" r="3" fill="#fde68a"/>
                  <circle cx="145" cy="50" r="2.5" fill="#fca5a5"/>
                  <path d="M38 35 L39.5 39 L43 39 L40.5 41.5 L41.5 45 L38 43 L34.5 45 L35.5 41.5 L33 39 L36.5 39Z" fill="#fde68a"/>
                </svg>
              ) : (
                <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="90" cy="82" r="68" fill="#f0fdf4"/>
                  <circle cx="82" cy="74" r="30" fill="white" stroke="#86efac" strokeWidth="3"/>
                  <circle cx="82" cy="74" r="22" fill="#dcfce7"/>
                  <text x="82" y="82" textAnchor="middle" fontSize="22" fill="#34d399" fontWeight="bold">?</text>
                  <line x1="105" y1="97" x2="122" y2="114" stroke="#86efac" strokeWidth="5" strokeLinecap="round"/>
                  <circle cx="38" cy="55" r="3" fill="#fde68a"/>
                  <circle cx="145" cy="50" r="2.5" fill="#fca5a5"/>
                  <circle cx="36" cy="105" r="2" fill="#86efac"/>
                  <circle cx="148" cy="100" r="3" fill="#a7f3d0"/>
                  <path d="M38 35 L39.5 39 L43 39 L40.5 41.5 L41.5 45 L38 43 L34.5 45 L35.5 41.5 L33 39 L36.5 39Z" fill="#fde68a"/>
                  <path d="M144 34 L145 37 L148 37 L145.5 39 L146.5 42 L144 40.5 L141.5 42 L142.5 39 L140 37 L143 37Z" fill="#bbf7d0"/>
                </svg>
              )}
            </div>
            {selectedCategory !== "All" && !search ? (
              <>
                <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                  🚫 Out of Stock
                </span>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedCategory} Unavailable</h3>
                <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
                  No <span className="font-semibold text-gray-600">{selectedCategory}</span> products are currently available. Check back soon or browse other categories.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
                  We couldn't find what you're looking for. Try adjusting your filters or browse all fresh produce.
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  wishlisted={isWishlisted(product.id)}
                  onWishlist={handleWishlist}
                />
              ))}
            </div>

            {/* ── Load More ── */}
            {hasMore && (
              <div className="flex justify-center mt-6 mb-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-8 py-3 bg-white border border-green-600 text-green-700 font-bold text-sm rounded-2xl hover:bg-green-50 transition-all active:scale-95 disabled:opacity-60 shadow-sm"
                >
                  {loadingMore ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    <>Load more products</>
                  )}
                </button>
              </div>
            )}

            {/* ── End of results ── */}
            {!hasMore && products.length > PAGE_SIZE && (
              <p className="text-center text-xs text-gray-400 mt-6 mb-2">
                You've seen all {products.length} products 🌱
              </p>
            )}

            {/* Loading more skeletons */}
            {loadingMore && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductSkeleton key={`more-${i}`} />
                ))}
              </div>
            )}
          </>
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
export function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>}>
      <ProductsInner />
    </Suspense>
  );
}