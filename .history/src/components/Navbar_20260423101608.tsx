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
import { motion, AnimatePresence } from "framer-motion";
import { onAddToCart } from "@/lib/cartEvent";
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Crown,
  X,
  Bell,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { role } = useRole();
  const { cart } = useCart();
  const { wishlist } = useWishlist();

  const [cartBounce, setCartBounce] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const cartCount = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Cart bounce animation on add
  useEffect(() => {
    const unsub = onAddToCart(() => {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 600);
    });
    return unsub;
  }, []);

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close profile on route change
  useEffect(() => {
    setProfileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Focus search on open
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileOpen(false);
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const initials = user?.email?.[0]?.toUpperCase() || "U";

  return (
    <>
      {/* ── MAIN NAVBAR ── */}
      <nav
        className={`w-full bg-white sticky top-0 z-50 transition-shadow duration-200 ${
          scrolled ? "shadow-md" : "shadow-sm border-b border-gray-100"
        }`}
      >
        {/* ── TOP GREEN ACCENT BAR (desktop) ── */}
        <div className="hidden md:block h-1 bg-gradient-to-r from-green-500 via-green-400 to-emerald-500" />

        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 h-14 md:h-16">

            {/* ── LOGO ── */}
            <Link
              href="/"
              className="flex items-center gap-1.5 shrink-0 group"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-white text-sm md:text-base font-bold leading-none">F</span>
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-green-700 font-extrabold text-lg tracking-tight">FarmX</span>
                <span className="text-[9px] text-green-500 font-medium tracking-widest uppercase -mt-0.5">Fresh · Direct</span>
              </div>
            </Link>

            {/* ── SEARCH BAR (desktop inline, mobile icon) ── */}
            <div className="flex-1 max-w-xl mx-2 md:mx-4">
              {/* Desktop search */}
              <form onSubmit={handleSearch} className="hidden md:flex items-center">
                <div className="relative w-full">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search vegetables, fruits, dairy…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition placeholder:text-gray-400"
                  />
                </div>
              </form>

              {/* Mobile search trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-400"
              >
                <Search size={15} />
                <span className="text-xs">Search products…</span>
              </button>
            </div>

            {/* ── RIGHT ICONS ── */}
            <div className="flex items-center gap-1 shrink-0">

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2 rounded-xl hover:bg-gray-50 transition group"
                aria-label="Wishlist"
              >
                <Heart
                  size={21}
                  className={`transition ${
                    wishlist.length > 0
                      ? "fill-red-500 text-red-500"
                      : "text-gray-500 group-hover:text-red-400"
                  }`}
                />
                <AnimatePresence>
                  {wishlist.length > 0 && (
                    <motion.span
                      key="wish-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {wishlist.length > 9 ? "9+" : wishlist.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2 rounded-xl hover:bg-gray-50 transition group"
                aria-label="Cart"
              >
                <motion.div
                  animate={cartBounce ? { scale: [1, 1.35, 0.9, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <ShoppingCart
                    size={21}
                    className="text-gray-500 group-hover:text-green-600 transition"
                  />
                </motion.div>
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="cart-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Profile dropdown */}
              {!loading && (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((p) => !p)}
                    className="flex items-center gap-1 p-1.5 rounded-xl hover:bg-gray-50 transition"
                    aria-label="Profile"
                  >
                    {user ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {initials}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User size={16} className="text-gray-500" />
                      </div>
                    )}
                    <ChevronDown
                      size={13}
                      className={`hidden md:block text-gray-400 transition-transform ${
                        profileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                      >
                        {user ? (
                          <>
                            {/* User info */}
                            <div className="px-4 py-3 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-gray-100">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-gray-800 truncate">
                                    {user.email}
                                  </p>
                                  {role && (
                                    <span className="text-[10px] capitalize text-green-600 font-medium">
                                      {role}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Links */}
                            {[
                              { href: "/profile", icon: <User size={15} />, label: "My Profile" },
                              { href: "/orders", icon: <ShoppingCart size={15} />, label: "My Orders" },
                              { href: "/wishlist", icon: <Heart size={15} />, label: "Wishlist" },
                              ...(role === "farmer"
                                ? [{ href: "/farmer/dashboard", icon: <LayoutDashboard size={15} />, label: "Farmer Dashboard" }]
                                : []),
                              ...(role === "admin"
                                ? [{ href: "/admin", icon: <Crown size={15} />, label: "Admin Panel" }]
                                : []),
                            ].map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                              >
                                <span className="text-gray-400">{item.icon}</span>
                                {item.label}
                              </Link>
                            ))}

                            <div className="border-t border-gray-100 mt-1">
                              <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                              >
                                <LogOut size={15} />
                                Sign Out
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="p-4 space-y-2">
                            <Link
                              href="/login"
                              className="block w-full text-center py-2.5 rounded-xl border-2 border-green-600 text-green-600 font-semibold text-sm hover:bg-green-50 transition"
                            >
                              Login
                            </Link>
                            <Link
                              href="/signup"
                              className="block w-full text-center py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition"
                            >
                              Sign Up Free
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── DESKTOP CATEGORY NAV ── */}
        <div className="hidden md:block border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-6 h-10 text-sm font-medium text-gray-600">
              {[
                { label: "All Products", href: "/products" },
                { label: "🥦 Vegetables", href: "/products?category=Vegetables" },
                { label: "🍎 Fruits", href: "/products?category=Fruits" },
                { label: "🥛 Dairy", href: "/products?category=Dairy" },
                { label: "🌿 Organic", href: "/products?category=Organic" },
                { label: "🌾 Grains", href: "/products?category=Grains" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-green-600 transition whitespace-nowrap py-2 border-b-2 border-transparent hover:border-green-500"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE FULL-SCREEN SEARCH OVERLAY ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[60] flex flex-col md:hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shadow-sm">
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-2 rounded-xl hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
              <form onSubmit={handleSearch} className="flex-1">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vegetables, fruits, dairy…"
                  className="w-full py-2 text-base focus:outline-none text-gray-800 placeholder:text-gray-400"
                />
              </form>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-gray-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Quick suggestions */}
            <div className="px-4 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Popular Searches
              </p>
              {["Fresh Tomatoes", "Organic Milk", "Alphonso Mangoes", "Brown Rice", "Spinach"].map(
                (q) => (
                  <button
                    key={q}
                    onClick={() => {
                      router.push(`/products?search=${encodeURIComponent(q)}`);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-3 w-full py-2.5 text-sm text-gray-700 border-b border-gray-50 hover:text-green-600 transition"
                  >
                    <Search size={14} className="text-gray-300 shrink-0" />
                    {q}
                  </button>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}