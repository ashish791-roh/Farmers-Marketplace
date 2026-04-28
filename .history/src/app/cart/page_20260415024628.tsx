"use client";

import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { cart, removeFromCart, updateQty } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // small safety delay for hydration + firebase load
    setLoading(false);
  }, []);

  // 🧠 SAFE TOTAL CALCULATION
  const total = cart?.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  ) || 0;

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Loading Cart...</h1>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* 🛒 TITLE */}
      <h1 className="text-3xl font-bold mb-6 text-green-700">
        Your Cart 🛒
      </h1>

      {/* EMPTY STATE */}
      {(!cart || cart.length === 0) ? (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-600">
            Your cart is empty
          </h2>
          <p className="text-gray-400 mt-2">
            Add some fresh products from marketplace
          </p>
        </div>
      ) : (
        <>
          {/* CART ITEMS */}
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between border p-4 rounded-lg shadow-sm hover:shadow-md transition"
              >

                {/* PRODUCT INFO */}
                <div className="flex items-center gap-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}

                  <div>
                    <h2 className="font-semibold text-lg">
                      {item.name}
                    </h2>
                    <p className="text-gray-600">
                      ₹{item.price}
                    </p>
                  </div>
                </div>

                {/* QUANTITY CONTROLS */}
                <div className="flex items-center gap-3 mt-3 md:mt-0">

                  <button
                    onClick={() =>
                      updateQty(
                        item.id,
                        Math.max(1, item.quantity - 1)
                      )
                    }
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    -
                  </button>

                  <span className="font-medium">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      updateQty(item.id, item.quantity + 1)
                    }
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    +
                  </button>
                </div>

                {/* REMOVE BUTTON */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 mt-3 md:mt-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* TOTAL SECTION */}
          <div className="mt-8 p-5 border rounded-lg bg-green-50 flex justify-between items-center">

            <h2 className="text-xl font-bold">
              Total Amount
            </h2>

            <h2 className="text-2xl font-bold text-green-700">
              ₹{total}
            </h2>

          </div>

          {/* CHECKOUT BUTTON (UI ONLY FOR NOW) */}
          <button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition">
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
}