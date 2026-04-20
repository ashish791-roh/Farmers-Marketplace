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
};

const ProductCard = ({ id, name, price, image }: Props) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(id);

  const handleWishlist = () => {
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
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden"
    >
      {/* IMAGE */}
      <div className="relative overflow-hidden">
        <Link href={`/product/${id}`}>
          <motion.img
            src={image}
            alt={name}
            className="h-44 w-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
            onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/300x200?text=Product"; }}
          />
        </Link>
        {/* WISHLIST HEART */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 p-2 rounded-full shadow transition ${
            wishlisted ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-red-500"
          }`}
        >
          <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800">{name}</h3>

        <p className="text-green-600 font-bold text-lg mt-1">
          ₹{price}
        </p>

        {/* ADD TO CART */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            addToCart({
              id,
              name,
              price,
              image,
              quantity: 1,
            });

            //  animation trigger 
            const img = (e.currentTarget
              .closest("div")
              ?.querySelector("img") as HTMLImageElement);

            if (img) {
              const rect = img.getBoundingClientRect();
              emitAddToCart({ image });
            }
          }}
          className="mt-4 w-full bg-green-600 cursor-pointer hover:bg-green-700 text-white py-2 rounded-xl transition"
        >
          Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;