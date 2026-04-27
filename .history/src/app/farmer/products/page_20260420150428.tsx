"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Trash2, Clock, CheckCircle, XCircle, Package } from "lucide-react";

export default function FarmerProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "pendingProducts"),
      where("farmerId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const sorted = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProducts(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleDelete = async (id: string, status: string) => {
    if (status === "approved") {
      toast.error("Cannot delete an approved product. Contact admin.");
      return;
    }
    if (!confirm("Delete this product submission?")) return;
    try {
      await deleteDoc(doc(db, "pendingProducts", id));
      toast.success("Product removed");
    } catch {
      toast.error("Delete failed");
    }
  };

  const filtered = filter === "all" ? products : products.filter((p) => p.status === filter);

  const counts = {
    all: products.length,
    pending: products.filter((p) => p.status === "pending").length,
    approved: products.filter((p) => p.status === "approved").length,
    rejected: products.filter((p) => p.status === "rejected").length,
  };

  const getStatusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle size={14} className="text-green-400" />;
    if (status === "rejected") return <XCircle size={14} className="text-red-400" />;
    return <Clock size={14} className="text-yellow-400" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (status === "rejected") return "bg-red-500/20 text-red-400 border border-red-500/30";
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">📦 My Products</h1>
        <Link
          href="/farmer/products/add"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl shadow transition"
        >
          <Plus size={18} /> Add Product
        </Link>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
              filter === tab
                ? "bg-green-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-20">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-xl">No {filter === "all" ? "" : filter} products</p>
          {filter === "all" && (
            <Link href="/farmer/products/add" className="mt-3 inline-block text-green-400 hover:underline text-sm">
              Add your first product →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white/10 backdrop-blur rounded-2xl border border-white/10 overflow-hidden hover:border-green-500/40 transition"
            >
              <div className="relative">
                <img
                  src={p.image || "https://via.placeholder.com/300x200?text=🌾"}
                  alt={p.name}
                  className="h-40 w-full object-cover"
                  onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/300x200?text=🌾"; }}
                />
                <span className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusBadge(p.status || "pending")}`}>
                  {getStatusIcon(p.status || "pending")}
                  {(p.status || "pending").charAt(0).toUpperCase() + (p.status || "pending").slice(1)}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white truncate">{p.name}</h3>
                <p className="text-green-400 font-bold mt-1">₹{p.price} / {p.unit || "kg"}</p>
                {p.category && (
                  <span className="text-xs text-gray-400 mt-1 block">{p.category}</span>
                )}
                {p.adminNote && (
                  <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-400">
                      💬 <span className="font-medium">Admin note:</span> {p.adminNote}
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-gray-500">
                    {p.createdAt?.seconds
                      ? new Date(p.createdAt.seconds * 1000).toLocaleDateString()
                      : "—"}
                  </span>
                  {p.status !== "approved" && (
                    <button
                      onClick={() => handleDelete(p.id, p.status)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm transition"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
