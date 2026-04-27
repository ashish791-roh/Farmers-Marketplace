"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { motion } from "framer-motion";
import { onAddToCart } from "@/lib/cartEvent";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { role } = useRole();

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

  useEffect(() => {
    const unsubscribe = onAddToCart(() => {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="w-full bg-white shadow-md border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/" className="text-xl md:text-2xl font-bold text-green-700">
          🌱 FarmX
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="hover:text-green-600 transition">Home</Link>
          <Link href="/products" className="hover:text-green-600 transition">Products</Link>
          <motion.div ref={cartRef} animate={cartBounce ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.4 }}>
            <Link href="/cart" className="hover:text-green-600">🛒 Cart</Link>
          </motion.div>
          <Link href="/orders" className="hover:text-green-600 transition">Orders</Link>
        </div>

        {/* AUTH (DESKTOP) */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : user ? (
            <>
              <span className="text-sm text-gray-700 hidden lg:block">{user.email}</span>

              {/* Admin Panel - only for admins */}
              {role === "admin" && (
                <Link href="/admin" className="px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-purple-600 text-white hover:bg-purple-700">
                  👑 Admin Panel
                </Link>
              )}

              {/* Farmer Portal - only for approved farmers */}
              {role === "farmer_approved" && (
                <Link href="/farmer/dashboard" className="px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-green-700 text-white hover:bg-green-800">
                  🌾 Farmer Portal
                </Link>
              )}

              {/* Pending farmers */}
              {role === "farmer" && (
                <Link href="/farmer/pending" className="px-4 py-2 rounded-xl font-medium shadow-sm transition bg-yellow-100 text-yellow-700 border border-yellow-300">
                  ⏳ Awaiting Approval
                </Link>
              )}

              <button onClick={handleLogout} className="px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-red-500 text-white hover:bg-red-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition border border-green-600 text-green-600">
                Login
              </Link>
              <Link href="/signup" className="px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-green-600 text-white hover:bg-green-700">
                Signup
              </Link>
            </>
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-2xl">☰</button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-4">
          <Link href="/" className="block text-gray-700">Home</Link>
          <Link href="/products" className="block text-gray-700">Products</Link>
          <Link href="/cart" className="block text-gray-700">Cart</Link>
          <Link href="/orders" className="block text-gray-700">Orders</Link>

          <div className="border-t pt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : user ? (
              <>
                <p className="text-sm text-gray-600">{user.email}</p>

                {role === "admin" && (
                  <button onClick={() => router.push("/admin")} className="w-full py-2 rounded-xl font-medium shadow-sm transition bg-purple-600 text-white">
                    👑 Admin Panel
                  </button>
                )}
                {role === "farmer_approved" && (
                  <button onClick={() => router.push("/farmer/dashboard")} className="w-full py-2 rounded-xl font-medium shadow-sm transition bg-green-700 text-white">
                    🌾 Farmer Portal
                  </button>
                )}
                {role === "farmer" && (
                  <button onClick={() => router.push("/farmer/pending")} className="w-full py-2 rounded-xl font-medium transition bg-yellow-100 text-yellow-700 border border-yellow-300">
                    ⏳ Awaiting Approval
                  </button>
                )}
                <button onClick={handleLogout} className="w-full py-2 rounded-xl font-medium shadow-sm transition bg-red-500 text-white">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push("/login")} className="w-full py-2 rounded-xl font-medium shadow-sm transition border border-green-600 text-green-600">Login</button>
                <button onClick={() => router.push("/signup")} className="w-full py-2 rounded-xl font-medium shadow-sm transition bg-green-600 text-white">Signup</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}