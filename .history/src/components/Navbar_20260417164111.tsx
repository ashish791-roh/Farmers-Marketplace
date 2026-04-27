"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { onAddToCart } from "@/lib/cartEvent";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const cartRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // 🛒 Cart animation
  useEffect(() => {
    const unsub = onAddToCart(() => {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    });
    return unsub;
  }, []);

  // 🔥 Scroll shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 🔥 NAVBAR */}
      <nav
        className={`sticky top-0 z-50 px-6 py-3 flex justify-between items-center transition-all duration-300 ${
          scrolled
            ? "bg-white/70 backdrop-blur-lg shadow-lg"
            : "bg-white"
        }`}
      >
        {/* 🌱 LOGO */}
        <Link
          href="/"
          className="text-2xl font-bold text-green-700 flex items-center gap-2"
        >
          🌱 FarmX
        </Link>

        {/* 🧭 DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="hover:text-green-600 transition">
            Home
          </Link>

          <Link href="/products" className="hover:text-green-600 transition">
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
        </div>

        {/* 🔐 AUTH (DESKTOP) */}
        <div className="hidden md:flex items-center gap-3 relative">
          {loading ? (
            <span>Loading...</span>
          ) : user ? (
            <>
              {/* 👤 PROFILE */}
              <div
                onClick={() => setProfileOpen(!profileOpen)}
                className="cursor-pointer px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
              >
                👤
              </div>

              {/* DROPDOWN */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-12 bg-white shadow-xl rounded-xl p-4 w-48"
                  >
                    <p className="text-sm text-gray-600 mb-2">
                      {user.email}
                    </p>

                    <button
                      onClick={() => router.push("/orders")}
                      className="w-full text-left py-2 hover:text-green-600"
                    >
                      My Orders
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left py-2 text-red-500 hover:text-red-600"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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

        {/* 🍔 HAMBURGER */}
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden text-2xl"
        >
          ☰
        </button>
      </nav>

      {/* 🔥 MOBILE SIDEBAR (INSANE LEVEL) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* SIDEBAR */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="fixed top-0 left-0 w-72 h-full bg-white z-50 shadow-xl p-6 space-y-6"
            >
              {/* CLOSE */}
              <button
                onClick={() => setMenuOpen(false)}
                className="text-xl"
              >
                ✕
              </button>

              {/* LINKS */}
              <div className="space-y-4">
                <Link href="/">Home</Link>
                <Link href="/products">Products</Link>
                <Link href="/cart">Cart</Link>
                <Link href="/orders">Orders</Link>
              </div>

              {/* AUTH */}
              <div className="border-t pt-4 space-y-3">
                {user ? (
                  <>
                    <p className="text-sm text-gray-600">
                      {user.email}
                    </p>

                    <button
                      onClick={handleLogout}
                      className="w-full py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-red-500 text-white"
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
                      className="w-full py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-green-600 text-white"
                    >
                      Signup
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}