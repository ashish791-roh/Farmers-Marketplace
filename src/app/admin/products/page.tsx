"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Product deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">📦 Manage Products</h1>
        <Link
          href="/admin/products/add"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl shadow transition"
        >
          <Plus size={18} /> Add Product
        </Link>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search products..."
        className="w-full mb-6 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-gray-400 text-center py-20">Loading products...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-xl">No products found 😕</p>
          <p className="text-sm mt-2">Try adding new products or adjust the search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white/10 backdrop-blur rounded-2xl border border-white/10 overflow-hidden hover:border-green-500/40 transition"
            >
              <div className="relative h-40">
                <Image
                  src={p.image || "https://via.placeholder.com/300x200?text=No+Image"}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white truncate">{p.name}</h3>
                <p className="text-green-400 font-bold mt-1">₹{p.price}</p>
                {p.category && (
                  <span className="text-xs text-gray-400 mt-1 block">{p.category}</span>
                )}
                <div className="flex gap-3 mt-4">
                  <Link
                    href={`/admin/products/edit/${p.id}`}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition"
                  >
                    <Pencil size={14} /> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm transition ml-auto"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}