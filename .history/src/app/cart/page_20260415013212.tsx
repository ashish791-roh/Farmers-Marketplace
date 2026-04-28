"use client";

import Navbar from "@/components/Navbar";
import { useCartStore } from "@/store/cartStore";

export default function CartPage() {
  const { cart, addToCart } = useCartStore();

  // remove item
  const removeItem = (id: string) => {
    useCartStore.setState((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    }));
  };

  // decrease quantity
  const decreaseQty = (id: string) => {
    useCartStore.setState((state) => ({
      cart: state.cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0),
    }));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <h1 className="text-3xl font-bold mb-6">Your Cart 🛒</h1>

        {cart.length === 0 ? (
          <p className="text-gray-500">Your cart is empty</p>
        ) : (
          <div className="space-y-6">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-6 bg-white p-4 rounded-xl shadow"
              >
                {/* Image */}
                <img
                  src={item.image}
                  className="w-24 h-24 object-cover rounded"
                />

                {/* Info */}
                <div className="flex-1">
                  <h2 className="font-semibold">{item.name}</h2>
                  <p className="text-green-600 font-bold">
                    ₹{item.price}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => decreaseQty(item.id)}
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      -
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() =>
                        addToCart({ ...item, quantity: 1 })
                      }
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="font-bold">
                  ₹{item.price * item.quantity}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}

            {/* TOTAL SECTION */}
            <div className="text-right mt-6">
              <h2 className="text-2xl font-bold">
                Total: ₹{total}
              </h2>

              <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl">
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}