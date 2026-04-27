"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { onAddToCart } from "@/lib/cartEvent";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); // ✅ FIX for menu close
  const { user, loading } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  const cartRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 🛒 Cart animation (UNCHANGED)
  useEffect(() => {
    const unsubscribe = onAddToCart(() => {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    });

    return unsubscribe;
  }, []);

  // ✅ FIX: close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="w-full bg-white shadow-md px-4 py-3 flex items-center justify-between relative z-50">

      {/* 🌱 LOGO */}
      <div className="text-xl font-bold text-green-700">
        <Link href="/">🌱FarmX</Link>
      </div>

      {/* 🍔 HAMBURGER */}
      <button
        className="md:hidden text-2xl"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      {/* 🧭 NAV LINKS */}
      <div
        className={`flex-col md:flex md:flex-row md:items-center gap-6 absolute md:static bg-white md:bg-transparent left-0 w-full md:w-auto px-6 md:px-0 py-6 md:py-0 shadow-md md:shadow-none transition-all duration-300 ${
          menuOpen ? "top-14 flex" : "hidden md:flex"
        }`}
      >
        <Link href="/" className="hover:text-green-600">
          Home
        </Link>

        <Link href="/products" className="hover:text-green-600">
          Products
        </Link>

        {/* 🛒 CART */}
        <motion.div
          ref={cartRef}
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

        {/* 🔐 MOBILE AUTH */}
        <div className="md:hidden border-t pt-4 space-y-3">
          {loading ? (
            <span className="text-gray-500 text-sm">Loading...</span>
          ) : user ? (
            <>
              <span className="text-sm text-gray-700 block">
                {user.email}
              </span>

              <button
                onClick={handleLogout}
                className="w-full py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-red-500 text-white hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="w-full py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition border border-green-600 text-green-600"
              >
                Login
              </button>

              <button
                onClick={() => router.push("/signup")}
                className="w-full py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-green-600 text-white hover:bg-green-700"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

      {/* 🔐 DESKTOP AUTH */}
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
              className="px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-red-500 text-white hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition border border-green-600 text-green-600"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-green-600 text-white hover:bg-green-700"
            >
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}