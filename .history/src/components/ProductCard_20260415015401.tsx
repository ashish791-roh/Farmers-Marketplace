"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { motion } from "framer-motion";

type Props = {
  id: string;
  name: string;
  price: number;
  image: string;
};

const ProductCard = ({ id, name, price, image }: Props) => {
  const addToCart = useCartStore((state) => state.addToCart);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden"
    >
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

      <div className="p-4">
        <h3 className="font-semibold text-gray-800">
          {name}
        </h3>

        <p className="text-green-600 font-bold text-lg mt-1">
          ₹{price}
        </p>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() =>
            addToCart({ id, name, price, image, quantity: 1 })
          }
          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-full"
        >
          Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;