"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

type Props = {
  id: string;
  name: string;
  price: number;
  image: string;
};

const ProductCard = ({ id, name, price, image }: Props) => {
  const addToCart = useCartStore((state) => state.addToCart);

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition duration-300 overflow-hidden group">
      
      <Link href={`/product/${id}`}>
        <div className="overflow-hidden">
          <img
            src={image}
            alt={name}
            className="h-44 w-full object-cover group-hover:scale-105 transition duration-300"
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

        <button
          onClick={() =>
            addToCart({ id, name, price, image, quantity: 1 })
          }
          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-full transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;