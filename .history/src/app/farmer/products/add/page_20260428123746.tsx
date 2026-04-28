"use client";

import Image from "next/image";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

const CATEGORIES = ["Vegetables", "Fruits", "Dairy", "Organic", "Grains", "Other"];

export default function FarmerAddProduct() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [farmerStatus, setFarmerStatus] = useState<string | null>(null);
  const [farmerName, setFarmerName] = useState("");
  const [form, setForm] = useState({
    name: "",
    price: "",
    originalPrice: "",
    image: "",
    category: "",
    description: "",
    stock: "",
    unit: "kg",
  });

  useEffect(() => {
    if (!user) return;
    const fetchFarmerData = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setFarmerStatus(snap.data().farmerStatus || "pending");
        setFarmerName(snap.data().name || snap.data().email || "");
      }
    };
    fetchFarmerData();
  }, [user]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    setLoading(true);
    try {
      // Add to pendingProducts collection (not products)
      const docRef = await addDoc(collection(db, "pendingProducts"), {
        name: form.name.trim(),
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        image: form.image.trim() || "",
        category: form.category,
        description: form.description.trim(),
        stock: Number(form.stock) || 0,
        unit: form.unit,
        farmerId: user.uid,
        farmerEmail: user.email,
        farmerName: farmerName,
        status: "pending",       // pending | approved | rejected
        adminNote: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create a notification for admins
      await addDoc(collection(db, "adminNotifications"), {
        type: "new_product",
        title: "New Product Submitted",
        message: `${farmerName || user.email} submitted "${form.name.trim()}" for approval.`,
        productId: docRef.id,
        productName: form.name.trim(),
        farmerId: user.uid,
        farmerName: farmerName || user.email,
        farmerEmail: user.email,
        status: "unread",
        createdAt: serverTimestamp(),
      });

      toast.success("Product submitted for admin review! 🎉");
      router.push("/farmer/products");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/farmer/products" className="text-gray-400 hover:text-white transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">📦 Add New Product</h1>
          <p className="text-gray-400 text-sm mt-1">
            Your product will be reviewed by our admin before going live.
          </p>
        </div>
      </div>

      {/* Status warning */}
      {farmerStatus === "pending" && (
        <div className="mb-5 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
          ⏳ Your farmer account is pending approval. You can still submit products — they will be reviewed along with your account.
        </div>
      )}
      {farmerStatus === "rejected" && (
        <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          ❌ Your farmer account has been rejected. Please contact support.
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">

        {/* NAME */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Product Name *</label>
          <input
            placeholder="e.g. Fresh Organic Tomatoes"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* PRICE, STOCK, UNIT */}
        <div className="grid grid-cols-3 gap-4">
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
            <label className="block text-sm text-gray-400 mb-1">Stock</label>
            <input
              type="number"
              placeholder="0"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Unit</label>
            <select
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="litre">litre</option>
              <option value="piece">piece</option>
              <option value="dozen">dozen</option>
              <option value="bundle">bundle</option>
            </select>
          </div>
        </div>

        {/* ORIGINAL PRICE */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Original / MRP (&#x20B9;){" "}
            <span className="text-gray-600 text-xs font-normal">&#8212; optional, sets discount badge on listing</span>
          </label>
          <input
            type="number"
            placeholder="Leave blank for no discount badge"
            value={form.originalPrice}
            onChange={(e) => set("originalPrice", e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
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

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            rows={4}
            placeholder="Describe your product — freshness, origin, certifications, how it's grown..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* REVIEW NOTE */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs">
          <Sparkles size={14} className="inline mr-1" />
          Your product will appear in our marketplace after admin review. You'll see the status update in your dashboard.
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading || farmerStatus === "rejected"}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition"
          >
            {loading ? "Submitting..." : "Submit for Review"}
          </button>
          <Link
            href="/farmer/products"
            className="flex-1 text-center bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}