"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <div className="w-64 bg-black text-white p-6 space-y-6">
        <h2 className="text-2xl font-bold text-green-400">
          Admin Panel
        </h2>

        <nav className="flex flex-col gap-4">
          <Link href="/admin/products">📦 Products</Link>
          <Link href="/admin/orders">📄 Orders</Link>
          <Link href="/admin/users">👤 Users</Link>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-10">
        <h1 className="text-3xl font-bold mb-6">
          Dashboard Overview
        </h1>

        {/* CARDS */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <p>Total Products</p>
            <h2 className="text-2xl font-bold">--</h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <p>Total Orders</p>
            <h2 className="text-2xl font-bold">--</h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <p>Total Users</p>
            <h2 className="text-2xl font-bold">--</h2>
          </div>
        </div>
      </div>
    </div>
  );
}