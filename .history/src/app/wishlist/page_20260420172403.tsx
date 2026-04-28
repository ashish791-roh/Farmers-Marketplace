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
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
            <PackageOpen size={56} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-6">Save products you love and come back to them anytime.</p>
            <Link href="/" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition">
              Browse Products
            </Link>
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