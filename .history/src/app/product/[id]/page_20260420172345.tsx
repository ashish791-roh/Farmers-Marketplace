"use client";

import { use, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Package, Tag, Layers } from "lucide-react";
import toast from "react-hot-toast";
import { emitAddToCart } from "@/lib/cartEvent";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProductDetails({ params }: Props) {
  const { id } = use(params);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  const wishlisted = isWishlisted(id);

  useEffect(() => {
    const fetchProduct = async () => {
      const snap = await getDoc(doc(db, "products", id));
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: qty });
    emitAddToCart({ image: product.image });
  };

  const handleWishlist = () => {
    if (wishlisted) {
      removeFromWishlist(id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({ id: product.id, name: product.name, price: product.price, image: product.image });
      toast.success("Added to wishlist ❤️");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-6xl mx-auto p-6 md:p-10">
          <div className="grid md:grid-cols-2 gap-10 bg-white p-6 rounded-2xl shadow animate-pulse">
            <div className="bg-gray-200 h-[350px] rounded-xl" />
            <div className="space-y-4">
              <div className="bg-gray-200 h-8 rounded w-3/4" />
              <div className="bg-gray-200 h-6 rounded w-1/3" />
              <div className="bg-gray-200 h-4 rounded w-full" />
              <div className="bg-gray-200 h-4 rounded w-5/6" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="p-10 text-center text-gray-500">Product not found</div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-10 bg-white p-6 rounded-2xl shadow"
        >

          {/* IMAGE */}
          <div className="relative">
            <img
              src={product.image || "https://via.placeholder.com/600x400?text=Product"}
              alt={product.name}
              className="w-full h-[350px] object-cover rounded-xl"
              onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/600x400?text=Product"; }}
            />
            <button
              onClick={handleWishlist}
              className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition ${
                wishlisted ? "bg-red-500 text-white" : "bg-white text-gray-400 hover:text-red-500"
              }`}
            >
              <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {/* DETAILS */}
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>

            <p className="text-green-600 text-2xl font-bold mt-3">
              ₹{product.price}
              {product.unit && <span className="text-base font-normal text-gray-500"> / {product.unit}</span>}
            </p>

            <div className="mt-3 text-yellow-500">
              ⭐⭐⭐⭐☆
            </div>

            {/* METADATA BADGES */}
            <div className="flex flex-wrap gap-2 mt-4">
              {product.category && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                  <Tag size={13} /> {product.category}
                </span>
              )}
              {product.stock !== undefined && (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
                  product.stock > 0
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-red-50 text-red-600 border-red-200"
                }`}>
                  <Layers size={13} />
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              )}
            </div>

            <p className="mt-4 text-gray-600">
              {product.description || "Fresh product directly from verified farmers."}
            </p>

            {/* QUANTITY SELECTOR */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Qty:</span>
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold transition"
              >
                -
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button
                onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold transition"
              >
                +
              </button>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 cursor-pointer hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                <ShoppingCart size={18} /> Add to Cart 🛒
              </button>
              <button
                onClick={handleWishlist}
                className={`p-3 rounded-xl border-2 transition ${
                  wishlisted ? "border-red-500 bg-red-50 text-red-500" : "border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-500"
                }`}
              >
                <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            {product.farmerName && (
              <p className="mt-5 text-xs text-gray-400 flex items-center gap-1.5">
                <Package size={13} /> Sold by <span className="font-medium text-gray-600">{product.farmerName}</span>
              </p>
            )}
          </div>

        </motion.div>
      </main>
    </>
  );
}