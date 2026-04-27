"use client";

import { useState } from "react";
import { ShoppingCart, Heart, Star } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  farmerId?: string;
  farmerName?: string;
  rating?: number;
  unit?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onWishlist?: (product: Product) => void;
  isWishlisted?: boolean;
  variant?: "grid" | "horizontal";
}

export default function ProductCard({
  product,
  onAddToCart,
  onWishlist,
  isWishlisted = false,
  variant = "grid",
}: ProductCardProps) {
  const [wished, setWished] = useState(isWishlisted);
  const [adding, setAdding] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : null;

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 500);

    setAdding(true);
    onAddToCart?.(product);
    setTimeout(() => setAdding(false), 600);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setWished(!wished);
    onWishlist?.(product);
    toast.success(wished ? "Removed from wishlist" : "Added to wishlist ❤️");
  };

  const stars = product.rating ?? (3.5 + Math.random() * 1.5);
  const reviewCount = Math.floor(Math.random() * 200 + 50);

  if (variant === "horizontal") {
    return (
      <Link href={`/products/${product.id}`} className="block">
        <div className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200 active:scale-98 min-w-[260px]">
          {/* Image */}
          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            <img
              src={product.image || "https://placehold.co/80x80/e8f5e9/2e7d32?text=🌱"}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/80x80/e8f5e9/2e7d32?text=🌱";
              }}
            />
            {discount && (
              <span className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                -{discount}%
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 font-semibold text-sm leading-tight truncate">
              {product.name}
            </p>
            {product.farmerName && (
              <p className="text-gray-400 text-[10px] mt-0.5">
                by {product.farmerName}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              <span className="text-[10px] text-gray-500">
                {stars.toFixed(1)} ({reviewCount})
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div>
                <span className="text-green-700 font-bold text-sm">
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <span className="text-gray-400 text-[10px] line-through ml-1">
                    ₹{product.originalPrice}
                  </span>
                )}
                <span className="text-gray-400 text-[10px] ml-0.5">
                  /{product.unit ?? "kg"}
                </span>
              </div>
              <button
                onClick={handleAddToCart}
                className="bg-green-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-green-700 transition-all active:scale-95"
              >
                + Cart
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <div className="relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 active:scale-98 flex flex-col">
        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <Heart
            size={14}
            className={wished ? "fill-red-500 text-red-500" : "text-gray-400"}
          />
        </button>

        {/* Discount badge */}
        {discount && (
          <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
            -{discount}% OFF
          </div>
        )}

        {/* Image */}
        <div className="relative w-full pt-[75%] bg-gradient-to-br from-green-50 to-gray-100 overflow-hidden">
          <img
            src={product.image || "https://placehold.co/300x225/e8f5e9/2e7d32?text=🌱"}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/300x225/e8f5e9/2e7d32?text=🌱";
            }}
          />
        </div>

        {/* Content */}
        <div className="p-2.5 flex flex-col flex-1">
          {/* Category chip */}
          {product.category && (
            <span className="text-[9px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full w-fit mb-1 uppercase tracking-wide">
              {product.category}
            </span>
          )}

          <p className="text-gray-800 font-semibold text-sm leading-snug line-clamp-2 flex-1">
            {product.name}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-bold px-1 py-0.5 rounded">
              <span>{stars.toFixed(1)}</span>
              <Star size={7} className="fill-white" />
            </div>
            <span className="text-gray-400 text-[10px]">({reviewCount})</span>
          </div>

          {/* Price row */}
          <div className="flex items-end justify-between mt-1.5">
            <div>
              <div className="text-green-700 font-extrabold text-base leading-none">
                ₹{product.price}
                <span className="text-gray-400 text-[10px] font-normal ml-0.5">
                  /{product.unit ?? "kg"}
                </span>
              </div>
              {product.originalPrice && (
                <span className="text-gray-400 text-[10px] line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart button with ripple */}
          <button
            onClick={handleAddToCart}
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