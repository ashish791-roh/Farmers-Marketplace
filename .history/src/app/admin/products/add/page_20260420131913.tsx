"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const CATEGORIES = ["Vegetables", "Fruits", "Dairy", "Organic", "Grains", "Other"];

export default function AddProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    image: "",
    category: "",
    description: "",
    stock: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAdd = async () => {
    if (!form.name.trim() || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        name: form.name.trim(),
        price: Number(form.price),
        image: form.image.trim() || "",
        category: form.category,
        description: form.description.trim(),
        stock: Number(form.stock) || 0,
        createdAt: serverTimestamp(),
      });
      toast.success("Product added successfully!");
      router.push("/admin/products");
    } catch {
      toast.error("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="text-gray-400 hover:text-white transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold">➕ Add Product</h1>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">

        {/* NAME */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Product Name *</label>
          <input
            placeholder="e.g. Fresh Tomatoes"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* PRICE & STOCK */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Price (₹) *</label>
            <input
              type="number"
              placeholder="0"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Stock (units)</label>
            <input
              type="number"
              placeholder="0"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* CATEGORY */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* IMAGE URL */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Image URL</label>
          <input
            placeholder="https://..."
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {form.image && (
            <img
              src={form.image}
              alt="Preview"
              className="mt-3 h-36 w-full object-cover rounded-xl border border-white/10"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            rows={3}
            placeholder="Product description..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleAdd}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition"
          >
            {loading ? "Adding..." : "Add Product"}
          </button>
          <Link
            href="/admin/products"
            className="flex-1 text-center bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}