"use client";

import { useCartStore } from "@/store/cartStore";

const Navbar = () => {
  const cart = useCartStore((state) => state.cart);

  return (
    <nav className="bg-green-700 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <h1 className="text-xl font-bold">🌿 FarmFresh</h1>

      <div className="flex items-center gap-4">
        <button>Login</button>

        <div className="relative">
          <button className="bg-white text-green-700 px-4 py-1 rounded-lg font-semibold">
            Cart 🛒
          </button>

          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {cart.length}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;