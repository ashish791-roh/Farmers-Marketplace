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
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { PackageOpen } from "lucide-react";

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "shipped":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "delivered":
        return "text-green-600 bg-green-50 border-green-200";
      case "paid":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-6">
          My Orders 📦
        </h1>

        {/* NOT LOGGED IN */}
        {!user && !loading && (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
            <PackageOpen size={56} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              Login to view your orders
            </h2>
            <Link
              href="/login"
              className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              Login
            </Link>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border rounded-xl p-5 animate-pulse bg-white"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
            ))}
          </div>
        )}

        {/* NO ORDERS */}
        {!loading && user && orders.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
            <PackageOpen size={56} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-400 mb-6">
              Place your first order from our fresh marketplace
            </p>
            <Link
              href="/products"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              Shop Now
            </Link>
          </div>
        )}

        {/* ORDERS LIST */}
        {!loading && orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border rounded-xl p-5 shadow-sm hover:shadow-md transition bg-white"
              >
                {/* HEADER */}
                <div className="flex justify-between mb-4 items-start">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      {order.createdAt?.seconds
                        ? new Date(
                            order.createdAt.seconds * 1000
                          ).toLocaleString()
                        : "Processing..."}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold capitalize px-3 py-1 rounded-full border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* ITEMS */}
                <div className="space-y-2 border-b pb-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <span className="text-gray-700">
                          {item.name}{" "}
                          <span className="text-gray-400">× {item.quantity}</span>
                        </span>
                      </div>
                      <span className="font-medium">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* TOTAL */}
                <div className="mt-4 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-green-700">₹{order.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
