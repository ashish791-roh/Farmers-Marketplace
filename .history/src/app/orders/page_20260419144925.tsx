"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

type Order = {
  id: string;
  items: any[];
  total: number;
  status: string;
  createdAt: any;
};

export default function OrdersPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true); 

  // 🔥 REAL-TIME ORDERS
  // ===============================
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.log("Orders fetch error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ===============================
  // 🟡 STATUS COLOR
  // ===============================
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "shipped":
        return "text-blue-600";
      case "delivered":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">

      <h1 className="text-3xl font-bold text-green-700 mb-6">
        My Orders 📦
      </h1>

      {/* ⏳ LOADING */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No orders yet
        </div>
      ) : (
        <div className="space-y-6">

          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-5 shadow-sm hover:shadow-md transition bg-white"
            >
              {/* HEADER */}
              <div className="flex justify-between mb-3 items-center">

                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">
                    Order ID: {order.id.slice(0, 8)}
                  </span>

                  {/* 🕒 DATE */}
                  <span className="text-xs text-gray-400">
                    {order.createdAt?.seconds
                      ? new Date(
                          order.createdAt.seconds * 1000
                        ).toLocaleString()
                      : "Processing..."}
                  </span>
                </div>

                <span
                  className={`text-sm font-semibold capitalize ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              {/* ITEMS */}
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>

                    <span>
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* TOTAL */}
              <div className="mt-4 flex justify-between font-bold border-t pt-3">
                <span>Total</span>
                <span className="text-green-700">
                  ₹{order.total}
                </span>
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}