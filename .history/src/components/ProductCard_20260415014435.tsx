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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-3">
      <Link href={`/product/${id}`}>
        <img
          src={image}
          alt={name}
          className="h-40 w-full object-cover rounded-lg cursor-pointer hover:scale-105 transition duration-300 shadow-sm → hover:shadow-xl"
        />
      </Link>

      <div className="mt-3">
        <h3 className="text-sm font-semibold text-gray-800 ">
          {name}
        </h3>

        <p className="text-green-600 font-bold mt-1">
          ₹{price}
        </p>

        <button
          onClick={() =>
            addToCart({ id, name, price, image, quantity: 1 })
          }
          className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm hover:scale-105 transition duration-300 shadow-sm → hover:shadow-xl"
        >
          Add to Cart 🛒
        </button>
      </div>
    </div>
  );
};

export default ProductCard;