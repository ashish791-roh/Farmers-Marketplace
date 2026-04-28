"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

const Navbar = () => {
  const cart = useCartStore((state) => state.cart);

  return (
    <nav className="bg-green-700 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
      
      {/* 🌿 Logo */}
      <Link href="/">
        <h1 className="text-xl md:text-2xl font-bold cursor-pointer">
          🌿 FarmFresh
        </h1>
      </Link>

      {/* 🔍 Search Bar */}
      <div className="flex-1 mx-6 hidden md:block hover:scale-102 transition duration-300 shadow-sm → hover:shadow-xl">
        <input
          type="text"
          placeholder="Search fresh products..."
          className="w-full px-4 py-2 rounded-lg text-black outline-none"
        />
      </div>

      {/* 🧭 Actions */}
      <div className="flex items-center gap-4">
        
        {/* Login */}
        <button className="hover:underline">
          Login
        </button>

        {/* Cart */}
        <Link href="/cart">
          <div className="relative">
            <button className="bg-white text-green-700 px-4 py-1 rounded-lg font-semibold cursor-pointer hover:scale-105 transition duration-300 shadow-sm → hover:shadow-xl">
              Cart 🛒
            </button>

            {/* 🔢 Cart Count */}
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            )}
          </div>
        </Link>

      </div>
    </nav>
  );
};

export default Navbar;