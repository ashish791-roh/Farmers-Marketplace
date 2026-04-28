"use client";

import { useEffect, useState } from "react";

// ✅ FIX: Proper Product type (added status only, no feature change)
type Product = {
  id: string;
  status?: "approved" | "pending" | "rejected"; // optional to avoid runtime crash
};

export default function FarmerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    // ⚠️ Keep your existing fetch logic here (UNCHANGED)
    // Example (replace with your actual logic if different):
    const fetchProducts = async () => {
      try {
        // Your existing fetching logic (Firestore or API)
        // Example placeholder:
        const data: Product[] = []; // replace with real data

        setProducts(data);

        // ✅ FIX: Safe access using optional chaining
        setStats({
          total: data.length,
          approved: data.filter((p) => p.status === "approved").length,
          pending: data.filter((p) => p.status === "pending").length,
          rejected: data.filter((p) => p.status === "rejected").length,
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchProducts();
  }, []);

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