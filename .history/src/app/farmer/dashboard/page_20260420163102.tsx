"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Package, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

type ProductStatus = "approved" | "pending" | "rejected";

type FarmerProduct = {
  id: string;
  status?: ProductStatus;
  name?: string;
  image?: string;
  price?: number;
  category?: string;
  adminNote?: string;
  createdAt?: { seconds?: number };
};

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [recentProducts, setRecentProducts] = useState<FarmerProduct[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch farmer's submitted products
    const q = query(
      collection(db, "pendingProducts"),
      where("farmerId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const products = snap.docs.map((d) => ({ ...(d.data() as FarmerProduct), id: d.id }));
      setStats({
        total: products.length,
        approved: products.filter((p) => p.status === "approved").length,
        pending: products.filter((p) => p.status === "pending").length,
        rejected: products.filter((p) => p.status === "rejected").length,
      });
      // Sort by createdAt desc for recent
      const sorted = [...products].sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setRecentProducts(sorted.slice(0, 5));
    });

    return () => unsub();
  }, [user]);

  const statCards = [
    { title: "Total Submitted", value: stats.total, icon: <Package size={22} />, color: "from-blue-500 to-blue-700" },
    { title: "Approved", value: stats.approved, icon: <CheckCircle size={22} />, color: "from-green-500 to-green-700" },
    { title: "Pending Review", value: stats.pending, icon: <Clock size={22} />, color: "from-yellow-500 to-yellow-700" },
    { title: "Rejected", value: stats.rejected, icon: <XCircle size={22} />, color: "from-red-500 to-red-700" },
  ];

  const getStatusBadge = (status?: ProductStatus) => {
    if (status === "approved") return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (status === "rejected") return "bg-red-500/20 text-red-400 border border-red-500/30";
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  };

  const getStatusLabel = (status?: ProductStatus) => {
    if (status === "approved") return "✅ Approved";
    if (status === "rejected") return "❌ Rejected";
    return "⏳ Pending";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">🌾 Farmer Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your farm products and track approvals</p>
        </div>
        <Link
          href="/farmer/products/add"
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow"
        >
          + Add Product
        </Link>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.03 }}
            className={`bg-gradient-to-r ${card.color} p-5 rounded-2xl shadow-lg`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-80">{card.title}</p>
                <h2 className="text-2xl font-bold mt-1">{card.value}</h2>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">{card.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* RECENT PRODUCTS */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold">📦 Recent Product Submissions</h2>
          <Link href="/farmer/products" className="text-green-400 text-sm hover:underline">
            View All →
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p>No products submitted yet.</p>
            <Link
              href="/farmer/products/add"
              className="mt-3 inline-block text-green-400 text-sm hover:underline"
            >
              Add your first product →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition"
              >
                <img
                  src={product.image || "https://via.placeholder.com/60x60?text=🌾"}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/60x60?text=🌾"; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{product.name}</p>
                  <p className="text-sm text-gray-400">₹{product.price} · {product.category || "Uncategorized"}</p>
                  {product.adminNote && (
                    <p className="text-xs text-yellow-400 mt-1">💬 Admin: {product.adminNote}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${getStatusBadge(product.status)}`}>
                  {getStatusLabel(product.status || "pending")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TIPS */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-green-400" />
          Tips for Faster Approval
        </h2>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2"><span className="text-green-400">•</span> Add a clear, high-quality product image URL</li>
          <li className="flex gap-2"><span className="text-green-400">•</span> Write a detailed product description</li>
          <li className="flex gap-2"><span className="text-green-400">•</span> Set a competitive and fair price</li>
          <li className="flex gap-2"><span className="text-green-400">•</span> Specify the correct category for your product</li>
        </ul>
      </div>
    </div>
  );
}
