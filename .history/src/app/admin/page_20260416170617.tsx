"use client";

import { motion } from "framer-motion";
import {
  Package,
  Users,
  ShoppingCart,
  IndianRupee,
} from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-green-950 text-white">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 hidden md:flex flex-col">
        <h2 className="text-2xl font-bold text-green-400 mb-10">
          🌱 Admin
        </h2>

        <nav className="space-y-4">
          <div className="hover:text-green-400 cursor-pointer">
            Dashboard
          </div>
          <div className="hover:text-green-400 cursor-pointer">
            Products
          </div>
          <div className="hover:text-green-400 cursor-pointer">
            Orders
          </div>
          <div className="hover:text-green-400 cursor-pointer">
            Users
          </div>
        </nav>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 p-6 md:p-10">

        {/* 🔝 TOP BAR */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Dashboard Overview
          </h1>

          <div className="bg-white/10 px-4 py-2 rounded-xl">
            👑 Admin Panel
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

          <StatCard
            title="Revenue"
            value="₹1,24,000"
            icon={<IndianRupee />}
            color="from-green-500 to-green-700"
          />

          <StatCard
            title="Orders"
            value="320"
            icon={<ShoppingCart />}
            color="from-blue-500 to-blue-700"
          />

          <StatCard
            title="Users"
            value="1,240"
            icon={<Users />}
            color="from-purple-500 to-purple-700"
          />

          <StatCard
            title="Products"
            value="85"
            icon={<Package />}
            color="from-orange-500 to-orange-700"
          />
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">
            Recent Orders
          </h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="pb-2">Order ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-t border-white/10">
                <td className="py-3">#ORD123</td>
                <td>Ashish</td>
                <td>₹500</td>
                <td className="text-green-400">Completed</td>
              </tr>

              <tr className="border-t border-white/10">
                <td className="py-3">#ORD124</td>
                <td>Rahul</td>
                <td>₹850</td>
                <td className="text-yellow-400">Pending</td>
              </tr>

              <tr className="border-t border-white/10">
                <td className="py-3">#ORD125</td>
                <td>Sneha</td>
                <td>₹320</td>
                <td className="text-red-400">Cancelled</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}







// ================= REUSABLE STAT CARD =================
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
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