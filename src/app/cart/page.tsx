"use client";

import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ShoppingCart, PackageOpen } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, updateQty } = useCart();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(false);
  }, []);

  const total =
    cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Loading Cart...</h1>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-green-700 flex items-center gap-2">
          <ShoppingCart size={28} /> Your Cart
        </h1>

        {!cart || cart.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
            <PackageOpen size={56} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-400 mt-2 mb-6">
              Add some fresh products from the marketplace
            </p>
            <Link
              href="/products"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row md:items-center justify-between border p-4 rounded-xl shadow-sm hover:shadow-md transition bg-white"
                >
                  <div className="flex items-center gap-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/64x64?text=Product";
                        }}
                      />
                    )}
                    <div>
                      <h2 className="font-semibold text-lg">{item.name}</h2>
                      <p className="text-gray-600 text-sm">₹{item.price} each</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 md:mt-0">
                    <button
                      onClick={() =>
                        updateQty(item.id, Math.max(1, item.quantity - 1))
                      }
                      className="w-9 h-9 bg-gray-100 rounded-xl hover:bg-gray-200 transition flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-medium w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-9 h-9 bg-gray-100 rounded-xl hover:bg-gray-200 transition flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-3 md:mt-0">
                    <span className="font-semibold text-green-700">
                      ₹{item.price * item.quantity}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-600 text-sm font-medium transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 border rounded-xl bg-green-50 flex justify-between items-center">
              <h2 className="text-xl font-bold">Total Amount</h2>
              <h2 className="text-2xl font-bold text-green-700">₹{total}</h2>
            </div>

            <button
              onClick={() => router.push("/checkout")}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition"
            >
              Proceed to Checkout
            </button>
          </>
        )}
      </div>
    </>
  );
}
