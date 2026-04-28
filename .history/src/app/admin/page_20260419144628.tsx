"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Package,
  Users,
  ShoppingCart,
  IndianRupee,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
  });

  //  REAL-TIME FIRESTORE LISTENERS
  useEffect(() => {
    // USERS
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setStats((prev) => ({
        ...prev,
        users: snap.size,
      }));
    });

    // PRODUCTS
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setStats((prev) => ({
        ...prev,
        products: snap.size,
      }));
    });

    // ORDERS
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      let revenue = 0;

      snap.docs.forEach((doc) => {
        const data = doc.data();
        revenue += data.total || 0;
      });

      setStats((prev) => ({
        ...prev,
        orders: snap.size,
        revenue,
      }));
    });

    return () => {
      unsubUsers();
      unsubProducts();
      unsubOrders();
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-green-950 text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 hidden md:flex flex-col">
        <h2 className="text-2xl font-bold text-green-400 mb-10">
          🌱 Admin
        </h2>

        <nav className="space-y-4">
          <div className="hover:text-green-400 cursor-pointer">Dashboard</div>
          <div className="hover:text-green-400 cursor-pointer">Products</div>
          <div className="hover:text-green-400 cursor-pointer">Orders</div>
          <div className="hover:text-green-400 cursor-pointer">Users</div>
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1 p-6 md:p-10">

        {/* TOP */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Dashboard Overview
          </h1>

          <div className="bg-white/10 px-4 py-2 rounded-xl">
            👑 Live Data
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

          <StatCard
            title="Revenue"
            value={`₹${stats.revenue}`}
            icon={<IndianRupee />}
            color="from-green-500 to-green-700"
          />

          <StatCard
            title="Orders"
            value={stats.orders.toString()}
            icon={<ShoppingCart />}
            color="from-blue-500 to-blue-700"
          />

          <StatCard
            title="Users"
            value={stats.users.toString()}
            icon={<Users />}
            color="from-purple-500 to-purple-700"
          />

          <StatCard
            title="Products"
            value={stats.products.toString()}
            icon={<Package />}
            color="from-orange-500 to-orange-700"
          />
        </div>

        {/* LIVE FEED */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">
            🔴 Live Activity (Firestore)
          </h2>

          <p className="text-gray-400 text-sm">
            Data updates in real-time whenever database changes
          </p>
        </div>

      </div>
    </div>
  );
}

// ================= CARD =================
function StatCard({ title, value, icon, color }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`bg-gradient-to-r ${color} p-5 rounded-2xl shadow-lg`}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <h2 className="text-2xl font-bold mt-1">{value}</h2>
        </div>

        <div className="bg-white/20 p-3 rounded-xl">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}