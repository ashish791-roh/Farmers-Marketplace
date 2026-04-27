"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { motion } from "framer-motion";
import { Package, Users, ShoppingCart, IndianRupee } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setStats((prev) => ({ ...prev, users: snap.size }));
    });

    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setStats((prev) => ({ ...prev, products: snap.size }));
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      let revenue = 0;
      snap.docs.forEach((doc) => { revenue += doc.data().total || 0; });
      setStats((prev) => ({ ...prev, orders: snap.size, revenue }));
    });

    // Recent 5 orders
    const recentQ = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5));
    const unsubRecent = onSnapshot(recentQ, (snap) => {
      setRecentOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUsers(); unsubProducts(); unsubOrders(); unsubRecent(); };
  }, []);

  const statCards = [
    { title: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: <IndianRupee size={22} />, color: "from-green-500 to-green-700" },
    { title: "Total Orders",  value: stats.orders,   icon: <ShoppingCart size={22} />, color: "from-blue-500 to-blue-700" },
    { title: "Total Users",   value: stats.users,    icon: <Users size={22} />,        color: "from-purple-500 to-purple-700" },
    { title: "Products",      value: stats.products, icon: <Package size={22} />,      color: "from-orange-500 to-orange-700" },
  ];

  const getStatusColor = (status: string) => {
    if (status === "delivered") return "bg-green-500/20 text-green-400";
    if (status === "shipped")   return "bg-blue-500/20 text-blue-400";
    return "bg-yellow-500/20 text-yellow-400";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="bg-white/10 px-4 py-2 rounded-xl text-sm">👑 Live Data</div>
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

      {/* RECENT ORDERS */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-semibold mb-5">🕐 Recent Orders</h2>

        {recentOrders.length === 0 ? (
          <p className="text-gray-400 text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10 text-left">
                  <th className="pb-3 pr-4">Order ID</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-300">{order.id.slice(0, 10)}…</td>
                    <td className="py-3 pr-4 text-gray-300">
                      {order.createdAt?.seconds
                        ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-green-400 font-semibold">₹{order.total}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}