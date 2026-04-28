"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { ShoppingBag } from "lucide-react";
import type { Order } from "@/types";

export default function FarmerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Orders that include products from this farmer
    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      const farmerOrders = (snap.docs
        .map((d) => ({ id: d.id, ...d.data() })) as Order[])
        .filter((order) =>
          order.items?.some((item) => item.farmerId === user.uid)
        )
        .sort((a, b) => ((b.createdAt as any)?.seconds || 0) - ((a.createdAt as any)?.seconds || 0));
      setOrders(farmerOrders);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const getStatusColor = (status: string) => {
    if (status === "delivered") return "bg-green-500/20 text-green-400";
    if (status === "shipped") return "bg-blue-500/20 text-blue-400";
    return "bg-yellow-500/20 text-yellow-400";
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <ShoppingBag size={28} className="text-green-400" />
        My Orders
      </h1>

      {loading ? (
        <p className="text-gray-400 text-center py-20">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white/5 rounded-2xl border border-white/10">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-xl">No orders yet</p>
          <p className="text-sm mt-1">Orders for your products will appear here once customers purchase them.</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10 text-left">
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => {
                  const myItems = order.items?.filter((i) => i.farmerId === user?.uid) || [];
                  const myTotal = myItems.reduce((sum: number, i) => sum + (i.price * i.quantity), 0);
                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition">
                      <td className="px-5 py-4 font-mono text-xs text-gray-300">{order.id.slice(0, 10)}…</td>
                      <td className="px-5 py-4 text-gray-300">
                        {order.createdAt?.seconds
                          ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {myItems.map((item, i: number) => (
                            <p key={i} className="text-xs text-gray-300">
                              {item.name} × {item.quantity}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-green-400 font-semibold">₹{myTotal}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status || "pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
