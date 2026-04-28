"use client";

import { use } from "react";
import { products } from "@/lib/data";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProductDetails({ params }: Props) {
  const { id } = use(params);

  const product = products.find((p) => p.id === id);

  const { addToCart } = useCart();

  if (!product) {
    return <div className="p-10">Product not found</div>;
  }

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid md:grid-cols-2 gap-10 bg-white p-6 rounded-2xl shadow">

          {/* IMAGE */}
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-[350px] object-cover rounded-xl"
          />

          {/* DETAILS */}
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>

            <p className="text-green-600 text-2xl font-bold mt-3">
              ₹{product.price}
            </p>

            <div className="mt-3 text-yellow-500">
              ⭐⭐⭐⭐☆
            </div>

            <p className="mt-4 text-gray-600">
              {product.description}
            </p>

            {/* ADD TO CART */}
            <button
              onClick={() =>
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  quantity: 1,
                })
              }
              className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >
              Add to Cart 🛒
            </button>
          </div>

        </div>
      </main>
    </>
  );
}