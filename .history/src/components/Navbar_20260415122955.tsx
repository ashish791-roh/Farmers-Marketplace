"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { onAddToCart } from "@/lib/cartEvent";

export default function Navbar() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  // 🔐 Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 📦 Cart animation listener
  useEffect(() => {
    const unsubscribe = onAddToCart(() => {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    });

    return unsubscribe;
  }, []);

  // Optional: close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [router]);

  return (
    <nav className="w-full bg-white shadow-md px-4 py-3 flex items-center justify-between">

      {/* 🧭 LEFT - LOGO */}
      <div className="text-xl font-bold text-green-600">
        <Link href="/">Farmers Marketplace</Link>
      </div>

      {/* 📱 MOBILE MENU BUTTON */}
      <button
        className="md:hidden text-2xl"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      {/* 🧭 CENTER LINKS */}
      <div
        className={`flex-col md:flex md:flex-row md:items-center gap-6 absolute md:static bg-white md:bg-transparent left-0 w-full md:w-auto px-4 md:px-0 py-4 md:py-0 shadow-md md:shadow-none transition-all duration-300 ${
          menuOpen ? "top-14 flex" : "hidden md:flex"
        }`}
      >
        <Link href="/" className="hover:text-green-600">
          Home
        </Link>

        <Link href="/products" className="hover:text-green-600">
          Products
        </Link>

        {/* 🛒 CART WITH ANIMATION */}
        <motion.div
          animate={cartBounce ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          <Link href="/cart" className="hover:text-green-600">
            🛒 Cart
          </Link>
        </motion.div>

        <Link href="/orders" className="hover:text-green-600">
          Orders
        </Link>
      </div>

      {/* 🔐 AUTH SECTION */}
      <div className="hidden md:flex items-center gap-3">
        {loading ? (
          <span className="text-sm text-gray-500">Loading...</span>
        ) : user ? (
          <>
            <span className="text-sm text-gray-700">
              {user.email}
            </span>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}