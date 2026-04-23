"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { emitAddToCart } from "@/lib/cartEvent";
import { Heart, ShoppingCart, Star, Zap } from "lucide-react";
import { useState } from "react";
import LoginModal from "@/components/LoginModal";

type Props = {
  id: string;
  name: string;
  price: number;
  image: string;
  unit?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  originalPrice?: number; // if set, shows discount badge
  isFeatured?: boolean;
};

// ── Skeleton loader ────────────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-3 space-y-2.5">
        <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        <div className="h-4 bg-gray-100 rounded-full w-1/3" />
        <div className="h-8 bg-gray-100 rounded-xl mt-3" />
      </div>
    </div>
  );
}

// ── Main card ──────────────────────────────────────────────────────────────────
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
}: Props) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const wishlisted = isWishlisted(id);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Compute discount percentage
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (wishlisted) {
      removeFromWishlist(id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({ id, name, price, image });
      toast.success("Saved to wishlist ❤️");
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
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
    setTimeout(() => setAdding(false), 800);
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl shadow-sm hover:shadow-lg overflow-hidden flex flex-col group border border-gray-100 transition-shadow duration-200"
      >
        {/* ── IMAGE SECTION ──────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gray-50">
          <Link href={`/product/${id}`} className="block">
            <motion.img
              src={imgError ? "https://placehold.co/300x220/f3f4f6/9ca3af?text=No+Image" : image}
              alt={name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-44 object-cover transition-transform duration-400 group-hover:scale-105"
            />
          </Link>

          {/* Discount badge */}
          {discount && (
            <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-0.5">
              <Zap size={9} className="fill-white" />
              {discount}% OFF
            </div>
          )}

          {/* Featured badge */}
          {isFeatured && !discount && (
            <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              FRESH PICK
            </div>
          )}

          {/* Category chip */}
          {category && (
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-green-100 shadow-sm">
              {category}
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all duration-200 ${
              wishlisted
                ? "bg-red-500 text-white scale-110"
                : "bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:scale-110"
            }`}
          >
            <Heart
              size={15}
              strokeWidth={2}
              fill={wishlisted ? "currentColor" : "none"}
            />
          </button>
        </div>

        {/* ── CONTENT SECTION ────────────────────────────────────────── */}
        <div className="p-3 flex flex-col flex-1">
          {/* Name */}
          <Link href={`/product/${id}`}>
            <h3 className="text-sm font-semibold text-gray-800 hover:text-green-700 transition line-clamp-2 leading-snug mb-1">
              {name}
            </h3>
          </Link>

          {/* Rating row */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              <span>{rating.toFixed(1)}</span>
              <Star size={8} className="fill-white" />
            </div>
            {reviewCount && (
              <span className="text-[10px] text-gray-400">({reviewCount})</span>
            )}
          </div>

          {/* Price row */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-extrabold text-gray-900">
              ₹{price}
              {unit && (
                <span className="text-xs font-normal text-gray-400"> /{unit}</span>
              )}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-gray-400 line-through">
                ₹{originalPrice}
              </span>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Add to cart button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={adding}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              adding
                ? "bg-green-100 text-green-600 cursor-default"
                : "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm hover:shadow-md"
            }`}
          >
            <ShoppingCart size={14} strokeWidth={2.2} />
            {adding ? "Added ✓" : "Add to Cart"}
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