"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { notifyUser, orderStatusLabel, orderStatusEmoji } from "@/lib/notifications";
import toast from "react-hot-toast";
import type { Order } from "@/types";

const STATUSES = ["pending", "shipped", "delivered", "cancelled"];

const statusStyle: Record<string, string> = {
  pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  shipped:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string, order: Order) => {
    setUpdating(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });

      // ── Notify the customer about their order status change ──────────
      if (order?.userId) {
        const emoji = orderStatusEmoji(newStatus);
        const label = orderStatusLabel(newStatus);
        await notifyUser(order.userId, {
          type: `order_${newStatus}` as any,
          title: `Order ${label} ${emoji}`,
          message: `Your order #${orderId.slice(0, 8).toUpperCase()} has been updated to: ${label}.`,
          link: "/orders",
        });
      }

      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.userId?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">🛒 Manage Orders</h1>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="Search by Order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-3 rounded-xl bg-gray-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-20">Loading orders...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-20">No orders found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-green-500/30 transition"
            >
              {/* ORDER HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <p className="font-mono text-xs text-gray-400">
                    Order ID: <span className="text-white">{order.id}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.createdAt?.seconds
                      ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                      : "Processing..."}
                  </p>
                  {order.userId && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      User: {order.userId.slice(0, 16)}…
                    </p>
                  )}
                </div>

                {/* STATUS DROPDOWN */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border ${statusStyle[order.status] || statusStyle.pending}`}>
                    {order.status || "pending"}
                  </span>
                  <select
                    value={order.status || "pending"}
                    disabled={updating === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value, order)}
                    className="p-2 text-sm rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ORDER ITEMS */}
              <div className="border-t border-white/10 pt-4 space-y-2">
                {order.items?.map((item, i: number) => (
                  <div key={i} className="flex justify-between text-sm text-gray-300">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* TOTAL */}
              <div className="flex justify-between font-bold border-t border-white/10 pt-3 mt-3">
                <span className="text-gray-300">Total</span>
                <span className="text-green-400 text-lg">₹{order.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}