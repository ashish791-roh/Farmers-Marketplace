"use client";

import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, PackageOpen } from "lucide-react";
import toast from "react-hot-toast";
import { emitAddToCart } from "@/lib/cartEvent";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = (item: any) => {
    addToCart({ id: item.id, name: item.name, price: item.price, image: item.image, quantity: 1 });
    emitAddToCart({ image: item.image });
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto p-10 text-center">
          <Heart size={56} className="mx-auto mb-4 text-red-400 opacity-60" />
          <h1 className="text-2xl font-bold mb-2">Your Wishlist</h1>
          <p className="text-gray-500 mb-6">Please login to view and save your wishlist.</p>
          <Link href="/login" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition">
            Login
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto p-6 md:p-10">
        <div className="flex items-center gap-3 mb-8">
          <Heart size={28} className="text-red-500 fill-red-500" />
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          {wishlist.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-600 text-sm font-semibold px-3 py-1 rounded-full">
              {wishlist.length} item{wishlist.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {/* Illustration */}
            <div className="relative mb-8">
              <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background circle */}
                <circle cx="90" cy="85" r="70" fill="#f0fdf4" />
                {/* Shopping basket */}
                <rect x="52" y="80" width="76" height="48" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5"/>
                {/* Basket handle */}
                <path d="M65 80 Q90 52 115 80" stroke="#86efac" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                {/* Basket weave lines */}
                <line x1="70" y1="80" x2="70" y2="128" stroke="#bbf7d0" strokeWidth="1"/>
                <line x1="90" y1="80" x2="90" y2="128" stroke="#bbf7d0" strokeWidth="1"/>
                <line x1="110" y1="80" x2="110" y2="128" stroke="#bbf7d0" strokeWidth="1"/>
                <line x1="52" y1="100" x2="128" y2="100" stroke="#bbf7d0" strokeWidth="1"/>
                {/* Big heart */}
                <path d="M90 73 C90 73 78 62 70 66 C62 70 62 80 70 86 L90 104 L110 86 C118 80 118 70 110 66 C102 62 90 73 90 73Z" fill="#fca5a5" stroke="#f87171" strokeWidth="1.5"/>
                {/* Sparkles */}
                <circle cx="42" cy="60" r="3" fill="#fde68a"/>
                <circle cx="140" cy="55" r="2" fill="#a7f3d0"/>
                <circle cx="148" cy="75" r="3" fill="#fca5a5"/>
                <circle cx="35" cy="85" r="2" fill="#86efac"/>
                {/* Stars */}
                <path d="M42 40 L43.5 44 L47 44 L44.5 46.5 L45.5 50 L42 48 L38.5 50 L39.5 46.5 L37 44 L40.5 44Z" fill="#fde68a"/>
                <path d="M140 38 L141 41 L144 41 L141.5 43 L142.5 46 L140 44.5 L137.5 46 L138.5 43 L136 41 L139 41Z" fill="#bbf7d0"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
              Tap the ❤️ on any product to save it here. Your saved items are just a tap away!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-sm"
              >
                🛒 Browse Products
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700 px-8 py-3 rounded-2xl font-semibold transition-all"
              >
                🌱 View Fresh Picks
              </Link>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-2xl shadow hover:shadow-lg overflow-hidden transition"
                >
                  <Link href={`/product/${item.id}`}>
                    <img
                      src={item.image || "https://via.placeholder.com/300x200?text=Product"}
                      alt={item.name}
                      className="h-44 w-full object-cover hover:scale-105 transition duration-300"
                      onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/300x200?text=Product"; }}
                    />
                  </Link>
                  <div className="p-4">
                    <Link href={`/product/${item.id}`}>
                      <h3 className="font-semibold text-gray-800 hover:text-green-700 transition truncate">{item.name}</h3>
                    </Link>
                    <p className="text-green-600 font-bold text-lg mt-1">₹{item.price}</p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-medium transition"
                      >
                        <ShoppingCart size={15} /> Add to Cart
                      </button>
                      <button
                        onClick={() => { removeFromWishlist(item.id); toast.success("Removed from wishlist"); }}
                        className="p-2 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </>
  );
}