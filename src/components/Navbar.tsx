"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { motion } from "framer-motion";
import { onAddToCart } from "@/lib/cartEvent";
import { Heart, User } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { role } = useRole();
  const { cart } = useCart();
  const { wishlist } = useWishlist();

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  const cartRef = useRef<HTMLDivElement | null>(null);

  const cartCount = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Cart animation
  useEffect(() => {
    const unsubscribe = onAddToCart(() => {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    });

    return unsubscribe;
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="w-full bg-white shadow-md border-b sticky top-0 z-50">

      {/* CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/" className="text-xl md:text-2xl font-bold text-green-700">
          🌱 FarmX
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="hover:text-green-600 transition">
            Home
          </Link>

          <Link href="/products" className="hover:text-green-600 transition">
            Products
          </Link>

          {/* CART */}
          <motion.div
            ref={cartRef}
            animate={cartBounce ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <Link href="/cart" className="hover:text-green-600 flex items-center gap-1">
              🛒 Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </motion.div>

          {/* WISHLIST */}
          <Link href="/wishlist" className="relative hover:text-red-500 transition flex items-center gap-1">
            <Heart size={18} className={wishlist.length > 0 ? "fill-red-500 text-red-500" : ""} />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {wishlist.length > 9 ? "9+" : wishlist.length}
              </span>
            )}
          </Link>

          <Link href="/orders" className="hover:text-green-600 transition">
            Orders
          </Link>
        </div>

        {/* AUTH (DESKTOP) */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : user ? (
            <>
              {/* Profile */}
              <Link href="/profile" className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-green-700 transition px-3 py-2 rounded-xl hover:bg-gray-50">
                <User size={16} />
                <span className="hidden lg:block truncate max-w-[120px]">{user.email}</span>
              </Link>

              {/* Admin Panel button — only visible to admins */}
              {role === "admin" && (
                <Link
                  href="/admin"
                  className="px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-purple-600 text-white hover:bg-purple-700"
                >
                  👑 Admin Panel
                </Link>
              )}

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

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-2xl"
        >
          ☰
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-4">

          {/* NAV LINKS */}
          <Link href="/" className="block text-gray-700">
            Home
          </Link>

          <Link href="/products" className="block text-gray-700">
            Products
          </Link>

          <Link href="/cart" className="block text-gray-700 flex items-center gap-2">
            Cart {cartCount > 0 && <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5">{cartCount}</span>}
          </Link>

          <Link href="/wishlist" className="block text-gray-700 flex items-center gap-2">
            Wishlist {wishlist.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{wishlist.length}</span>}
          </Link>

          <Link href="/orders" className="block text-gray-700">
            Orders
          </Link>

          {user && (
            <Link href="/profile" className="block text-gray-700">
              My Profile
            </Link>
          )}

          {/* AUTH SECTION */}
          <div className="border-t pt-4 space-y-3">

            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : user ? (
              <>
                <p className="text-sm text-gray-600">
                  {user.email}
                </p>

                {/* Admin Panel button — only visible to admins */}
                {role === "admin" && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="w-full py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition bg-purple-600 text-white hover:bg-purple-700"
                  >
                    👑 Admin Panel
                  </button>
                )}

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
        </div>
      )}
    </nav>
  );
}