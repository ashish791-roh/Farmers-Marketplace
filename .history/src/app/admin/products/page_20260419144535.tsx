"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const loadProducts = async () => {
    try {
      const snap = await getDocs(collection(db, "products"));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(data);
    } catch (err) {
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // FILTER
  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  // DELETE
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Delete this product?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Product deleted");
      loadProducts();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-6 md:p-10">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          📦 Manage Products
        </h1>

        <Link
          href="/admin/products/add"
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl shadow hover:scale-105 transition duration-300"
        >
          + Add Product
        </Link>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search products..."
        className="w-full mb-6 p-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* EMPTY STATE */}
      {filtered.length === 0 ? (
        <div className="text-center mt-20 text-gray-500">
          <p className="text-xl">No products found 😕</p>
          <p className="text-sm mt-2">
            Try adding new products or adjust search
          </p>
        </div>
      ) : (
        /* 🛒 GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden"
            >
              {/* IMAGE */}
              <img
                src={
                  p.image ||
                  "https://via.placeholder.com/300x200?text=No+Image"
                }
                alt={p.name}
                className="h-40 w-full object-cover"
              />

              {/* CONTENT */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">
                  {p.name}
                </h3>

                <p className="text-green-600 font-bold mt-1">
                  ₹{p.price}
                </p>

                {/* ACTIONS */}
                <div className="flex justify-between mt-4">
                  <Link
                    href={`/admin/products/edit/${p.id}`}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Delete
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