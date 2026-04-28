"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

type Product = {
  id: string;
  status: "approved" | "pending" | "rejected";
  name?: string;
  price?: number;
  unit?: string;
  category?: string;
  image?: string;
  adminNote?: string;
  farmerId?: string;
  createdAt?: { seconds: number };
};

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "pendingProducts"),
      where("farmerId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data: Product[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Product, "id">),
      }));

      setProducts(data);
      setStats({
        total: data.length,
        approved: data.filter((p) => p.status === "approved").length,
        pending: data.filter((p) => p.status === "pending").length,
        rejected: data.filter((p) => p.status === "rejected").length,
      });
    });

    return () => unsub();
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Farmer Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-100 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Total</h2>
          <p className="text-2xl">{stats.total}</p>
        </div>

        <div className="p-4 bg-green-100 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Approved</h2>
          <p className="text-2xl">{stats.approved}</p>
        </div>

        <div className="p-4 bg-yellow-100 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Pending</h2>
          <p className="text-2xl">{stats.pending}</p>
        </div>

        <div className="p-4 bg-red-100 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Rejected</h2>
          <p className="text-2xl">{stats.rejected}</p>
        </div>
      </div>
    </div>
  );
}