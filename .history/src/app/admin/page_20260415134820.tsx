"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="mt-6 space-y-4">
        <Link href="/admin/add-product" className="block text-blue-600">
          ➕ Add Product
        </Link>

        <Link href="/admin/products" className="block text-blue-600">
          📦 Manage Products
        </Link>
      </div>
    </div>
  );
}