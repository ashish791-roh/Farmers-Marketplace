"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const CATEGORIES = ["Vegetables", "Fruits", "Dairy", "Organic", "Grains", "Other"];

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    originalPrice: "",
    image: "",
    category: "",
    description: "",
    stock: "",
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (snap.exists()) {
          const d = snap.data();
          setForm({
            name: d.name || "",
            price: String(d.price || ""),
            originalPrice: d.originalPrice ? String(d.originalPrice) : "",
            image: d.image || "",
            category: d.category || "",
            description: d.description || "",
            stock: String(d.stock || ""),
          });
        } else {
          toast.error("Product not found");
          router.push("/admin/products");
        }
      } catch {
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleUpdate = async () => {
    if (!form.name.trim() || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "products", id), {
        name: form.name.trim(),
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        image: form.image.trim(),
        category: form.category,
        description: form.description.trim(),
        stock: Number(form.stock) || 0,
      });
      toast.success("Product updated!");
      router.push("/admin/products");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading product...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="text-gray-400 hover:text-white transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold">✏️ Edit Product</h1>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">

        <div>
          <label className="block text-sm text-gray-400 mb-1">Product Name *</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Price (₹) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Stock (units)</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* ORIGINAL PRICE */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Original / MRP (&#x20B9;){" "}
            <span className="text-gray-600 text-xs font-normal">&#8212; shown as strikethrough if higher than price</span>
          </label>
          <input
            type="number"
            placeholder="Leave blank for no discount badge"
            value={form.originalPrice}
            onChange={(e) => set("originalPrice", e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

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

        <div>
          <label className="block text-sm text-gray-400 mb-1">Image URL</label>
          <input
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {form.image && (
            <div className="relative mt-3 h-36 w-full rounded-xl overflow-hidden border border-white/10">
              <Image
                src={form.image}
                alt="Preview"
                fill
                sizes="100vw"
                className="object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition"
          >
            {saving ? "Saving..." : "Save Changes"}
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