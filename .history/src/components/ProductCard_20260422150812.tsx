"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { emitAddToCart } from "@/lib/cartEvent";
import { Heart } from "lucide-react";

type Props = {
  id: string;
  name: string;
  price: number;
  image: string;
  unit?: string;
  category?: string;
};

const ProductCard = ({ id, name, price, image, unit, category }: Props) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (wishlisted) {
      removeFromWishlist(id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({ id, name, price, image });
      toast.success("Added to wishlist ❤️");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden flex flex-col"
    >
      {/* IMAGE */}
      <div className="relative overflow-hidden">
        <Link href={`/product/${id}`}>
          <motion.img
            src={image}
            alt={name}
            className="h-44 w-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.3 }}
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/300x200?text=Product";
            }}
          />
        </Link>

        {/* CATEGORY BADGE */}
        {category && (
          <span className="absolute top-2 left-2 bg-white/90 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
            {category}
          </span>
        )}

        {/* WISHLIST HEART */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2 right-2 p-2 rounded-full shadow transition ${
            wishlisted
              ? "bg-red-500 text-white"
              : "bg-white/90 text-gray-400 hover:text-red-500"
          }`}
        >
          <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/product/${id}`}>
          <h3 className="font-semibold text-gray-800 hover:text-green-700 transition line-clamp-2">
            {name}
          </h3>
        </Link>

        <p className="text-green-600 font-bold text-lg mt-1">
          ₹{price}
          {unit && (
            <span className="text-xs font-normal text-gray-400"> / {unit}</span>
          )}
        </p>

        {/* SPACER to push button to bottom */}
        <div className="flex-1" />

        {/* ADD TO CART */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            addToCart({ id, name, price, image, quantity: 1 });
            emitAddToCart({ image });
          }}
          className="mt-4 w-full bg-green-600 cursor-pointer hover:bg-green-700 text-white py-2 rounded-xl transition font-medium text-sm"
        >
          Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
