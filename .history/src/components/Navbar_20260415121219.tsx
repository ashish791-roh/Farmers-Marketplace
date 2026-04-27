"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  // 🔐 Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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

      {/* 🧭 CENTER / LINKS */}
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

        <Link href="/cart" className="hover:text-green-600">
          Cart
        </Link>

        <Link href="/orders" className="hover:text-green-600">
          Orders
        </Link>
      </div>

      {/* 🔐 RIGHT - AUTH SECTION */}
      <div className="hidden md:flex items-center gap-3">
        {loading ? (
          <span className="text-sm text-gray-500">Loading...</span>
        ) : user ? (
          <>
            {/* 👤 User Email */}
            <span className="text-sm text-gray-700">
              {user.email}
            </span>

            {/* 🚪 Logout */}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 cursor-poihover:bg-red-600 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            {/* 🔑 Login */}
            <Link
              href="/login"
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Login
            </Link>

            {/* 🆕 Signup */}
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