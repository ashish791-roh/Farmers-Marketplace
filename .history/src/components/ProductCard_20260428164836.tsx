"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { emitAddToCart } from "@/lib/cartEvent";
import { Heart, ShoppingCart, Star, Zap, Plus, Check, Leaf } from "lucide-react";
import { useState } from "react";
import LoginModal from "@/components/LoginModal";

type Props = {
  id: string;
  name: string;
  price: number;
  image?: string;
  unit?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  originalPrice?: number;
  isFeatured?: boolean;
  stock?: number;
  farmerVerified?: boolean;
  farmerName?: string;
  /** Pass true for the first above-the-fold card to boost LCP */
  priority?: boolean;
};

// ── Skeleton loader ────────────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-white/70 to-gray-100 animate-[shimmerSkeleton_1.5s_ease-in-out_infinite]" />
      </div>
      <div className="p-3 space-y-2.5">
        <div className="relative h-3.5 bg-gray-100 rounded-full w-4/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-white/70 to-gray-100 animate-[shimmerSkeleton_1.5s_0.1s_ease-in-out_infinite]" />
        </div>
        <div className="relative h-3 bg-gray-100 rounded-full w-1/2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-white/70 to-gray-100 animate-[shimmerSkeleton_1.5s_0.2s_ease-in-out_infinite]" />
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="relative h-5 bg-gray-100 rounded-full w-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-white/70 to-gray-100 animate-[shimmerSkeleton_1.5s_0.3s_ease-in-out_infinite]" />
          </div>
          <div className="relative h-4 bg-gray-100 rounded-full w-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-white/70 to-gray-100 animate-[shimmerSkeleton_1.5s_0.35s_ease-in-out_infinite]" />
          </div>
        </div>
        <div className="relative h-9 bg-gray-100 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-white/70 to-gray-100 animate-[shimmerSkeleton_1.5s_0.4s_ease-in-out_infinite]" />
        </div>
      </div>
      <style>{`
        @keyframes shimmerSkeleton {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .animate-\\[shimmerSkeleton_1\\.5s_ease-in-out_infinite\\],
        .animate-\\[shimmerSkeleton_1\\.5s_0\\.1s_ease-in-out_infinite\\],
        .animate-\\[shimmerSkeleton_1\\.5s_0\\.2s_ease-in-out_infinite\\],
        .animate-\\[shimmerSkeleton_1\\.5s_0\\.3s_ease-in-out_infinite\\],
        .animate-\\[shimmerSkeleton_1\\.5s_0\\.35s_ease-in-out_infinite\\],
        .animate-\\[shimmerSkeleton_1\\.5s_0\\.4s_ease-in-out_infinite\\] {
          background-size: 800px 100%;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}

// ── Category emoji map ────────────────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  Vegetables: "🥦",
  Fruits: "🍎",
  Dairy: "🥛",
  Organic: "🌿",
  Grains: "🌾",
  Other: "📦",
};

// ── Main Card ─────────────────────────────────────────────────────────────────
const ProductCard = ({
  id,
  name,
  price,
  image,
  unit,
  category,
  rating = 4.2,
  reviewCount,
  originalPrice,
  isFeatured,
  stock,
  farmerVerified,
  farmerName,
  priority = false,
}: Props) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const wishlisted = isWishlisted(id);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [wishlistPulse, setWishlistPulse] = useState(false);

  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  const isLowStock = stock !== undefined && stock > 0 && stock <= 5;
  const isOutOfStock = stock !== undefined && stock === 0;
  const savingsAmount =
    originalPrice && originalPrice > price ? originalPrice - price : null;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setWishlistPulse(true);
    setTimeout(() => setWishlistPulse(false), 400);
    if (wishlisted) {
      removeFromWishlist(id);
      toast("Removed from wishlist", { icon: "💔" });
    } else {
      addToWishlist({ id, name, price, image });
      toast.success("Saved to wishlist ❤️");
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    if (!user) {
      localStorage.setItem(
        "pendingCartItem",
        JSON.stringify({ id, name, price, image, quantity: 1 })
      );
      setShowLoginModal(true);
      return;
    }
    setAdding(true);
    addToCart({ id, name, price, image, quantity: 1 });
    emitAddToCart({ image });
    setTimeout(() => {
      setAdding(false);
      setAdded(true);
      toast.success(`${name} added to cart 🛒`);
      setTimeout(() => setAdded(false), 2000);
    }, 600);
  };

  const handleLoginSuccess = () => {
    const pending = localStorage.getItem("pendingCartItem");
    if (pending) {
      try {
        const item = JSON.parse(pending);
        addToCart(item);
        emitAddToCart({ image: item.image });
        localStorage.removeItem("pendingCartItem");
        toast.success(`${item.name} added to cart 🛒`);
      } catch {
        localStorage.removeItem("pendingCartItem");
      }
    }
  };

  const categoryEmoji = category ? CATEGORY_EMOJI[category] || "🌱" : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, transition: { duration: 0.18, ease: "easeOut" } }}
        transition={{ duration: 0.3 }}
        className={[
          "group relative bg-white rounded-2xl overflow-hidden flex flex-col",
          "border border-gray-100",
          "shadow-[0_2px_10px_rgba(0,0,0,0.06)]",
          "hover:shadow-[0_16px_40px_rgba(0,0,0,0.13)]",
          "hover:border-green-100",
          "transition-all duration-300",
          isOutOfStock ? "opacity-70" : "",
        ].join(" ")}
      >
        {/* ── IMAGE ZONE ────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-emerald-50/30">
          <Link href={`/product/${id}`} className="block">
            <div className="relative w-full h-44">
              <Image
                src={
                  imgError || !image
                    ? "https://placehold.co/300x220/f0fdf4/16a34a?text=%F0%9F%8C%BF"
                    : image
                }
                alt={name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                priority={priority}
                loading={priority ? "eager" : "lazy"}
                onError={() => setImgError(true)}
              />
            </div>
          </Link>

          {/* Subtle dark scrim on hover for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* ── BADGES — top left ── */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {discount && (
              <div className="flex items-center gap-0.5 bg-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-lg">
                <Zap size={8} className="fill-white shrink-0" />
                {discount}% OFF
              </div>
            )}
            {isFeatured && !discount && (
              <div className="flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-lg">
                <Leaf size={8} className="fill-white shrink-0" />
                FRESH PICK
              </div>
            )}
            {category === "Organic" && !isFeatured && !discount && (
              <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-lg">
                🌿 ORGANIC
              </div>
            )}
          </div>

          {/* ── WISHLIST — top right ── */}
          <motion.button
            onClick={handleWishlist}
            animate={wishlistPulse ? { scale: [1, 1.45, 0.9, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={[
              "absolute top-2 right-2 z-10 w-8 h-8 rounded-full",
              "flex items-center justify-center",
              "shadow-md backdrop-blur-sm",
              "cursor poin"
              "transition-all duration-200",
              wishlisted
                ? "bg-red-500 text-white"
                : "bg-white/90 text-gray-400 cursor-pointer hover:text-red-500 hover:bg-white hover:scale-110",
            ].join(" ")}
          >
            <Heart
              size={14}
              strokeWidth={2.5}
              fill={wishlisted ? "currentColor" : "none"}
            />
          </motion.button>

          {/* ── BOTTOM OVERLAYS ── */}
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between pointer-events-none z-10">
            {category && (
              <span className="bg-white/90 backdrop-blur-sm text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-green-100 shadow-sm">
                {categoryEmoji} {category}
              </span>
            )}
            {isLowStock && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                Only {stock} left!
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/55 backdrop-blur-[1.5px] flex items-center justify-center z-20">
              <span className="bg-gray-800/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                Out of Stock
              </span>
            </div>
          )}

          {/* ── QUICK ADD — slides up on desktop hover ── */}
          <div className="hidden md:block absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-30">
            <button
              onClick={handleAddToCart}
              disabled={adding || isOutOfStock}
              className={[
                "w-full py-2.5 flex items-center justify-center gap-1.5",
                "text-xs font-bold tracking-wide",
                "transition-all duration-200",
                isOutOfStock
                  ? "bg-gray-500/90 text-white cursor-not-allowed"
                  : added
                  ? "bg-green-600/95 text-white"
                  : "bg-green-600/95 hover:bg-green-700 text-white",
              ].join(" ")}
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span
                    key="done"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check size={13} strokeWidth={3} />
                    Added to Cart!
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Plus size={13} strokeWidth={3} />
                    Quick Add
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* ── CONTENT ZONE ──────────────────────────────────────────────── */}
        <div className="p-3 flex flex-col flex-1">

          {/* Product name */}
          <Link href={`/product/${id}`}>
            <h3 className="text-sm font-semibold text-gray-800 hover:text-green-700 transition-colors line-clamp-2 leading-snug mb-1.5">
              {name}
            </h3>
          </Link>

          {/* Farmer row — always one fixed line; shows verified badge + name when available,
               falls back to category tag, or a neutral "Farm Fresh" label so the slot
               is never empty and cards stay exactly the same height. */}
          <div className="flex items-center gap-1 mb-1.5 h-[18px] overflow-hidden">
            {farmerVerified ? (
              <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-0">
                <svg className="w-2.5 h-2.5 text-green-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="truncate">{farmerName ? `${farmerName}` : "Verified Farmer"}</span>
              </span>
            ) : farmerName ? (
              <span className="text-[10px] text-gray-400 truncate">🧑‍🌾 {farmerName}</span>
            ) : (
              <span className="text-[10px] text-gray-400">🌿 Farm Fresh</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-bold px-1.5 py-[2px] rounded">
              <span>{rating.toFixed(1)}</span>
              <Star size={7} className="fill-white" />
            </div>
            <span className="text-[10px] text-gray-400">
              {reviewCount ? `(${reviewCount})` : "· Verified"}
            </span>
          </div>

          {/* Price + savings — fixed height so all cards stay the same size */}
          <div className="h-10 flex flex-col justify-start mb-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-gray-900 tracking-tight">
                ₹{price}
                {unit && (
                  <span className="text-[11px] font-normal text-gray-400"> /{unit}</span>
                )}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-xs text-gray-400 line-through">₹{originalPrice}</span>
              )}
            </div>
            <p className={`text-[10px] font-bold text-green-600 ${savingsAmount ? "visible" : "invisible"}`}>
              {savingsAmount ? `You save ₹${savingsAmount} 🎉` : "⁠"}
            </p>
          </div>

          <div className="flex-1" />

          {/* ── ADD TO CART BUTTON ── */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAddToCart}
            disabled={adding || isOutOfStock}
            className={[
              "w-full flex items-center justify-center gap-1.5",
              "py-2.5 rounded-xl text-sm font-bold",
              "transition-all duration-200",
              isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : added
                ? "bg-green-600 text-white shadow-[0_4px_14px_rgba(22,163,74,0.4)]"
                : adding
                ? "bg-green-100 text-green-600 cursor-default"
                : "bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white shadow-sm hover:shadow-[0_4px_14px_rgba(22,163,74,0.35)]",
            ].join(" ")}
          >
            <AnimatePresence mode="wait">
              {isOutOfStock ? (
                <motion.span key="oos" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Out of Stock
                </motion.span>
              ) : added ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-1.5"
                >
                  <Check size={14} strokeWidth={3} />
                  Added!
                </motion.span>
              ) : adding ? (
                <motion.span
                  key="adding"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                    className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full"
                  />
                  Adding…
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-1.5"
                >
                  <ShoppingCart size={14} strokeWidth={2.2} />
                  Add to Cart
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default ProductCard;