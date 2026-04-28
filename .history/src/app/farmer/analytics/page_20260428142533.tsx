"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, Package, IndianRupee, ShoppingBag } from "lucide-react";
import type { Product, Order } from "@/types";

export default function FarmerAnalytics() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubProducts = onSnapshot(
      query(collection(db, "products"), where("farmerId", "==", user.uid)),
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      }
    );

    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const farmerOrders = (snap.docs
        .map((d) => ({ id: d.id, ...d.data() })) as Order[])
        .filter((o) => o.items?.some((i) => i.farmerId === user.uid));
      setOrders(farmerOrders);
      setLoading(false);
    });

    return () => { unsubProducts(); unsubOrders(); };
  }, [user]);

  const totalRevenue = orders.reduce((sum, order) => {
    const myItems = order.items?.filter((i) => i.farmerId === user?.uid) || [];
    return sum + myItems.reduce((s: number, i) => s + (i.price * i.quantity), 0);
  }, 0);

  const totalUnitsSold = orders.reduce((sum, order) => {
    const myItems = order.items?.filter((i) => i.farmerId === user?.uid) || [];
    return sum + myItems.reduce((s: number, i) => s + (i.quantity || 0), 0);
  }, 0);

  const statCards = [
    { title: "Live Products", value: products.length, icon: <Package size={22} />, color: "from-blue-500 to-blue-700" },
    { title: "Total Orders", value: orders.length, icon: <ShoppingBag size={22} />, color: "from-purple-500 to-purple-700" },
    { title: "Units Sold", value: totalUnitsSold, icon: <TrendingUp size={22} />, color: "from-orange-500 to-orange-700" },
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: <IndianRupee size={22} />, color: "from-green-500 to-green-700" },
  ];

  // Top selling products
  const productSales: { [key: string]: { name: string; qty: number; revenue: number } } = {};
  orders.forEach((order) => {
    order.items
      ?.filter((i) => i.farmerId === user?.uid)
      .forEach((item) => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, qty: 0, revenue: 0 };
        }
        productSales[item.name].qty += item.quantity || 0;
        productSales[item.name].revenue += (item.price * item.quantity) || 0;
      });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <BarChart2 size={28} className="text-green-400" />
        My Analytics
      </h1>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TOP SELLING PRODUCTS */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">🏆 Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm w-5">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-white font-medium">{p.name}</span>
                      <span className="text-xs text-green-400 font-bold">₹{p.revenue}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                        style={{ width: `${Math.min(100, (p.revenue / (topProducts[0]?.revenue || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{p.qty} units sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LIVE PRODUCTS */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">📦 Live Products</h2>
          {products.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No approved products yet</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={p.image || "https://via.placeholder.com/40x40?text=🌾"}
                      alt={p.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/40x40?text=🌾"; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">₹{p.price}/{p.unit || "kg"} · Stock: {p.stock}</p>
                  </div>
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">Live</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
