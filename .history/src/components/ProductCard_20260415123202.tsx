"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { emitAddToCart } from "@/lib/cartEvent";

type Props = {
  id: string;
  name: string;
  price: number;
  image: string;
};

const ProductCard = ({ id, name, price, image }: Props) => {
  const { addToCart } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden"
    >
      {/* PRODUCT LINK */}
      <Link href={`/product/${id}`}>
        <div className="overflow-hidden">
          <motion.img
            src={image}
            alt={name}
            className="h-44 w-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </Link>

      {/* CONTENT */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800">{name}</h3>

        <p className="text-green-600 font-bold text-lg mt-1">
          ₹{price}
        </p>

        {/* ADD TO CART */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            addToCart({
              id,
              name,
              price,
              image,
              quantity: 1,
            });

            // 🔔 Toast
            toast.success("Added to cart 🛒");

            // 🎯 Trigger animation event
            emitAddToCart({ image });
          }}
          className="mt-4 w-full bg-green-600 cursor-hover:bg-green-700 text-white py-2 rounded-xl transition"
        >
          Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;